"use client";

import { useCallback, useState } from "react";
import { FaClipboard, FaTrashCan, FaUserPlus } from "react-icons/fa6";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type Member = {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export type InviteToken = {
  id: string;
  code: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  usedBy?: { id: string; name: string; email: string } | null;
};

export type MembersPanelLabels = {
  inviteTitle: string;
  inviteDescription: string;
  createToken: string;
  copyCode: string;
  tokenHint: string;
  codeCopied: string;
  tokensTitle: string;
  noTokens: string;
  revoke: string;
  revokeConfirmTitle: string;
  revokeConfirmDescription: string;
  tokenRevoked: string;
  tokenStatus: Record<string, string>;
  listTitle: string;
  noMembers: string;
  you: string;
  promoteOwner: string;
  demoteOwner: string;
  promoteAdmin: string;
  remove: string;
  memberRemoved: string;
  removeConfirmTitle: string;
  removeConfirmDescription: string;
  roleUpdated: string;
  error: string;
  cancel: string;
  loading: string;
  roles: Record<string, string>;
};

type Props = {
  currentUserId: string | null;
  currentRole: string;
  initialMembers: Member[];
  initialTokens: InviteToken[];
  labels: MembersPanelLabels;
};

export function MembersPanel({
  currentUserId,
  currentRole,
  initialMembers,
  initialTokens,
  labels,
}: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [tokens, setTokens] = useState<InviteToken[]>(initialTokens);
  const [creating, setCreating] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState<Member | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState<InviteToken | null>(
    null,
  );
  const [revoking, setRevoking] = useState(false);

  const isOwner = currentRole === "owner";
  const canManage = isOwner || currentRole === "admin";

  const fetchAll = useCallback(async () => {
    const [memberRes, tokenRes] = await Promise.all([
      fetch("/api/members"),
      fetch("/api/tokens"),
    ]);
    if (memberRes.ok) {
      const data = await memberRes.json();
      if (data.members) setMembers(data.members);
    }
    if (tokenRes.ok) {
      const data = await tokenRes.json();
      if (data.tokens) setTokens(data.tokens);
    }
  }, []);

  async function updateRole(id: string, role: string) {
    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? labels.error);
      return;
    }
    toast.success(labels.roleUpdated);
    await fetchAll();
  }

  async function removeMember(member: Member) {
    setConfirmingRemove(null);
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? labels.error);
      return;
    }
    toast.success(labels.memberRemoved);
    await fetchAll();
  }

  async function createToken() {
    setCreating(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "member" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? labels.error);
        return;
      }
      await fetchAll();
    } finally {
      setCreating(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    toast.success(labels.codeCopied);
  }

  async function revokeToken() {
    if (!confirmingRevoke) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/tokens/${confirmingRevoke.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? labels.error);
        return;
      }
      toast.success(labels.tokenRevoked);
      setConfirmingRevoke(null);
      await fetchAll();
    } finally {
      setRevoking(false);
    }
  }

  function tokenStatusLabel(token: InviteToken): string {
    if (token.status === "active") {
      return new Date(token.expiresAt) < new Date()
        ? (labels.tokenStatus.expired ?? labels.tokenStatus.revoked)
        : labels.tokenStatus.active;
    }
    return labels.tokenStatus[token.status] ?? token.status;
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <section className="mb-8 space-y-3 rounded-2xl bg-card p-5 ring-1 ring-white/10">
          <h2 className="text-base font-semibold">{labels.inviteTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {labels.inviteDescription}
          </p>

          <Button
            onClick={createToken}
            disabled={creating}
            className="h-10 rounded-full px-5"
          >
            <FaUserPlus aria-hidden="true" className="mr-1.5 size-3.5" />
            {creating ? labels.loading : labels.createToken}
          </Button>
        </section>
      ) : null}

      {tokens.length > 0 && canManage ? (
        <section className="space-y-3 rounded-2xl bg-card p-5 ring-1 ring-white/10">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {labels.tokensTitle}
          </h3>

          <div className="space-y-2">
            {tokens.map((token) => {
              const isActive = token.status === "active";
              const isExpired =
                isActive && new Date(token.expiresAt) < new Date();
              return (
                <div
                  key={token.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/30 p-3"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <span className="font-mono text-lg tracking-widest">
                      {token.code}
                    </span>
                    <Badge
                      variant={
                        isActive && !isExpired
                          ? "default"
                          : token.status === "used"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {tokenStatusLabel(token)}
                    </Badge>
                    {token.usedBy ? (
                      <span className="text-xs text-muted-foreground">
                        {token.usedBy.name}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isActive && !isExpired ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCode(token.code)}
                      >
                        <FaClipboard
                          aria-hidden="true"
                          className="mr-1.5 size-3.5"
                        />
                        {labels.copyCode}
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setConfirmingRevoke(token)}
                    >
                      <FaTrashCan
                        aria-hidden="true"
                        className="mr-1.5 size-3.5"
                      />
                      {labels.revoke}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-2 rounded-2xl bg-card p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-base font-semibold">{labels.listTitle}</h2>

        {members.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {labels.noMembers}
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/30 p-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {member.user.image ? (
                    // biome-ignore lint/performance/noImgElement: user avatar from external auth provider
                    <img
                      src={member.user.image}
                      alt=""
                      className="size-10 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.user.name}
                      {member.userId === currentUserId && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({labels.you})
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      member.role === "owner"
                        ? "default"
                        : member.role === "admin"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {labels.roles[member.role] ?? member.role}
                  </Badge>

                  {canManage && member.userId !== currentUserId ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {isOwner && member.role !== "owner" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateRole(member.id, "owner")}
                        >
                          {labels.promoteOwner}
                        </Button>
                      ) : null}
                      {isOwner && member.role === "owner" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateRole(member.id, "admin")}
                        >
                          {labels.demoteOwner}
                        </Button>
                      ) : null}
                      {member.role !== "admin" && member.role !== "owner" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateRole(member.id, "admin")}
                        >
                          {labels.promoteAdmin}
                        </Button>
                      ) : null}
                      {((isOwner && member.role !== "owner") ||
                        (currentRole === "admin" &&
                          member.role === "member")) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setConfirmingRemove(member)}
                        >
                          {labels.remove}
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog
        open={Boolean(confirmingRevoke)}
        onOpenChange={(open) => {
          if (!open) setConfirmingRevoke(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.revokeConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.revokeConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={revokeToken}
              disabled={revoking}
            >
              {revoking ? labels.loading : labels.revoke}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {confirmingRemove ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: modal overlay with keyboard handler
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onKeyDown={(e) => {
            if (e.key === "Escape") setConfirmingRemove(null);
          }}
        >
          <button
            type="button"
            aria-label={labels.cancel}
            className="absolute inset-0"
            onClick={() => setConfirmingRemove(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={labels.removeConfirmTitle}
            className="relative w-full max-w-sm rounded-2xl bg-background p-5"
          >
            <h3 className="text-base font-semibold">
              {labels.removeConfirmTitle}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {labels.removeConfirmDescription.replace(
                "{{name}}",
                confirmingRemove.user.name,
              )}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmingRemove(null)}>
                {labels.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={() => removeMember(confirmingRemove)}
              >
                {labels.remove}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
