import { DEFAULT_HOURS, DEFAULT_SETTINGS, WEEKDAYS, type DayHours, type HoursMap, type PublicSettings, type Weekday } from "./types";
import { toMinutes } from "./time";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseHours(raw: unknown): HoursMap {
  const source = typeof raw === "string" ? safeJson(raw) : raw;
  const hours = {} as HoursMap;
  for (const day of WEEKDAYS) {
    const value = source && typeof source === "object" ? (source as Record<string, DayHours>)[day.key] : undefined;
    if (!value || typeof value.open !== "string" || typeof value.close !== "string") {
      hours[day.key] = DEFAULT_HOURS[day.key];
      continue;
    }
    hours[day.key] = {
      closed: Boolean(value.closed),
      open: TIME_RE.test(value.open) ? value.open : DEFAULT_HOURS[day.key].open,
      close: TIME_RE.test(value.close) ? value.close : DEFAULT_HOURS[day.key].close,
    };
  }
  return hours;
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function hoursAreValid(hours: HoursMap) {
  return WEEKDAYS.every((day) => {
    const value = hours[day.key];
    if (!value || !TIME_RE.test(value.open) || !TIME_RE.test(value.close)) return false;
    if (value.closed) return true;
    return toMinutes(value.close) > toMinutes(value.open);
  });
}

export function toPublicSettings(row: {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  hoursJson: string;
  leadTimeMinutes: number;
  slotMinutes: number;
  taxEnabled: boolean;
  taxBps: number;
  timezone: string;
}): PublicSettings {
  return {
    storeName: row.storeName || DEFAULT_SETTINGS.storeName,
    address: row.address,
    phone: row.phone,
    email: row.email,
    hours: parseHours(row.hoursJson),
    leadTimeMinutes: row.leadTimeMinutes,
    slotMinutes: row.slotMinutes,
    taxEnabled: row.taxEnabled,
    taxBps: row.taxBps,
    timezone: row.timezone || DEFAULT_SETTINGS.timezone,
  };
}

export function weekdayLabel(key: Weekday) {
  return WEEKDAYS.find((day) => day.key === key)?.label ?? key;
}
