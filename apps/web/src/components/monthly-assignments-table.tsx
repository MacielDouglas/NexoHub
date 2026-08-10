"use client";

import { useMemo } from "react";
import {
  addDays,
  parseDateKey,
  startOfWeek,
} from "@/lib/cleaning-assignment";
import { cn } from "@/lib/utils";

type Column = {
  id: string;
  label: string;
};

type Row = {
  date: string;
  cells: Record<string, string[]>;
};

type Props = {
  dateLabel: string;
  columns: Column[];
  rows: Row[];
  emptyMessage: string;
  dateLocale: string;
};

type DateStatus = "past" | "current" | "future";

function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function dateStatus(dateKey: string): DateStatus {
  const date = normalizeDate(parseDateKey(dateKey));
  const today = normalizeDate(new Date());

  if (date < today) {
    return "past";
  }

  const weekStart = normalizeDate(startOfWeek(new Date()));
  const weekEnd = normalizeDate(addDays(weekStart, 6));

  if (date >= weekStart && date <= weekEnd) {
    return "current";
  }

  return "future";
}

function formatDateCell(dateKey: string, locale: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  });
}

function getDateClasses(status: DateStatus): string {
  return cn(
    "shrink-0 whitespace-nowrap text-left font-medium tabular-nums",
    status === "past" && "text-muted-foreground/50 line-through",
    status === "current" && "text-primary",
    status === "future" && "text-foreground/80",
  );
}

function getCellClasses(status: DateStatus): string {
  return cn(
    "min-w-0 wrap-break-word",
    status === "past" && "opacity-40",
  );
}

function AssignmentNames({
  names,
  status,
}: {
  names: string[];
  status: DateStatus;
}) {
  if (names.length === 0) {
    return (
      <span
        className="text-sm text-muted-foreground/40"
        aria-label="Sem atribuições"
      >
        —
      </span>
    );
  }

  return (
    <ul className="min-w-0 space-y-1">
      {names.map((name, index) => (
        <li
          key={`${name}-${index}`}
          className={cn(
            "wrap-break-word text-sm leading-5",
            status === "past" && "line-through",
            status === "current" && "font-medium text-primary",
          )}
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

function MobileAssignmentCard({
  row,
  columns,
  dateLocale,
}: {
  row: Row;
  columns: Column[];
  dateLocale: string;
}) {
  const status = dateStatus(row.date);

  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl bg-card p-4 ring-1 ring-white/10",
        status === "current" && "bg-primary/5 ring-primary/20",
      )}
    >
      <header className="mb-4 flex min-w-0 items-center justify-between gap-3 border-b border-white/10 pb-3">
        <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Data
        </span>

        <time
          dateTime={row.date}
          className={cn("text-sm", getDateClasses(status))}
        >
          {formatDateCell(row.date, dateLocale)}
        </time>
      </header>

      <dl className="min-w-0 divide-y divide-white/5">
        {columns.map((column) => {
          const names = row.cells[column.id] ?? [];

          return (
            <div
              key={column.id}
              className="grid min-w-0 grid-cols-1 gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,40%)_minmax(0,1fr)] sm:gap-4"
            >
              <dt className="min-w-0 wrap-break-word text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {column.label}
              </dt>

              <dd className={getCellClasses(status)}>
                <AssignmentNames
                  names={names}
                  status={status}
                />
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}

export function MonthlyAssignmentsTable({
  dateLabel,
  columns,
  rows,
  emptyMessage,
  dateLocale,
}: Props) {
  const sortedRows = useMemo(
    () => rows.slice().sort((a, b) => a.date.localeCompare(b.date)),
    [rows],
  );

  const mobileRows = useMemo(
    () => sortedRows.filter((row) => dateStatus(row.date) !== "past"),
    [sortedRows],
  );

  if (columns.length === 0 || sortedRows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* Mobile: até 780px, somente semana atual e dias futuros */}
      <div className="grid min-w-0 gap-3 min-[781px]:hidden">
        {mobileRows.length > 0 ? (
          mobileRows.map((row) => (
            <MobileAssignmentCard
              key={row.date}
              row={row}
              columns={columns}
              dateLocale={dateLocale}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </div>

      {/* Desktop/tablet: acima de 780px, exibe todos os dias */}
      <div className="hidden min-w-0 overflow-hidden rounded-2xl bg-card ring-1 ring-white/10 min-[781px]:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[clamp(5.5rem,14vw,8rem)]" />

            {columns.map((column) => (
              <col key={column.id} />
            ))}
          </colgroup>

          <thead>
            <tr className="border-b border-white/10">
              <th
                scope="col"
                className="bg-card px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:px-4"
              >
                {dateLabel}
              </th>

              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className="min-w-0 wrap-break-word px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:px-4"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((row) => {
              const status = dateStatus(row.date);

              return (
                <tr
                  key={row.date}
                  className={cn(
                    "border-b border-white/5 last:border-0",
                    status === "current" && "bg-primary/5",
                  )}
                >
                  <th
                    scope="row"
                    className={cn(
                      "bg-card px-3 py-3 text-left lg:px-4",
                      getDateClasses(status),
                    )}
                  >
                    <time dateTime={row.date}>
                      {formatDateCell(row.date, dateLocale)}
                    </time>
                  </th>

                  {columns.map((column) => {
                    const names = row.cells[column.id] ?? [];

                    return (
                      <td
                        key={column.id}
                        className={cn(
                          "min-w-0 max-w-0 wrap-break-word px-3 py-3 align-top lg:px-4",
                          getCellClasses(status),
                        )}
                      >
                        <AssignmentNames
                          names={names}
                          status={status}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
