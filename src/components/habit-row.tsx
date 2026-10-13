import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { HabitDefinition } from '@/domain/habits';
import type { DayPlan } from '@/domain/schedule';
import type { Entry } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';

export function habitSummary(habit: HabitDefinition, plan: DayPlan): string {
  if (!habit.activeOn.includes(plan.dayType)) return 'Opcional hoy';
  switch (habit.id) {
    case 'despertar':
      return `De pie a las ${plan.wakeTarget}`;
    case 'leer':
      return '20 min · en un mal día, 1 página';
    case 'profundo':
      return `${plan.deepWorkMinutes} min en una sola tarea`;
  }
}

type Props = {
  habit: HabitDefinition;
  plan: DayPlan;
  entry?: Entry;
  streak: number;
  missedLastTime: boolean;
  onToggle: () => void;
  onOpen: () => void;
};

export function HabitRow({ habit, plan, entry, streak, missedLastTime, onToggle, onOpen }: Props) {
  const theme = useTheme();
  const status = entry?.status;
  const active = habit.activeOn.includes(plan.dayType);

  const circle =
    status === 'completo'
      ? { bg: theme.success, border: theme.success, icon: '✓' }
      : status === 'minimo'
        ? { bg: theme.partial, border: theme.partial, icon: '½' }
        : status === 'fallado'
          ? { bg: theme.danger, border: theme.danger, icon: '✕' }
          : { bg: 'transparent', border: theme.backgroundSelected, icon: '' };

  const note =
    status === 'minimo'
      ? 'Hiciste lo mínimo: la racha sigue'
      : status === 'fallado'
        ? 'No pasa nada: mañana con lo mínimo basta'
        : missedLastTime && active && !status
          ? 'Ayer no salió: hoy basta con lo mínimo'
          : null;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: status === 'completo' }}
        accessibilityLabel={`Marcar ${habit.name} como hecho`}
        style={({ pressed }) => [
          styles.circle,
          { backgroundColor: circle.bg, borderColor: circle.border },
          pressed && styles.pressed,
        ]}>
        <ThemedText style={[styles.circleIcon, { color: theme.onAccent }]}>{circle.icon}</ThemedText>
      </Pressable>

      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityHint="Abre opciones y detalles">
        <View style={styles.text}>
          <ThemedText style={styles.name}>
            {habit.emoji} {habit.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {habitSummary(habit, plan)}
          </ThemedText>
          {note && (
            <ThemedText type="small" themeColor={status === 'fallado' ? 'danger' : 'partial'}>
              {note}
            </ThemedText>
          )}
        </View>
        <View style={styles.right}>
          {streak > 0 && <ThemedText type="smallBold">🔥 {streak}</ThemedText>}
          <ThemedText themeColor="textSecondary" style={styles.chevron}>
            ›
          </ThemedText>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIcon: { fontSize: 18, lineHeight: 22, fontWeight: 800 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  text: { flex: 1, gap: 2 },
  name: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chevron: { fontSize: 26, lineHeight: 28 },
  pressed: { opacity: 0.6 },
});
