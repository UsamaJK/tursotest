import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";
import AuthPage from "./AuthPage";

export default async function Root() {
  const s = await getSession();
  if (s?.role === "ADMIN") redirect("/admin");
  if (s?.role === "CANDIDATE") redirect("/candidate");
  return <AuthPage />; // shows Login/Register when not logged in
}
