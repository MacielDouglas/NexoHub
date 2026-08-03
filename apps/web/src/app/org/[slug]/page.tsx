import { Card, CardContent } from "@/components/ui/card";

type OrganizationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type StatCard = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const statCards: StatCard[] = [
  {
    label: "Tarefas em aberto",
    value: "18",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="20" rx="2" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="12" y1="12" x2="12" y2="18" />
      </>
    ),
  },
  {
    label: "Reuniões agendadas",
    value: "6",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
      </>
    ),
  },
  {
    label: "Designações ativas",
    value: "24",
    icon: <path d="M20 6L9 17l-5-5" />,
  },
  {
    label: "Pessoas cadastradas",
    value: "42",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
];

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden="true"
                >
                  {card.icon}
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-body text-muted-foreground">{card.label}</p>
                <p className="text-display text-foreground">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="space-y-2 p-6">
            <p className="text-title text-foreground">Resumo operacional</p>
            <p className="text-body leading-relaxed text-muted-foreground">
              Você está no ambiente da organização{" "}
              <span className="font-medium text-foreground">{slug}</span>. Aqui
              entrarão os dados reais de tarefas prioritárias, reuniões do dia e
              alertas de designação.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-6">
            <p className="text-title text-foreground">Indicadores</p>
            <p className="text-body leading-relaxed text-muted-foreground">
              Mantenha os dados da organização atualizados para acompanhar o
              progresso das atividades.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
