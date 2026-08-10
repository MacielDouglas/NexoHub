import type { Metadata } from "next";
import { DemoDesignacoes } from "@/features/demo/demo-designacoes";

export const metadata: Metadata = {
  title: "Demonstração · Designações",
  description:
    "Veja como o Nexohub atribui designações de som, vídeo, limpeza e micros para os membros da congregação.",
};

export default function DemoDesignacoesPage() {
  return <DemoDesignacoes />;
}
