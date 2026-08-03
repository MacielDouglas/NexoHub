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
};

type Props = {
  slug: string;
  type: "midweek" | "weekend";
  config?: MeetingConfig;
};

export function MeetingDayForm({ type, config }: Props) {
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

      <SubmitButton className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
        Salvar
      </SubmitButton>
    </form>
  );
}
