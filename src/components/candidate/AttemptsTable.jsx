"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Eye } from "lucide-react";

export default function AttemptsTable() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function load(p = page) {
    setLoading(true);
    try {
      const r = await fetch(`/api/candidate/attempts?page=${p}&pageSize=10`, { credentials: "include" });
      const j = await r.json();
      setRows(j.items || []);
      setTotalPages(j.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [page]);

  async function startTest() {
    // router.push("/candidate/instructions");
    router.push("/candidate/checkout");
  }

  return (
    <div className="border rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between px-10 py-7 ">
        <div>
          <h3 className="text-lg font-medium text-[#000000]">Test Attempts</h3>
          <p className="text-sm text-gray-600 mt-0.5">Your complete testing history</p>
        </div>
        <button
          onClick={startTest}
          className="flex items-center gap-2 bg-[#4E58BC] text-white px-6 py-3 rounded-4xl
          hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-bold">Take New Test</span>
        </button>
      </div>
      <div className="px-10">
        {rows.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" color="#344156">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Test History</h3>
            <p className="text-gray-600 mb-6">You haven't taken any tests yet. Start your first English proficiency test now!</p>
            <div className="flex justify-center">
              <button
                onClick={startTest}
                className="flex items-center gap-2 bg-[#4E58BC] text-white px-6 py-3 rounded-4xl
          hover:bg-indigo-700 transition-colors"
              >
                <span className="text-sm font-bold">Take your first test</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="px-6 py-4 text-[1.125rem] font-normal text-[#000000]">Date</th>
                    <th className="px-6 py-4 text-[1.125rem] font-normal text-[#000000] text-center">Status</th>
                    <th className="px-6 py-4 text-right text-[1.125rem] font-normal text-[#000000]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a, i) => (
                    <tr key={a.id} className={`border-b border-gray-100 last:border-0 ${i % 2 ? "bg-gray-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(a.startedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 tracking-widest">
                          {new Date(a.startedAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={a.status} level={a.level} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ActionsCell id={a.id} status={a.status} router={router} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-9 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-9 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Level to proficiency name mapping
const LEVEL_LABELS = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

function StatusBadge({ status, level }) {
  if (status !== "SUBMITTED") {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
        In progress
      </span>
    );
  }

  const levelValue = level || "A1";
  const proficiencyName = LEVEL_LABELS[levelValue] || "Beginner";

  return (
    <span
      className="inline-flex items-center rounded-full bg-[#FAEAEB] px-3 py-1 text-base
    font-bold text-[#F14374]"
    >
      {levelValue} - {proficiencyName}
    </span>
  );
}

function ActionsCell({ id, status, router }) {
  if (status !== "SUBMITTED") {
    return (
      <button
        onClick={() => router.push(`/candidate/test/${id}`)}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-2 text-xs font-medium hover:bg-gray-800 transition-colors"
      >
        Resume Test
      </button>
    );
  }

  return (
    <a
      href={`/api/candidate/attempts/${id}/certificate.pdf`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border-1 border-[#4E58BC] text-[#4E58BC] px-3 py-2.5 text-xs font-semibold hover:bg-indigo-50 transition-colors"
    >
      <Eye className="w-4 h-4" />
      View Certificate
    </a>
  );
}
