import { createDecipheriv, createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { inflateSync } from "node:zlib";
import { load } from "cheerio";

const AES_XOR_CONST = Buffer.from(
  "11cbb5587e32846d4c26790c633da289f66fe5842a3a585ce1bc3a294af5ada7",
  "hex",
);

export function deriveAesKey(
  langIdx: number,
  symbol: string,
  year: number,
  issueTag: string | number,
): { key: Buffer; iv: Buffer } {
  let s = `${langIdx}_${symbol}_${year}`;
  const tagNum = typeof issueTag === "string" ? Number(issueTag) : issueTag;
  if (tagNum !== 0) s += `_${issueTag}`;
  const hash = createHash("sha256").update(s, "utf8").digest();
  const xored = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) xored[i] = hash[i] ^ AES_XOR_CONST[i];
  return { key: xored.subarray(0, 16), iv: xored.subarray(16, 32) };
}

export function decryptAesContent(
  buf: Buffer,
  key: Buffer,
  iv: Buffer,
): string | null {
  try {
    const decipher = createDecipheriv("aes-128-cbc", key, iv);
    const dec = Buffer.concat([decipher.update(buf), decipher.final()]);
    const inflated = inflateSync(dec);
    return inflated.toString("utf8");
  } catch {
    return null;
  }
}

export type ExtractType = "songbook" | "talks" | "watchtower" | "workbook";
export type PubRow = Record<string, unknown>;

export type PublicationMeta = {
  title: string;
  coverTitle: string;
  symbol: string;
  issue: string | null;
};

export function getPublicationMeta(
  db: DatabaseSync,
  pub: PubRow | undefined,
): PublicationMeta {
  const issueProp = db
    .prepare(
      "SELECT Title, CoverTitle, Symbol FROM PublicationIssueProperty LIMIT 1",
    )
    .get();

  const tag = String(pub?.IssueTagNumber ?? "");
  const tagYear = Number(tag.slice(0, 4));
  const tagMonth = Number(tag.slice(4, 6));
  const issue =
    tagYear >= 2000 && tagMonth >= 1 && tagMonth <= 12
      ? `${tagYear}-${String(tagMonth).padStart(2, "0")}`
      : null;

  return {
    title: String(issueProp?.Title ?? pub?.Title ?? ""),
    coverTitle: String(issueProp?.CoverTitle ?? ""),
    symbol: String(issueProp?.Symbol ?? pub?.Symbol ?? pub?.UniqueSymbol ?? ""),
    issue,
  };
}

export function detectType(db: DatabaseSync): {
  type: ExtractType;
  pub: PubRow | undefined;
} {
  const pubRow = db.prepare("SELECT * FROM Publication LIMIT 1").get();
  const sym = String(pubRow?.Symbol ?? pubRow?.UniqueEnglishSymbol ?? "");
  const cls = db.prepare("SELECT DISTINCT Class FROM Document LIMIT 5").all();
  const classes = new Set(cls.map((c) => c.Class));

  if (pubRow?.PublicationType === "Meeting Workbook" || sym.startsWith("mwb")) {
    return { type: "workbook", pub: pubRow };
  }
  if (classes.has("31") || sym.startsWith("sjj")) {
    return { type: "songbook", pub: pubRow };
  }
  if (classes.has("34") || sym.startsWith("S-34")) {
    return { type: "talks", pub: pubRow };
  }
  if (
    classes.has("40") ||
    pubRow?.PublicationType === "Watchtower" ||
    pubRow?.PublicationType === "Book"
  ) {
    return { type: "watchtower", pub: pubRow };
  }
  return { type: "watchtower", pub: pubRow };
}

export function extractSongbook(db: DatabaseSync) {
  return db
    .prepare(
      `SELECT ChapterNumber AS songNumber, Title AS theme
       FROM Document
       WHERE Class = '31' AND ChapterNumber IS NOT NULL
       ORDER BY ChapterNumber`,
    )
    .all() as Array<{ songNumber: number; theme: string }>;
}

export function extractTalks(db: DatabaseSync) {
  const rows = db
    .prepare(
      `SELECT Title AS theme
       FROM Document
       WHERE Class = '34'
       ORDER BY DocumentId`,
    )
    .all() as Array<{ theme: string }>;

  return rows.map((r) => {
    const m = r.theme.match(/^(\d+)\.\s*(.*)/);
    return {
      number: m ? parseInt(m[1], 10) : null,
      theme: m ? m[2] : r.theme,
    };
  });
}

type WatchtowerRow = {
  DocumentId: number;
  theme: string;
  week: string;
  songNumber: number;
  songLabel: string | null;
  ordinal: number;
};

export type WatchtowerStudy = {
  week: string;
  theme: string;
  songs: {
    opening: { number: number; title: string };
    closing: { number: number; title: string };
  };
};

export function extractWatchtower(db: DatabaseSync, pub: PubRow | undefined) {
  const rows = db
    .prepare(
      `SELECT
        d.DocumentId,
        d.Title AS theme,
        d.ContextTitle AS week,
        m.Track AS songNumber,
        m.Label AS songLabel,
        dm.BeginParagraphOrdinal AS ordinal
       FROM Document d
       JOIN DocumentMultimedia dm ON dm.DocumentId = d.DocumentId
       JOIN Multimedia m ON m.MultimediaId = dm.MultimediaId
       WHERE d.Class = '40'
         AND m.KeySymbol = 'sjjm'
         AND m.Track IS NOT NULL
       ORDER BY d.DocumentId, dm.BeginParagraphOrdinal`,
    )
    .all() as WatchtowerRow[];

  const byDoc = new Map<number, WatchtowerRow[]>();
  for (const r of rows) {
    const list = byDoc.get(r.DocumentId) ?? [];
    list.push(r);
    byDoc.set(r.DocumentId, list);
  }

  const studies: WatchtowerStudy[] = [];
  for (const [, list] of byDoc) {
    if (list.length < 2) continue;
    const first = list[0];
    const last = list[list.length - 1];
    studies.push({
      week: first.week ?? "",
      theme: first.theme ?? "",
      songs: {
        opening: {
          number: first.songNumber,
          title: first.songLabel?.trim() ?? "",
        },
        closing: {
          number: last.songNumber,
          title: last.songLabel?.trim() ?? "",
        },
      },
    });
  }
  return { studies, title: String(pub?.Title ?? "") };
}

type DatedTextRow = {
  DatedTextId: number;
  DocumentId: number;
  Caption: string;
  FirstDateOffset: number;
  LastDateOffset: number;
  BeginParagraphOrdinal: number;
  EndParagraphOrdinal: number;
  Content: Uint8Array;
};

type SongRef = {
  DocumentId: number;
  BeginParagraphOrdinal: number;
  Track: number;
  KeySymbol: string;
};

export type WorkbookPart = {
  order: number;
  parte: string;
  tema: string;
  tempo: string;
  modalidade: string | null;
  fonte: string | null;
};

export type WorkbookSection = {
  secao: string;
  partes: WorkbookPart[];
  cancionMedia?: number | null;
};

export type WorkbookWeek = {
  semana: string;
  dateRange: string;
  canticoInicial: number | null;
  secoes: WorkbookSection[];
  canticoFinal: number | null;
};

export type WorkbookData = {
  nomeApostila: string;
  symbol: string;
  coverTitle: string;
  semanas: WorkbookWeek[];
};

export function extractWorkbook(
  db: DatabaseSync,
  pub: PubRow | undefined,
): WorkbookData {
  const issueProp = db
    .prepare("SELECT * FROM PublicationIssueProperty LIMIT 1")
    .get();

  const output: WorkbookData = {
    nomeApostila: String(issueProp?.Title ?? pub?.title ?? ""),
    symbol: String(issueProp?.Symbol ?? ""),
    coverTitle: String(issueProp?.CoverTitle ?? ""),
    semanas: [],
  };

  const datedTexts = db
    .prepare("SELECT * FROM DatedText ORDER BY DatedTextId")
    .all() as DatedTextRow[];

  const extracts = new Map(
    (
      db
        .prepare("SELECT ExtractId, Caption, Link FROM Extract")
        .all() as Array<{ ExtractId: number; Caption: string; Link: string }>
    ).map((e) => [e.ExtractId, e]),
  );

  const docExtracts = db
    .prepare(
      "SELECT de.DocumentId, de.ExtractId, de.BeginParagraphOrdinal FROM DocumentExtract de ORDER BY de.DocumentId, de.BeginParagraphOrdinal",
    )
    .all() as Array<{
    DocumentId: number;
    ExtractId: number;
    BeginParagraphOrdinal: number;
  }>;

  const docSongs = db
    .prepare(`SELECT dm.DocumentId, dm.BeginParagraphOrdinal, m.Track, m.KeySymbol
            FROM DocumentMultimedia dm JOIN Multimedia m ON m.MultimediaId = dm.MultimediaId
            WHERE m.KeySymbol = 'sjjm' AND m.Track IS NOT NULL
            ORDER BY dm.DocumentId, dm.BeginParagraphOrdinal`)
    .all() as SongRef[];

  const pubRow = db
    .prepare(
      "SELECT MepsLanguageIndex, Symbol, Year, IssueTagNumber FROM Publication LIMIT 1",
    )
    .get();
  const aesCtx = pubRow
    ? deriveAesKey(
        Number(pubRow.MepsLanguageIndex),
        String(pubRow.Symbol),
        Number(pubRow.Year),
        (pubRow.IssueTagNumber ?? 0) as string | number,
      )
    : null;

  const SECTION_HEADINGS = new Set([
    "TESOROS DE LA BIBLIA",
    "TESOUROS DA BÍBLIA",
    "SEAMOS MEJORES MAESTROS",
    "FAÇAMOS MELHORES MESTRES",
    "NUESTRA VIDA CRISTIANA",
    "NOSSA VIDA CRISTÃ",
  ]);

  function parseActivityName(h3Text: string): { nome: string } {
    let t = h3Text.replace(/[«»""]/g, "").trim();
    t = t.replace(/^(\d+)\.\s*/, "");
    return { nome: t };
  }

  const FORMAT_MARKERS = [
    "DE CASA EN CASA",
    "PREDICACIÓN INFORMAL",
    "PREDICACIÓN PÚBLICA",
    "Discurso",
    "Escenificación",
    "Análisis con el auditorio",
    "Análise com o auditório",
  ];

  function extractModalidade(text: string): string | null {
    const rest = text.replace(/\(\d+\s*mins?\.?\s*\)/, "").trim();
    for (const marker of FORMAT_MARKERS) {
      if (rest.startsWith(marker)) return marker;
    }
    return null;
  }

  const weeks: WorkbookWeek[] = [];
  for (const dt of datedTexts) {
    const html = aesCtx
      ? decryptAesContent(Buffer.from(dt.Content ?? []), aesCtx.key, aesCtx.iv)
      : null;
    const $ = html ? load(html) : null;

    let openingSong: SongRef | undefined;
    let closingSong: SongRef | undefined;
    let middleSong: SongRef | undefined;
    const weekSongs = docSongs
      .filter((s) => s.DocumentId === dt.DocumentId)
      .sort((a, b) => a.BeginParagraphOrdinal - b.BeginParagraphOrdinal);
    if (weekSongs.length > 0) openingSong = weekSongs[0];
    if (weekSongs.length > 1) closingSong = weekSongs[weekSongs.length - 1];
    if (weekSongs.length > 2)
      middleSong = weekSongs[Math.floor(weekSongs.length / 2)];

    const weekExtracts = docExtracts.filter(
      (e) => e.DocumentId === dt.DocumentId,
    );
    const extractsByPid = new Map<
      number,
      Array<{ source: string; tema: string }>
    >();
    for (const de of weekExtracts) {
      const ext = extracts.get(de.ExtractId);
      const $c = load(ext?.Caption ?? "");
      const source = $c(".eloc").text().trim();
      const tema = $c(".etitle").text().trim();
      if (/(canción|cántico|canção|cântico)/i.test(source)) continue;
      const list = extractsByPid.get(de.BeginParagraphOrdinal) ?? [];
      list.push({ source, tema });
      extractsByPid.set(de.BeginParagraphOrdinal, list);
    }

    const timingMap = new Map<number, string>();
    const modalidadeMap = new Map<number, string>();
    if ($) {
      let lastTiming = "—";
      $("[data-pid]").each((_i, el) => {
        const pid = parseInt($(el).attr("data-pid") ?? "", 10);
        if (Number.isNaN(pid)) return;
        const text = $(el).text();
        const m = text.match(/(\d+)\s*mins?\.?/);
        if (m) {
          lastTiming = `${m[1]} min`;
          const mod = extractModalidade(text);
          if (mod) modalidadeMap.set(pid, mod);
        }
        timingMap.set(pid, lastTiming);
      });
    }

    const sections: WorkbookSection[] = [];
    let order = 0;

    if ($) {
      const boundaries: Array<{ tag: string; name: string; pid: number }> = [];
      $("h2").each((_i, el) => {
        const text = $(el).text().trim().toUpperCase();
        if (SECTION_HEADINGS.has(text)) {
          const pid = parseInt($(el).attr("data-pid") ?? "0", 10);
          boundaries.push({ tag: "section", name: text, pid });
        }
      });
      $("h3").each((_i, el) => {
        const cls = $(el).attr("class") ?? "";
        const text = $(el).text().trim();
        if (cls.includes("dc-icon--music")) return;
        if (/(palabras de conclusi[óo]n|conclusi[óo]n)/i.test(text)) return;
        if (/canci[óo]n/i.test(text) && /^\d/.test(text)) return;
        const pid = parseInt($(el).attr("data-pid") ?? "0", 10);
        if (!pid) return;
        boundaries.push({
          tag: "activity",
          name: parseActivityName(text).nome,
          pid,
        });
      });
      boundaries.sort((a, b) => a.pid - b.pid);

      let currentSection: {
        name: string;
        activities: Array<{ pid: number; name: string }>;
      } | null = null;
      const sectionActivities: Array<{
        secao: string;
        activities: Array<{ pid: number; name: string }>;
      }> = [];

      for (const b of boundaries) {
        if (b.tag === "section") {
          currentSection = { name: b.name, activities: [] };
          sectionActivities.push({
            secao: currentSection.name,
            activities: currentSection.activities,
          });
        } else if (b.tag === "activity" && currentSection) {
          currentSection.activities.push({ pid: b.pid, name: b.name });
        }
      }

      for (let si = 0; si < sectionActivities.length; si++) {
        const sec = sectionActivities[si];
        const acts = sec.activities;
        const partes: WorkbookPart[] = [];

        for (let ai = 0; ai < acts.length; ai++) {
          const act = acts[ai];
          const nextPid =
            ai + 1 < acts.length
              ? acts[ai + 1].pid
              : si + 1 < sectionActivities.length
                ? (sectionActivities[si + 1].activities[0]?.pid ?? Infinity)
                : Infinity;

          const activityExtracts: Array<{ source: string; tema: string }> = [];
          for (const [pid, exts] of extractsByPid) {
            if (pid >= act.pid && pid < nextPid) {
              activityExtracts.push(...exts);
            }
          }

          let timing = "—";
          let modalidade: string | null = null;
          const sortedPids = [...timingMap.keys()]
            .filter((p) => p > act.pid && p < nextPid)
            .sort((a, b) => a - b);
          for (const p of sortedPids) {
            const t = timingMap.get(p);
            if (t && t !== "—") {
              timing = t;
              modalidade = modalidadeMap.get(p) ?? null;
              break;
            }
          }

          const fontes = [
            ...new Set(activityExtracts.map((e) => e.source)),
          ].filter(Boolean);
          const temas = [
            ...new Set(activityExtracts.map((e) => e.tema)),
          ].filter(Boolean);

          const parte = act.name;
          let tema = parte;
          const genericTypes = new Set([
            "Busquemos perlas escondidas",
            "Busquemos pérolas escondidas",
            "Lectura de la Biblia",
            "Leitura da Bíblia",
            "Estudio bíblico de la congregación",
            "Estudo bíblico de congregação",
            "Discurso",
            "Empiece conversaciones",
            "Comece conversas",
            "Haga revisitas",
            "Faça revisitas",
            "Haga discípulos",
            "Faça discípulos",
            "Explique sus creencias",
            "Explique suas crenças",
            "Necesidades de la congregación",
            "Necessidades da congregação",
          ]);
          if (genericTypes.has(parte) && temas.length > 0) {
            tema = temas[0];
          }

          order++;
          partes.push({
            order,
            parte,
            tema,
            tempo: timing,
            modalidade,
            fonte: fontes.length > 0 ? fontes.join("; ") : null,
          });
        }

        const section: WorkbookSection = { secao: sec.secao, partes };
        if (si === 1 && middleSong) {
          section.cancionMedia = Number(middleSong.Track);
        }
        sections.push(section);
      }
    }

    const clean = (s: string) => s.replace(/<[^>]+>/g, "").trim();
    const $cap = load(dt.Caption ?? "");
    const semanaTitle = $cap(".etitle").text().trim();
    weeks.push({
      semana: semanaTitle || clean(dt.Caption),
      dateRange: `${dt.FirstDateOffset}-${dt.LastDateOffset}`,
      canticoInicial: openingSong ? Number(openingSong.Track) : null,
      secoes: sections,
      canticoFinal:
        closingSong && closingSong !== openingSong
          ? Number(closingSong.Track)
          : null,
    });
  }

  output.semanas = weeks;
  return output;
}
