"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMars, FaVenus } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  showDesignacoes,
  showPrivilegioServico,
  showPrivilegios,
  showPrivilegiosServico,
} from "@/lib/people";
import { cn } from "@/lib/utils";
import type { Family, MemberUser, Person, Sex } from "./types";

type FormState = {
  name: string;
  sex: Sex;
  active: boolean;
  young: boolean;
  batizado: boolean;
  limpeza: boolean;
  estudante: boolean;
  privilegioServico: boolean;

  chefeFamilia: boolean;
  casada: boolean;
  familyId: string;
  familyName: string;

  iniciarConversas: boolean;
  cultivarInteresse: boolean;
  fazerDiscipulos: boolean;
  explicarCrencas: boolean;

  leituraBiblia: boolean;
  microfoneVolante: boolean;
  som: boolean;
  video: boolean;
  palco: boolean;

  leitorEstudoBiblico: boolean;
  leitorSentinela: boolean;
  indicador: boolean;
  oracao: boolean;

  anciao: boolean;
  presidenteVidaMinisterio: boolean;
  discursoTesouros: boolean;
  joiasEspirituais: boolean;
  nossaVidaCrista: boolean;
  necessidadesLocais: boolean;
  condutorEstudoBiblico: boolean;
  presidenteFimSemana: boolean;
  discursoPublico: boolean;
  condutorSentinela: boolean;

  userId: string;
};

const emptyForm = (): FormState => ({
  name: "",
  sex: "MALE",
  active: true,
  young: false,
  batizado: false,
  limpeza: true,
  estudante: true,
  privilegioServico: false,
  chefeFamilia: false,
  casada: false,
  familyId: "",
  familyName: "",
  iniciarConversas: false,
  cultivarInteresse: false,
  fazerDiscipulos: false,
  explicarCrencas: false,
  leituraBiblia: false,
  microfoneVolante: false,
  som: false,
  video: false,
  palco: false,
  leitorEstudoBiblico: false,
  leitorSentinela: false,
  indicador: false,
  oracao: false,
  anciao: false,
  presidenteVidaMinisterio: false,
  discursoTesouros: false,
  joiasEspirituais: false,
  nossaVidaCrista: false,
  necessidadesLocais: false,
  condutorEstudoBiblico: false,
  presidenteFimSemana: false,
  discursoPublico: false,
  condutorSentinela: false,
  userId: "",
});

function fromPerson(person: Person): FormState {
  return {
    name: person.name,
    sex: person.sex,
    active: person.active,
    young: person.young,
    batizado: person.batizado,
    limpeza: person.limpeza,
    estudante: person.estudante,
    privilegioServico: person.privilegioServico,
    chefeFamilia: person.chefeFamilia,
    casada: person.casada,
    familyId: person.familyId ?? "",
    familyName: person.chefeFamilia ? (person.family?.name ?? "") : "",
    iniciarConversas: person.iniciarConversas,
    cultivarInteresse: person.cultivarInteresse,
    fazerDiscipulos: person.fazerDiscipulos,
    explicarCrencas: person.explicarCrencas,
    leituraBiblia: person.leituraBiblia,
    microfoneVolante: person.microfoneVolante,
    som: person.som,
    video: person.video,
    palco: person.palco,
    leitorEstudoBiblico: person.leitorEstudoBiblico,
    leitorSentinela: person.leitorSentinela,
    indicador: person.indicador,
    oracao: person.oracao,
    anciao: person.anciao,
    presidenteVidaMinisterio: person.presidenteVidaMinisterio,
    discursoTesouros: person.discursoTesouros,
    joiasEspirituais: person.joiasEspirituais,
    nossaVidaCrista: person.nossaVidaCrista,
    necessidadesLocais: person.necessidadesLocais,
    condutorEstudoBiblico: person.condutorEstudoBiblico,
    presidenteFimSemana: person.presidenteFimSemana,
    discursoPublico: person.discursoPublico,
    condutorSentinela: person.condutorSentinela,
    userId: person.user?.id ?? "",
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  families: Family[];
  users: MemberUser[];
  onSaved: () => void;
};

export function PersonDialog({
  open,
  onOpenChange,
  person,
  families,
  users,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(person ? fromPerson(person) : emptyForm());
      setError(null);
      setSaving(false);
    }
  }, [open, person]);

  const set = useCallback((update: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...update }));
  }, []);

  const showPrivServico = showPrivilegioServico(form.sex, form.batizado);
  const showDesig = showDesignacoes(form.sex);
  const showPriv = showPrivilegios(form.sex, form.batizado);
  const showPrivServicoSection = showPrivilegiosServico(
    form.sex,
    form.batizado,
    form.privilegioServico,
  );

  const availableUsers = useMemo(() => {
    if (!person) return users;
    const linked = person.user;
    if (!linked) return users;
    return users.some((u) => u.id === linked.id) ? users : [linked, ...users];
  }, [users, person]);

  function handleSexChange(sex: Sex) {
    set({
      sex,
      privilegioServico: false,
      leituraBiblia: false,
      microfoneVolante: false,
      som: false,
      video: false,
      palco: false,
      leitorEstudoBiblico: false,
      leitorSentinela: false,
      indicador: false,
      oracao: false,
      anciao: false,
      presidenteVidaMinisterio: false,
      discursoTesouros: false,
      joiasEspirituais: false,
      nossaVidaCrista: false,
      necessidadesLocais: false,
      condutorEstudoBiblico: false,
      presidenteFimSemana: false,
      discursoPublico: false,
      condutorSentinela: false,
    });
  }

  function handleBatizadoChange(value: boolean) {
    set({
      batizado: value,
      privilegioServico: false,
      leitorEstudoBiblico: false,
      leitorSentinela: false,
      indicador: false,
      oracao: false,
      anciao: false,
      presidenteVidaMinisterio: false,
      discursoTesouros: false,
      joiasEspirituais: false,
      nossaVidaCrista: false,
      necessidadesLocais: false,
      condutorEstudoBiblico: false,
      presidenteFimSemana: false,
      discursoPublico: false,
      condutorSentinela: false,
    });
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError(t("people.errors.nameRequired"));
      return;
    }

    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      ...form,
      name: form.name.trim(),
      familyId: form.familyId || null,
      familyName: form.familyName.trim() || null,
      userId: form.userId || null,
    };

    try {
      const res = person
        ? await fetch(`/api/people/${person.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/people", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Erro");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const sectionClass =
    "space-y-4 rounded-xl border border-border bg-muted/30 p-4";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {person ? t("people.edit") : t("people.add")}
          </DialogTitle>
          <DialogDescription>{t("people.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Obrigatórios */}
          <section
            className={sectionClass}
            aria-label={t("people.form.sectionObrigatorios")}
          >
            <h3 className="text-sm font-semibold">
              {t("people.form.sectionObrigatorios")}
            </h3>

            <div>
              <Label htmlFor="person-name">{t("people.form.name")}</Label>
              <Input
                id="person-name"
                name="name"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder={t("people.form.namePlaceholder")}
                autoComplete="off"
                required
                className="mt-1.5"
              />
            </div>

            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium">
                {t("people.form.sex")}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {(["MALE", "FEMALE"] as Sex[]).map((sex) => {
                  const active = form.sex === sex;
                  return (
                    <button
                      key={sex}
                      type="button"
                      onClick={() => handleSexChange(sex)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      {sex === "MALE" ? (
                        <FaMars aria-hidden="true" />
                      ) : (
                        <FaVenus aria-hidden="true" />
                      )}
                      {sex === "MALE"
                        ? t("people.form.sexMale")
                        : t("people.form.sexFemale")}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <CheckboxField
                id="person-active"
                label={t("people.activeLabel")}
                checked={form.active}
                onChange={(v) => set({ active: v })}
              />
              <CheckboxField
                id="person-young"
                label={t("people.young")}
                checked={form.young}
                onChange={(v) => set({ young: v })}
              />
              <CheckboxField
                id="person-batizado"
                label={t("people.baptized")}
                checked={form.batizado}
                onChange={handleBatizadoChange}
              />
              <CheckboxField
                id="person-limpeza"
                label={t("people.cleaning")}
                checked={form.limpeza}
                onChange={(v) => set({ limpeza: v })}
              />
              <CheckboxField
                id="person-estudante"
                label={t("people.student")}
                checked={form.estudante}
                onChange={(v) => set({ estudante: v })}
              />
              {showPrivServico && (
                <CheckboxField
                  id="person-privilegio-servico"
                  label={t("people.servicePrivilegeLabel")}
                  checked={form.privilegioServico}
                  onChange={(v) => set({ privilegioServico: v })}
                />
              )}
            </div>
          </section>

          {/* Família */}
          <section
            className={sectionClass}
            aria-label={t("people.form.sectionFamilia")}
          >
            <h3 className="text-sm font-semibold">
              {t("people.form.sectionFamilia")}
            </h3>

            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <CheckboxField
                id="person-chefe-familia"
                label={t("people.form.chefeFamilia")}
                checked={form.chefeFamilia}
                onChange={(v) =>
                  set({ chefeFamilia: v, familyId: "", familyName: "" })
                }
              />
              <CheckboxField
                id="person-casada"
                label={t("people.form.casada")}
                checked={form.casada}
                onChange={(v) => set({ casada: v })}
              />
            </div>

            {form.chefeFamilia ? (
              <div>
                <Label htmlFor="person-family-name">
                  {t("people.form.familyNameTitle")}
                </Label>
                <Input
                  id="person-family-name"
                  value={form.familyName}
                  onChange={(e) => set({ familyName: e.target.value })}
                  placeholder={t("people.form.familyNamePlaceholder")}
                  autoComplete="off"
                  className="mt-1.5"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="person-family">
                  {t("people.form.selectFamily")}
                </Label>
                <select
                  id="person-family"
                  value={form.familyId}
                  onChange={(e) => set({ familyId: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="">{t("people.noFamily")}</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Aspectos gerais */}
          <section
            className={sectionClass}
            aria-label={t("people.form.sectionAspectosGerais")}
          >
            <h3 className="text-sm font-semibold">
              {t("people.form.sectionAspectosGerais")}
            </h3>
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <CheckboxField
                id="person-iniciar-conversas"
                label="Iniciar conversas"
                checked={form.iniciarConversas}
                onChange={(v) => set({ iniciarConversas: v })}
              />
              <CheckboxField
                id="person-cultivar-interesse"
                label="Cultivar interesse"
                checked={form.cultivarInteresse}
                onChange={(v) => set({ cultivarInteresse: v })}
              />
              <CheckboxField
                id="person-fazer-discipulos"
                label="Fazer discípulos"
                checked={form.fazerDiscipulos}
                onChange={(v) => set({ fazerDiscipulos: v })}
              />
              <CheckboxField
                id="person-explicar-crencas"
                label="Explicar crenças"
                checked={form.explicarCrencas}
                onChange={(v) => set({ explicarCrencas: v })}
              />
            </div>
          </section>

          {/* Designações */}
          {showDesig && (
            <section
              className={sectionClass}
              aria-label={t("people.form.sectionDesignacoes")}
            >
              <h3 className="text-sm font-semibold">
                {t("people.form.sectionDesignacoes")}
              </h3>
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <CheckboxField
                  id="person-leitura-biblia"
                  label="Leitura da Bíblia"
                  checked={form.leituraBiblia}
                  onChange={(v) => set({ leituraBiblia: v })}
                />
                <CheckboxField
                  id="person-microfone-volante"
                  label="Microfone volante"
                  checked={form.microfoneVolante}
                  onChange={(v) => set({ microfoneVolante: v })}
                />
                <CheckboxField
                  id="person-som"
                  label="Som"
                  checked={form.som}
                  onChange={(v) => set({ som: v })}
                />
                <CheckboxField
                  id="person-video"
                  label="Vídeo"
                  checked={form.video}
                  onChange={(v) => set({ video: v })}
                />
                <CheckboxField
                  id="person-palco"
                  label="Palco"
                  checked={form.palco}
                  onChange={(v) => set({ palco: v })}
                />
              </div>
            </section>
          )}

          {/* Privilégios */}
          {showPriv && (
            <section
              className={sectionClass}
              aria-label={t("people.form.sectionPrivilegios")}
            >
              <h3 className="text-sm font-semibold">
                {t("people.form.sectionPrivilegios")}
              </h3>
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <CheckboxField
                  id="person-leitor-estudo"
                  label="Leitor Estudo Bíblico"
                  checked={form.leitorEstudoBiblico}
                  onChange={(v) => set({ leitorEstudoBiblico: v })}
                />
                <CheckboxField
                  id="person-leitor-sentinela"
                  label="Leitor Sentinela"
                  checked={form.leitorSentinela}
                  onChange={(v) => set({ leitorSentinela: v })}
                />
                <CheckboxField
                  id="person-indicador"
                  label="Indicador"
                  checked={form.indicador}
                  onChange={(v) => set({ indicador: v })}
                />
                <CheckboxField
                  id="person-oracao"
                  label="Oração"
                  checked={form.oracao}
                  onChange={(v) => set({ oracao: v })}
                />
              </div>
            </section>
          )}

          {/* Privilégios de serviço */}
          {showPrivServicoSection && (
            <section
              className={sectionClass}
              aria-label={t("people.form.sectionPrivilegiosServico")}
            >
              <h3 className="text-sm font-semibold">
                {t("people.form.sectionPrivilegiosServico")}
              </h3>
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <CheckboxField
                  id="person-anciao"
                  label="Ancião"
                  checked={form.anciao}
                  onChange={(v) => set({ anciao: v })}
                />
                <CheckboxField
                  id="person-presidente-vm"
                  label="Presidente Vida e Ministério"
                  checked={form.presidenteVidaMinisterio}
                  onChange={(v) => set({ presidenteVidaMinisterio: v })}
                />
                <CheckboxField
                  id="person-discurso-tesouros"
                  label="Discurso Tesouros da Palavra de Deus"
                  checked={form.discursoTesouros}
                  onChange={(v) => set({ discursoTesouros: v })}
                />
                <CheckboxField
                  id="person-joias"
                  label="Joias espirituais"
                  checked={form.joiasEspirituais}
                  onChange={(v) => set({ joiasEspirituais: v })}
                />
                <CheckboxField
                  id="person-nossa-vida"
                  label="Nossa vida cristã"
                  checked={form.nossaVidaCrista}
                  onChange={(v) => set({ nossaVidaCrista: v })}
                />
                <CheckboxField
                  id="person-necessidades-locais"
                  label="Necessidades Locais"
                  checked={form.necessidadesLocais}
                  onChange={(v) => set({ necessidadesLocais: v })}
                />
                <CheckboxField
                  id="person-condutor-estudo"
                  label="Condutor Estudo Bíblico"
                  checked={form.condutorEstudoBiblico}
                  onChange={(v) => set({ condutorEstudoBiblico: v })}
                />
                <CheckboxField
                  id="person-presidente-fim-semana"
                  label="Presidente Fim de semana"
                  checked={form.presidenteFimSemana}
                  onChange={(v) => set({ presidenteFimSemana: v })}
                />
                <CheckboxField
                  id="person-discurso-publico"
                  label="Discurso Público"
                  checked={form.discursoPublico}
                  onChange={(v) => set({ discursoPublico: v })}
                />
                <CheckboxField
                  id="person-condutor-sentinela"
                  label="Condutor Sentinela"
                  checked={form.condutorSentinela}
                  onChange={(v) => set({ condutorSentinela: v })}
                />
              </div>
            </section>
          )}

          {/* Vínculo de usuário */}
          <section
            className={sectionClass}
            aria-label={t("people.form.linkUser")}
          >
            <h3 className="text-sm font-semibold">
              {t("people.form.linkUser")}
            </h3>
            <div>
              <Label htmlFor="person-user">{t("people.form.selectUser")}</Label>
              <select
                id="person-user"
                value={form.userId}
                onChange={(e) => set({ userId: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">{t("people.noLinkedUser")}</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                    {user.email ? ` · ${user.email}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/5"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border accent-primary"
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}
