import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Divider, InfoLine, ProgressBar, Row, Screen, Section } from '@/components/ui/habit-ui';
import { Spacing } from '@/constants/theme';
import { formatTime, parseTime, today, weekdayName } from '@/domain/dates';
import { HABITS, IDENTITY } from '@/domain/habits';
import { planFor } from '@/domain/schedule';
import { useTheme } from '@/hooks/use-theme';
import { useHabitStore } from '@/store/habit-store';

const WEEKDAYS = [1, 2, 3, 4, 5];

export default function PlanScreen() {
  const { settings, entries, updateSettings, resetAll } = useHabitStore();
  const theme = useTheme();
  const date = today();
  const plan = planFor(date, settings, entries);

  const start = parseTime(settings.startWake) ?? 0;
  const target = parseTime(settings.targetWake) ?? 0;
  const totalSteps = Math.ceil((start - target) / settings.wakeStepMinutes);
  const ladder = Array.from({ length: totalSteps + 1 }, (_, i) =>
    formatTime(Math.max(target, start - i * settings.wakeStepMinutes)),
  );
  const step = Math.min(plan.wakeStep, ladder.length - 1);
  const currentWake = ladder[step];
  const nextWake = ladder[step + 1];
  const weekdayBed = formatTime((parseTime(currentWake) ?? target) - settings.sleepHours * 60);

  const toggleOfficeDay = (day: number) => {
    const officeDays = settings.officeDays.includes(day)
      ? settings.officeDays.filter((d) => d !== day)
      : [...settings.officeDays, day].sort();
    updateSettings({ officeDays });
  };

  const confirmReset = () => {
    const msg = '¿Borrar todos los registros y empezar el plan de nuevo desde hoy?';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) resetAll();
      return;
    }
    Alert.alert('Empezar de nuevo', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar todo', style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <Screen title="Tu plan" subtitle={IDENTITY}>
      <Section
        title="Meta de sueño"
        description="Adelantamos tu hora poco a poco para que tu cuerpo se adapte sin sufrir.">
        <Card style={styles.goalCard}>
          <View style={styles.goalRow}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">
                Esta semana
              </ThemedText>
              <ThemedText style={styles.bigTime}>{currentWake}</ThemedText>
            </View>
            <ThemedText themeColor="textSecondary" style={styles.arrow}>
              →
            </ThemedText>
            <View style={styles.alignEnd}>
              <ThemedText type="small" themeColor="textSecondary">
                Meta
              </ThemedText>
              <ThemedText style={[styles.bigTime, { color: theme.accent }]}>{settings.targetWake}</ThemedText>
            </View>
          </View>
          <ProgressBar value={totalSteps === 0 ? 1 : step / totalSteps} />
          <ThemedText type="small" themeColor="textSecondary">
            Paso {step + 1} de {ladder.length}: {ladder.join(' · ')}
          </ThemedText>
          <Divider />
          <InfoLine label="Para avanzar">
            {nextWake
              ? `Levántate a las ${currentWake} al menos 5 de 7 días. La semana siguiente: ${nextWake}.`
              : '¡Llegaste a tu meta! Ahora solo mantenla.'}
          </InfoLine>
          <InfoLine label="Si no sale">Repites la semana. Sin castigo.</InfoLine>
          <InfoLine label="Dormir">
            Luces apagadas a las {weekdayBed} ({settings.sleepHours} h de sueño).
          </InfoLine>
          <InfoLine label="Fin de semana">
            Máximo {settings.weekendGraceMinutes} min más tarde. Así el lunes no duele.
          </InfoLine>
        </Card>
      </Section>

      <Section
        title="Días de oficina"
        description="Esos días el trabajo profundo va al llegar, antes del correo y Teams.">
        <Card>
          <Row>
            {WEEKDAYS.map((d) => (
              <Chip
                key={d}
                label={weekdayName(d)}
                selected={settings.officeDays.includes(d)}
                onPress={() => toggleOfficeDay(d)}
              />
            ))}
          </Row>
        </Card>
      </Section>

      <Section title="Cómo funciona cada hábito" description="Tu guía rápida: qué hacer, cuándo y qué pasa si el día está difícil.">
        {HABITS.map((h) => (
          <Card key={h.id}>
            <ThemedText style={styles.habitName}>
              {h.emoji} {h.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.identity}>
              “{h.identity}”
            </ThemedText>
            <Divider />
            <InfoLine label="Cuándo">{h.intention[plan.dayType]}</InfoLine>
            <InfoLine label="Meta">{h.fullVersion}</InfoLine>
            <InfoLine label="Día difícil">{h.minimalVersion}</InfoLine>
            <InfoLine label="Recompensa">{h.reward}</InfoLine>
            {h.id === 'profundo' && (
              <InfoLine label="Duración">
                {plan.deepWorkMinutes} min ahora. Sube {settings.deepWorkStepMinutes} min cada semana que lo
                cumplas, hasta {settings.deepWorkTargetMinutes}.
              </InfoLine>
            )}
          </Card>
        ))}
      </Section>

      <Pressable onPress={confirmReset} style={styles.reset}>
        <ThemedText type="small" themeColor="danger">
          Empezar el plan de nuevo
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  goalCard: { gap: Spacing.three },
  goalRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  bigTime: { fontSize: 40, lineHeight: 46, fontWeight: 800 },
  arrow: { fontSize: 28, lineHeight: 46 },
  alignEnd: { alignItems: 'flex-end' },
  habitName: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  identity: { fontStyle: 'italic' },
  reset: { alignSelf: 'center', padding: Spacing.three },
});
