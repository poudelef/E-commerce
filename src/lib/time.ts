import { WEEKDAYS, type Weekday } from "./types";

export type ZonedParts = {
  date: string;
  time: string;
  weekday: string;
};

const SHORT_TO_KEY: Record<string, Weekday> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

export function isValidTimeZone(timeZone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`,
    weekday: parts.weekday ?? "Mon",
  };
}

export function weekdayKeyFromIso(isoDate: string): Weekday {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return SHORT_TO_KEY[weekday] ?? "mon";
}

export function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function formatDateLabel(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatTimeLabel(hhmm: string) {
  const [hourRaw, minuteRaw] = hhmm.split(":").map(Number);
  const suffix = hourRaw >= 12 ? "PM" : "AM";
  const hour = hourRaw % 12 || 12;
  return `${hour}:${String(minuteRaw).padStart(2, "0")} ${suffix}`;
}

export function formatSlotLabel(start: string, end: string) {
  return `${formatTimeLabel(start)} – ${formatTimeLabel(end)}`;
}

export function toMinutes(hhmm: string) {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour * 60 + minute;
}

export function fromMinutes(total: number) {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatDateTime(iso: string | Date, timeZone: string) {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

export function timezoneAbbrev(timeZone: string) {
  const part = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    timeZoneName: "short",
  })
    .formatToParts(new Date())
    .find((item) => item.type === "timeZoneName");
  return part?.value ?? timeZone;
}

export function hoursSummary(hours: Record<Weekday, { closed: boolean; open: string; close: string }>) {
  return WEEKDAYS.map((day) => {
    const value = hours[day.key];
    if (!value || value.closed) return `${day.short} Closed`;
    return `${day.short} ${formatTimeLabel(value.open)} – ${formatTimeLabel(value.close)}`;
  });
}

export const MAX_PICKUP_DAYS = 14;
