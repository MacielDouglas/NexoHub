import type { ReactNode } from "react";
import { SettingsBottomNav } from "@/features/settings/components/settings-bottom-nav";
import { SettingsSideNav } from "@/features/settings/components/settings-side-nav";

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function SettingsLayout({ children, params }: Props) {
  const { slug } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-24 md:pb-8">
      <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
        <aside className="md:sticky md:top-4">
          <div className="rounded-[28px] border border-border bg-card p-3 shadow-sm">
            <SettingsSideNav slug={slug} />
          </div>
        </aside>

        <div className="min-w-0 space-y-5">{children}</div>
      </div>

      <SettingsBottomNav slug={slug} />
    </div>
  );
}
