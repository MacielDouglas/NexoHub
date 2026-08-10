import type { Metadata } from "next";
import { DemoHome } from "@/features/demo/demo-home";

export const metadata: Metadata = {
  title: "Demonstração",
  description:
    "Explore o Nexohub em modo demonstração: agenda semanal, reuniões e designações para congregações.",
};

export default function DemoPage() {
  return <DemoHome />;
}
