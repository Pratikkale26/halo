import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Report } from "@halo/detector";
import { theme } from "../theme";

interface Props {
  report: Report;
}

const SEVERITY_COLOR: Record<string, string> = {
  info: theme.colors.textMuted,
  warning: theme.colors.warning,
  critical: theme.colors.danger,
};

export function HaloReportCard({ report }: Props) {
  const tone = report.shouldBlock
    ? { bg: theme.colors.dangerSoft, border: theme.colors.danger, label: "BLOCKED" }
    : report.findings.length > 0
      ? { bg: theme.colors.bgElevated, border: theme.colors.warning, label: "REVIEW" }
      : { bg: theme.colors.successSoft, border: theme.colors.success, label: "SAFE" };

  return (
    <View style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>Halo report</Text>
        <View style={[styles.statusPill, { borderColor: tone.border }]}>
          <Text style={[styles.statusText, { color: tone.border }]}>{tone.label}</Text>
        </View>
      </View>
      <View style={styles.scoreRow}>
        <Text style={styles.score}>{report.riskScore}</Text>
        <Text style={styles.scoreSuffix}>/ 100 risk</Text>
      </View>

      {report.findings.length === 0 ? (
        <Text style={styles.empty}>No suspicious patterns detected.</Text>
      ) : (
        <View style={styles.findings}>
          {report.findings.map((f, i) => (
            <View key={i} style={styles.finding}>
              <Text style={[styles.findingTitle, { color: SEVERITY_COLOR[f.severity] }]}>
                {f.severity.toUpperCase()} · {f.ruleId}
              </Text>
              <Text style={styles.findingReason}>{f.reason}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLabel: {
    ...theme.text.caption,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  statusText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  scoreRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  score: { color: theme.colors.text, fontSize: 36, fontWeight: "700" },
  scoreSuffix: { color: theme.colors.textMuted, fontSize: 14 },
  empty: { color: theme.colors.textMuted, ...theme.text.body },
  findings: { gap: theme.spacing.md },
  finding: { gap: 4 },
  findingTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6 },
  findingReason: { color: theme.colors.text, ...theme.text.body },
});
