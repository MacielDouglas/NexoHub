"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaMagnifyingGlass,
  FaMars,
  FaPencil,
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

  const groupedPeople = useMemo(() => {
    const grouped: Record<string, Person[]> = {};
    const noFamily: Person[] = [];

    for (const person of filtered) {
      if (person.family) {
        const key = person.family.name;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(person);
      } else {
        noFamily.push(person);
      }
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    noFamily.sort((a, b) => a.name.localeCompare(b.name));

    const familyNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    return { grouped, noFamily, familyNames };
  }, [filtered]);

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

  const statCards: {
    key: keyof PeopleStats;
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }[] = [
    { key: "total", label: t("people.stats.total"), variant: "default" },
    { key: "active", label: t("people.stats.active"), variant: "secondary" },
    { key: "families", label: t("people.stats.families"), variant: "outline" },
    { key: "men", label: t("people.stats.men"), variant: "default" },
    { key: "women", label: t("people.stats.women"), variant: "destructive" },
    {
      key: "servicePrivilege",
      label: t("people.stats.servicePrivilege"),
      variant: "secondary",
    },
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
        className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        aria-label={t("people.titleLabel")}
      >
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="p-4">
              <Badge
                variant={card.variant}
                className="h-9 w-9 flex items-center justify-center p-0"
              >
                <FaUserCheck className="h-4 w-4" aria-hidden="true" />
              </Badge>
              <div className="mt-2">
                <p className="truncate text-xs text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-xl font-semibold">{stats[card.key]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
        {groupedPeople.familyNames.length === 0 &&
        groupedPeople.noFamily.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {search ? t("people.noSearchResults") : t("people.noPeople")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedPeople.familyNames.map((familyName) => {
              const members = groupedPeople.grouped[familyName];
              return (
                <div key={familyName} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-2">
                    {familyName}
                  </h3>
                  {members.map((person) => (
                    <Card key={person.id}>
                      <CardContent className="flex flex-wrap items-center gap-3 p-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            person.sex === "MALE"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary/10 text-secondary",
                          )}
                          aria-hidden="true"
                        >
                          {person.sex === "MALE" ? (
                            <FaMars className="size-3" />
                          ) : (
                            <FaVenus className="size-3" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">
                            {person.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {!person.active && (
                              <Badge variant="destructive" className="text-xs">
                                Inativo
                              </Badge>
                            )}
                            {person.young && (
                              <Badge variant="outline" className="text-xs">
                                Jovem
                              </Badge>
                            )}
                            {person.batizado && (
                              <Badge variant="outline" className="text-xs">
                                Batizado
                              </Badge>
                            )}
                            {person.casada && (
                              <Badge variant="outline" className="text-xs">
                                Casado(a)
                              </Badge>
                            )}
                            {person.privilegioServico && (
                              <Badge variant="outline" className="text-xs">
                                Priv. serviço
                              </Badge>
                            )}
                            {person.chefeFamilia && (
                              <Badge variant="secondary" className="text-xs">
                                Chefe
                              </Badge>
                            )}
                            {person.user && (
                              <Badge variant="outline" className="text-xs">
                                ↗ {person.user.name}
                              </Badge>
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
                              <FaPencil aria-hidden="true" className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10"
                              aria-label={t("people.remove")}
                              onClick={() => setDeleting(person)}
                            >
                              <FaTrashCan
                                aria-hidden="true"
                                className="size-3"
                              />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })}

            {groupedPeople.noFamily.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-2">
                  {t("people.noFamilyGroup")}
                </h3>
                {groupedPeople.noFamily.map((person) => (
                  <Card key={person.id}>
                    <CardContent className="flex flex-wrap items-center gap-3 p-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          person.sex === "MALE"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/10 text-secondary",
                        )}
                        aria-hidden="true"
                      >
                        {person.sex === "MALE" ? (
                          <FaMars className="size-3" />
                        ) : (
                          <FaVenus className="size-3" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {person.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {!person.active && (
                            <Badge variant="destructive" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                          {person.young && (
                            <Badge variant="outline" className="text-xs">
                              Jovem
                            </Badge>
                          )}
                          {person.batizado && (
                            <Badge variant="outline" className="text-xs">
                              Batizado
                            </Badge>
                          )}
                          {person.casada && (
                            <Badge variant="outline" className="text-xs">
                              Casado(a)
                            </Badge>
                          )}
                          {person.privilegioServico && (
                            <Badge variant="outline" className="text-xs">
                              Priv. serviço
                            </Badge>
                          )}
                          {person.user && (
                            <Badge variant="outline" className="text-xs">
                              ↗ {person.user.name}
                            </Badge>
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
                            <FaPencil aria-hidden="true" className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:bg-destructive/10"
                            aria-label={t("people.remove")}
                            onClick={() => setDeleting(person)}
                          >
                            <FaTrashCan aria-hidden="true" className="size-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
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
