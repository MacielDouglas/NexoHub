import type { Metadata } from "next";
import { NotFoundClient } from "@/components/not-found-client";

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "A página que você procura não existe ou foi movida.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <NotFoundClient />;
}
