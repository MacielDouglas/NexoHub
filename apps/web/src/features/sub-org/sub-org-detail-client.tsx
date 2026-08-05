"use client";

import {
  ArrowLeft,
  ArrowRightLeft,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TalkItem = {
  id: string;
  meetingContentItemId: string;
  date: string | null;
  meetingContentItem: {
    id: string;
    data: { number?: number | null; theme?: string };
  };
};

type SubOrgPerson = {
  id: string;
  name: string;
  batizado: boolean;
  privilegioServico: boolean;
  talks: TalkItem[];
};

type SubOrg = {
  id: string;
  name: string;
  description: string | null;
  people: SubOrgPerson[];
};

type CatalogItem = {
  id: string;
  number: number | null;
  theme: string;
};

type SelectedTalk = {
  meetingContentItemId: string;
  date: string;
};

const EMPTY_TALK: SelectedTalk = { meetingContentItemId: "", date: "" };

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

function talkLabel(item: CatalogItem): string {
  const num = item.number != null ? `${item.number} - ` : "";
  return `${num}${item.theme}`;
}

export function SubOrgDetailClient({
  role,
  organizationId,
  subOrgId,
}: {
  role?: string;
  organizationId: string;
  subOrgId: string;
}) {
  const { t } = useTranslation();
  const canManage = role === "owner" || role === "admin";

  const [subOrg, setSubOrg] = useState<SubOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<SubOrgPerson | null>(null);
  const [personName, setPersonName] = useState("");
  const [selectedTalks, setSelectedTalks] = useState<SelectedTalk[]>([]);
  const [busy, setBusy] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [migrating, setMigrating] = useState<SubOrgPerson | null>(null);
  const [migrateBusy, setMigrateBusy] = useState(false);
  const [migrateSex, setMigrateSex] = useState<"MALE" | "FEMALE">("MALE");
  const [migrateBatizado, setMigrateBatizado] = useState(true);
  const [migratePrivilegio, setMigratePrivilegio] = useState(true);
  const [migrateDiscursoPublico, setMigrateDiscursoPublico] = useState(true);

  const fetchSubOrg = useCallback(async () => {
    const res = await fetch(`/api/sub-orgs?subOrgId=${subOrgId}`);
    if (res.ok) {
      const data = await res.json();
      setSubOrg(data.subOrg ?? null);
    }
    setLoading(false);
  }, [subOrgId]);

  const fetchCatalog = useCallback(async () => {
    const res = await fetch(
      "/api/meeting-content?type=discursos&includeItems=1",
    );
    if (res.ok) {
      const data = await res.json();
      const items = (data.contents ?? [])
        .flatMap(
          (c: {
            items?: {
              id: string;
              data: { number?: number | null; theme?: string };
            }[];
          }) => c.items ?? [],
        )
        .map(
          (item: {
            id: string;
            data: { number?: number | null; theme?: string };
          }) => ({
            id: item.id,
            number: item.data.number ?? null,
            theme: item.data.theme ?? "",
          }),
        );
      setCatalog(items);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSubOrg(), fetchCatalog()]);
  }, [fetchSubOrg, fetchCatalog]);

  const catalogByItem = useMemo(
    () => new Map(catalog.map((c) => [c.id, c])),
    [catalog],
  );

  const usedItemIds = useMemo(
    () => new Set(selectedTalks.map((s) => s.meetingContentItemId)),
    [selectedTalks],
  );

  const availableCatalog = useMemo(
    () => catalog.filter((c) => !usedItemIds.has(c.id)),
    [catalog, usedItemIds],
  );

  function openCreate() {
    setEditingPerson(null);
    setPersonName("");
    setSelectedTalks([]);
    setDialogOpen(true);
  }

  function openEdit(person: SubOrgPerson) {
    setEditingPerson(person);
    setPersonName(person.name);
    setSelectedTalks(
      person.talks.map((talk) => ({
        meetingContentItemId: talk.meetingContentItemId,
        date: talk.date ?? "",
      })),
    );
    setDialogOpen(true);
  }

  function updateTalk(index: number, patch: Partial<SelectedTalk>) {
    setSelectedTalks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  function removeTalk(index: number) {
    setSelectedTalks((prev) => prev.filter((_, i) => i !== index));
  }

  function addTalkFromSelection(itemId: string) {
    if (!itemId) return;
    setSelectedTalks((prev) => [
      ...prev,
      { meetingContentItemId: itemId, date: "" },
    ]);
  }

  const handleSavePerson = async () => {
    if (!personName.trim()) return;
    setBusy(true);
    try {
      const payload = {
        name: personName.trim(),
        talks: selectedTalks.map((s) => ({
          meetingContentItemId: s.meetingContentItemId,
          date: s.date || null,
        })),
      };

      const res = editingPerson
        ? await fetch(`/api/sub-org-people/${editingPerson.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/sub-org-people", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, subOrgId }),
          });

      if (res.ok) {
        toast.success(
          editingPerson
            ? t("people.subOrg.editPersonSuccess")
            : t("people.subOrg.addPersonSuccess"),
        );
        setDialogOpen(false);
        setEditingPerson(null);
        setPersonName("");
        setSelectedTalks([]);
        fetchSubOrg();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? t("people.subOrg.savePersonError"));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePerson = async () => {
    if (!confirmDelete) return;

    const res = await fetch(`/api/sub-org-people/${confirmDelete}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success(t("people.subOrg.removePersonSuccess"));
      fetchSubOrg();
    } else {
      toast.error(t("people.subOrg.removePersonError"));
    }
    setConfirmDelete(null);
  };

  const openMigrate = (person: SubOrgPerson) => {
    setMigrateSex("MALE");
    setMigrateBatizado(person.batizado);
    setMigratePrivilegio(person.privilegioServico);
    setMigrateDiscursoPublico(true);
    setMigrating(person);
  };

  const handleMigrate = async () => {
    if (!migrating) return;
    setMigrateBusy(true);
    try {
      const res = await fetch("/api/migrate-person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: "sub-to-org",
          personId: migrating.id,
          sex: migrateSex,
          batizado: migrateBatizado,
          privilegioServico: migratePrivilegio,
          discursoPublico: migrateDiscursoPublico,
        }),
      });
      if (res.ok) {
        toast.success(
          t("people.subOrg.migrateToOrgSuccess", { name: migrating.name }),
        );
        setMigrating(null);
        fetchSubOrg();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? t("people.subOrg.migrateToOrgError"));
      }
    } finally {
      setMigrateBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!subOrg) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-muted-foreground">{t("people.subOrg.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href={`/org/${organizationId}/sub-org`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("people.subOrg.back")}
      </Link>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{subOrg.name}</h1>
          {subOrg.description && (
            <p className="mt-1 text-muted-foreground">{subOrg.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {t("people.subOrg.peopleCount", { count: subOrg.people.length })}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            {t("people.subOrg.addPerson")}
          </Button>
        )}
      </div>

      {subOrg.people.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 ring-1 ring-border text-center">
          <p className="text-muted-foreground">{t("people.subOrg.noPeople")}</p>
          {canManage && (
            <p className="text-sm text-muted-foreground mt-2">
              {t("people.subOrg.noPeopleHint")}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {subOrg.people.map((person) => (
            <div
              key={person.id}
              className="rounded-2xl bg-card p-5 ring-1 ring-border"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{person.name}</p>
                  {person.talks.length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("people.subOrg.noTalks")}
                    </p>
                  ) : (
                    <ul className="mt-1.5 space-y-0.5">
                      {person.talks.map((talk) => {
                        const item = catalogByItem.get(
                          talk.meetingContentItemId,
                        );
                        const num =
                          item?.number != null ? `${item.number} - ` : "";
                        const theme =
                          item?.theme ??
                          talk.meetingContentItem.data.theme ??
                          "";
                        const date = formatDate(talk.date);
                        return (
                          <li
                            key={talk.id}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground"
                          >
                            <span className="flex items-center gap-1.5 min-w-0">
                              <span className="shrink-0 font-semibold text-primary">
                                {num.trim() ? `${item?.number} -` : ""}
                              </span>
                              <span className="truncate">
                                {theme}
                                {date ? (
                                  <>
                                    {" "}
                                    <span className="text-muted-foreground/70">
                                      - {date}.
                                    </span>
                                  </>
                                ) : null}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(person)}
                      aria-label={t("people.subOrg.editPerson")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMigrate(person)}
                      aria-label={t("people.subOrg.migrateToOrg")}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(person.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPerson
                ? t("people.subOrg.editPersonTitle")
                : t("people.subOrg.addPersonTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("people.subOrg.personName")}</Label>
              <Input
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder={t("people.subOrg.personNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("people.subOrg.addTalk")}</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={EMPTY_TALK.meetingContentItemId}
                  onValueChange={(v) => addTalkFromSelection(v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={t("people.subOrg.selectTalkPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCatalog.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {t("people.subOrg.noAvailableTalks")}
                      </div>
                    ) : (
                      availableCatalog.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {talkLabel(item)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedTalks.length > 0 && (
              <div className="space-y-2">
                <Label>{t("people.subOrg.selectedTalks")}</Label>
                <ul className="space-y-2">
                  {selectedTalks.map((talk, index) => {
                    const item = catalogByItem.get(talk.meetingContentItemId);
                    return (
                      <li
                        key={talk.meetingContentItemId}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-medium">
                            {item ? talkLabel(item) : talk.meetingContentItemId}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeTalk(index)}
                            aria-label={t("common.remove")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 space-y-1">
                          <Label className="text-xs">
                            {t("people.subOrg.talkDate")}
                          </Label>
                          <Input
                            type="date"
                            value={talk.date}
                            onChange={(e) =>
                              updateTalk(index, { date: e.target.value })
                            }
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSavePerson}
                disabled={!personName.trim() || busy}
              >
                {busy ? t("common.loading") : t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("people.subOrg.removePersonConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("people.subOrg.removePersonConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeletePerson}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!migrating}
        onOpenChange={(open) => !open && setMigrating(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("people.subOrg.migrateToOrgTitle")}</DialogTitle>
            <DialogDescription>
              {migrating
                ? t("people.subOrg.migrateToOrgDescription", {
                    name: migrating.name,
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("people.subOrg.migrateSex")}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="migrate-sex"
                    checked={migrateSex === "MALE"}
                    onChange={() => setMigrateSex("MALE")}
                  />
                  {t("people.subOrg.migrateMale")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="migrate-sex"
                    checked={migrateSex === "FEMALE"}
                    onChange={() => setMigrateSex("FEMALE")}
                  />
                  {t("people.subOrg.migrateFemale")}
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="migrate-batizado"
                  checked={migrateBatizado}
                  onCheckedChange={(v) => setMigrateBatizado(v === true)}
                />
                <label htmlFor="migrate-batizado" className="text-sm">
                  {t("people.subOrg.batizado")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="migrate-privilegio"
                  checked={migratePrivilegio}
                  onCheckedChange={(v) => setMigratePrivilegio(v === true)}
                />
                <label htmlFor="migrate-privilegio" className="text-sm">
                  {t("people.subOrg.approvedPublicTalk")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="migrate-discurso-publico"
                  checked={migrateDiscursoPublico}
                  onCheckedChange={(v) => setMigrateDiscursoPublico(v === true)}
                />
                <label htmlFor="migrate-discurso-publico" className="text-sm">
                  {t("people.subOrg.migrateDiscursoPublico")}
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMigrating(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleMigrate} disabled={migrateBusy}>
              {migrateBusy
                ? t("common.loading")
                : t("people.subOrg.migrateToOrg")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
