import { describe, expect, it } from "vitest";

import { Analyzer } from "../src/analyzer.js";
import {
  ASSOCIATED_TOKEN_PROGRAM,
  SPL_TOKEN_PROGRAM,
  SYSTEM_PROGRAM,
  TOKEN_2022_PROGRAM,
} from "../src/constants.js";
import {
  PROGRAMS,
  assignAttackTx,
  blinksBaitTx,
  cleanDepositTx,
  durableNonceTx,
  expectedApprovalTx,
  hiddenApprovalTx,
  transferHookAbuseTx,
} from "./fixtures.js";

const KAMINO_ALLOWED_CONFIG = {
  allowedPrograms: [
    SYSTEM_PROGRAM,
    SPL_TOKEN_PROGRAM,
    TOKEN_2022_PROGRAM,
    ASSOCIATED_TOKEN_PROGRAM,
    PROGRAMS.KAMINO_PROGRAM,
  ],
  blinksContext: {
    description: "Deposit 5,000 USDC into Kamino main market",
    expectedRecipientPrograms: [PROGRAMS.KAMINO_PROGRAM],
  },
};

describe("Analyzer — clean transactions", () => {
  it("emits no findings for a normal Kamino deposit", () => {
    const analyzer = new Analyzer(KAMINO_ALLOWED_CONFIG);
    const report = analyzer.analyze(cleanDepositTx);

    expect(report.shouldBlock).toBe(false);
    expect(report.findings).toHaveLength(0);
    expect(report.riskScore).toBe(0);
  });
});

describe("Analyzer — assign-attack rule", () => {
  it("flags an Assign-to-attacker as critical and blocks", () => {
    const analyzer = new Analyzer(KAMINO_ALLOWED_CONFIG);
    const report = analyzer.analyze(assignAttackTx);

    const finding = report.findings.find((f) => f.ruleId === "assign-attack");
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("critical");
    expect(report.shouldBlock).toBe(true);
    expect((finding!.evidence as { newOwner: string }).newOwner).toBe(
      PROGRAMS.ATTACKER_PROGRAM,
    );
  });

  it("does not flag Assign to an allow-listed program", () => {
    const analyzer = new Analyzer({
      ...KAMINO_ALLOWED_CONFIG,
      allowedPrograms: [
        ...KAMINO_ALLOWED_CONFIG.allowedPrograms,
        PROGRAMS.ATTACKER_PROGRAM, // imagine the dApp legitimately uses this program
      ],
    });
    const report = analyzer.analyze(assignAttackTx);
    const finding = report.findings.find((f) => f.ruleId === "assign-attack");
    expect(finding).toBeUndefined();
  });
});

describe("Analyzer — hidden-token-approval rule", () => {
  it("flags a hidden Approve when the description doesn't mention it", () => {
    const analyzer = new Analyzer(KAMINO_ALLOWED_CONFIG);
    const report = analyzer.analyze(hiddenApprovalTx);

    const finding = report.findings.find(
      (f) => f.ruleId === "hidden-token-approval",
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("critical");
    expect(report.shouldBlock).toBe(true);
  });

  it("does not flag an Approve when description includes 'approve'", () => {
    const analyzer = new Analyzer({
      ...KAMINO_ALLOWED_CONFIG,
      blinksContext: {
        description: "Approve Kamino to spend up to 5,000 USDC",
        expectedRecipientPrograms: [PROGRAMS.KAMINO_PROGRAM],
      },
    });
    const report = analyzer.analyze(expectedApprovalTx);
    const finding = report.findings.find(
      (f) => f.ruleId === "hidden-token-approval",
    );
    expect(finding).toBeUndefined();
  });
});

describe("Analyzer — transfer-hook-abuse rule", () => {
  it("flags Token-2022 transfer with non-allowlisted hook program", () => {
    const analyzer = new Analyzer(KAMINO_ALLOWED_CONFIG);
    const report = analyzer.analyze(transferHookAbuseTx);

    const finding = report.findings.find(
      (f) => f.ruleId === "transfer-hook-abuse",
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("critical");
    expect((finding!.evidence as { hookProgram: string }).hookProgram).toBe(
      PROGRAMS.ATTACKER_PROGRAM,
    );
  });

  it("does not flag when the hook program is allow-listed", () => {
    const analyzer = new Analyzer({
      ...KAMINO_ALLOWED_CONFIG,
      allowedPrograms: [
        ...KAMINO_ALLOWED_CONFIG.allowedPrograms,
        PROGRAMS.ATTACKER_PROGRAM,
      ],
    });
    const report = analyzer.analyze(transferHookAbuseTx);
    const finding = report.findings.find(
      (f) => f.ruleId === "transfer-hook-abuse",
    );
    expect(finding).toBeUndefined();
  });
});

describe("Analyzer — durable-nonce-abuse rule", () => {
  it("emits a warning when the tx uses a durable nonce", () => {
    const analyzer = new Analyzer(KAMINO_ALLOWED_CONFIG);
    const report = analyzer.analyze(durableNonceTx);

    const finding = report.findings.find(
      (f) => f.ruleId === "durable-nonce-abuse",
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("warning");
    // Warnings alone shouldn't block.
    expect(report.shouldBlock).toBe(false);
  });
});

describe("Analyzer — blinks-mismatch rule", () => {
  it("flags when the tx touches a program the description didn't imply", () => {
    const analyzer = new Analyzer(KAMINO_ALLOWED_CONFIG);
    const report = analyzer.analyze(blinksBaitTx);

    const finding = report.findings.find(
      (f) => f.ruleId === "blinks-mismatch",
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("critical");
    expect(
      (finding!.evidence as { unexpectedPrograms: string[] }).unexpectedPrograms,
    ).toContain(PROGRAMS.ATTACKER_PROGRAM);
  });

  it("does not flag when no Blinks context is provided", () => {
    const analyzer = new Analyzer({
      allowedPrograms: KAMINO_ALLOWED_CONFIG.allowedPrograms,
    });
    const report = analyzer.analyze(blinksBaitTx);
    const finding = report.findings.find(
      (f) => f.ruleId === "blinks-mismatch",
    );
    expect(finding).toBeUndefined();
  });
});

describe("Analyzer — risk score aggregation", () => {
  it("returns a 0 score for a clean tx", () => {
    const analyzer = new Analyzer(KAMINO_ALLOWED_CONFIG);
    const report = analyzer.analyze(cleanDepositTx);
    expect(report.riskScore).toBe(0);
  });

  it("returns a critical-tier score (>= 80) when a critical rule fires", () => {
    const analyzer = new Analyzer(KAMINO_ALLOWED_CONFIG);
    const report = analyzer.analyze(assignAttackTx);
    expect(report.riskScore).toBeGreaterThanOrEqual(80);
    expect(report.riskScore).toBeLessThanOrEqual(100);
  });
});

describe("Analyzer — rule selection", () => {
  it("only runs rules that appear in enabledRules", () => {
    const analyzer = new Analyzer({
      ...KAMINO_ALLOWED_CONFIG,
      enabledRules: ["assign-attack"],
    });
    const report = analyzer.analyze(hiddenApprovalTx);

    expect(report.findings.find((f) => f.ruleId === "hidden-token-approval"))
      .toBeUndefined();
    expect(report.findings.find((f) => f.ruleId === "assign-attack"))
      .toBeUndefined();
  });
});
