"use client";

/*
CONTRACT · seed ea58f3f2 · world: Itaú current banking app (user-pinned; assigned candidate 6 overridden)
THESIS: The congregation register reads as a bank home — the "saldo" of people as the hero number, statement rows as the roster.
OWN-WORLD: ink surface (#0c0c12) with Itaú orange #EC7000; dark cards, soft white rings, tabular numerals, one orange glow in the hero; badge chips keep semantic variants.
STORY: owner/admin sees the congregation as a balance sheet — total in focus, five statement cells, search pill, family-led rows with edit/remove on the right.
FIRST VIEWPORT: dark rounded panel; "Pessoas" header + Nova pessoa pill; hero card with total + 5 stat cells; search pill; family rows.
FORM: user-pinned Itaú world, no re-roll taken; seed key ea58f3f2.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/

import { useRouter } from "next/navigation";
import { type ComponentType, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaLink,
  FaMagnifyingGlass,
  FaMars,
  FaPencil,
  FaPeopleRoof,
  FaTrashCan,
  FaUserCheck,
  FaUserPlus,
  FaUsers,
  FaUserTie,
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

type StatCell = {
  key: keyof PeopleStats;
  label: string;
  icon: ComponentType<{ className?: string }>;
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

  const secondaryStats: StatCell[] = [
    {
      key: "active",
      label: t("people.stats.active"),
      icon: FaUserCheck,
    },
    {
      key: "families",
      label: t("people.stats.families"),
      icon: FaPeopleRoof,
    },
    { key: "men", label: t("people.stats.men"), icon: FaMars },
    { key: "women", label: t("people.stats.women"), icon: FaVenus },
    {
      key: "servicePrivilege",
      label: t("people.stats.servicePrivilege"),
      icon: FaUserTie,
    },
  ];

  return (
    <div className="people-banking rounded-3xl bg-background ring-1 ring-white/10">
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {t("people.title")}
            </h1>
            <p className="mt-1 text-muted-foreground">{t("people.subtitle")}</p>
          </div>

          {canManage && (
            <Button onClick={openCreate} className="h-10 rounded-full px-5">
              <FaUserPlus aria-hidden="true" />
              {t("people.add")}
            </Button>
          )}
        </header>

        <section
          className="relative overflow-hidden rounded-2xl bg-card ring-1 ring-white/10"
          aria-label={t("people.titleLabel")}
        >
          <div
            className="bank-hero-glow pointer-events-none absolute inset-0"
            aria-hidden="true"
          />

          <div className="relative grid gap-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("people.stats.total")}
                </p>
                <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {stats.total}
                </p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <FaUsers className="size-5" aria-hidden="true" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {secondaryStats.map((cell) => {
                const Icon = cell.icon;
                return (
                  <div
                    key={cell.key}
                    className="rounded-xl bg-muted/40 p-3 ring-1 ring-white/5"
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon className="size-3.5" aria-hidden="true" />
                      <p className="truncate text-xs font-medium">
                        {cell.label}
                      </p>
                    </div>
                    <p className="mt-1.5 text-2xl font-semibold text-foreground tabular-nums">
                      {stats[cell.key]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="relative max-w-md">
          <FaMagnifyingGlass
            className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("people.searchPlaceholder")}
            aria-label={t("people.search")}
            className="h-10 rounded-full border-white/10 bg-card pl-10"
          />
        </div>

        <section aria-label={t("people.title")}>
          {groupedPeople.familyNames.length === 0 &&
          groupedPeople.noFamily.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card p-10 text-center ring-1 ring-white/10">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                <FaUsers className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-muted-foreground">
                {search ? t("people.noSearchResults") : t("people.noPeople")}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedPeople.familyNames.map((familyName) => {
                const members = groupedPeople.grouped[familyName];
                return (
                  <div key={familyName} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {familyName}
                      </h3>
                      <span
                        className="h-px flex-1 bg-white/10"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="space-y-2">
                      {members.map((person) => (
                        <PersonRow
                          key={person.id}
                          person={person}
                          canManage={canManage}
                          onEdit={openEdit}
                          onDelete={setDeleting}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {groupedPeople.noFamily.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("people.noFamilyGroup")}
                    </h3>
                    <span
                      className="h-px flex-1 bg-white/10"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="space-y-2">
                    {groupedPeople.noFamily.map((person) => (
                      <PersonRow
                        key={person.id}
                        person={person}
                        canManage={canManage}
                        onEdit={openEdit}
                        onDelete={setDeleting}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

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
        <AlertDialogContent size="sm" className="people-banking">
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

function PersonRow({
  person,
  canManage,
  onEdit,
  onDelete,
}: {
  person: Person;
  canManage: boolean;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="group flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-white/10 transition-colors hover:ring-primary/40 sm:p-4">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          person.sex === "MALE"
            ? "bg-primary/15 text-primary"
            : "bg-white/10 text-foreground",
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
        <p className="truncate text-sm font-medium text-foreground">
          {person.name}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {!person.active && (
            <Badge variant="destructive" className="text-xs">
              {t("people.inactive")}
            </Badge>
          )}
          {person.young && (
            <Badge variant="outline" className="text-xs">
              {t("people.young")}
            </Badge>
          )}
          {person.batizado && (
            <Badge variant="outline" className="text-xs">
              {t("people.baptized")}
            </Badge>
          )}
          {person.casada && (
            <Badge variant="outline" className="text-xs">
              {t("people.married")}
            </Badge>
          )}
          {person.privilegioServico && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              {t("people.servicePrivilegeShort")}
            </Badge>
          )}
          {person.chefeFamilia && (
            <Badge variant="secondary" className="text-xs">
              {t("people.head")}
            </Badge>
          )}
          {person.user && (
            <Badge variant="outline" className="gap-1 text-xs">
              <FaLink className="size-2.5" aria-hidden="true" />
              {person.user.name}
            </Badge>
          )}
        </div>
      </div>

      {canManage && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(person)}
            aria-label={t("people.edit")}
            className="text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            <FaPencil aria-hidden="true" className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={t("people.remove")}
            onClick={() => onDelete(person)}
          >
            <FaTrashCan aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
