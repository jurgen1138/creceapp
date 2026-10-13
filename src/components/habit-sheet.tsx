import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Chip, Divider, Field, Row, Scale } from '@/components/ui/habit-ui';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { FAIL_REASONS, type HabitDefinition } from '@/domain/habits';
import type { DayPlan } from '@/domain/schedule';
import type { DateKey, Entry, Status } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';
import { useHabitStore } from '@/store/habit-store';

type Props = {
  habit: HabitDefinition | null;
  date: DateKey;
  plan: DayPlan;
  entry?: Entry;
  onClose: () => void;
};

export function HabitSheet({ habit, date, plan, entry, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { saveEntry, clearEntry } = useHabitStore();

  if (!habit) return null;

  const save = (patch: Partial<Entry>) => saveEntry(date, habit.id, patch);
  const setStatus = (status: Status) =>
    entry?.status === status ? clearEntry(date, habit.id) : save({ status });

  const options: { id: Status; title: string; detail: string; color: ThemeColor; soft: ThemeColor }[] = [
    { id: 'completo', title: '✓  Lo hice', detail: habit.fullVersion, color: 'success', soft: 'successSoft' },
    {
      id: 'minimo',
      title: '½  Hice lo mínimo',
      detail: `${habit.minimalVersion}. Cuenta para tu racha.`,
      color: 'partial',
      soft: 'partialSoft',
    },
    { id: 'fallado', title: '✕  No lo hice', detail: 'Anotarlo también es avanzar.', color: 'danger', soft: 'dangerSoft' },
  ];

  const num = (v?: number) => (v === undefined ? '' : String(v));
  const toNum = (t: string) => {
    const n = parseInt(t, 10);
    return Number.isNaN(n) ? undefined : n;
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
        pointerEvents="box-none">
        <ThemedView
          type="backgroundElement"
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.titleBlock}>
              <ThemedText style={styles.title}>
                {habit.emoji} {habit.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {habit.intention[plan.dayType]}
              </ThemedText>
            </View>

            <View style={styles.options}>
              {options.map((o) => {
                const selected = entry?.status === o.id;
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => setStatus(o.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: selected ? theme[o.soft] : theme.background,
                        borderColor: selected ? theme[o.color] : 'transparent',
                      },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText style={[styles.optionTitle, selected && { color: theme[o.color] }]}>
                      {o.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {o.detail}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {entry?.status === 'completo' && (
              <ThemedText type="small" themeColor="success">
                🎁 Te ganaste tu recompensa: {habit.reward.toLowerCase()}
              </ThemedText>
            )}

            {entry?.status === 'fallado' && (
              <View style={styles.group}>
                <ThemedText type="smallBold">¿Qué pasó?</ThemedText>
                <Row>
                  {FAIL_REASONS.map((r) => (
                    <Chip
                      key={r.id}
                      label={r.label}
                      color="danger"
                      selected={entry.failReason === r.id}
                      onPress={() => save({ failReason: r.id })}
                    />
                  ))}
                </Row>
              </View>
            )}

            {entry && entry.status !== 'fallado' && (
              <>
                <Divider />
                <View style={styles.group}>
                  <ThemedText type="smallBold">Detalles (opcional)</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Con estos datos la app te muestra patrones en Progreso.
                  </ThemedText>
                </View>

                {habit.id === 'despertar' && (
                  <>
                    <Row>
                      <Field
                        label="Me levanté a las"
                        placeholder="09:00"
                        value={entry.wakeTime ?? ''}
                        onChangeText={(t) => save({ wakeTime: t })}
                      />
                      <Field
                        label="Anoche me dormí a las"
                        placeholder="00:30"
                        value={entry.bedTime ?? ''}
                        onChangeText={(t) => save({ bedTime: t })}
                      />
                    </Row>
                    <Scale
                      label="¿Con cuánta energía? (1 = nada, 5 = mucha)"
                      value={entry.energy}
                      onChange={(v) => save({ energy: v })}
                    />
                  </>
                )}

                {habit.id === 'leer' && (
                  <>
                    <Row>
                      <Field
                        label="Minutos"
                        keyboardType="number-pad"
                        value={num(entry.minutes)}
                        onChangeText={(t) => save({ minutes: toNum(t) })}
                      />
                      <Field
                        label="Páginas"
                        keyboardType="number-pad"
                        value={num(entry.pages)}
                        onChangeText={(t) => save({ pages: toNum(t) })}
                      />
                    </Row>
                    <Field
                      label="Una idea que te llevas"
                      multiline
                      value={entry.idea ?? ''}
                      onChangeText={(t) => save({ idea: t })}
                    />
                  </>
                )}

                {habit.id === 'profundo' && (
                  <>
                    <Field
                      label="¿En qué trabajaste?"
                      value={entry.task ?? ''}
                      onChangeText={(t) => save({ task: t })}
                    />
                    <Row>
                      <Field
                        label="Minutos reales"
                        keyboardType="number-pad"
                        value={num(entry.minutes)}
                        onChangeText={(t) => save({ minutes: toNum(t) })}
                      />
                      <Field
                        label="Interrupciones"
                        keyboardType="number-pad"
                        value={num(entry.interruptions)}
                        onChangeText={(t) => save({ interruptions: toNum(t) })}
                      />
                    </Row>
                    <Scale
                      label="¿Qué tan concentrado? (1 = nada, 5 = total)"
                      value={entry.focus}
                      onChange={(v) => save({ focus: v })}
                    />
                    <Row>
                      <Chip
                        label={entry.deliverableDone ? '✓ Terminé lo que me propuse' : '¿Terminaste lo que te propusiste?'}
                        color="success"
                        selected={entry.deliverableDone}
                        onPress={() => save({ deliverableDone: !entry.deliverableDone })}
                      />
                    </Row>
                  </>
                )}
              </>
            )}

            <Button label="Listo" onPress={onClose} />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.two,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: Spacing.two },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two, gap: Spacing.three },
  titleBlock: { gap: Spacing.one },
  title: { fontSize: 24, lineHeight: 30, fontWeight: 800 },
  options: { gap: Spacing.two },
  option: { borderRadius: 16, borderWidth: 2, padding: Spacing.three, gap: 2 },
  optionTitle: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  group: { gap: Spacing.two },
  pressed: { opacity: 0.7 },
});
