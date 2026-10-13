import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HabitRow } from '@/components/habit-row';
import { HabitSheet } from '@/components/habit-sheet';
import { ThemedText } from '@/components/themed-text';
import { Card, Divider, ProgressBar, Screen, Section } from '@/components/ui/habit-ui';
import { Spacing } from '@/constants/theme';
import { formatLongDate, today } from '@/domain/dates';
import { HABITS } from '@/domain/habits';
import { DAY_TYPE_LABEL, entryKey, isSuccess, planFor } from '@/domain/schedule';
import { currentStreak, missedLastTime } from '@/domain/stats';
import type { HabitId } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';
import { useHabitStore } from '@/store/habit-store';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function TodayScreen() {
  const { settings, entries, ready, saveEntry, clearEntry } = useHabitStore();
  const theme = useTheme();
  const [openId, setOpenId] = useState<HabitId | null>(null);
  const date = today();
  const plan = planFor(date, settings, entries);

  if (!ready) return null;

  const activeHabits = HABITS.filter((h) => h.activeOn.includes(plan.dayType));
  const done = activeHabits.filter((h) => isSuccess(entries[entryKey(date, h.id)])).length;
  const openHabit = HABITS.find((h) => h.id === openId) ?? null;

  return (
    <Screen title={greeting()} subtitle={`${formatLongDate(date)} · ${DAY_TYPE_LABEL[plan.dayType]}`}>
      <Card style={styles.summary}>
        <View style={styles.timeRow}>
          <View style={[styles.timeBox, { backgroundColor: theme.accentSoft }]}>
            <ThemedText type="small" themeColor="textSecondary">
              ☀️ Despertar
            </ThemedText>
            <ThemedText style={styles.time}>{plan.wakeTarget}</ThemedText>
          </View>
          <View style={[styles.timeBox, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" themeColor="textSecondary">
              🌙 Dormir
            </ThemedText>
            <ThemedText style={styles.time}>{plan.bedTarget}</ThemedText>
          </View>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          A las {plan.windDown}: celular a cargar fuera del cuarto
          {plan.dayType === 'oficina' ? ' (y ya fuera de la oficina)' : ''}.
        </ThemedText>
      </Card>

      <Section title="Tus hábitos" description="Toca el círculo cuando lo hagas. Toca el nombre para más opciones.">
        <Card>
          <View style={styles.progressHeader}>
            <ThemedText type="smallBold">
              {done === activeHabits.length ? '¡Día completo! 🎉' : `${done} de ${activeHabits.length} hechos`}
            </ThemedText>
          </View>
          <ProgressBar value={done / activeHabits.length} color="success" />
          {HABITS.map((habit, i) => {
            const entry = entries[entryKey(date, habit.id)];
            return (
              <View key={habit.id}>
                {i > 0 && <Divider />}
                <HabitRow
                  habit={habit}
                  plan={plan}
                  entry={entry}
                  streak={currentStreak(habit.id, date, settings, entries)}
                  missedLastTime={missedLastTime(habit.id, date, settings, entries)}
                  onToggle={() =>
                    entry ? clearEntry(date, habit.id) : saveEntry(date, habit.id, { status: 'completo' })
                  }
                  onOpen={() => setOpenId(habit.id)}
                />
              </View>
            );
          })}
        </Card>
      </Section>

      <HabitSheet
        habit={openHabit}
        date={date}
        plan={plan}
        entry={openId ? entries[entryKey(date, openId)] : undefined}
        onClose={() => setOpenId(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: Spacing.three },
  timeRow: { flexDirection: 'row', gap: Spacing.two },
  timeBox: { flex: 1, borderRadius: 16, padding: Spacing.three, gap: 2 },
  time: { fontSize: 32, lineHeight: 38, fontWeight: 800 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
});
