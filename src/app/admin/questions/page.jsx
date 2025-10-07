export const dynamic = "force-dynamic";

import QuestionsTable from "@/components/admin/QuestionsTable";

export default function QuestionsPage() {
  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Question Bank</h1>
      </div>
      <QuestionsTable />
    </main>
  );
}
