import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import InstructionsCard from "@/components/candidate/InstructionsCard";
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

export default async function InstructionsPage() {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") redirect("/");

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Header email={session.email} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <InstructionsCard />
      </div>
    </main>
  );
}
