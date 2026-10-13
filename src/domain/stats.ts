import { addDays, daysBetween, formatTime, parseTime } from './dates';
import { getHabit } from './habits';
import { dayType, entryKey, isSuccess } from './schedule';
import type { DateKey, Entry, FailReason, HabitId, Settings } from './types';

type Entries = Record<string, Entry>;

function isActive(habitId: HabitId, date: DateKey, settings: Settings): boolean {
  return getHabit(habitId).activeOn.includes(dayType(date, settings));
}

/**
 * Racha actual: días activos consecutivos con versión completa o mínima.
 * Hoy sin registrar no rompe la racha (el día aún no termina).
 */
export function currentStreak(habitId: HabitId, date: DateKey, settings: Settings, entries: Entries) {
  let streak = 0;
  let cursor = date;
  if (!entries[entryKey(cursor, habitId)]) cursor = addDays(cursor, -1);
  while (daysBetween(settings.startDate, cursor) >= 0) {
    if (isActive(habitId, cursor, settings)) {
      if (!isSuccess(entries[entryKey(cursor, habitId)])) break;
      streak++;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestStreak(habitId: HabitId, date: DateKey, settings: Settings, entries: Entries) {
  let best = 0;
  let run = 0;
  for (let d = settings.startDate; daysBetween(d, date) >= 0; d = addDays(d, 1)) {
    if (!isActive(habitId, d, settings)) continue;
    if (isSuccess(entries[entryKey(d, habitId)])) {
      run++;
      best = Math.max(best, run);
    } else if (d !== date) {
      run = 0;
    }
  }
  return best;
}

/** "Nunca fallar dos veces": ¿el último día activo antes de hoy fue un fallo? */
export function missedLastTime(habitId: HabitId, date: DateKey, settings: Settings, entries: Entries) {
  let cursor = addDays(date, -1);
  while (daysBetween(settings.startDate, cursor) >= 0) {
    if (isActive(habitId, cursor, settings)) return !isSuccess(entries[entryKey(cursor, habitId)]);
    cursor = addDays(cursor, -1);
  }
  return false;
}

/** % de días activos cumplidos (completo o mínimo) en los últimos `days` días */
export function consistency(
  habitId: HabitId,
  date: DateKey,
  days: number,
  settings: Settings,
  entries: Entries,
): number | null {
  let active = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(date, -i);
    if (daysBetween(settings.startDate, d) < 0) break;
    if (!isActive(habitId, d, settings)) continue;
    // Hoy solo cuenta si ya se registró
    if (i === 0 && !entries[entryKey(d, habitId)]) continue;
    active++;
    if (isSuccess(entries[entryKey(d, habitId)])) done++;
  }
  return active === 0 ? null : Math.round((done / active) * 100);
}

export function lastDays(date: DateKey, days: number): DateKey[] {
  return Array.from({ length: days }, (_, i) => addDays(date, i - days + 1));
}

export function averageWakeTime(date: DateKey, days: number, entries: Entries): string | null {
  const times = lastDays(date, days)
    .map((d) => entries[entryKey(d, 'despertar')]?.wakeTime)
    .map((t) => (t ? parseTime(t) : null))
    .filter((t): t is number => t !== null);
  if (times.length === 0) return null;
  return formatTime(Math.round(times.reduce((a, b) => a + b, 0) / times.length));
}

export function sumField(
  habitId: HabitId,
  field: 'minutes' | 'pages',
  date: DateKey,
  days: number,
  entries: Entries,
): number {
  return lastDays(date, days).reduce(
    (sum, d) => sum + (entries[entryKey(d, habitId)]?.[field] ?? 0),
    0,
  );
}

export function topFailReasons(entries: Entries): { reason: FailReason; count: number }[] {
  const counts = new Map<FailReason, number>();
  for (const e of Object.values(entries)) {
    if (e.status === 'fallado' && e.failReason) {
      counts.set(e.failReason, (counts.get(e.failReason) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * La pregunta de investigación central: ¿despertar a tiempo arrastra a los
 * demás hábitos? Compara la tasa de éxito de `habitId` en días en que el
 * despertar se cumplió vs. días en que no.
 */
export function wakeEffect(habitId: HabitId, settings: Settings, entries: Entries) {
  const buckets = { woke: { n: 0, ok: 0 }, missed: { n: 0, ok: 0 } };
  for (const e of Object.values(entries)) {
    if (e.habitId !== habitId) continue;
    if (!isActive(habitId, e.date, settings)) continue;
    const wake = entries[entryKey(e.date, 'despertar')];
    if (!wake) continue;
    const bucket = wake.status === 'completo' ? buckets.woke : buckets.missed;
    bucket.n++;
    if (isSuccess(e)) bucket.ok++;
  }
  const rate = (b: { n: number; ok: number }) => (b.n === 0 ? null : Math.round((b.ok / b.n) * 100));
  return {
    whenWoke: rate(buckets.woke),
    whenMissed: rate(buckets.missed),
    sample: buckets.woke.n + buckets.missed.n,
  };
}
