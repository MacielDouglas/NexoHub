"use client";

import { Copy, LogOut, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SignOutButton } from "@/components/sign-out-button";
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
import { Separator } from "@/components/ui/separator";

type OwnerToken = {
  id: string;
  code: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  usedBy?: { id: string; name: string; email: string } | null;
};

type Org = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { members: number };
};

export function AdminClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tokens, setTokens] = useState<OwnerToken[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    const [tokenRes, orgRes] = await Promise.all([
      fetch("/api/tokens"),
      fetch("/api/admin/orgs"),
    ]);
    if (tokenRes.ok) {
      const data = await tokenRes.json();
      if (data.tokens) setTokens(data.tokens);
    }
    if (orgRes.ok) {
      const data = await orgRes.json();
      if (data.organizations) setOrgs(data.organizations);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function createToken() {
    setCreating(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Erro");
        return;
      }
      toast.success(t("admin.tokenCreated"));
      await fetchAll();
    } finally {
      setCreating(false);
    }
  }

  async function revokeToken(id: string) {
    const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro");
      return;
    }
    toast.success(t("admin.tokenRevoked"));
    await fetchAll();
  }

  async function enterOrg(id: string) {
    const res = await fetch(`/api/admin/orgs/${id}/enter`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function deleteOrg(id: string) {
    const res = await fetch(`/api/admin/orgs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro");
      return;
    }
    toast.success(t("admin.orgDeleted"));
    await fetchAll();
  }

  async function exitOrg() {
    await fetch("/api/admin/exit-org", { method: "POST" });
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    toast.success(t("admin.codeCopied"));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED]">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-lg font-semibold">Nexohub</span>
          </div>
          <h1 className="text-2xl font-semibold">{t("admin.title")}</h1>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-800"
            onClick={exitOrg}
          >
            {t("nav.dashboard")}
          </Link>
          <SignOutButton />
        </div>
      </header>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("admin.createTokenTitle")}
                </CardTitle>
                <CardDescription>
                  {t("admin.createTokenDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={createToken} disabled={creating}>
                  <Plus className="size-4" />
                  {creating ? t("common.loading") : t("admin.createToken")}
                </Button>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("admin.tokensTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tokens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("admin.noTokens")}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {tokens.map((token) => (
                      <li
                        key={token.id}
                        className="flex items-center justify-between rounded-xl bg-background px-4 py-3 ring-1 ring-border"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-lg tracking-widest">
                            {token.code}
                          </span>
                          <Badge
                            variant={
                              token.status === "active"
                                ? "default"
                                : token.status === "used"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {t(`admin.tokenStatus.${token.status}`)}
                          </Badge>
                          {token.usedBy && (
                            <span className="text-sm text-muted-foreground">
                              {token.usedBy.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {token.status === "active" && (
                            <>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyCode(token.code)}
                                aria-label={t("admin.copyCode")}
                              >
                                <Copy className="size-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger
                                  render={
                                    <Button size="icon" variant="outline" />
                                  }
                                >
                                  <Trash2 className="size-4" />
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("admin.revokeConfirmTitle")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("admin.revokeConfirmDescription")}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t("common.cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => revokeToken(token.id)}
                                    >
                                      {t("common.delete")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("admin.orgsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orgs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("admin.noOrgs")}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {orgs.map((org) => (
                      <li
                        key={org.id}
                        className="flex items-center justify-between rounded-xl bg-background px-4 py-3 ring-1 ring-border"
                      >
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {org.slug} ·{" "}
                            {t("admin.memberCount", {
                              count: org._count.members,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => enterOrg(org.id)}>
                            {t("admin.enterOrg")}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button size="sm" variant="destructive" />
                              }
                            >
                              <LogOut className="size-4" />
                              {t("admin.deleteOrg")}
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("admin.deleteOrgConfirmTitle")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("admin.deleteOrgConfirmDescription", {
                                    name: org.name,
                                  })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t("common.cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteOrg(org.id)}
                                >
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
