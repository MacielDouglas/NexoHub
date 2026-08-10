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

type DiscursoDate = {
  id: string;
  date: string;
  notes: string | null;
};

type Discurso = {
  id: string;
  personId: string;
  personName: string;
  meetingContentItemId: string;
  number: number | null;
  theme: string;
  dates: DiscursoDate[];
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

type ConfirmDelete = {
  type: "talk" | "date";
  id: string;
} | null;

type MeetingContentResponse = {
  contents?: Array<{
    items?: Array<{
      id: string;
      data?: {
        number?: number | null;
        theme?: string;
      };
    }>;
  }>;
};

type PersonTalkResponse = {
  talks?: Array<{
    id: string;
    personId: string;
    personName: string;
    meetingContentItemId: string;
    meetingContentItem?: {
      data?: {
        number?: number | null;
        theme?: string;
      };
    };
    dates?: DiscursoDate[];
  }>;
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
  const [isAddingTalk, setIsAddingTalk] = useState(false);

  const [datesDialogOpen, setDatesDialogOpen] = useState(false);
  const [datesDialogTalk, setDatesDialogTalk] = useState<Discurso | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogTalk, setEditDialogTalk] = useState<Discurso | null>(null);
  const [editDateValue, setEditDateValue] = useState("");
  const [isAddingDate, setIsAddingDate] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPeople = useCallback(async () => {
    const response = await fetch(
      `/api/people?orgId=${encodeURIComponent(
        organizationId,
      )}&onlyApproved=true`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch people");
    }

    const data = await response.json();
    setPeople(data.people ?? []);
  }, [organizationId]);

  const fetchCatalog = useCallback(async () => {
    const response = await fetch(
      "/api/meeting-content?type=discursos&includeItems=1",
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch talk catalog");
    }

    const data: MeetingContentResponse = await response.json();

    const items =
      data.contents
        ?.flatMap((content) => content.items ?? [])
        .map((item) => ({
          id: item.id,
          number: item.data?.number ?? null,
          theme: item.data?.theme ?? "",
        })) ?? [];

    setCatalog(items);
  }, []);

  const fetchDiscursos = useCallback(async () => {
    const response = await fetch(
      `/api/person-talks?orgId=${encodeURIComponent(organizationId)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch talks");
    }

    const data: PersonTalkResponse = await response.json();

    const formatted: Discurso[] =
      data.talks?.map((talk) => {
        const dates = talk.dates ?? [];

        return {
          id: talk.id,
          personId: talk.personId,
          personName: talk.personName,
          meetingContentItemId: talk.meetingContentItemId,
          number: talk.meetingContentItem?.data?.number ?? null,
          theme: talk.meetingContentItem?.data?.theme ?? "",
          dates,
          lastDate: dates[0]?.date ?? null,
        };
      }) ?? [];

    setDiscursos(formatted);
  }, [organizationId]);

  const refreshDiscursos = useCallback(async () => {
    try {
      await fetchDiscursos();
    } catch {
      toast.error(t("people.discursos.loadError"));
    }
  }, [fetchDiscursos, t]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setLoading(true);

      try {
        const results = await Promise.allSettled([
          fetchPeople(),
          fetchCatalog(),
          fetchDiscursos(),
        ]);

        if (
          !cancelled &&
          results.some((result) => result.status === "rejected")
        ) {
          toast.error(t("people.discursos.loadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [fetchPeople, fetchCatalog, fetchDiscursos, t]);

  const resetAddDialog = () => {
    setAddDialogOpen(false);
    setAddDialogPersonId(null);
    setAddDialogTalkId(null);
    setAddDialogDate("");
  };

  const handleAddTalk = async () => {
    if (!addDialogPersonId || !addDialogTalkId || isAddingTalk) {
      return;
    }

    setIsAddingTalk(true);

    try {
      const response = await fetch("/api/person-talks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personId: addDialogPersonId,
          meetingContentItemId: addDialogTalkId,
          date: addDialogDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add talk");
      }

      toast.success(t("people.discursos.addSuccess"));
      resetAddDialog();
      await refreshDiscursos();
    } catch {
      toast.error(t("people.discursos.addError"));
    } finally {
      setIsAddingTalk(false);
    }
  };

  const handleRemoveTalk = async () => {
    if (!confirmDelete || confirmDelete.type !== "talk" || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/person-talks/${encodeURIComponent(confirmDelete.id)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove talk");
      }

      toast.success(t("people.discursos.removeSuccess"));
      setConfirmDelete(null);
      await refreshDiscursos();
    } catch {
      toast.error(t("people.discursos.removeError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddDate = async () => {
    if (!editDialogTalk || !editDateValue || isAddingDate) {
      return;
    }

    setIsAddingDate(true);

    try {
      const response = await fetch("/api/talk-dates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personTalkId: editDialogTalk.id,
          date: editDateValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add date");
      }

      toast.success(t("people.discursos.dateAddSuccess"));
      setEditDateValue("");
      await refreshDiscursos();
    } catch {
      toast.error(t("people.discursos.dateAddError"));
    } finally {
      setIsAddingDate(false);
    }
  };

  const handleRemoveDate = async () => {
    if (!confirmDelete || confirmDelete.type !== "date" || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/talk-dates/${encodeURIComponent(confirmDelete.id)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove date");
      }

      toast.success(t("people.discursos.dateRemoveSuccess"));
      setConfirmDelete(null);
      await refreshDiscursos();
    } catch {
      toast.error(t("people.discursos.dateRemoveError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddDialog = (personId: string) => {
    setAddDialogPersonId(personId);
    setAddDialogTalkId(null);
    setAddDialogDate("");
    setAddDialogOpen(true);
  };

  const openDatesDialog = (talk: Discurso) => {
    setDatesDialogTalk(talk);
    setDatesDialogOpen(true);
  };

  const openEditDialog = (talk: Discurso) => {
    setEditDialogTalk(talk);
    setEditDateValue("");
    setEditDialogOpen(true);
  };

  const openConfirmDelete = (type: "talk" | "date", id: string) => {
    setConfirmDelete({ type, id });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return "—";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("pt-BR");
  };

  const getAvailableTalks = useCallback(
    (personId: string) => {
      const assignedIds = new Set(
        discursos
          .filter((discurso) => discurso.personId === personId)
          .map((discurso) => discurso.meetingContentItemId),
      );

      return catalog.filter((talk) => !assignedIds.has(talk.id));
    },
    [catalog, discursos],
  );

  const availableTalks = useMemo(
    () => (addDialogPersonId ? getAvailableTalks(addDialogPersonId) : []),
    [addDialogPersonId, getAvailableTalks],
  );

  const sortedPeopleTalks = useCallback(
    (personId: string) => {
      return discursos
        .filter((discurso) => discurso.personId === personId)
        .sort((first, second) => {
          if (first.number == null && second.number == null) {
            return 0;
          }

          if (first.number == null) {
            return 1;
          }

          if (second.number == null) {
            return -1;
          }

          return first.number - second.number;
        });
    },
    [discursos],
  );

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <output className="block text-sm text-muted-foreground">
          {t("common.loading")}
        </output>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl overflow-x-clip px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 space-y-1 sm:mb-8">
        <h1 className="wrap-break-word text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("people.discursos.title")}
        </h1>

        <p className="wrap-break-word text-sm text-muted-foreground sm:text-base">
          {t("people.discursos.subtitle")}
        </p>
      </header>

      {people.length === 0 ? (
        <section
          aria-label={t("people.discursos.title")}
          className="rounded-2xl bg-card p-6 text-center ring-1 ring-border sm:p-8"
        >
          <p className="text-sm text-muted-foreground">
            {t("people.discursos.noApprovedPeople")}
          </p>
        </section>
      ) : (
        <section
          aria-label={t("people.discursos.title")}
          className="space-y-4 sm:space-y-6"
        >
          {people.map((person) => {
            const personTalks = sortedPeopleTalks(person.id);
            const availableForPerson = getAvailableTalks(person.id);

            return (
              <article
                key={person.id}
                className="min-w-0 overflow-hidden rounded-2xl bg-card ring-1 ring-border"
              >
                <header className="flex min-w-0 flex-col gap-4 border-b px-4 py-4 sm:px-5 sm:py-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted"
                      aria-hidden="true"
                    >
                      <CalendarDays className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="wrap-break-word text-base font-medium sm:text-lg">
                        {person.name}
                      </h2>

                      <p className="mt-1 wrap-break-word text-xs leading-5 text-muted-foreground sm:text-sm">
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

                  {canManage && availableForPerson.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full shrink-0 md:w-auto"
                      onClick={() => openAddDialog(person.id)}
                    >
                      <Plus className="mr-1.5 size-4" aria-hidden="true" />
                      {t("people.discursos.addTalk")}
                    </Button>
                  )}
                </header>

                <div className="p-4 sm:p-5">
                  {personTalks.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {t("people.discursos.noTalksAssigned")}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {personTalks.map((talk) => (
                        <li
                          key={talk.id}
                          className="min-w-0 rounded-xl bg-muted/50 p-3 sm:p-4"
                        >
                          <div className="flex min-w-0 flex-col gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="wrap-break-word text-sm font-medium leading-6 sm:text-base">
                                {talk.number != null && (
                                  <span className="mr-1.5 font-semibold text-primary">
                                    {talk.number}.
                                  </span>
                                )}

                                <span className="wrap-break-word">
                                  {talk.theme || "—"}
                                </span>
                              </h3>

                              <p className="mt-1 wrap-break-word text-xs leading-5 text-muted-foreground sm:text-sm">
                                {t("people.discursos.lastDate")}:{" "}
                                {formatDate(talk.lastDate)}
                              </p>
                            </div>

                            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start sm:w-auto sm:justify-center"
                                onClick={() => openDatesDialog(talk)}
                              >
                                <CalendarDays
                                  className="mr-1.5 size-4"
                                  aria-hidden="true"
                                />
                                {t("people.discursos.viewDates")}
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start sm:w-auto sm:justify-center"
                                onClick={() => openEditDialog(talk)}
                              >
                                <Edit
                                  className="mr-1.5 size-4"
                                  aria-hidden="true"
                                />
                                {t("people.discursos.editDates")}
                              </Button>

                              {canManage && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-destructive hover:text-destructive sm:w-auto sm:justify-center"
                                  onClick={() =>
                                    openConfirmDelete("talk", talk.id)
                                  }
                                >
                                  <Trash2
                                    className="mr-1.5 size-4"
                                    aria-hidden="true"
                                  />
                                  {t("people.discursos.removeTalk")}
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);

          if (!open) {
            setAddDialogPersonId(null);
            setAddDialogTalkId(null);
            setAddDialogDate("");
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overflow-x-hidden rounded-2xl sm:max-h-[90dvh]">
          <DialogHeader>
            <DialogTitle className="wrap-break-word">
              {t("people.discursos.addTalkTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2 sm:py-4">
            <div className="space-y-2">
              <Label htmlFor="talk-select">
                {t("people.discursos.selectTalk")}
              </Label>

              <Select
                value={addDialogTalkId ?? ""}
                onValueChange={setAddDialogTalkId}
              >
                <SelectTrigger id="talk-select" className="w-full">
                  <SelectValue
                    placeholder={t("people.discursos.selectTalkPlaceholder")}
                  />
                </SelectTrigger>

                <SelectContent className="max-w-[calc(100vw-2rem)]">
                  {availableTalks.map((talk) => (
                    <SelectItem
                      key={talk.id}
                      value={talk.id}
                      className="max-w-full"
                    >
                      <span className="block max-w-[calc(100vw-5rem)] truncate">
                        {talk.number != null ? `${talk.number}. ` : ""}
                        {talk.theme || "—"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-date">
                {t("people.discursos.initialDate")}
              </Label>

              <Input
                id="initial-date"
                type="date"
                value={addDialogDate}
                onChange={(event) => setAddDialogDate(event.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={resetAddDialog}
                disabled={isAddingTalk}
              >
                {t("common.cancel")}
              </Button>

              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={handleAddTalk}
                disabled={!addDialogTalkId || isAddingTalk}
              >
                <Plus className="mr-1.5 size-4" aria-hidden="true" />
                {t("people.discursos.addTalk")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={datesDialogOpen}
        onOpenChange={(open) => {
          setDatesDialogOpen(open);

          if (!open) {
            setDatesDialogTalk(null);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overflow-x-hidden rounded-2xl sm:max-h-[90dvh]">
          <DialogHeader>
            <DialogTitle>{t("people.discursos.datesTitle")}</DialogTitle>
          </DialogHeader>

          {datesDialogTalk && (
            <div className="space-y-5 py-2 sm:py-4">
              <div className="min-w-0">
                <h3 className="wrap-break-word font-medium">
                  {datesDialogTalk.number != null
                    ? `${datesDialogTalk.number}. `
                    : ""}
                  {datesDialogTalk.theme || "—"}
                </h3>

                <p className="mt-1 wrap-break-word text-sm text-muted-foreground">
                  {t("people.discursos.person")}: {datesDialogTalk.personName}
                </p>
              </div>

              {datesDialogTalk.dates.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("people.discursos.noDates")}
                </p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto overscroll-contain">
                  {datesDialogTalk.dates.map((date) => (
                    <li
                      key={date.id}
                      className="flex min-w-0 flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <time dateTime={date.date} className="shrink-0 text-sm">
                        {formatDate(date.date)}
                      </time>

                      {date.notes && (
                        <span className="wrap-break-word text-xs text-muted-foreground sm:max-w-[65%] sm:text-right">
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

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);

          if (!open) {
            setEditDialogTalk(null);
            setEditDateValue("");
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overflow-x-hidden rounded-2xl sm:max-h-[90dvh]">
          <DialogHeader>
            <DialogTitle>{t("people.discursos.editDatesTitle")}</DialogTitle>
          </DialogHeader>

          {editDialogTalk && (
            <div className="space-y-5 py-2 sm:py-4">
              <h3 className="wrap-break-word font-medium">
                {editDialogTalk.number != null
                  ? `${editDialogTalk.number}. `
                  : ""}
                {editDialogTalk.theme || "—"}
              </h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-date">
                    {t("people.discursos.addNewDate")}
                  </Label>

                  <Input
                    id="new-date"
                    type="date"
                    value={editDateValue}
                    onChange={(event) => setEditDateValue(event.target.value)}
                    className="w-full"
                  />
                </div>

                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={handleAddDate}
                  disabled={!editDateValue || isAddingDate}
                >
                  <Plus className="mr-1.5 size-4" aria-hidden="true" />
                  {t("people.discursos.addDate")}
                </Button>
              </div>

              {editDialogTalk.dates.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-medium">
                    {t("people.discursos.existingDates")}
                  </h3>

                  <ul className="max-h-56 space-y-2 overflow-y-auto overscroll-contain">
                    {editDialogTalk.dates.map((date) => (
                      <li
                        key={date.id}
                        className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-2.5"
                      >
                        <time dateTime={date.date} className="text-sm">
                          {formatDate(date.date)}
                        </time>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`${t(
                            "people.discursos.removeDate",
                          )} ${formatDate(date.date)}`}
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => openConfirmDelete("date", date.id)}
                        >
                          <X className="size-4" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
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
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setConfirmDelete(null);
          }
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="wrap-break-word">
              {confirmDelete?.type === "talk"
                ? t("people.discursos.removeTalkConfirmTitle")
                : t("people.discursos.removeDateConfirmTitle")}
            </AlertDialogTitle>

            <AlertDialogDescription className="wrap-break-word">
              {confirmDelete?.type === "talk"
                ? t("people.discursos.removeTalkConfirmDescription")
                : t("people.discursos.removeDateConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();

                if (confirmDelete?.type === "talk") {
                  void handleRemoveTalk();
                } else {
                  void handleRemoveDate();
                }
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
