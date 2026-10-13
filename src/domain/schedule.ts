import { addDays, daysBetween, formatTime, fromDateKey, parseTime } from './dates';
import { getHabit } from './habits';
import type { DateKey, DayType, Entry, HabitId, Settings } from './types';

export const DEFAULT_SETTINGS: Omit<Settings, 'startDate'> = {
  officeDays: [2, 4], // martes y jueves; se puede editar en "Plan"
  startWake: '09:00',
  targetWake: '06:00',
  wakeStepMinutes: 30,
  sleepHours: 8,
  weekendGraceMinutes: 60,
  deepWorkStartMinutes: 45,
  deepWorkTargetMinutes: 90,
  deepWorkStepMinutes: 15,
};

/** Consistencia semanal (versión completa) necesaria para avanzar un paso: 5 de 7, 4 de 5 */
export const ADVANCE_RATIO = 0.7;

export function dayType(date: DateKey, settings: Settings): DayType {
  const weekday = fromDateKey(date).getDay();
  if (weekday === 0 || weekday === 6) return 'finde';
  return settings.officeDays.includes(weekday) ? 'oficina' : 'remoto';
}

export function isSuccess(entry: Entry | undefined): boolean {
  return entry?.status === 'completo' || entry?.status === 'minimo';
}

/**
 * Cuántas semanas completas se lograron para un hábito desde el inicio del plan.
 * La progresión solo avanza cuando la semana anterior fue sólida: el ritmo lo
 * marca la consistencia real, no el calendario.
 */
function earnedSteps(
  habitId: HabitId,
  date: DateKey,
  settings: Settings,
  entries: Record<string, Entry>,
): number {
  const fullWeeks = Math.floor(daysBetween(settings.startDate, date) / 7);
  const activeOn = getHabit(habitId).activeOn;
  let steps = 0;
  for (let w = 0; w < fullWeeks; w++) {
    let successes = 0;
    let activeDays = 0;
    for (let d = 0; d < 7; d++) {
      const key = addDays(settings.startDate, w * 7 + d);
      if (!activeOn.includes(dayType(key, settings))) continue;
      activeDays++;
      if (entries[entryKey(key, habitId)]?.status === 'completo') successes++;
    }
    if (activeDays > 0 && successes >= Math.ceil(activeDays * ADVANCE_RATIO)) steps++;
  }
  return steps;
}

export type DayPlan = {
  dayType: DayType;
  wakeTarget: string;
  bedTarget: string;
  windDown: string;
  deepWorkMinutes: number;
  wakeStep: number;
  isFinalWake: boolean;
};

export function planFor(date: DateKey, settings: Settings, entries: Record<string, Entry>): DayPlan {
  const type = dayType(date, settings);
  const start = parseTime(settings.startWake) ?? 9 * 60;
  const target = parseTime(settings.targetWake) ?? 6 * 60;

  const wakeStep = earnedSteps('despertar', date, settings, entries);
  let wake = Math.max(target, start - wakeStep * settings.wakeStepMinutes);
  if (type === 'finde') wake += settings.weekendGraceMinutes;

  const bed = wake - settings.sleepHours * 60;

  const deepStep = earnedSteps('profundo', date, settings, entries);
  const deepWorkMinutes = Math.min(
    settings.deepWorkTargetMinutes,
    settings.deepWorkStartMinutes + deepStep * settings.deepWorkStepMinutes,
  );

  return {
    dayType: type,
    wakeTarget: formatTime(wake),
    bedTarget: formatTime(bed),
    windDown: formatTime(bed - 60),
    deepWorkMinutes,
    wakeStep,
    isFinalWake: wake - (type === 'finde' ? settings.weekendGraceMinutes : 0) <= target,
  };
}

export function entryKey(date: DateKey, habitId: HabitId): string {
  return `${date}:${habitId}`;
}

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  oficina: 'Día de oficina',
  remoto: 'Teletrabajo',
  finde: 'Fin de semana',
};
