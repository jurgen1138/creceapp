import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { today } from '@/domain/dates';
import { DEFAULT_SETTINGS, entryKey } from '@/domain/schedule';
import type { DateKey, Entry, HabitId, Settings } from '@/domain/types';

/**
 * Persistencia local (v1). Cuando la app pase a multiusuario, este provider es
 * el único lugar que cambia: se reemplaza AsyncStorage por Supabase/otro backend
 * manteniendo la misma interfaz.
 */
const STORAGE_KEY = 'habitos:v1';

type PersistedState = {
  settings: Settings;
  entries: Record<string, Entry>;
};

type HabitStore = PersistedState & {
  ready: boolean;
  saveEntry: (date: DateKey, habitId: HabitId, patch: Partial<Omit<Entry, 'date' | 'habitId'>>) => void;
  clearEntry: (date: DateKey, habitId: HabitId) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const HabitStoreContext = createContext<HabitStore | null>(null);

function initialState(): PersistedState {
  return { settings: { ...DEFAULT_SETTINGS, startDate: today() }, entries: {} };
}

export function HabitStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as PersistedState;
        setState({
          settings: { ...initialState().settings, ...saved.settings },
          entries: saved.entries ?? {},
        });
      })
      .catch((err) => console.warn('No se pudo cargar el estado guardado', err))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err) =>
      console.warn('No se pudo guardar el estado', err),
    );
  }, [state, ready]);

  const saveEntry = useCallback<HabitStore['saveEntry']>((date, habitId, patch) => {
    setState((s) => {
      const key = entryKey(date, habitId);
      const prev = s.entries[key];
      const next: Entry = {
        ...prev,
        ...patch,
        status: patch.status ?? prev?.status ?? 'completo',
        date,
        habitId,
        updatedAt: new Date().toISOString(),
      };
      if (next.status !== 'fallado') delete next.failReason;
      return { ...s, entries: { ...s.entries, [key]: next } };
    });
  }, []);

  const clearEntry = useCallback<HabitStore['clearEntry']>((date, habitId) => {
    setState((s) => {
      const entries = { ...s.entries };
      delete entries[entryKey(date, habitId)];
      return { ...s, entries };
    });
  }, []);

  const updateSettings = useCallback<HabitStore['updateSettings']>((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetAll = useCallback(() => setState(initialState()), []);

  return (
    <HabitStoreContext.Provider
      value={{ ...state, ready, saveEntry, clearEntry, updateSettings, resetAll }}>
      {children}
    </HabitStoreContext.Provider>
  );
}

export function useHabitStore(): HabitStore {
  const ctx = useContext(HabitStoreContext);
  if (!ctx) throw new Error('useHabitStore debe usarse dentro de <HabitStoreProvider>');
  return ctx;
}
