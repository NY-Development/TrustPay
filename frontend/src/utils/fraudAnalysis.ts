// Deterministic, statistics-based fraud & trend analysis over real
// Verification records — no model, no network call, no fabricated output.
// Replaces the web app's previous "AI Fraud & Security Hub" panel, which
// (in every real deployment, since VITE_AI_ENDPOINT is never configured)
// silently ran on MockProvider and returned hardcoded canned results
// regardless of the actual data.

export interface SuspiciousTransaction {
  referenceNumber: string;
  reason: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface FraudReport {
  riskScore: number; // 0-100
  suspiciousTransactions: SuspiciousTransaction[];
  summary: string;
  breakdown: {
    fraudFlagged: number;
    duplicates: number;
    statisticalOutliers: number;
    processingErrors: number;
  };
}

const SEVERITY_RANK: Record<SuspiciousTransaction['severity'], number> = {
  critical: 3,
  high: 2,
  medium: 1,
};

export function computeFraudReport(records: any[]): FraudReport {
  const emptyBreakdown = { fraudFlagged: 0, duplicates: 0, statisticalOutliers: 0, processingErrors: 0 };

  if (records.length === 0) {
    return {
      riskScore: 0,
      suspiciousTransactions: [],
      summary: 'No verification activity in the selected period.',
      breakdown: emptyBreakdown,
    };
  }

  const amounts = records.map((r) => Number(r.amount) || 0);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((sum, a) => sum + (a - mean) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  const refCounts: Record<string, number> = {};
  records.forEach((r) => {
    const ref = r.referenceNumber || r.transactionId;
    if (ref) refCounts[ref] = (refCounts[ref] || 0) + 1;
  });

  const suspicious: SuspiciousTransaction[] = [];
  let fraudFlagged = 0;
  let duplicates = 0;
  let statisticalOutliers = 0;
  let processingErrors = 0;

  records.forEach((r) => {
    const ref = r.referenceNumber || r.transactionId || 'Unknown';
    const amount = Number(r.amount) || 0;
    const severity = r.verificationSummary?.severity;

    if (severity === 'fraud_risk') {
      fraudFlagged++;
      suspicious.push({
        referenceNumber: ref,
        reason: r.verificationSummary?.description || 'Flagged as high fraud risk by settlement account matching.',
        severity: 'critical',
      });
      return;
    }

    const isDuplicate =
      refCounts[ref] > 1 ||
      severity === 'duplicate' ||
      r.rawResponse?.confirmationHistory?.confirmationCount > 1 ||
      r.rawResponse?.confirmationHistory?.confirmedBefore === true;

    if (isDuplicate) {
      duplicates++;
      suspicious.push({
        referenceNumber: ref,
        reason: 'Reference number submitted more than once — possible duplicate claim.',
        severity: 'high',
      });
      return;
    }

    if (r.processingStatus === 'failed' || severity === 'error') {
      processingErrors++;
      return;
    }

    // Z-score outlier detection: unusually large amounts relative to this
    // period's mean are the fraud-relevant direction to flag.
    if (stdDev > 0 && amount > 0) {
      const z = (amount - mean) / stdDev;
      if (z > 2.5) {
        statisticalOutliers++;
        suspicious.push({
          referenceNumber: ref,
          reason: `Amount (${amount.toLocaleString()} ${r.currency || 'ETB'}) is a statistical outlier — ${z.toFixed(1)}σ above the period average of ${Math.round(mean).toLocaleString()} ${r.currency || 'ETB'}.`,
          severity: 'medium',
        });
      }
    }
  });

  const total = records.length;
  const riskScore = Math.min(
    100,
    Math.round(((fraudFlagged * 6 + duplicates * 3 + statisticalOutliers * 1.5 + processingErrors) / total) * 20)
  );

  const flaggedCount = suspicious.length;
  const summary =
    flaggedCount === 0
      ? `Analyzed ${total} verification${total === 1 ? '' : 's'} in the selected period. No fraud indicators, duplicate submissions, or statistical anomalies detected.`
      : `Analyzed ${total} verification${total === 1 ? '' : 's'} — flagged ${flaggedCount} for review: ${fraudFlagged} fraud-risk, ${duplicates} duplicate, ${statisticalOutliers} statistical outlier${statisticalOutliers === 1 ? '' : 's'}.`;

  return {
    riskScore,
    suspiciousTransactions: suspicious
      .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
      .slice(0, 10),
    summary,
    breakdown: { fraudFlagged, duplicates, statisticalOutliers, processingErrors },
  };
}

export interface BusinessInsights {
  summary: string;
  recommendations: string[];
  trend: { direction: 'up' | 'down' | 'flat'; percentage: number; label: string };
}

export function computeBusinessInsights(records: any[]): BusinessInsights {
  if (records.length === 0) {
    return {
      summary: 'No verification data yet — insights will appear once you start verifying payments.',
      recommendations: [],
      trend: { direction: 'flat', percentage: 0, label: 'No data' },
    };
  }

  const sorted = [...records].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const firstVolume = firstHalf.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const secondVolume = secondHalf.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  let direction: 'up' | 'down' | 'flat' = 'flat';
  let percentage = 0;
  if (firstVolume > 0) {
    percentage = Math.round(((secondVolume - firstVolume) / firstVolume) * 100);
    direction = percentage > 2 ? 'up' : percentage < -2 ? 'down' : 'flat';
  } else if (secondVolume > 0) {
    direction = 'up';
    percentage = 100;
  }

  const providerCounts: Record<string, number> = {};
  records.forEach((r) => {
    const p = (r.provider || 'unknown').toUpperCase();
    providerCounts[p] = (providerCounts[p] || 0) + 1;
  });
  const topEntry = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0];
  const topShare = topEntry ? Math.round((topEntry[1] / records.length) * 100) : 0;

  const verifiedCount = records.filter((r) => r.verified === true).length;
  const successRate = Math.round((verifiedCount / records.length) * 1000) / 10;

  const fraudCount = records.filter((r) => r.verificationSummary?.severity === 'fraud_risk').length;
  const fraudRate = Math.round((fraudCount / records.length) * 1000) / 10;

  const recommendations: string[] = [];
  if (topEntry && topShare >= 60) {
    recommendations.push(
      `${topEntry[0]} accounts for ${topShare}% of verification volume — consider promoting alternate payment channels to reduce single-provider dependency.`
    );
  }
  if (fraudRate > 2) {
    recommendations.push(
      `Fraud-risk rate is ${fraudRate}% this period, above the 2% baseline — review settlement account matching rules and flagged transactions closely.`
    );
  }
  if (successRate < 90) {
    recommendations.push(
      `Verification success rate is ${successRate}%, below the 90% target — check for stale settlement account details or provider connectivity issues.`
    );
  }
  if (direction === 'down' && percentage <= -15) {
    recommendations.push(
      `Transaction volume dropped ${Math.abs(percentage)}% within the selected period — worth checking for seasonal effects or a verification funnel issue.`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('No structural risks detected in the selected period — verification volume, success rate, and provider mix all look healthy.');
  }

  const summary = `${records.length} verification${records.length === 1 ? '' : 's'} processed, ${successRate}% success rate, ${fraudRate}% flagged as fraud risk. Volume is ${
    direction === 'flat' ? 'stable' : `trending ${direction} ${Math.abs(percentage)}%`
  } across the selected period.`;

  return {
    summary,
    recommendations,
    trend: {
      direction,
      percentage: Math.abs(percentage),
      label: direction === 'up' ? 'Trending Up' : direction === 'down' ? 'Trending Down' : 'Stable',
    },
  };
}
