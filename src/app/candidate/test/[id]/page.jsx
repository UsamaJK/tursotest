// src/app/candidate/test/[id]/page.jsx  (or wherever your TestRunner lives)
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TestSubmissionAcknowledgementPopUp from "@/components/candidate/TestSubmissionAcknowledgementPopUp";
import { Flag } from "lucide-react";

/** Safely coerce JSON-string-or-array -> array<string> */
const toArr = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function TestRunner() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [idx, setIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const submittingRef = useRef(false);
  const initialized = useRef(false);

  const item = data?.items?.[idx];

  // --- fetch attempt ---
  useEffect(() => {
    initialized.current = false; // reset when id changes

    (async () => {
      const r = await fetch(`/api/candidate/attempts/${id}`);
      if (!r.ok) return router.push("/candidate");

      const payload = await r.json();

      // Normalize items once so UI logic works with arrays (not JSON strings)
      const normalized = {
        ...payload,
        items: (payload.items || []).map((it) => ({
          ...it,
          selectedOptionIds: toArr(it.selectedOptionIds),
          correctOptionIds: toArr(it.correctOptionIds),
        })),
      };

      setData(normalized);
      setSecondsLeft(normalized.secondsLeft ?? 0);

      // FIRST UNANSWERED (now that they're arrays)
      const firstUnanswered = normalized.items.findIndex((it) => toArr(it.selectedOptionIds).length === 0);
      // If everything is answered (e.g., resume), start from 0 instead of last
      const derived = firstUnanswered === -1 ? 0 : firstUnanswered;

      // prefer localStorage if present (BEFORE any saver runs)
      const savedRaw = typeof window !== "undefined" ? window.localStorage.getItem(`attempt:${id}:idx`) : null;
      const saved = savedRaw != null ? Number(savedRaw) : null;
      const startIdx = Number.isFinite(saved) ? saved : derived;

      setIdx(Number.isFinite(startIdx) ? Math.max(0, Math.min(normalized.items.length - 1, startIdx)) : 0);

      // time already elapsed -> autosubmit once
      if ((normalized.secondsLeft ?? 0) <= 0 && !submittingRef.current) {
        submittingRef.current = true;
        autoSubmit();
      }

      initialized.current = true; // allow saver to run
    })();
  }, [id, router]);

  // persist current index per attempt (after initial load)
  useEffect(() => {
    if (!id) return;
    if (typeof window === "undefined") return;
    if (!initialized.current) return;
    window.localStorage.setItem(`attempt:${id}:idx`, String(idx));
  }, [id, idx]);

  // --- countdown & auto-submit ---
  useEffect(() => {
    if (secondsLeft == null) return;
    if (secondsLeft <= 0) return;

    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          if (!submittingRef.current) {
            submittingRef.current = true;
            autoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [secondsLeft]);

  async function autoSubmit() {
    try {
      await fetch(`/api/candidate/attempts/${id}/submit`, { method: "POST" });
      if (typeof window !== "undefined") window.localStorage.removeItem(`attempt:${id}:idx`);
      router.push(`/candidate/result/${id}`);
    } catch {
      router.push(`/candidate/result/${id}`);
    }
  }

  // --- helpers ---
  const total = data?.items?.length || 0;
  const progressPct = useMemo(() => {
    if (!total) return 0;
    return Math.round(((idx + 1) / total) * 100);
  }, [idx, total]);

  async function saveSelection(selectedOptionIds) {
    if (!item) return;
    await fetch(`/api/candidate/attempts/${id}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedOptionIds }),
    });
  }

  async function submit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const r = await fetch(`/api/candidate/attempts/${id}/submit`, {
      method: "POST",
    });
    if (r.ok) {
      if (typeof window !== "undefined") window.localStorage.removeItem(`attempt:${id}:idx`);
      router.push(`/candidate/result/${id}`);
    } else {
      submittingRef.current = false;
    }
  }

  if (!data || !item) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 pt-10 text-sm text-gray-500">Loading…</div>
      </main>
    );
  }

  const section = item.sectionName || item.tagName || item.question?.section || item.question?.tags?.[0];

  return (
    <main className="min-h-screen bg-gray-50">
      <TestSubmissionAcknowledgementPopUp isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={submit} />

      <Header showTimer={true} secondsLeft={secondsLeft ?? 0} />

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <div className="bg-white rounded-lg border shadow-sm">
          {/* Progress */}
          <div className="px-6 pt-4">
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-black" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-3">
            <div className="text-lg font-semibold mt-1 text-black">
              Question {idx + 1} of {total}
            </div>
            {section ? <div className="text-xs text-gray-500 mt-1">Section: {section}</div> : null}

            <p className="mt-5 text-[15px] text-gray-900">{item.question.text}</p>

            {/* Options */}
            <ul className="mt-4 space-y-3">
              {item.question.options.map((opt) => {
                const current = toArr(item.selectedOptionIds);
                const checked = current.includes(opt.id);

                const handleChange = () => {
                  if (item.allowMultiple) {
                    const next = new Set(current);
                    checked ? next.delete(opt.id) : next.add(opt.id);
                    item.selectedOptionIds = [...next];
                  } else {
                    item.selectedOptionIds = [opt.id];
                  }
                  setData({ ...data }); // re-render
                  saveSelection(item.selectedOptionIds);
                };

                return (
                  <li key={opt.id}>
                    <label className="block">
                      <div
                        className={[
                          "flex items-center gap-3 rounded-md border",
                          "px-4 py-3 bg-white",
                          "hover:bg-gray-50 transition-colors",
                          checked ? "border-gray-900" : "border-gray-300",
                        ].join(" ")}
                      >
                        <input
                          type={item.allowMultiple ? "checkbox" : "radio"}
                          name={`q-${item.id}`}
                          checked={!!checked}
                          onChange={handleChange}
                          className="h-4 w-4 border-gray-300"
                        />
                        <span className="text-sm text-gray-900">{opt.text}</span>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Sticky footer controls */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            className={[
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-gray-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Previous
          </button>

          {idx < total - 1 ? (
            <button
              onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
              className="inline-flex items-center gap-2 rounded-md bg-black text-white px-4 py-2 text-sm"
            >
              Next
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#19A24A] text-white px-4 py-2 text-sm gap-3"
            >
              <Flag size={15} />
              Finish
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Header({ showTimer = false, secondsLeft = 0 }) {
  const mm = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="h-12 border-b bg-white">
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="text-md font-bold text-black">English Proficiency Test</div>
        {showTimer ? (
          <div className="text-md font-semibold text-black tabular-nums">
            {mm}:{ss}
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
