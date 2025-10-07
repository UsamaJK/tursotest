"use client";

import { useEffect, useMemo, useState } from "react";
import AddQuestionModal from "@/components/admin/AddQuestionModal";

const TAGS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function QuestionsTable() {
  const [data, setData] = useState([]);
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState({ open: false, mode: "create", question: null });

  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (tag) qs.set("tag", tag);
      qs.set("page", String(page));
      qs.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/questions?${qs.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();
      setData(json.items ?? []);
      setTotalPages(json.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, page]);

  const rows = useMemo(() => data ?? [], [data]);

  const onDelete = async (id) => {
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`/api/admin/questions/${id}`, {
      method: "DELETE",
      credentials: "include", // <-- add this
    });
    if (res.ok) {
      fetchData();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed to delete");
    }
  };

  const handleSaved = () => {
    setModalOpen(false); // close modal
    fetchData(); // refresh list
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={tag}
            onChange={(e) => {
              setPage(1);
              setTag(e.target.value);
            }}
            className="h-9 rounded-md border bg-white px-2 text-sm text-gray-700 shadow-sm focus:outline-none"
          >
            <option value="">All Tags</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setModalState({ open: true, mode: "create", question: null })}
          className="h-9 rounded-md bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none"
        >
          + Add Question
        </button>
      </div>

      {/* Table card (NO opacity here) */}
      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-600">
              <th className="px-4 py-3 font-medium">Question Text</th>
              <th className="px-4 py-3 font-medium w-28">Tag</th>
              <th className="px-4 py-3 font-medium w-36">Type</th>
              <th className="px-4 py-3 font-medium w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-800">
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>
                  No questions yet.
                </td>
              </tr>
            )}

            {rows.map((q, i) => (
              <tr key={q.id} className={i % 2 ? "bg-gray-50/30" : ""}>
                <td className="px-4 py-3 align-top">{q.text.length > 140 ? `${q.text.slice(0, 140)}…` : q.text}</td>
                <td className="px-4 py-3 align-top">
                  <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{q.tag}</span>
                </td>
                <td className="px-4 py-3 align-top">{q.allowMultiple ? "Multi-Select" : "Single-Select"}</td>
                <td className="px-4 py-3 align-top text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setModalState({ open: true, mode: "edit", question: q })}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                    <button onClick={() => onDelete(q.id)} className="text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-8 rounded-md border bg-white px-3 text-sm disabled:opacity-50 text-gray-600"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-8 rounded-md border bg-white px-3 text-sm disabled:opacity-50 text-gray-600"
          >
            Next
          </button>
        </div>
      </div>

      {/* Non-dimming loading overlay (blocks clicks only) */}
      {loading && <div className="absolute inset-0 cursor-wait" aria-hidden />}

      <AddQuestionModal
        open={modalState.open}
        mode={modalState.mode}
        question={modalState.question}
        onClose={(didSave) => {
          setModalState((s) => ({ ...s, open: false }));
          if (didSave) fetchData();
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}
