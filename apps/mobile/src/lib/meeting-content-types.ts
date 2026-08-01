export type MeetingContent = {
  id: string;
  type: string;
  title: string;
  symbol: string | null;
  coverTitle: string | null;
  issue: string | null;
  createdAt: string;
  _count?: { items: number };
};

export function formatContentIssue(
  type: string,
  content: { issue?: string | null; symbol?: string | null },
): string {
  if (type === "apostila") {
    if (content.symbol) return content.symbol;
    const issue = content.issue;
    if (issue && issue.length >= 7) {
      return `mwb${issue.slice(2, 4)}.${issue.slice(5, 7)}`;
    }
    return "";
  }
  if (type === "sentinela") {
    const issue = content.issue;
    if (issue && issue.length >= 7) {
      return `${issue.slice(0, 4)}.${issue.slice(5, 7)}`;
    }
    const m = content.symbol?.match(/^w(\d{2})\.(\d{2})$/);
    if (m) return `20${m[1]}.${m[2]}`;
    return "";
  }
  return "";
}

export function issueKey(content: {
  issue?: string | null;
  symbol?: string | null;
}): number {
  const issue = content.issue;
  if (issue && issue.length >= 7) {
    return Number(issue.slice(0, 4)) * 100 + Number(issue.slice(5, 7));
  }
  const m = content.symbol?.match(/^w(\d{2})\.(\d{2})$/);
  if (m) return (2000 + Number(m[1])) * 100 + Number(m[2]);
  return 0;
}

export type MeetingContentItem = {
  id: string;
  contentId: string;
  position: number;
  data: Record<string, unknown>;
};

export type LoadedContent = MeetingContent & { items: MeetingContentItem[] };

export const CONTENT_TABS = [
  { key: "apostila", icon: "📘" },
  { key: "sentinela", icon: "📖" },
  { key: "discursos", icon: "🎤" },
  { key: "canticos", icon: "🎵" },
] as const;

export type ContentTabKey = (typeof CONTENT_TABS)[number]["key"];

export type SongRef = { number: number | null; title: string };

export type SentinelaItem = {
  week: string;
  theme: string;
  songs: {
    opening: SongRef;
    closing: SongRef;
  };
};

export type ApostilaParte = {
  order: number;
  parte: string;
  tema: string;
  tempo: string;
  modalidade: string | null;
  fonte: string | null;
};

export type ApostilaSecao = {
  secao: string;
  cancionMedia?: number | null;
  partes: ApostilaParte[];
};

export type ApostilaSemana = {
  semana: string;
  dateRange: string;
  canticoInicial: number | null;
  secoes: ApostilaSecao[];
  canticoFinal: number | null;
};

export function emptyItemData(type: string): Record<string, unknown> {
  switch (type) {
    case "apostila":
      return emptyApostilaSemana() as unknown as Record<string, unknown>;
    case "sentinela":
      return emptySentinelaItem() as unknown as Record<string, unknown>;
    default:
      return { number: null, theme: "" };
  }
}

export function emptyApostilaParte(order: number): ApostilaParte {
  return {
    order,
    parte: "",
    tema: "",
    tempo: "",
    modalidade: null,
    fonte: null,
  };
}

export function emptyApostilaSecao(): ApostilaSecao {
  return { secao: "", partes: [] };
}

export function emptyApostilaSemana(): ApostilaSemana {
  return {
    semana: "",
    dateRange: "",
    canticoInicial: null,
    secoes: [],
    canticoFinal: null,
  };
}

export function emptySentinelaItem(): SentinelaItem {
  return {
    week: "",
    theme: "",
    songs: {
      opening: { number: null, title: "" },
      closing: { number: null, title: "" },
    },
  };
}
