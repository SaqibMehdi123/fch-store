import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { listTeamMembers } from "@/lib/admin/queries";
import { TeamManager } from "@/components/admin/team-manager";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};

export default async function AdminTeamPage() {
  const [members, session] = await Promise.all([listTeamMembers(), auth()]);
  const currentEmail = session?.user?.email ?? "";

  return <TeamManager members={members} currentEmail={currentEmail} isOwner={session?.user?.role === "owner"} />;
}
