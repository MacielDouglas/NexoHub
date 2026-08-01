export const CLEANING_TYPES = ["meeting", "weekly", "general"] as const;
export type CleaningType = (typeof CLEANING_TYPES)[number];

export const CLEANING_UNITS = ["person", "family", "group"] as const;
export type CleaningUnit = (typeof CLEANING_UNITS)[number];

export const GENDERS = ["male", "female", "any"] as const;
export type Gender = (typeof GENDERS)[number];

export type CleaningSectorDefault = {
  key: string;
  type: CleaningType;
  unit: CleaningUnit;
  peopleCount?: number;
  allowYoung?: boolean;
  gender?: Gender;
  sortOrder: number;
};

export const DEFAULT_SECTORS: CleaningSectorDefault[] = [
  {
    key: "bathroomMale",
    type: "meeting",
    unit: "family",
    peopleCount: 2,
    allowYoung: false,
    gender: "male",
    sortOrder: 0,
  },
  {
    key: "bathroomFemale",
    type: "meeting",
    unit: "family",
    peopleCount: 2,
    allowYoung: false,
    gender: "female",
    sortOrder: 1,
  },
  {
    key: "auditorium",
    type: "meeting",
    unit: "group",
    peopleCount: 2,
    allowYoung: true,
    gender: "any",
    sortOrder: 2,
  },
  {
    key: "supplies",
    type: "meeting",
    unit: "person",
    peopleCount: 1,
    allowYoung: true,
    gender: "any",
    sortOrder: 3,
  },
  {
    key: "trash",
    type: "meeting",
    unit: "person",
    peopleCount: 1,
    allowYoung: true,
    gender: "any",
    sortOrder: 4,
  },
  {
    key: "cobwebs",
    type: "weekly",
    unit: "family",
    sortOrder: 0,
  },
  {
    key: "floor",
    type: "weekly",
    unit: "group",
    sortOrder: 1,
  },
  {
    key: "doorsWindows",
    type: "weekly",
    unit: "family",
    sortOrder: 2,
  },
  {
    key: "objects",
    type: "weekly",
    unit: "family",
    sortOrder: 3,
  },
  {
    key: "microphones",
    type: "weekly",
    unit: "family",
    sortOrder: 4,
  },
  {
    key: "chairs",
    type: "weekly",
    unit: "group",
    sortOrder: 5,
  },
  {
    key: "gardens",
    type: "weekly",
    unit: "group",
    sortOrder: 6,
  },
  {
    key: "laundry",
    type: "weekly",
    unit: "family",
    sortOrder: 7,
  },
  {
    key: "forgottenObjects",
    type: "weekly",
    unit: "family",
    sortOrder: 8,
  },
  {
    key: "walls",
    type: "general",
    unit: "group",
    sortOrder: 0,
  },
  {
    key: "blinds",
    type: "general",
    unit: "family",
    sortOrder: 1,
  },
  {
    key: "fans",
    type: "general",
    unit: "group",
    sortOrder: 2,
  },
  {
    key: "bathrooms",
    type: "general",
    unit: "group",
    sortOrder: 3,
  },
  {
    key: "gates",
    type: "general",
    unit: "group",
    sortOrder: 4,
  },
  {
    key: "garden",
    type: "general",
    unit: "group",
    sortOrder: 5,
  },
  {
    key: "sidewalks",
    type: "general",
    unit: "group",
    sortOrder: 6,
  },
  {
    key: "cleaningRoom",
    type: "general",
    unit: "family",
    sortOrder: 7,
  },
];

export function unitsForType(type: CleaningType): CleaningUnit[] {
  return type === "meeting"
    ? ["person", "family", "group"]
    : ["family", "group"];
}

export function isCleaningType(value: string): value is CleaningType {
  return (CLEANING_TYPES as readonly string[]).includes(value);
}

export function isCleaningUnit(value: string): value is CleaningUnit {
  return (CLEANING_UNITS as readonly string[]).includes(value);
}

export function isGender(value: string): value is Gender {
  return (GENDERS as readonly string[]).includes(value);
}

export function isCleaningSectorDefault(
  value: CleaningSectorDefault,
): value is CleaningSectorDefault {
  return (DEFAULT_SECTORS as CleaningSectorDefault[]).some(
    (d) => d.key === value.key && d.type === value.type,
  );
}

export function sectorNameKey(sector: {
  defaultKey: string | null;
  type: CleaningType;
}): string | null {
  if (!sector.defaultKey) return null;
  return `cleaning.defaults.${sector.type}.${sector.defaultKey}.name`;
}

export function sectorTaskKey(sector: {
  defaultKey: string | null;
  type: CleaningType;
}): string | null {
  if (!sector.defaultKey) return null;
  return `cleaning.defaults.${sector.type}.${sector.defaultKey}.task`;
}
