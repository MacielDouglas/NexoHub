"use client";

import { CalendarDays, Edit, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

type Discurso = {
  id: string;
  personId: string;
  personName: string;
  meetingContentItemId: string;
  number: number | null;
  theme: string;
  dates: { id: string; date: string; notes: string | null }[];
  lastDate: string | null;
};

type Person = {
  id: string;
  name: string;
  sex: string;
  batizado: boolean;
  privilegioServico: boolean;
  discursoPublico: boolean;
};

type TalkCatalogItem = {
  id: string;
  number: number | null;
  theme: string;
};

export function DiscursosClient({
  role,
  organizationId,
}: {
  role?: string;
  organizationId: string;
}) {
  const { t } = useTranslation();
  const canManage = role === "owner" || role === "admin";

  const [people, setPeople] = useState<Person[]>([]);
  const [catalog, setCatalog] = useState<TalkCatalogItem[]>([]);
  const [discursos, setDiscursos] = useState<Discurso[]>([]);
  const [loading, setLoading] = useState(true);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogPersonId, setAddDialogPersonId] = useState<string | null>(
    null,
  );
  const [addDialogTalkId, setAddDialogTalkId] = useState<string | null>(null);
  const [addDialogDate, setAddDialogDate] = useState("");

  const [datesDialogOpen, setDatesDialogOpen] = useState(false);
  const [datesDialogTalk, setDatesDialogTalk] = useState<Discurso | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogTalk, setEditDialogTalk] = useState<Discurso | null>(null);
  const [editDateValue, setEditDateValue] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<{
    type: "talk" | "date";
    id: string;
  } | null>(null);

  const fetchPeople = useCallback(async () => {
    const res = await fetch(
      `/api/people?orgId=${organizationId}&onlyApproved=true`,
    );
    if (res.ok) {
      const data = await res.json();
      setPeople(data.people ?? []);
    }
  }, [organizationId]);

  const fetchCatalog = useCallback(async () => {
    const res = await fetch(
      `/api/meeting-content?type=discursos&includeItems=1`,
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

  const fetchDiscursos = useCallback(async () => {
    const res = await fetch(`/api/person-talks?orgId=${organizationId}`);
    if (res.ok) {
      const data = await res.json();
      const formatted = (data.talks ?? []).map(
        (t: {
          id: string;
          personId: string;
          personName: string;
          meetingContentItemId: string;
          meetingContentItem: {
            data: { number?: number | null; theme?: string };
          };
          dates: { id: string; date: string; notes: string | null }[];
        }) => {
          const lastDate = t.dates[0]?.date ?? null;
          return {
            id: t.id,
            personId: t.personId,
            personName: t.personName,
            meetingContentItemId: t.meetingContentItemId,
            number: t.meetingContentItem.data.number,
            theme: t.meetingContentItem.data.theme,
            dates: t.dates,
            lastDate,
          };
        },
      );
      setDiscursos(formatted);
    }
  }, [organizationId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchPeople(), fetchCatalog(), fetchDiscursos()]);
      setLoading(false);
    }
    init();
  }, [fetchPeople, fetchCatalog, fetchDiscursos]);

  const handleAddTalk = async () => {
    if (!addDialogPersonId || !addDialogTalkId) return;

    const res = await fetch("/api/person-talks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: addDialogPersonId,
        meetingContentItemId: addDialogTalkId,
        date: addDialogDate || null,
      }),
    });

    if (res.ok) {
      toast.success(t("people.discursos.addSuccess"));
      setAddDialogOpen(false);
      setAddDialogPersonId(null);
      setAddDialogTalkId(null);
      setAddDialogDate("");
      fetchDiscursos();
    } else {
      toast.error(t("people.discursos.addError"));
    }
  };

  const handleRemoveTalk = async () => {
    if (!confirmDelete || confirmDelete.type !== "talk") return;

    const res = await fetch(`/api/person-talks/${confirmDelete.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success(t("people.discursos.removeSuccess"));
      fetchDiscursos();
    } else {
      toast.error(t("people.discursos.removeError"));
    }
    setConfirmDelete(null);
  };

  const handleAddDate = async () => {
    if (!editDialogTalk || !editDateValue) return;

    const res = await fetch("/api/talk-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personTalkId: editDialogTalk.id,
        date: editDateValue,
      }),
    });

    if (res.ok) {
      toast.success(t("people.discursos.dateAddSuccess"));
      setEditDateValue("");
      fetchDiscursos();
    } else {
      toast.error(t("people.discursos.dateAddError"));
    }
  };

  const handleRemoveDate = async () => {
    if (!confirmDelete || confirmDelete.type !== "date") return;

    const res = await fetch(`/api/talk-dates/${confirmDelete.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success(t("people.discursos.dateRemoveSuccess"));
      fetchDiscursos();
    } else {
      toast.error(t("people.discursos.dateRemoveError"));
    }
    setConfirmDelete(null);
  };

  const openAddDialog = (personId: string) => {
    setAddDialogPersonId(personId);
    setAddDialogOpen(true);
  };

  const openDatesDialog = (talk: Discurso) => {
    setDatesDialogTalk(talk);
    setDatesDialogOpen(true);
  };

  const openEditDialog = (talk: Discurso) => {
    setEditDialogTalk(talk);
    setEditDialogOpen(true);
  };

  const openConfirmDelete = (type: "talk" | "date", id: string) => {
    setConfirmDelete({ type, id });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR");
  };

  const getAvailableTalks = useCallback(
    (personId: string) => {
      const assignedIds = discursos
        .filter((d) => d.personId === personId)
        .map((d) => d.meetingContentItemId);
      return catalog.filter((t) => !assignedIds.includes(t.id));
    },
    [discursos, catalog],
  );

  const availableTalks = useMemo(
    () => (addDialogPersonId ? getAvailableTalks(addDialogPersonId) : []),
    [addDialogPersonId, getAvailableTalks],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          {t("people.discursos.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("people.discursos.subtitle")}
        </p>
      </div>

      {people.length === 0 && (
        <div className="rounded-2xl bg-card p-8 ring-1 ring-border text-center">
          <p className="text-muted-foreground">
            {t("people.discursos.noApprovedPeople")}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {people.map((person) => {
          const personTalks = discursos.filter((d) => d.personId === person.id);
          const availableTalks = getAvailableTalks(person.id);

          return (
            <div
              key={person.id}
              className="rounded-2xl bg-card ring-1 ring-border"
            >
              <div className="px-5 py-4 border-b flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {person.sex === "MALE"
                        ? t("people.form.sexMale")
                        : t("people.form.sexFemale")}{" "}
                      ·{" "}
                      {person.batizado
                        ? t("people.baptized")
                        : t("people.notBaptized")}{" "}
                      ·{" "}
                      {person.privilegioServico
                        ? t("people.approvedPublicTalk")
                        : t("people.notApprovedPublicTalk")}
                    </p>
                  </div>
                </div>

                {canManage && availableTalks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddDialog(person.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("people.discursos.addTalk")}
                  </Button>
                )}
              </div>

              <div className="p-5">
                {personTalks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {t("people.discursos.noTalksAssigned")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {personTalks.map((talk) => (
                      <div
                        key={talk.id}
                        className="rounded-xl bg-muted/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {talk.number != null ? (
                              <span className="mr-1.5 font-semibold text-primary">
                                {talk.number}.
                              </span>
                            ) : null}
                            {talk.theme || "—"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("people.discursos.lastDate")}:{" "}
                            {formatDate(talk.lastDate)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDatesDialog(talk)}
                          >
                            <CalendarDays className="h-4 w-4 mr-1" />
                            {t("people.discursos.viewDates")}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(talk)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t("people.discursos.editDates")}
                          </Button>

                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openConfirmDelete("talk", talk.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {t("people.discursos.removeTalk")}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("people.discursos.addTalkTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("people.discursos.selectTalk")}</Label>
              <Select
                value={addDialogTalkId ?? ""}
                onValueChange={setAddDialogTalkId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("people.discursos.selectTalkPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableTalks.map((talk) => (
                    <SelectItem key={talk.id} value={talk.id}>
                      {talk.number != null ? `${talk.number}. ` : ""}
                      {talk.theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("people.discursos.initialDate")}</Label>
              <Input
                type="date"
                value={addDialogDate}
                onChange={(e) => setAddDialogDate(e.target.value)}
                placeholder={t("people.discursos.datePlaceholder")}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddTalk} disabled={!addDialogTalkId}>
                {t("people.discursos.addTalk")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={datesDialogOpen} onOpenChange={setDatesDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("people.discursos.datesTitle")}</DialogTitle>
          </DialogHeader>
          {datesDialogTalk && (
            <div className="space-y-4 py-4">
              <p className="font-medium">
                {datesDialogTalk.number != null
                  ? `${datesDialogTalk.number}. `
                  : ""}
                {datesDialogTalk.theme}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("people.discursos.person")}: {datesDialogTalk.personName}
              </p>

              {datesDialogTalk.dates.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t("people.discursos.noDates")}
                </p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {datesDialogTalk.dates.map((date) => (
                    <li
                      key={date.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span>{formatDate(date.date)}</span>
                      {date.notes && (
                        <span className="text-xs text-muted-foreground">
                          {date.notes}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("people.discursos.editDatesTitle")}</DialogTitle>
          </DialogHeader>
          {editDialogTalk && (
            <div className="space-y-4 py-4">
              <p className="font-medium">
                {editDialogTalk.number != null
                  ? `${editDialogTalk.number}. `
                  : ""}
                {editDialogTalk.theme}
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("people.discursos.addNewDate")}</Label>
                  <Input
                    type="date"
                    value={editDateValue}
                    onChange={(e) => setEditDateValue(e.target.value)}
                    placeholder={t("people.discursos.datePlaceholder")}
                  />
                  <Button onClick={handleAddDate} disabled={!editDateValue}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t("people.discursos.addDate")}
                  </Button>
                </div>

                {editDialogTalk.dates.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <Label>{t("people.discursos.existingDates")}</Label>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {editDialogTalk.dates.map((date) => (
                        <li
                          key={date.id}
                          className="flex items-center justify-between rounded-lg border p-2"
                        >
                          <span className="text-sm">
                            {formatDate(date.date)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openConfirmDelete("date", date.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDelete != null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete?.type === "talk"
                ? t("people.discursos.removeTalkConfirmTitle")
                : t("people.discursos.removeDateConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.type === "talk"
                ? t("people.discursos.removeTalkConfirmDescription")
                : t("people.discursos.removeDateConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                confirmDelete?.type === "talk"
                  ? handleRemoveTalk()
                  : handleRemoveDate()
              }
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
