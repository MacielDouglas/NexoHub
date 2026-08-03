import { MeetingDayForm } from "./meeting-day-form";

const DAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
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

export function MeetingDayCard({ slug, type, config }: Props) {
  const title =
    type === "midweek"
      ? "Reunião de Meio de Semana"
      : "Reunião de Fim de Semana";

  const summary = config
    ? `${DAY_LABELS[config.dayOfWeek]} às ${config.startTime}`
    : "Não configurado";

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">{summary}</p>
      <MeetingDayForm slug={slug} type={type} config={config} />
    </div>
  );
}
