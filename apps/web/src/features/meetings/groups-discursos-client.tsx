"use client";

import {
  ArrowLeft,
  ChevronRight,
  Edit,
  Home,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiscursosClient } from "@/features/discursos/discursos-client";
import { SubOrgDetailClient } from "@/features/sub-org/sub-org-detail-client";

type SubOrg = {
  id: string;
  name: string;
  description: string | null;
  _count: { people: number };
};

type GroupsDiscursosClientProps = {
  slug: string;
  role: string;
  organizationId: string;
  selected: "main" | string | null;
};

const inputClassName = "min-h-11 text-base sm:text-sm";

export function GroupsDiscursosClient({
  slug,
  role,
  organizationId,
  selected,
}: GroupsDiscursosClientProps) {
  const { t } = useTranslation();
  const canManage = role === "owner" || role === "admin";
  const [subOrgs, setSubOrgs] = useState<SubOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSubOrg, setEditSubOrg] = useState<SubOrg | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const groupsHref = `/org/${slug}/meetings?view=groups`;

  const fetchSubOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sub-orgs?orgId=${organizationId}`);
      if (!res.ok) throw new Error("Failed to load sub organizations");
      const data = await res.json();
      setSubOrgs(data.subOrgs ?? []);
    } catch {
      toast.error(
        t("people.subOrg.loadError", "Não foi possível carregar os grupos."),
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId, t]);

  useEffect(() => {
    fetchSubOrgs();
  }, [fetchSubOrgs]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sub-orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("people.subOrg.createSuccess"));
      setCreateDialogOpen(false);
      setCreateName("");
      setCreateDescription("");
      await fetchSubOrgs();
    } catch {
      toast.error(t("people.subOrg.createError"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editSubOrg || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sub-orgs/${editSubOrg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("people.subOrg.editSuccess"));
      setEditDialogOpen(false);
      setEditSubOrg(null);
      await fetchSubOrgs();
    } catch {
      toast.error(t("people.subOrg.editError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sub-orgs/${confirmDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(t("people.subOrg.deleteSuccess"));
      await fetchSubOrgs();
    } catch {
      toast.error(t("people.subOrg.deleteError"));
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  const openEditDialog = (subOrg: SubOrg) => {
    setEditSubOrg(subOrg);
    setEditName(subOrg.name);
    setEditDescription(subOrg.description ?? "");
    setEditDialogOpen(true);
  };

  if (selected === "main") {
    return (
      <div className="min-w-0 space-y-5">
        <Link
          href={groupsHref}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("people.subOrg.back")}
        </Link>
        <DiscursosClient role={role} organizationId={organizationId} />
      </div>
    );
  }

  if (selected) {
    return (
      <SubOrgDetailClient
        role={role}
        _organizationId={organizationId}
        subOrgId={selected}
        backHref={groupsHref}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <section className="min-w-0 space-y-4 sm:space-y-5">
      <header className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {t("meetings.tabGroups")}
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("people.subOrg.subtitle")}
          </p>
        </div>
        {canManage && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger
              render={<Button className="w-full sm:w-auto" size="sm" />}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("people.subOrg.createNew")}
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("people.subOrg.createTitle")}</DialogTitle>
                <DialogDescription>
                  {t("people.subOrg.subtitle")}
                </DialogDescription>
              </DialogHeader>
              <SubOrgForm
                name={createName}
                description={createDescription}
                onNameChange={setCreateName}
                onDescriptionChange={setCreateDescription}
                onCancel={() => setCreateDialogOpen(false)}
                onSubmit={handleCreate}
                submitLabel={t("people.subOrg.create")}
                saving={saving}
              />
            </DialogContent>
          </Dialog>
        )}
      </header>

      <Link
        href={`${groupsHref}&subOrg=main`}
        className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl bg-card p-4 ring-1 ring-white/10 transition-colors hover:ring-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-muted sm:h-12 sm:w-12">
            <Home className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">{t("people.mainCongregation")}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {t("people.mainCongregationTalks")}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>

      {subOrgs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center sm:px-8">
          <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50 sm:h-12 sm:w-12" />
          <p className="text-sm text-muted-foreground sm:text-base">
            {t("people.subOrg.empty")}
          </p>
          {canManage && (
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {t("people.subOrg.emptyHint")}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {subOrgs.map((subOrg) => (
            <div
              key={subOrg.id}
              className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-white/10 transition-colors hover:ring-primary/50 hover:bg-muted/40 sm:p-5"
            >
              <Link
                href={`${groupsHref}&subOrg=${subOrg.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-muted sm:h-12 sm:w-12">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{subOrg.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground tabular-nums">
                    {t("people.subOrg.peopleCount", {
                      count: subOrg._count.people,
                    })}
                    {subOrg.description ? ` · ${subOrg.description}` : ""}
                  </p>
                </div>
              </Link>

              <div className="flex shrink-0 items-center gap-0.5">
                {canManage && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      aria-label={`${t("common.edit")}: ${subOrg.name}`}
                      onClick={() => openEditDialog(subOrg)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive hover:text-destructive"
                      aria-label={`${t("common.delete")}: ${subOrg.name}`}
                      onClick={() => setConfirmDelete(subOrg.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <ChevronRight
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("people.subOrg.editTitle")}</DialogTitle>
          </DialogHeader>
          <SubOrgForm
            name={editName}
            description={editDescription}
            onNameChange={setEditName}
            onDescriptionChange={setEditDescription}
            onCancel={() => setEditDialogOpen(false)}
            onSubmit={handleEdit}
            submitLabel={t("people.subOrg.save")}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("people.subOrg.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("people.subOrg.deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setConfirmDelete(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleDelete}
              disabled={saving}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type SubOrgFormProps = {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  saving: boolean;
};

function SubOrgForm({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onCancel,
  onSubmit,
  submitLabel,
  saving,
}: SubOrgFormProps) {
  const { t } = useTranslation();

  return (
    <form
      className="space-y-5 pt-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="sub-org-name">{t("people.subOrg.name")}</Label>
        <Input
          id="sub-org-name"
          className={inputClassName}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={t("people.subOrg.namePlaceholder")}
          autoFocus
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sub-org-description">
          {t("people.subOrg.description")}
        </Label>
        <Input
          id="sub-org-description"
          className={inputClassName}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={t("people.subOrg.descriptionPlaceholder")}
        />
      </div>
      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={!name.trim() || saving}
        >
          {saving ? t("common.saving", "Salvando...") : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
