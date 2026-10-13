import type { DayType, FailReason, HabitId } from './types';

export type HabitDefinition = {
  id: HabitId;
  name: string;
  emoji: string;
  identity: string;
  /** Intención de implementación por tipo de día: "Después de X, haré Y en Z" */
  intention: Record<DayType, string>;
  fullVersion: string;
  minimalVersion: string;
  reward: string;
  /** Días en que el hábito cuenta para rachas y estadísticas */
  activeOn: DayType[];
};

export const IDENTITY = 'Soy alguien que es dueño de sus mañanas.';

export const HABITS: HabitDefinition[] = [
  {
    id: 'despertar',
    name: 'Despertar temprano',
    emoji: '☀️',
    identity: 'Me levanto con intención, no con culpa.',
    intention: {
      oficina:
        'Suena la alarma → camino hasta el celular (fuera del cuarto) → agua → luz natural 5 min.',
      remoto:
        'Suena la alarma → camino hasta el celular → agua → luz natural. No vuelvo a la cama.',
      finde: 'Misma rutina, con un margen de hasta 1 h. La cama no se negocia.',
    },
    fullVersion: 'De pie a la hora objetivo y sin posponer la alarma',
    minimalVersion: 'Pies en el piso al primer sonido, aunque sea tarde',
    reward: 'Café o música favorita, solo a esa hora',
    activeOn: ['oficina', 'remoto', 'finde'],
  },
  {
    id: 'leer',
    name: 'Leer',
    emoji: '📖',
    identity: 'Soy un lector: aprendo algo cada día.',
    intention: {
      oficina: 'Después del journaling, leo en el sillón con el café antes de salir.',
      remoto: 'Después del journaling, leo 20 min en el sillón con el café.',
      finde: 'Después del desayuno, leo 20 min (o más si fluye).',
    },
    fullVersion: '20 minutos de lectura en papel',
    minimalVersion: '1 página (o 10 min en la cama antes de dormir)',
    reward: 'Anotar 1 idea del libro',
    activeOn: ['oficina', 'remoto', 'finde'],
  },
  {
    id: 'profundo',
    name: 'Trabajo profundo',
    emoji: '🧠',
    identity: 'Hago trabajo que importa, sin distracciones.',
    intention: {
      oficina:
        'Al llegar a la oficina, antes de abrir el correo y Teams, trabajo en mi tarea definida.',
      remoto: 'Después de leer, en el escritorio y con el celular en otra habitación, hago mi bloque.',
      finde: 'Opcional: un bloque para un proyecto personal.',
    },
    fullVersion: 'Bloque completo en UNA tarea decidida de antemano',
    minimalVersion: '25 min (un pomodoro) en la tarea',
    reward: 'Marcar el entregable como hecho',
    activeOn: ['oficina', 'remoto'],
  },
];

export function getHabit(id: HabitId): HabitDefinition {
  const habit = HABITS.find((h) => h.id === id);
  if (!habit) throw new Error(`Hábito desconocido: ${id}`);
  return habit;
}

export const FAIL_REASONS: { id: FailReason; label: string }[] = [
  { id: 'dormi-tarde', label: 'Dormí tarde' },
  { id: 'cansancio', label: 'Cansancio' },
  { id: 'olvido', label: 'Olvido' },
  { id: 'imprevisto', label: 'Imprevisto' },
  { id: 'sin-ganas', label: 'Sin ganas' },
];

/** Hitos de racha con recompensa (puntos de refuerzo, no metas finales) */
export const MILESTONES = [
  { days: 3, label: 'Arranque', reward: 'Un antojo sin culpa' },
  { days: 7, label: 'Primera semana', reward: 'Un libro nuevo' },
  { days: 14, label: 'Dos semanas', reward: 'Una salida que te guste' },
  { days: 30, label: 'Un mes', reward: 'Algo que vengas postergando comprar' },
  { days: 66, label: 'Automático', reward: 'Una gran recompensa: ya es parte de ti' },
];
