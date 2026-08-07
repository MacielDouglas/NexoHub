import {
  DESIGNATION_ROLES,
  type DesignationRole,
} from "@/lib/designation-assignment";

export type DesignationPdfEntry = {
  date: string;
  role: DesignationRole;
  sector: string | null;
  personName: string;
};

type TFunc = (key: string, options?: Record<string, unknown>) => string;

function formatDateKey(key: string, locale: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function cellLabel(
  role: DesignationRole,
  names: string[],
  sectors: (string | null)[],
): string {
  if (role === "indicador") {
    return names
      .map((name, i) => {
        const sector = sectors[i];
        return sector ? `${name} - ${sector}` : name;
      })
      .join("\n");
  }
  return names.join("\n");
}

export async function generateDesignationsPdf(opts: {
  orgName: string;
  startDate: string;
  endDate: string;
  enabledSectors: DesignationRole[];
  entries: DesignationPdfEntry[];
  dateLocale: string;
  t: TFunc;
}): Promise<void> {
  const {
    orgName,
    startDate,
    endDate,
    enabledSectors,
    entries,
    dateLocale,
    t,
  } = opts;

  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(orgName, pageW / 2, 16, { align: "center" });
  doc.setFontSize(12);
  doc.text(t("designations.pdf.title"), pageW / 2, 23, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `${t("designations.pdf.period")}: ${formatDateKey(startDate, dateLocale)} – ${formatDateKey(endDate, dateLocale)}`,
    pageW / 2,
    30,
    { align: "center" },
  );

  const grouped = new Map<string, Map<DesignationRole, string[]>>();
  const sectorsByDate = new Map<
    string,
    Map<DesignationRole, (string | null)[]>
  >();
  for (const entry of entries) {
    let roles = grouped.get(entry.date);
    if (!roles) {
      roles = new Map();
      grouped.set(entry.date, roles);
    }
    const names = roles.get(entry.role) ?? [];
    names.push(entry.personName);
    roles.set(entry.role, names);

    let sectors = sectorsByDate.get(entry.date);
    if (!sectors) {
      sectors = new Map();
      sectorsByDate.set(entry.date, sectors);
    }
    const list = sectors.get(entry.role) ?? [];
    list.push(entry.sector);
    sectors.set(entry.role, list);
  }

  const roleOrder: DesignationRole[] = DESIGNATION_ROLES.filter((role) =>
    enabledSectors.includes(role),
  );

  const head = [
    t("designations.pdf.date"),
    ...roleOrder.map((role) => t(`designations.roles.${role}`)),
  ];

  const rows: string[][] = [];
  for (const dateKey of [...grouped.keys()].sort()) {
    const roles = grouped.get(dateKey);
    const sectors = sectorsByDate.get(dateKey);
    if (!roles) continue;
    const row: string[] = [formatDateKey(dateKey, dateLocale)];
    for (const role of roleOrder) {
      row.push(
        cellLabel(role, roles.get(role) ?? [], sectors?.get(role) ?? []),
      );
    }
    rows.push(row);
  }

  autoTable(doc, {
    startY: 36,
    head: [head],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 41, 55] },
    margin: { left: 14, right: 14 },
    columnStyles: { 0: { cellWidth: 25 } },
  });

  doc.save(`designacoes-${startDate}.pdf`);
}
