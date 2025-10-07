"use client";

import { CreditCard, FileText } from "lucide-react";
import { useState } from "react";

export default function Tabs({ setTab, tab }) {
  return (
    <div role="tablist" aria-label="Authentication" className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
      <button
        role="tab"
        className={`flex w-full justify-center py-1 rounded-lg text-sm font-medium focus:outline-none  
                    ${tab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-700"}`}
        onClick={() => setTab("history")}
      >
        <FileText size={18} />
        <div className="px-2">Test History</div>
      </button>
      <button
        role="tab"
        className={`flex w-full justify-center py-1 rounded-lg text-sm font-medium focus:outline-none 
                    ${tab === "payments" ? "bg-white text-slate-900 shadow-sm" : "text-slate-700"}`}
        onClick={() => setTab("payments")}
      >
        <CreditCard size={18} />
        <div className="px-2">Payment History</div>
      </button>
    </div>
  );
}
