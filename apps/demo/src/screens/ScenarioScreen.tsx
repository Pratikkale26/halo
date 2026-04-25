import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { HaloReportCard } from "../components/HaloReportCard";
import { TransactionPreview } from "../components/TransactionPreview";
import { buildAnalyzer, SCENARIOS } from "../lib/halo-mock";
import { theme } from "../theme";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Scenario">;

type Phase = "preview" | "halo-blocked" | "seed-vault" | "approved" | "rejected";

export function ScenarioScreen({ route, navigation }: Props) {
  const { scenario: scenarioKey } = route.params;
  const scenario = SCENARIOS[scenarioKey];
  const analyzer = useMemo(() => buildAnalyzer(scenarioKey), [scenarioKey]);
  const report = useMemo(() => analyzer.analyze(scenario.tx), [analyzer, scenario]);

  const [phase, setPhase] = useState<Phase>("preview");

  function handleSubmit() {
    if (report.shouldBlock) {
      setPhase("halo-blocked");
      return;
    }
    setPhase("seed-vault");
  }

  function handleSeedVaultApprove() {
    setPhase("approved");
  }

  function handleSeedVaultDecline() {
    setPhase("rejected");
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{scenario.title}</Text>
      <Text style={styles.value}>${scenario.valueUsd.toLocaleString()}</Text>

      <TransactionPreview tx={scenario.tx} userFacingDescription={scenario.description} />
      <HaloReportCard report={report} />

      {phase === "preview" && (
        <Pressable onPress={handleSubmit} style={[styles.cta, styles.ctaPrimary]}>
          <Text style={styles.ctaPrimaryText}>Submit transaction</Text>
        </Pressable>
      )}

      {phase === "halo-blocked" && (
        <View style={styles.terminalBlocked}>
          <Text style={styles.terminalLabel}>Halo blocked this transaction</Text>
          <Text style={styles.terminalBody}>
            The on-device detector found a critical drainer pattern. Seed Vault was never asked to
            sign. No funds at risk.
          </Text>
          <Pressable onPress={() => navigation.popToTop()} style={[styles.cta, styles.ctaGhost]}>
            <Text style={styles.ctaGhostText}>Back to scenarios</Text>
          </Pressable>
        </View>
      )}

      {phase === "seed-vault" && (
        <View style={styles.seedVault}>
          <Text style={styles.seedVaultLabel}>Seed Vault</Text>
          <Text style={styles.seedVaultBody}>
            Approve "{scenario.title}" with biometric? This signature happens inside the Seeker's
            secure execution environment.
          </Text>
          <View style={styles.seedVaultActions}>
            <Pressable onPress={handleSeedVaultDecline} style={[styles.cta, styles.ctaGhost, styles.flex1]}>
              <Text style={styles.ctaGhostText}>Decline</Text>
            </Pressable>
            <Pressable onPress={handleSeedVaultApprove} style={[styles.cta, styles.ctaPrimary, styles.flex1]}>
              <Text style={styles.ctaPrimaryText}>Approve with biometric</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === "approved" && (
        <View style={styles.terminalApproved}>
          <Text style={styles.terminalLabel}>Approved · attestation issued</Text>
          <Text style={styles.terminalBody}>
            Halo signed the transaction with Seed Vault and issued an on-chain SAS attestation that
            any Solana program can verify with a 5-line CPI.
          </Text>
          <Pressable
            onPress={() => Alert.alert("Demo", "In production this would broadcast to the cluster.")}
            style={[styles.cta, styles.ctaGhost]}
          >
            <Text style={styles.ctaGhostText}>Show me the attestation address</Text>
          </Pressable>
        </View>
      )}

      {phase === "rejected" && (
        <View style={styles.terminalGeneric}>
          <Text style={styles.terminalLabel}>Declined</Text>
          <Text style={styles.terminalBody}>You declined inside Seed Vault. Nothing was signed.</Text>
          <Pressable onPress={() => navigation.popToTop()} style={[styles.cta, styles.ctaGhost]}>
            <Text style={styles.ctaGhostText}>Back to scenarios</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: theme.colors.bg, flex: 1 },
  container: { padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: theme.spacing.xxl * 2 },
  title: { ...theme.text.h2, color: theme.colors.text },
  value: { ...theme.text.body, color: theme.colors.textMuted, marginTop: -theme.spacing.sm },
  cta: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  ctaPrimary: { backgroundColor: theme.colors.accent },
  ctaPrimaryText: { color: theme.colors.text, fontWeight: "700", fontSize: 15 },
  ctaGhost: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.bgElevated },
  ctaGhostText: { color: theme.colors.text, fontSize: 14, fontWeight: "500" },
  flex1: { flex: 1 },
  terminalBlocked: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  terminalApproved: {
    borderWidth: 1,
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  terminalGeneric: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  terminalLabel: {
    ...theme.text.caption,
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  terminalBody: { ...theme.text.body, color: theme.colors.text },
  seedVault: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  seedVaultLabel: {
    ...theme.text.caption,
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  seedVaultBody: { ...theme.text.body, color: theme.colors.text },
  seedVaultActions: { flexDirection: "row", gap: theme.spacing.sm },
});
