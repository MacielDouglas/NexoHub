"use client";

import { useState } from "react";
import { FaLink, FaUser } from "react-icons/fa6";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ProfileData = {
  userId: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  personId: string | null;
  personName: string | null;
};

type Props = {
  initialProfile: ProfileData;
  labels: {
    title: string;
    subtitle: string;
    accountTitle: string;
    personTitle: string;
    personDescription: string;
    noPerson: string;
    personNameLabel: string;
    save: string;
    saving: string;
    minLength: string;
    saved: string;
  };
};

export function ProfileClient({ initialProfile, labels }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [personName, setPersonName] = useState(initialProfile.personName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPerson = Boolean(profile.personId);

  async function handleSave() {
    const trimmed = personName.trim();
    if (trimmed.length < 3) {
      setError(labels.minLength);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Erro");
        return;
      }
      setProfile(data.profile);
      setPersonName(data.profile.personName ?? "");
      toast.success(labels.saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{labels.title}</h1>
        <p className="mt-1 text-muted-foreground">{labels.subtitle}</p>
      </div>

      <section className="mb-8 space-y-4 rounded-2xl bg-card p-5 ring-1 ring-white/10">
        <h2 className="text-base font-semibold">{labels.accountTitle}</h2>
        <div className="flex items-center gap-4">
          {profile.image ? (
            // biome-ignore lint/performance/noImgElement: user avatar from external auth provider
            <img
              src={profile.image}
              alt=""
              className="size-14 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <FaUser className="size-6" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{profile.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">
              {profile.email ?? "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-white/10">
        <div>
          <h2 className="text-base font-semibold">{labels.personTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.personDescription}
          </p>
        </div>

        {hasPerson ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="person-name">{labels.personNameLabel}</Label>
              <Input
                id="person-name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="h-10 rounded-full border-white/10 bg-card"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              onClick={handleSave}
              disabled={saving}
              className={cn("h-10 rounded-full px-5")}
            >
              {saving ? labels.saving : labels.save}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            <FaLink className="size-4 shrink-0" aria-hidden="true" />
            {labels.noPerson}
          </div>
        )}
      </section>
    </div>
  );
}
