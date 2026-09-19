"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addTeamMember, removeTeamMember, resetTeamMemberPassword } from "@/app/actions/admin-content";
import type { TeamMember } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";

export function TeamManager({
  members,
  currentEmail,
  isOwner,
}: {
  members: TeamMember[];
  currentEmail: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // add-member dialog
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "admin">("admin");

  // password reset dialog
  const [resetting, setResetting] = useState<TeamMember | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const field = "w-full rounded-sm border border-stone bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold";
  const label = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

  const submitAdd = () => {
    startTransition(async () => {
      const res = await addTeamMember({ name, email, password, role });
      if (res.ok) {
        toast.success(res.message ?? "Team member added.");
        setAdding(false);
        setName("");
        setEmail("");
        setPassword("");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const submitReset = () => {
    if (!resetting) return;
    startTransition(async () => {
      const res = await resetTeamMemberPassword({ id: resetting.id, password: newPassword });
      if (res.ok) {
        toast.success(res.message ?? "Password reset.");
        setResetting(null);
        setNewPassword("");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-caps text-gold">Configuration</p>
          <h1 className="mt-1 font-display text-3xl">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} admin {members.length === 1 ? "account" : "accounts"} — owners manage everything, admins run the panel.
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" /> Add member
          </button>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-stone bg-card p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {m.name}
                {m.email === currentEmail && <span className="ml-2 text-xs text-gold">(you)</span>}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {m.email} · joined {formatDate(m.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={
                  m.role === "owner"
                    ? "rounded-sm bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold"
                    : "rounded-sm bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                }
              >
                {m.role}
              </span>
              {isOwner && (
                <div className="flex items-center gap-1">
                  <button
                    aria-label={`Reset password for ${m.name}`}
                    onClick={() => {
                      setResetting(m);
                      setNewPassword("");
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <KeyRound className="h-4 w-4" />
                  </button>
                  <button
                    aria-label={`Remove ${m.name}`}
                    disabled={m.email === currentEmail}
                    onClick={() => {
                      if (!confirm(`Remove ${m.name} from the team?`)) return;
                      startTransition(async () => {
                        const res = await removeTeamMember(m.id);
                        if (res.ok) toast.success(res.message); else toast.error(res.message);
                        router.refresh();
                      });
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!isOwner && (
        <p className="mt-4 text-xs text-muted-foreground">Only the store owner can manage team members.</p>
      )}

      {/* add member */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add team member</DialogTitle>
            <DialogDescription>They can sign in at /admin immediately after saving.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div>
              <label className={label} htmlFor="tm-name">Name</label>
              <input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="tm-email">Email</label>
              <input id="tm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="tm-pass">Temporary password</label>
                <input id="tm-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} font-mono`} placeholder="8+ chars, letters + numbers" />
              </div>
              <div>
                <label className={label} htmlFor="tm-role">Role</label>
                <select id="tm-role" value={role} onChange={(e) => setRole(e.target.value as "owner" | "admin")} className={field}>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={submitAdd}
              disabled={pending}
              className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Adding…" : "Add member"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* reset password */}
      <Dialog open={resetting !== null} onOpenChange={(o) => !o && setResetting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetting?.name}. Share it over a secure channel.
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <label className={label} htmlFor="tm-newpass">New password</label>
            <input
              id="tm-newpass"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${field} font-mono`}
              placeholder="8+ chars, letters + numbers"
            />
          </div>
          <DialogFooter>
            <button
              onClick={submitReset}
              disabled={pending}
              className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Reset password"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
