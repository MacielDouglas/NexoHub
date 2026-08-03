"use client";

import { Copy, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

type Member = {
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

type InviteToken = {
  id: string;
  code: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  usedBy?: { id: string; name: string; email: string } | null;
};

export function MembersClient({
  initialMembers,
  initialTokens,
  sessionUserId,
}: {
  initialMembers: Member[];
  initialTokens: InviteToken[];
  sessionUserId: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [tokens, setTokens] = useState<InviteToken[]>(initialTokens);
  const [creating, setCreating] = useState(false);

  const currentRole = members.find((m) => m.userId === session?.user?.id)?.role;
  const isOwner = currentRole === "owner";
  const isAdmin = currentRole === "admin";

  const fetchMembers = useCallback(async () => {
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
      toast.error(data?.error ?? "Erro");
      return;
    }
    toast.success(t("members.roleUpdated"));
    await fetchMembers();
  }

  async function removeMember(id: string) {
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "Erro");
      return;
    }
    toast.success(t("members.memberRemoved"));
    await fetchMembers();
  }

  async function leaveOrg() {
    const res = await fetch("/api/members/leave", { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "Erro");
      return;
    }
    toast.success(t("members.leftOrg"));
    router.push("/welcome");
    router.refresh();
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
        toast.error(data?.error ?? "Erro");
        return;
      }
      toast.success(t("members.tokenCreated"));
      await fetchMembers();
    } finally {
      setCreating(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    toast.success(t("members.codeCopied"));
  }

  const canManage = isOwner || isAdmin;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("members.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("members.subtitle")}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>
            {t("members.leaveOrg")}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("members.leaveConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("members.leaveConfirmDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={leaveOrg}>
                {t("members.leaveOrg")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex flex-col gap-6">
        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("members.inviteTitle")}
              </CardTitle>
              <CardDescription>
                {t("members.inviteDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tokens.filter((token) => token.status === "active").length ===
              0 ? (
                <Button onClick={createToken} disabled={creating}>
                  <Plus className="size-4" />
                  {creating ? t("common.loading") : t("members.createToken")}
                </Button>
              ) : (
                <ul className="space-y-3">
                  {tokens
                    .filter((token) => token.status === "active")
                    .map((token) => (
                      <li
                        key={token.id}
                        className="flex items-center justify-between rounded-xl bg-background px-4 py-3 ring-1 ring-border"
                      >
                        <div>
                          <span className="font-mono text-lg tracking-widest">
                            {token.code}
                          </span>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t("members.tokenHint")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyCode(token.code)}
                        >
                          <Copy className="size-4" />
                          {t("members.copyCode")}
                        </Button>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("members.listTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("members.noMembers")}
              </p>
            ) : (
              <ul className="space-y-3">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-xl bg-background px-4 py-3 ring-1 ring-border"
                  >
                    <div className="flex items-center gap-3">
                      {member.user.image ? (
                        // biome-ignore lint/performance/noImgElement: remote OAuth avatar, next/image requires image domains config
                        <img
                          src={member.user.image}
                          alt={member.user.name}
                          className="h-9 w-9 rounded-full"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {member.user.name}
                          {member.userId === sessionUserId && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({t("members.you")})
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          member.role === "owner"
                            ? "default"
                            : member.role === "admin"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {t(`members.roles.${member.role}`)}
                      </Badge>
                      {canManage && member.userId !== sessionUserId && (
                        <div className="flex gap-1">
                          {isOwner && member.role !== "owner" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateRole(member.id, "owner")}
                            >
                              {t("members.promoteOwner")}
                            </Button>
                          )}
                          {isOwner && member.role === "owner" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateRole(member.id, "admin")}
                            >
                              {t("members.demoteOwner")}
                            </Button>
                          )}
                          {member.role !== "admin" &&
                            member.role !== "owner" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateRole(member.id, "admin")}
                              >
                                {t("members.promoteAdmin")}
                              </Button>
                            )}
                          {((isOwner && member.role !== "owner") ||
                            (isAdmin && member.role === "member")) && (
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button size="sm" variant="destructive" />
                                }
                              >
                                {t("members.remove")}
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("members.removeConfirmTitle")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("members.removeConfirmDescription", {
                                      name: member.user.name,
                                    })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("common.cancel")}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeMember(member.id)}
                                  >
                                    {t("common.delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
