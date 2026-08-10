import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "A página que você procura não existe ou foi movida.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#0c0c12] via-[#14141c] to-[#1a1410] p-6 safe-top safe-bottom">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(236,112,0,0.18) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(236,112,0,0.10) 0, transparent 40%)",
        }}
      />

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <div className="bank-hero-glow flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/30">
          <span className="text-3xl font-bold text-primary-foreground">N</span>
        </div>

        <p className="mt-8 text-5xl font-bold tracking-tight text-foreground">
          404
        </p>

        <h1 className="mt-2 text-xl font-semibold text-foreground">
          Página não encontrada
        </h1>

        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          A página que você procura não existe, foi movida ou está indisponível.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
          >
            Ir para o início
          </Link>

          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-full bg-muted px-6 text-[15px] font-semibold text-muted-foreground transition-opacity hover:opacity-90 active:opacity-80"
          >
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
