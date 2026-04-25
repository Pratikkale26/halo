import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DecodedTransaction } from "@halo/detector";
import { theme } from "../theme";

interface Props {
  tx: DecodedTransaction;
  /** What the dApp tells the user. May or may not match the actual instructions. */
  userFacingDescription: string;
}

/** Shows the user-facing description on top + the actual decoded instructions. */
export function TransactionPreview({ tx, userFacingDescription }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.section}>
        <Text style={styles.label}>What the dApp says</Text>
        <Text style={styles.descriptionText}>{userFacingDescription}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.label}>What this transaction actually does</Text>
        {tx.instructions.map((ix) => (
          <View key={ix.index} style={styles.ix}>
            <Text style={styles.ixIndex}>#{ix.index}</Text>
            <View style={styles.ixBody}>
              <Text style={styles.ixName}>{ix.name ?? "<unknown instruction>"}</Text>
              <Text style={styles.ixProgram} numberOfLines={1}>
                program: {ix.programId.slice(0, 8)}…{ix.programId.slice(-4)}
              </Text>
              <Text style={styles.ixAccounts} numberOfLines={2}>
                accounts: {ix.accounts.length}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.bgElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  section: { gap: theme.spacing.sm },
  label: {
    ...theme.text.caption,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  descriptionText: { ...theme.text.body, color: theme.colors.text, fontWeight: "500" },
  divider: { height: 1, backgroundColor: theme.colors.border },
  ix: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  ixIndex: { color: theme.colors.textMuted, fontFamily: "Menlo", fontSize: 12, width: 24 },
  ixBody: { flex: 1, gap: 2 },
  ixName: { color: theme.colors.text, fontFamily: "Menlo", fontSize: 13 },
  ixProgram: { color: theme.colors.textMuted, fontFamily: "Menlo", fontSize: 11 },
  ixAccounts: { color: theme.colors.textMuted, fontFamily: "Menlo", fontSize: 11 },
});
