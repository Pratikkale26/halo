import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScenarioCard } from "../components/ScenarioCard";
import { theme } from "../theme";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Halo</Text>
        <Text style={styles.subtitle}>
          Hardware-attested transaction defense for Solana — built on the Seeker's Seed Vault.
        </Text>
      </View>

      <View style={styles.intro}>
        <Text style={styles.introTitle}>Two scenarios. Same wallet.</Text>
        <Text style={styles.introBody}>
          The first scenario is an honest Kamino deposit. The second is a drainer dApp dressed as
          an "airdrop." Watch what Halo's on-device detector sees that a server-side simulator
          would miss.
        </Text>
      </View>

      <ScenarioCard
        badge="HONEST"
        badgeColor={theme.colors.successSoft}
        title="Deposit 5,000 USDC into Kamino"
        description="Standard transfer + deposit. No suspicious patterns. Halo passes it through to Seed Vault for biometric approval."
        cta="Run scenario"
        onPress={() => navigation.navigate("Scenario", { scenario: "honestDeposit" })}
      />

      <ScenarioCard
        badge="DRAINER"
        badgeColor={theme.colors.dangerSoft}
        title="Claim free SOL airdrop"
        description="Looks like an airdrop. Hidden inside: a system_program::Assign that hands your token account to an attacker. Halo blocks it before Seed Vault even prompts."
        cta="Run scenario"
        onPress={() => navigation.navigate("Scenario", { scenario: "drainerBlink" })}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built for the Solana Mobile Builder Grant. Source: github.com/Pratikkale26/vaultguard
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: theme.colors.bg, flex: 1 },
  container: { padding: theme.spacing.xl, gap: theme.spacing.xl, paddingBottom: theme.spacing.xxl * 2 },
  header: { gap: theme.spacing.sm },
  title: { ...theme.text.h1, color: theme.colors.text, fontSize: 38, letterSpacing: -0.6 },
  subtitle: { ...theme.text.body, color: theme.colors.textMuted },
  intro: { gap: theme.spacing.sm },
  introTitle: { ...theme.text.h3, color: theme.colors.text },
  introBody: { ...theme.text.body, color: theme.colors.textMuted },
  footer: { paddingTop: theme.spacing.lg, alignItems: "center" },
  footerText: { color: theme.colors.textMuted, fontSize: 12, textAlign: "center" },
});
