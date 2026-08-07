import { addDays, parseDateKey } from "@/lib/cleaning-assignment";

export type PdfMeetingType = "midweek" | "weekend" | "memorial";

export type PdfAssignment = {
  id: string;
  role: string;
  sortOrder: number;
  personId: string | null;
  contentItemId: string | null;
  value: string | null;
  person: { id: string; name: string } | null;
  subOrgPerson: {
    id: string;
    name: string;
    subOrganization: { id: string; name: string };
  } | null;
  contentItem: { id: string; data: Record<string, unknown> } | null;
};

export type PdfRow = {
  key: string;
  kind: string;
  title: string;
  tempoMin: number;
  clockAdd?: number;
  role: string;
  secondary?: { role: string };
  fixed?: boolean;
};

export type PdfSection = {
  key: string;
  title: string;
  rows: PdfRow[];
};

export type PdfProgram = {
  sections: PdfSection[];
};

export type PdfMeeting = {
  id: string;
  type: PdfMeetingType;
  weekStart: string;
  program: PdfProgram | null;
  assignments: PdfAssignment[];
};

export type PdfConfig = {
  type: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
};

export type PdfApostilaParte = {
  order: number;
  parte: string;
  tema: string;
  tempo: string;
  modalidade: string | null;
  fonte: string | null;
};

export type PdfApostilaSecao = {
  secao: string;
  cancionMedia?: number | null;
  partes: PdfApostilaParte[];
};

export type PdfApostilaSemana = {
  id: string;
  semana: string;
  dateRange: string;
  canticoInicial: number | null;
  secoes: PdfApostilaSecao[];
  canticoFinal: number | null;
};

type TFunc = (key: string, options?: Record<string, unknown>) => string;

function parseTimeToMinutes(hm: string): number {
  const m = hm.match(/(\d+):(\d+)/);
  if (!m) return 19 * 60;
  return Number(m[1]) * 60 + Number(m[2]);
}

function fmtTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function weekLabel(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function sectionColor(title: string): string | null {
  const s = title.trim().toLowerCase();
  if (s.includes("tesouros") || s.includes("tesoros") || s.includes("perlas"))
    return "#3c7f8b";
  if (s.includes("maestros") || s.includes("mestres") || s.includes("minist"))
    return "#d68f00";
  if (s.includes("vida crist") || s.includes("nossa vida")) return "#bf2f13";
  return null;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const bigint = parseInt(m, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function roleSuffix(role: string): string {
  if (!role.startsWith("secao:")) return "";
  return role.split(":")[3] ?? "";
}

function basePartName(
  role: string,
  aw: PdfApostilaSemana | null,
): string | null {
  if (!role.startsWith("secao:")) return null;
  const parts = role.split(":");
  const si = Number(parts[1]);
  const order = Number(parts[2]);
  const parte = aw?.secoes[si]?.partes.find((p) => p.order === order);
  return parte?.parte ?? null;
}

function partNumber(role: string, aw: PdfApostilaSemana | null): number | null {
  if (!role.startsWith("secao:")) return null;
  const parts = role.split(":");
  const si = Number(parts[1]);
  const order = Number(parts[2]);
  return aw?.secoes[si]?.partes.some((p) => p.order === order) ? order : null;
}

export type PdfEvent = {
  type: string;
  date: string;
  endDate: string | null;
};

type PageSlot = {
  type: PdfMeetingType;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  cx: number;
  timeX: number;
  descX: number;
  descW: number;
  personX: number;
  personW: number;
  lineH: number;
  rowFont: number;
  sectionFont: number;
  weekFont: number;
};

export async function generateMeetingsPdf(opts: {
  orgName: string;
  meetings: PdfMeeting[];
  configs: PdfConfig[];
  apostilaWeeks: PdfApostilaSemana[];
  events: PdfEvent[];
  t: TFunc;
}): Promise<void> {
  const { orgName, meetings, configs, apostilaWeeks, events, t } = opts;

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const right = pageW - margin;
  const top = 31;
  const bottom = pageH - 8;
  const usable = bottom - top;

  const perPage: Record<PdfMeetingType, number> = {
    midweek: 2,
    weekend: 4,
    memorial: 1,
  };

  const buildSlot = (
    type: PdfMeetingType,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
  ): PageSlot => {
    const compact = type === "weekend" || type === "memorial";
    const lineH = compact ? 4.6 : 5.2;
    const timeW = 22;
    const descW = (x1 - x0) * 0.46;
    const timeX = x0;
    const descX = x0 + timeW;
    const personX = descX + descW;
    return {
      type,
      x0,
      x1,
      y0,
      y1,
      cx: (x0 + x1) / 2,
      timeX,
      descX,
      descW,
      personX,
      personW: x1 - personX,
      lineH,
      rowFont: compact ? 9.5 : 10,
      sectionFont: compact ? 10 : 10.5,
      weekFont: compact ? 10.5 : 11,
    };
  };

  const buildPageSlots = (type: PdfMeetingType): PageSlot[] => {
    const n = perPage[type];
    const slotH = usable / n;
    return Array.from({ length: n }, (_, i) =>
      buildSlot(type, margin, right, top + i * slotH, top + (i + 1) * slotH),
    );
  };

  const state: {
    y: number;
    currentType: PdfMeetingType | null;
    slots: PageSlot[];
    slotIdx: number;
    dryRun: boolean;
    scale: number;
  } = {
    y: 0,
    currentType: null,
    slots: [],
    slotIdx: 0,
    dryRun: false,
    scale: 1,
  };

  const currentSlot = (): PageSlot => state.slots[state.slotIdx];

  const drawPageHeader = (type: PdfMeetingType) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(orgName, pageW / 2, 18, { align: "center" });
    doc.setFontSize(12);
    doc.text(
      type === "midweek"
        ? t("meetings.pdf.midweekTitle")
        : type === "memorial"
          ? t("meetings.pdf.memorialTitle")
          : t("meetings.pdf.weekendTitle"),
      pageW / 2,
      25,
      { align: "center" },
    );
  };

  const beginPage = (type: PdfMeetingType) => {
    drawPageHeader(type);
    state.currentType = type;
    state.slots = buildPageSlots(type);
    state.slotIdx = 0;
    state.dryRun = false;
    state.scale = 1;
    state.y = currentSlot().y0 + 1;
  };

  const nextPage = () => {
    doc.addPage();
    if (state.currentType) beginPage(state.currentType);
  };

  const ensure = (needed: number) => {
    if (state.dryRun) return;
    const slot = currentSlot();
    if (state.y + needed > slot.y1 - 2) {
      if (state.slotIdx + 1 < state.slots.length) {
        state.slotIdx++;
        state.y = currentSlot().y0 + 1;
      } else {
        nextPage();
      }
    }
  };

  const fitToSlot = (slot: PageSlot, draw: () => void) => {
    const avail = slot.y1 - slot.y0 - 2;
    state.dryRun = true;
    state.scale = 1;
    state.y = slot.y0 + 1;
    draw();
    const used = state.y - slot.y0;
    state.dryRun = false;
    state.scale = used > avail ? Math.max(0.4, avail / used) : 1;
    state.y = slot.y0 + 1;
    draw();
  };

  const drawRow = (row: {
    time: string | null;
    desc: string;
    persons: string[];
  }) => {
    const slot = currentSlot();
    const lineH = slot.lineH * state.scale;
    const f = slot.rowFont * state.scale;
    if (state.dryRun) {
      const descLines = doc.splitTextToSize(row.desc, slot.descW) as string[];
      const n = Math.max(descLines.length, row.persons.length, 1);
      state.y += n * lineH;
      return;
    }
    ensure(lineH + 2);
    const descLines = doc.splitTextToSize(row.desc, slot.descW) as string[];
    const n = Math.max(descLines.length, row.persons.length, 1);
    const h = n * lineH;
    const baseY = state.y + lineH - 1.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(f);
    if (row.time) {
      doc.text(row.time, slot.timeX, baseY);
    }
    doc.text(descLines, slot.descX, baseY);
    doc.setFont("helvetica", "normal");
    row.persons.forEach((p, i) => {
      const lines = doc.splitTextToSize(p, slot.personW) as string[];
      lines.forEach((ln, j) => {
        doc.text(ln, slot.personX, state.y + (i + j + 1) * lineH - 1.2);
      });
    });
    state.y += h;
  };

  const drawSectionHeader = (title: string, color?: string) => {
    const slot = currentSlot();
    const lineH = slot.lineH * state.scale;
    if (state.dryRun) {
      state.y += lineH + 2;
      return;
    }
    ensure(lineH + 4);
    const s = currentSlot();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s.sectionFont * state.scale);
    if (color) {
      const [r, g, b] = hexToRgb(color);
      doc.setTextColor(r, g, b);
    }
    doc.text(title.toUpperCase(), s.cx, state.y + s.lineH * state.scale - 1, {
      align: "center",
    });
    if (color) doc.setTextColor(0, 0, 0);
    state.y += s.lineH * state.scale + 2;
  };

  const drawWeekHeader = (label: string) => {
    const slot = currentSlot();
    const lineH = slot.lineH * state.scale;
    if (state.dryRun) {
      state.y += lineH + 2;
      return;
    }
    ensure(lineH + 4);
    const s = currentSlot();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s.weekFont * state.scale);
    doc.text(label, s.cx, state.y + s.lineH * state.scale - 1, {
      align: "center",
    });
    state.y += s.lineH * state.scale + 2;
  };

  const meetingDateTime = (m: PdfMeeting): { date: Date; time: string } => {
    const ws = parseDateKey(m.weekStart);
    if (m.type === "memorial") return { date: ws, time: "" };
    const cfg = configs.find((c) => c.type === m.type && c.isActive);
    const day = cfg?.dayOfWeek ?? (m.type === "midweek" ? 2 : 0);
    return {
      date: addDays(ws, (day + 6) % 7),
      time: cfg?.startTime ?? (m.type === "midweek" ? "19:00" : "10:00"),
    };
  };

  const findApostilaWeek = (weekStart: string): PdfApostilaSemana | null => {
    const key = weekStart.replace(/-/g, "");
    return (
      apostilaWeeks.find((w) => {
        const start = w.dateRange.slice(0, 8);
        const end = w.dateRange.slice(9);
        return key >= start && key <= end;
      }) ?? null
    );
  };

  const songNumber = (a: PdfAssignment | undefined): number | null => {
    const data = a?.contentItem?.data as { number?: number } | null | undefined;
    return data?.number != null ? Number(data.number) : null;
  };

  const personName = (a: PdfAssignment | undefined): string | null =>
    a?.person?.name ?? (a?.subOrgPerson ? `${a.subOrgPerson.name}` : null);

  const personLabel = (a: PdfAssignment | undefined): string | null => {
    if (!a) return null;
    if (a.person) return a.person.name;
    if (a.subOrgPerson) {
      return `${a.subOrgPerson.name} (${a.subOrgPerson.subOrganization.name})`;
    }
    return null;
  };

  const assignLabel = personLabel;

  const sectionColorForWeekend = (title: string): string | null => {
    const s = title.trim().toLowerCase();
    if (s.includes("discu")) return "#3c7f8b";
    if (s.includes("estudio") || s.includes("estudo")) return "#bf2f13";
    return sectionColor(title);
  };

  const renderMidweek = (meeting: PdfMeeting) => {
    const assign = (role: string) =>
      meeting.assignments.find((a) => a.role === role);
    const aw = findApostilaWeek(meeting.weekStart);
    const { time } = meetingDateTime(meeting);
    const sections = meeting.program?.sections ?? [];
    let clock = parseTimeToMinutes(time);

    const openingNum = songNumber(assign("canticoInicial"));
    const presName = personName(assign("presidente"));
    drawRow({
      time: fmtTime(clock),
      desc:
        openingNum != null
          ? t("meetings.pdf.songAndPrayer", { n: openingNum })
          : t("meetings.roles.canticoInicial"),
      persons: presName
        ? [`${presName} (${t("meetings.roles.presidente")})`]
        : [],
    });
    clock += 5;

    drawRow({
      time: fmtTime(clock),
      desc: t("meetings.roles.palavrasIntroducao"),
      persons: [],
    });
    clock += 1;

    for (const section of sections) {
      if (section.key === "introducao" || section.key === "conclusao") {
        continue;
      }
      const header = section.title;
      drawSectionHeader(header, sectionColor(header) ?? undefined);

      for (const row of section.rows) {
        if (row.kind === "song") {
          const num = songNumber(assign(row.role));
          drawRow({
            time: null,
            desc:
              num != null
                ? t("meetings.pdf.middleSong", { n: num })
                : t("meetings.roles.canticoMeio"),
            persons: [],
          });
          clock += row.clockAdd ?? row.tempoMin;
          continue;
        }

        const name = basePartName(row.role, aw) ?? row.title;
        const num = partNumber(row.role, aw);
        const desc =
          num != null ? `${num} - ${name} (${row.tempoMin} min)` : name;
        const persons: string[] = [];
        const pn = personName(assign(row.role));
        if (pn) persons.push(pn);
        if (row.secondary) {
          const sn = personName(assign(row.secondary.role));
          if (sn) {
            const suf = roleSuffix(row.secondary.role);
            const label =
              suf === "leitor"
                ? t("meetings.roles.leitor")
                : suf === "condutor"
                  ? t("meetings.roles.condutor")
                  : null;
            persons.push(label ? `${sn} (${label})` : sn);
          }
        }
        drawRow({
          time: fmtTime(clock),
          desc,
          persons,
        });
        clock += row.clockAdd ?? row.tempoMin;
      }
    }

    const concl = sections.find((s) => s.key === "conclusao");
    const palavrasRow = concl?.rows.find((r) => r.key === "palavrasConclusao");
    drawRow({
      time: fmtTime(clock),
      desc: t("meetings.roles.palavrasConclusao"),
      persons: [],
    });
    clock += palavrasRow?.clockAdd ?? palavrasRow?.tempoMin ?? 3;

    const closingNum = songNumber(assign("canticoFinal"));
    const cpn = personName(assign("oracao"));
    drawRow({
      time: fmtTime(clock),
      desc:
        closingNum != null
          ? t("meetings.pdf.songAndPrayer", { n: closingNum })
          : t("meetings.roles.canticoFinalOracao"),
      persons: cpn ? [`(${cpn})`] : [],
    });
    clock += 5;
  };

  const renderWeekend = (meeting: PdfMeeting) => {
    const assign = (role: string) =>
      meeting.assignments.find((a) => a.role === role);
    const { time } = meetingDateTime(meeting);
    const sections = meeting.program?.sections ?? [];
    let clock = parseTimeToMinutes(time);

    const openingNum = songNumber(assign("canticoInicial"));
    const presName = personName(assign("presidente"));
    drawRow({
      time: fmtTime(clock),
      desc:
        openingNum != null
          ? t("meetings.pdf.songAndPrayer", { n: openingNum })
          : t("meetings.roles.canticoInicial"),
      persons: presName
        ? [`${presName} (${t("meetings.roles.presidente")})`]
        : [],
    });
    clock += 5;

    for (const section of sections) {
      if (section.key === "introducao" || section.key === "conclusao") {
        continue;
      }
      const header = section.title;
      drawSectionHeader(header, sectionColorForWeekend(header) ?? undefined);

      for (const row of section.rows) {
        if (row.kind === "song") {
          const num = songNumber(assign(row.role));
          drawRow({
            time: fmtTime(clock),
            desc:
              num != null
                ? t("meetings.pdf.middleSong", { n: num })
                : t("meetings.roles.canticoMeio"),
            persons: [],
          });
          clock += row.clockAdd ?? row.tempoMin;
          continue;
        }

        if (row.kind === "discurso") {
          const tema = (
            assign("discurso")?.contentItem?.data as { theme?: string } | null
          )?.theme;
          const orador = assignLabel(assign("orador"));
          drawRow({
            time: fmtTime(clock),
            desc: tema
              ? `${t("meetings.pdf.publicTalk")}: ${tema}`
              : t("meetings.pdf.publicTalk"),
            persons: orador ? [orador] : [],
          });
          clock += row.clockAdd ?? row.tempoMin;
          continue;
        }

        const name = row.title;
        const desc = row.tempoMin > 0 ? `${name} (${row.tempoMin} min)` : name;
        const persons: string[] = [];
        const pn = assignLabel(assign(row.role));
        if (pn) persons.push(pn);
        if (row.secondary) {
          const sn = assignLabel(assign(row.secondary.role));
          if (sn) persons.push(sn);
        }
        drawRow({
          time: fmtTime(clock),
          desc,
          persons,
        });
        clock += row.clockAdd ?? row.tempoMin;
      }
    }

    const rc = assign("canticoFinal");
    const closingNum = songNumber(rc);
    const cpn = assignLabel(rc);
    drawRow({
      time: fmtTime(clock),
      desc:
        closingNum != null
          ? t("meetings.pdf.songAndPrayer", { n: closingNum })
          : t("meetings.roles.canticoFinalOracao"),
      persons: cpn ? [`(${cpn})`] : [],
    });
    clock += 5;
  };

  const renderMemorial = (meeting: PdfMeeting) => {
    const assign = (role: string) =>
      meeting.assignments.filter((a) => a.role === role);
    const pres = assign("presidente")
      .map(personName)
      .filter(Boolean) as string[];
    const openingNum = songNumber(assign("canticoInicial")[0]);
    const discursoAssign = assign("discurso")[0];
    const discursoManual = discursoAssign?.value ?? "";
    const tema = discursoManual
      ? discursoManual
      : (discursoAssign?.contentItem?.data as { theme?: string } | null)?.theme;
    const oradorAssign = assign("orador")[0];
    const oradorManual = oradorAssign?.value ?? "";
    const orador = oradorManual || assignLabel(oradorAssign);

    if (pres.length) {
      drawRow({
        time: null,
        desc: t("meetings.roles.presidente"),
        persons: pres,
      });
    }
    drawRow({
      time: null,
      desc:
        openingNum != null
          ? t("meetings.pdf.songAndPrayer", { n: openingNum })
          : t("meetings.roles.canticoInicial"),
      persons: [],
    });
    drawRow({
      time: null,
      desc: tema
        ? `${t("meetings.pdf.publicTalk")}: ${tema}`
        : t("meetings.roles.discurso"),
      persons: orador ? [orador] : [],
    });

    for (const role of ["passarPao", "passarVinho", "indicador"]) {
      const persons = assign(role).map(personName).filter(Boolean) as string[];
      drawRow({
        time: null,
        desc: t(`meetings.roles.${role}`),
        persons,
      });
    }

    const closingNum = songNumber(assign("canticoFinal")[0]);
    drawRow({
      time: null,
      desc:
        closingNum != null
          ? t("meetings.pdf.songAndPrayer", { n: closingNum })
          : t("meetings.roles.canticoFinal"),
      persons: [],
    });
  };

  const isVisitWeek = (date: Date): boolean =>
    events.some((ev) => {
      if (ev.type !== "circuitVisit") return false;
      const start = parseDateKey(ev.date);
      const end = ev.endDate ? parseDateKey(ev.endDate) : start;
      return date >= start && date <= end;
    });

  const drawVisitBanner = () => {
    const slot = currentSlot();
    const s = slot;
    if (state.dryRun) {
      state.y += s.lineH * state.scale + 3;
      return;
    }
    ensure(s.lineH * state.scale + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s.sectionFont * state.scale);
    doc.setTextColor(191, 47, 19);
    doc.text(
      t("meetings.pdf.circuitVisit"),
      s.cx,
      state.y + s.lineH * state.scale - 1,
      { align: "center" },
    );
    doc.setTextColor(0, 0, 0);
    state.y += s.lineH * state.scale + 3;
  };

  const renderMeeting = (meeting: PdfMeeting) => {
    const slot = currentSlot();
    const draw = () => {
      const { date } = meetingDateTime(meeting);
      drawWeekHeader(weekLabel(date));
      if (meeting.type === "midweek" && isVisitWeek(date)) {
        drawVisitBanner();
      }
      if (meeting.type === "weekend") {
        renderWeekend(meeting);
      } else if (meeting.type === "memorial") {
        renderMemorial(meeting);
      } else {
        renderMidweek(meeting);
      }
    };
    fitToSlot(slot, draw);
    if (!state.dryRun) {
      state.slotIdx++;
      if (state.slotIdx >= state.slots.length) {
        nextPage();
      } else {
        state.y = currentSlot().y0 + 1;
      }
    }
  };

  const types: PdfMeetingType[] = ["midweek", "weekend", "memorial"];

  let firstPage = true;
  for (const type of types) {
    const list = meetings
      .filter((m) => m.type === type)
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    if (list.length === 0) continue;

    if (firstPage) {
      firstPage = false;
      beginPage(type);
    } else {
      doc.addPage();
      beginPage(type);
    }

    for (const meeting of list) {
      renderMeeting(meeting);
    }
  }

  doc.save(`reunioes.pdf`);
}
