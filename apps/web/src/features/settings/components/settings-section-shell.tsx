import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SettingsSectionShell({ title, description, children }: Props) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </section>
  );
}
