import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

interface Props {
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  cta: string;
  onPress: () => void;
}

export function ScenarioCard({ badge, badgeColor, title, description, cta, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>{cta} →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cardPressed: { opacity: 0.85 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  title: { ...theme.text.h3, color: theme.colors.text },
  description: { ...theme.text.body, color: theme.colors.textMuted },
  cta: { marginTop: theme.spacing.sm },
  ctaText: { color: theme.colors.accent, fontSize: 14, fontWeight: "600" },
});
