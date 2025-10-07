"use client";

import { useState } from "react";
import AttemptsTable from "@/components/candidate/AttemptsTable";
import Tabs from "../ui/Tabs";

export default function ClientTabs({ initial = "history" }) {
  const [tab, setTab] = useState(initial);

  return (
    <>
      <div className="max-w-7xl mx-auto py-6">
        <Tabs defaultTab="history" setTab={setTab} tab={tab} />
      </div>

      {/* Tab Content */}
      {tab === "history" && <AttemptsTable />}

      {tab === "payments" && (
        <div className="border rounded-xl bg-white shadow-sm p-6 text-gray-700">
          Payments coming soon. You'll see your receipts and invoices here after we enable billing.
        </div>
      )}
    </>
  );
}
