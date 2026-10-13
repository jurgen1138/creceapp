import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Divider, ProgressBar, Row, Screen, Section } from '@/components/ui/habit-ui';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { daysBetween, fromDateKey, today } from '@/domain/dates';
import { FAIL_REASONS, HABITS, MILESTONES } from '@/domain/habits';
import { entryKey } from '@/domain/schedule';
import {
  averageWakeTime,
  bestStreak,
  consistency,
  currentStreak,
  lastDays,
  sumField,
  topFailReasons,
  wakeEffect,
} from '@/domain/stats';
import { useTheme } from '@/hooks/use-theme';
import { useHabitStore } from '@/store/habit-store';

const MIN_DAYS_FOR_INSIGHTS = 10;

export default function ProgressScreen() {
  const { settings, entries } = useHabitStore();
  const theme = useTheme();
  const date = today();
  const days = lastDays(date, 28);
  const daysTracked = daysBetween(settings.startDate, date) + 1;

  const streaks = HABITS.map((h) => ({
    habit: h,
    current: currentStreak(h.id, date, settings, entries),
    best: bestStreak(h.id, date, settings, entries),
    week: consistency(h.id, date, 7, settings, entries),
  }));
  const leader = streaks.reduce((a, b) => (b.current > a.current ? b : a));
  const nextMilestone = MILESTONES.find((m) => m.days > leader.current);
  const prevMilestoneDays = [...MILESTONES].reverse().find((m) => m.days <= leader.current)?.days ?? 0;
  const bestEver = Math.max(...streaks.map((s) => s.best));

  const readEffect = wakeEffect('leer', settings, entries);
  const deepEffect = wakeEffect('profundo', settings, entries);
  const failReasons = topFailReasons(entries);

  const cellColor = (status?: string): string =>
    status === 'completo'
      ? theme.success
      : status === 'minimo'
        ? theme.partial
        : status === 'fallado'
          ? theme.danger
          : theme.backgroundSelected;

  return (
    <Screen title="Progreso" subtitle={`Día ${daysTracked} de tu plan`}>
      <Section title="Esta semana" description="Lo que lograste en los últimos 7 días.">
        <Row style={styles.tiles}>
          <Tile label="Despertar promedio" value={averageWakeTime(date, 7, entries) ?? '—'} color="accentSoft" />
          <Tile label="Minutos leyendo" value={String(sumField('leer', 'minutes', date, 7, entries))} color="successSoft" />
          <Tile label="Minutos de foco" value={String(sumField('profundo', 'minutes', date, 7, entries))} color="partialSoft" />
        </Row>
      </Section>

      <Section title="Rachas" description="Días seguidos cumpliendo. Hacer lo mínimo también cuenta.">
        <Card>
          {streaks.map((s, i) => (
            <View key={s.habit.id}>
              {i > 0 && <Divider />}
              <View style={styles.streakRow}>
                <View style={styles.streakText}>
                  <ThemedText style={styles.habitName}>
                    {s.habit.emoji} {s.habit.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Récord: {s.best} {s.best === 1 ? 'día' : 'días'}
                    {s.week !== null ? ` · Esta semana: ${s.week}%` : ''}
                  </ThemedText>
                </View>
                <View style={styles.streakNumber}>
                  <ThemedText style={styles.bigNumber}>{s.current}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    🔥 días
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Próxima recompensa" description="Se desbloquean con tu racha más larga en curso.">
        <Card>
          {nextMilestone ? (
            <>
              <ThemedText style={styles.habitName}>🎁 {nextMilestone.reward}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Llega a {nextMilestone.days} días seguidos. Vas en {leader.current} con{' '}
                {leader.habit.name.toLowerCase()}.
              </ThemedText>
              <ProgressBar
                value={(leader.current - prevMilestoneDays) / (nextMilestone.days - prevMilestoneDays)}
              />
            </>
          ) : (
            <ThemedText style={styles.habitName}>🏆 ¡Desbloqueaste todas las recompensas!</ThemedText>
          )}
          <Divider />
          {MILESTONES.map((m) => {
            const unlocked = bestEver >= m.days;
            return (
              <View key={m.days} style={styles.milestone}>
                <ThemedText type="small" style={styles.milestoneDays} themeColor={unlocked ? 'success' : 'textSecondary'}>
                  {unlocked ? '✓' : '🔒'} {m.days} días
                </ThemedText>
                <ThemedText type="small" themeColor={unlocked ? 'text' : 'textSecondary'} style={styles.flex}>
                  {m.reward}
                </ThemedText>
              </View>
            );
          })}
        </Card>
      </Section>

      <Section title="Últimas 4 semanas" description="Cada cuadro es un día; la fila termina hoy.">
        <Card>
          <Row style={styles.legend}>
            <Legend color={theme.success} label="Lo hice" />
            <Legend color={theme.partial} label="Lo mínimo" />
            <Legend color={theme.danger} label="No" />
            <Legend color={theme.backgroundSelected} label="Sin dato" />
          </Row>
          {HABITS.map((habit) => (
            <View key={habit.id} style={styles.gridBlock}>
              <ThemedText type="smallBold">
                {habit.emoji} {habit.name}
              </ThemedText>
              <View style={styles.grid}>
                {days.map((d) => {
                  const status = entries[entryKey(d, habit.id)]?.status;
                  return (
                    <View
                      key={d}
                      accessibilityLabel={`${d}: ${status ?? 'sin registro'}`}
                      style={[
                        styles.cell,
                        { backgroundColor: cellColor(status) },
                        fromDateKey(d).getDay() === 1 && styles.weekStart,
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Descubrimientos" description="Patrones que salen de tus propios datos.">
        <Card>
          {readEffect.sample + deepEffect.sample < MIN_DAYS_FOR_INSIGHTS ? (
            <>
              <ThemedText type="smallBold">🔬 Recolectando datos…</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Con unos {MIN_DAYS_FOR_INSIGHTS} días registrados te mostraré, por ejemplo, si despertar a
                tiempo hace que leas y te concentres más.
              </ThemedText>
            </>
          ) : (
            <>
              <Insight
                title="Cuando despiertas a tiempo, lees más seguido"
                a={readEffect.whenWoke}
                b={readEffect.whenMissed}
              />
              <Divider />
              <Insight
                title="…y haces más trabajo profundo"
                a={deepEffect.whenWoke}
                b={deepEffect.whenMissed}
              />
            </>
          )}
          {failReasons.length > 0 && (
            <>
              <Divider />
              <ThemedText type="small">
                Lo que más te frena:{' '}
                <ThemedText type="smallBold">
                  {FAIL_REASONS.find((r) => r.id === failReasons[0].reason)?.label.toLowerCase()}
                </ThemedText>{' '}
                ({failReasons[0].count} {failReasons[0].count === 1 ? 'vez' : 'veces'})
              </ThemedText>
            </>
          )}
        </Card>
      </Section>
    </Screen>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color: ThemeColor }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme[color] }]}>
      <ThemedText style={styles.tileValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function Insight({ title, a, b }: { title: string; a: number | null; b: number | null }) {
  const fmt = (v: number | null) => (v === null ? '—' : `${v}%`);
  return (
    <View style={styles.insight}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Días que despertaste a tiempo: {fmt(a)} · Días que no: {fmt(b)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexWrap: 'nowrap' },
  tile: { flex: 1, borderRadius: 16, padding: Spacing.three, gap: 2 },
  tileValue: { fontSize: 26, lineHeight: 32, fontWeight: 800 },
  streakRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.one },
  streakText: { flex: 1, gap: 2 },
  streakNumber: { alignItems: 'center', minWidth: 56 },
  bigNumber: { fontSize: 30, lineHeight: 34, fontWeight: 800 },
  habitName: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  milestone: { flexDirection: 'row', gap: Spacing.two },
  milestoneDays: { width: 80 },
  flex: { flex: 1 },
  legend: { gap: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  gridBlock: { gap: Spacing.one, marginTop: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 16, height: 16, borderRadius: 4 },
  weekStart: { marginLeft: Spacing.two },
  insight: { gap: 2 },
});
