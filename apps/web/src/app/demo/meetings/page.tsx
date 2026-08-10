import type { Metadata } from "next";
import { DemoMeetings } from "@/features/demo/demo-meetings";

export const metadata: Metadata = {
  title: "Demonstração · Reuniões",
  description:
    "Veja como o Nexohub organiza reuniões, partes, discursos e programações para a sua congregação.",
};

export default function DemoMeetingsPage() {
  return <DemoMeetings />;
}
