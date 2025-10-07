import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ClientTabs from "@/components/candidate/ClientTabs";
import Header from "@/components/candidate/Header";

const SECRET = process.env.JWT_ACCESS_SECRET || "devsecret_change_me";

async function getSession() {
  const store = await cookies();
  const token = store.get("access_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export default async function CandidateHome() {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header email={session.email} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back,{" "}
            <span className="text-[#4E58BC]">
              {session.name
                ?.trim()
                .split(/\s+/)[0]
                ?.replace(/^./, (c) => c.toUpperCase()) || "Candidate"}
            </span>
          </h1>
          <p className="text-[#727272]">Track your English proficiency progress and manage your certificates</p>
        </div>

        <ClientTabs initial="history" />
      </main>
    </div>
  );
}
