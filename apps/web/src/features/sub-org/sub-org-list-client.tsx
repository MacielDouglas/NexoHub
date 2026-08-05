"use client";

import { ChevronRight, Edit, Plus, Trash2, Users } from "lucide-react";
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

type SubOrg = {
  id: string;
  name: string;
  description: string | null;
  _count: { people: number };
};

export function SubOrgListClient({
  role,
  organizationId,
}: {
  role?: string;
  organizationId: string;
}) {
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

  const fetchSubOrgs = useCallback(async () => {
    const res = await fetch(`/api/sub-orgs?orgId=${organizationId}`);
    if (res.ok) {
      const data = await res.json();
      setSubOrgs(data.subOrgs ?? []);
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    fetchSubOrgs();
  }, [fetchSubOrgs]);

  const handleCreate = async () => {
    if (!createName.trim()) return;

    const res = await fetch("/api/sub-orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createName.trim(),
        description: createDescription.trim() || null,
      }),
    });

    if (res.ok) {
      toast.success(t("people.subOrg.createSuccess"));
      setCreateDialogOpen(false);
      setCreateName("");
      setCreateDescription("");
      fetchSubOrgs();
    } else {
      toast.error(t("people.subOrg.createError"));
    }
  };

  const handleEdit = async () => {
    if (!editSubOrg || !editName.trim()) return;

    const res = await fetch(`/api/sub-orgs/${editSubOrg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        description: editDescription.trim() || null,
      }),
    });

    if (res.ok) {
      toast.success(t("people.subOrg.editSuccess"));
      setEditDialogOpen(false);
      setEditSubOrg(null);
      setEditName("");
      setEditDescription("");
      fetchSubOrgs();
    } else {
      toast.error(t("people.subOrg.editError"));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    const res = await fetch(`/api/sub-orgs/${confirmDelete}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success(t("people.subOrg.deleteSuccess"));
      fetchSubOrgs();
    } else {
      toast.error(t("people.subOrg.deleteError"));
    }
    setConfirmDelete(null);
  };

  const openEditDialog = (subOrg: SubOrg) => {
    setEditSubOrg(subOrg);
    setEditName(subOrg.name);
    setEditDescription(subOrg.description ?? "");
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("people.subOrg.title")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("people.subOrg.subtitle")}
          </p>
        </div>
        {canManage && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4 mr-1" />
              {t("people.subOrg.createNew")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("people.subOrg.createTitle")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("people.subOrg.name")}</Label>
                  <Input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder={t("people.subOrg.namePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("people.subOrg.description")}</Label>
                  <Input
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder={t("people.subOrg.descriptionPlaceholder")}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleCreate} disabled={!createName.trim()}>
                    {t("people.subOrg.create")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {subOrgs.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 ring-1 ring-border text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t("people.subOrg.empty")}</p>
          {canManage && (
            <p className="text-sm text-muted-foreground mt-2">
              {t("people.subOrg.emptyHint")}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {subOrgs.map((subOrg) => (
            <Link
              key={subOrg.id}
              href={`/org/${organizationId}/sub-org/${subOrg.id}`}
              className="flex items-center justify-between rounded-2xl bg-card p-5 ring-1 ring-border hover:ring-primary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted">
                  <Users className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">{subOrg.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("people.subOrg.peopleCount", {
                      count: subOrg._count.people,
                    })}
                    {subOrg.description && ` · ${subOrg.description}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canManage && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        openEditDialog(subOrg);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        setConfirmDelete(subOrg.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("people.subOrg.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("people.subOrg.name")}</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t("people.subOrg.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("people.subOrg.description")}</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={t("people.subOrg.descriptionPlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleEdit} disabled={!editName.trim()}>
                {t("people.subOrg.save")}
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
            <DialogTitle>{t("people.subOrg.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("people.subOrg.deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
