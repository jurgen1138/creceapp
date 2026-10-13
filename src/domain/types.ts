export type DayType = 'oficina' | 'remoto' | 'finde';

export type HabitId = 'despertar' | 'leer' | 'profundo';

/** completo = versión completa · minimo = versión de 2 minutos (mantiene la racha) */
export type Status = 'completo' | 'minimo' | 'fallado';

export type FailReason = 'cansancio' | 'dormi-tarde' | 'olvido' | 'imprevisto' | 'sin-ganas';

/** Fecha local en formato YYYY-MM-DD */
export type DateKey = string;

export type Entry = {
  date: DateKey;
  habitId: HabitId;
  status: Status;
  failReason?: FailReason;
  /** despertar */
  wakeTime?: string; // HH:MM
  bedTime?: string; // HH:MM (noche anterior)
  energy?: number; // 1–5
  /** leer */
  pages?: number;
  idea?: string;
  /** leer + profundo */
  minutes?: number;
  /** profundo */
  task?: string;
  interruptions?: number;
  focus?: number; // 1–5
  deliverableDone?: boolean;
  updatedAt: string;
};

export type Settings = {
  /** Día en que empezó el plan; las semanas de progresión se cuentan desde aquí */
  startDate: DateKey;
  /** Días de oficina (0 = domingo … 6 = sábado) */
  officeDays: number[];
  startWake: string; // HH:MM
  targetWake: string; // HH:MM
  /** Minutos que se adelanta el despertar por cada semana lograda */
  wakeStepMinutes: number;
  /** Horas de sueño que se quieren proteger */
  sleepHours: number;
  /** Tolerancia de fin de semana (evita el "jet lag social") */
  weekendGraceMinutes: number;
  deepWorkStartMinutes: number;
  deepWorkTargetMinutes: number;
  deepWorkStepMinutes: number;
};
