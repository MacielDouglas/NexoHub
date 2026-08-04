"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaMagnifyingGlass,
  FaMars,
  FaPencil,
  FaPeopleRoof,
  FaStar,
  FaTrashCan,
  FaUserCheck,
  FaUserPlus,
  FaVenus,
} from "react-icons/fa6";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PersonDialog } from "./person-dialog";
import type { Family, MemberUser, PeopleStats, Person } from "./types";

type Props = {
  slug: string;
  canManage: boolean;
  people: Person[];
  families: Family[];
  users: MemberUser[];
  stats: PeopleStats;
};

const STAT_ICONS = {
  total: FaUserCheck,
  active: FaUserCheck,
  families: FaPeopleRoof,
  men: FaMars,
  women: FaVenus,
  servicePrivilege: FaStar,
} as const;

export function PeopleClient({
  canManage,
  people,
  families,
  users,
  stats,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);
  const [removing, setRemoving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => {
      const family = p.family?.name.toLowerCase() ?? "";
      return p.name.toLowerCase().includes(q) || family.includes(q);
    });
  }, [people, search]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(person: Person) {
    setEditing(person);
    setDialogOpen(true);
  }

  function handleSaved() {
    setDialogOpen(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/people/${deleting.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Erro");
        return;
      }
      toast.success(t("people.deleted"));
      setDeleting(null);
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  const statCards: { key: keyof PeopleStats; label: string }[] = [
    { key: "total", label: t("people.stats.total") },
    { key: "active", label: t("people.stats.active") },
    { key: "families", label: t("people.stats.families") },
    { key: "men", label: t("people.stats.men") },
    { key: "women", label: t("people.stats.women") },
    { key: "servicePrivilege", label: t("people.stats.servicePrivilege") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("people.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("people.subtitle")}</p>
        </div>

        {canManage && (
          <Button onClick={openCreate}>
            <FaUserPlus aria-hidden="true" />
            {t("people.add")}
          </Button>
        )}
      </div>

      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label={t("people.titleLabel")}
      >
        {statCards.map((card) => {
          const Icon = STAT_ICONS[card.key];
          return (
            <Card key={card.key}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-2xl font-semibold">{stats[card.key]}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="relative max-w-md">
        <FaMagnifyingGlass
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("people.searchPlaceholder")}
          aria-label={t("people.search")}
          className="pl-9"
        />
      </div>

      <section aria-label={t("people.title")}>
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {search ? t("people.noSearchResults") : t("people.noPeople")}
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {filtered.map((person) => (
              <li key={person.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        person.sex === "MALE"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/10 text-secondary",
                      )}
                      aria-hidden="true"
                    >
                      {person.sex === "MALE" ? (
                        <FaMars className="size-4" />
                      ) : (
                        <FaVenus className="size-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{person.name}</p>
                        {person.family && (
                          <Badge variant="outline">{person.family.name}</Badge>
                        )}
                        {person.chefeFamilia && (
                          <Badge variant="secondary">Chefe</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {!person.active && (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                        {person.young && <Badge variant="outline">Jovem</Badge>}
                        {person.batizado && (
                          <Badge variant="outline">Batizado</Badge>
                        )}
                        {person.casada && (
                          <Badge variant="outline">Casado(a)</Badge>
                        )}
                        {person.privilegioServico && (
                          <Badge variant="outline">Priv. serviço</Badge>
                        )}
                        {person.user && (
                          <Badge variant="outline">↗ {person.user.name}</Badge>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(person)}
                          aria-label={t("people.edit")}
                        >
                          <FaPencil aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10"
                          aria-label={t("people.remove")}
                          onClick={() => setDeleting(person)}
                        >
                          <FaTrashCan aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PersonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        person={editing}
        families={families}
        users={users}
        onSaved={handleSaved}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("people.removeConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? t("people.removeConfirmDescription", { name: deleting.name })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={removing}
            >
              {removing ? t("common.loading") : t("people.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
