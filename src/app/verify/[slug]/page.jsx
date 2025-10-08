import { prisma } from "@/lib/prisma";

export default async function VerifyPage({ params }) {
  const { slug } = await params;
  const attempt = await prisma.attempt.findFirst({
    where: { verifySlug: slug },
    include: { user: true },
  });

  if (!attempt) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Certificate Verification</h1>
        <p className="mt-2 text-red-600">Invalid or unknown certificate.</p>
      </main>
    );
  }

  return (
    <div className="bg-white h-full">
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Certificate Verification</h1>
        <div className="mt-4 rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-green-700 font-medium">This certificate is valid.</p>
          <div className="mt-3 text-sm text-gray-700 space-y-1">
            <div>
              <span className="font-semibold">Name:</span> {attempt.user.fullName}
            </div>
            <div>
              <span className="font-semibold">Level:</span> {attempt.level || "A1"}
            </div>
            <div>
              <span className="font-semibold">Attempt ID:</span> {attempt.id}
            </div>
            <div>
              <span className="font-semibold">Certificate ID:</span> {attempt.certificateId ?? "—"}
            </div>
            <div>
              <span className="font-semibold">Issued:</span> {attempt.issuedAt ? new Date(attempt.issuedAt).toLocaleDateString() : "—"}
            </div>
            <div>
              <span className="font-semibold">Region:</span> {attempt.region || "European Union"}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
