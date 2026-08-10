"use client";

import {
  OverviewClient,
  type OverviewItem,
} from "@/features/overview/overview-client";
import {
  addDays,
  startOfDay,
  startOfWeek,
  toDateKey,
} from "@/lib/cleaning-assignment";

export function DemoHome() {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);

  const midweekDate = toDateKey(addDays(weekStart, 2));
  const weekendDate = toDateKey(addDays(weekStart, 4));

  const weekAssignments: OverviewItem[] = [
    {
      id: "d-w1",
      kind: "meeting",
      date: midweekDate,
      titleKey: "meetings.roles.presidente",
      title: null,
      subtitleKey: "meetings.types.midweek",
      subtitle: null,
    },
    {
      id: "d-w2",
      kind: "meeting",
      date: midweekDate,
      titleKey: "meetings.roles.oracao",
      title: null,
      subtitleKey: "meetings.types.midweek",
      subtitle: null,
    },
    {
      id: "d-w3",
      kind: "designation",
      date: weekendDate,
      titleKey: "designations.roles.som",
      title: null,
      subtitleKey: null,
      subtitle: "Setor 1",
    },
    {
      id: "d-w4",
      kind: "cleaning",
      date: weekendDate,
      titleKey: "cleaning.defaults.meeting.auditorium.name",
      title: null,
      subtitleKey: "cleaning.types.meeting",
      subtitle: null,
      task: "cleaning.defaults.meeting.auditorium.task",
    },
  ];

  const upcoming: OverviewItem[] = [
    {
      id: "d-u1",
      kind: "designation",
      date: weekendDate,
      titleKey: "designations.roles.video",
      title: null,
      subtitleKey: null,
      subtitle: "Setor 1",
    },
    {
      id: "d-u2",
      kind: "cleaning",
      date: toDateKey(addDays(weekStart, 9)),
      titleKey: "cleaning.defaults.meeting.bathroomMale.name",
      title: null,
      subtitleKey: "cleaning.types.weekly",
      subtitle: null,
      task: "cleaning.defaults.meeting.bathroomMale.task",
    },
    {
      id: "d-u3",
      kind: "designation",
      date: toDateKey(addDays(weekStart, 10)),
      titleKey: "designations.roles.palco",
      title: null,
      subtitleKey: null,
      subtitle: "Setor 2",
    },
  ];

  const pastMonth: OverviewItem[] = [
    {
      id: "d-p1",
      kind: "meeting",
      date: toDateKey(addDays(weekStart, -5)),
      titleKey: "meetings.roles.palavrasIntroducao",
      title: null,
      subtitleKey: "meetings.types.midweek",
      subtitle: null,
    },
    {
      id: "d-p2",
      kind: "cleaning",
      date: toDateKey(addDays(weekStart, -8)),
      titleKey: "cleaning.defaults.meeting.supplies.name",
      title: null,
      subtitleKey: "cleaning.types.meeting",
      subtitle: null,
      task: "cleaning.defaults.meeting.supplies.task",
    },
    {
      id: "d-p3",
      kind: "designation",
      date: toDateKey(addDays(weekStart, -12)),
      titleKey: "designations.roles.mic",
      title: null,
      subtitleKey: null,
      subtitle: "Setor 1",
    },
  ];

  return (
    <OverviewClient
      personName="Carlos Mendes"
      weekStart={toDateKey(weekStart)}
      weekEnd={toDateKey(weekEnd)}
      today={toDateKey(today)}
      nextMeeting={{
        type: "midweek",
        date: midweekDate,
        time: "19:30",
      }}
      weekAssignments={weekAssignments}
      upcoming={upcoming}
      pastMonth={pastMonth}
    />
  );
}
