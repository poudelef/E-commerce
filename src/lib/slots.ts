import type { PublicSettings, Slot } from "./types";
import { addDays, formatSlotLabel, fromMinutes, MAX_PICKUP_DAYS, toMinutes, weekdayKeyFromIso, zonedParts } from "./time";

export function buildSlots(date: string, settings: PublicSettings, now = new Date()): Slot[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const today = zonedParts(now, settings.timezone).date;
  const last = addDays(today, MAX_PICKUP_DAYS);
  if (date < today || date > last) return [];

  const hours = settings.hours[weekdayKeyFromIso(date)];
  if (!hours || hours.closed) return [];
  if (toMinutes(hours.close) <= toMinutes(hours.open)) return [];

  const cutoff = zonedParts(new Date(now.getTime() + settings.leadTimeMinutes * 60_000), settings.timezone);
  const cutoffKey = `${cutoff.date}T${cutoff.time}`;
  const slots: Slot[] = [];
  let cursor = toMinutes(hours.open);
  const end = toMinutes(hours.close);
  const step = settings.slotMinutes;

  while (cursor + step <= end) {
    const start = fromMinutes(cursor);
    const stop = fromMinutes(cursor + step);
    if (`${date}T${start}` >= cutoffKey) {
      slots.push({ start, end: stop, label: formatSlotLabel(start, stop) });
    }
    cursor += step;
  }
  return slots;
}

export function firstBookableDate(settings: PublicSettings, now = new Date()) {
  const today = zonedParts(now, settings.timezone).date;
  for (let offset = 0; offset <= MAX_PICKUP_DAYS; offset += 1) {
    const date = addDays(today, offset);
    if (buildSlots(date, settings, now).length) return date;
  }
  return today;
}
