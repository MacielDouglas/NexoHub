import { saveMeetingConfigAction } from "../actions/settings.actions";
import { SubmitButton } from "./submit-button";

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
] as const;

type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
  defaultSentinelaConductorId: string | null;
};

type Person = {
  id: string;
  name: string;
};

type Props = {
  slug: string;
  type: "midweek" | "weekend";
  config?: MeetingConfig;
  conductorCandidates?: Person[];
};

export function MeetingDayForm({
  type,
  config,
  conductorCandidates = [],
}: Props) {
  return (
    <form action={saveMeetingConfigAction} className="mt-4 space-y-4">
      <input type="hidden" name="id" defaultValue={config?.id ?? ""} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="redirectTab" value="meetings" />

      <div>
        <label
          htmlFor={`${type}-day`}
          className="mb-2 block text-sm font-medium"
        >
          Dia da semana
        </label>
        <select
          id={`${type}-day`}
          name="dayOfWeek"
          defaultValue={String(config?.dayOfWeek ?? 3)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
        >
          {DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${type}-time`}
          className="mb-2 block text-sm font-medium"
        >
          Horário
        </label>
        <input
          id={`${type}-time`}
          name="startTime"
          type="time"
          defaultValue={config?.startTime ?? "19:30"}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
        />
      </div>

      {type === "weekend" && (
        <div>
          <label
            htmlFor={`${type}-default-conductor`}
            className="mb-2 block text-sm font-medium"
          >
            Dirigente da Sentinela padrão
          </label>
          <select
            id={`${type}-default-conductor`}
            name="defaultSentinelaConductorId"
            defaultValue={config?.defaultSentinelaConductorId ?? ""}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
          >
            <option value="">Nenhum (escolher em cada reunião)</option>
            {conductorCandidates.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Essa pessoa ficará pré-selecionada como dirigente em todas as
            reuniões de Fim de Semana. Você poderá trocá-la em uma reunião
            específica quando quiser.
          </p>
        </div>
      )}

      <SubmitButton className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
        Salvar
      </SubmitButton>
    </form>
  );
}
