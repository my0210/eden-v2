import { MetricScoring } from '@/lib/types';

export function computeMetricScore(value: number, scoring?: MetricScoring): number | null {
  if (!scoring) return null;
  const min = scoring.optimalRangeMin;
  const max = scoring.optimalRangeMax;
  if (min === undefined || max === undefined) return null;

  if (scoring.curveType === 'step') {
    return value >= min && value <= max ? 100 : 0;
  }

  // Default to linear falloff outside the optimal range
  const range = Math.max(max - min, 1);
  if (value >= min && value <= max) return 100;

  const distance = value < min ? min - value : value - max;
  const outerMargin = typeof scoring.curveParams?.outer_margin === 'number'
    ? (scoring.curveParams?.outer_margin as number)
    : range;

  const score = 100 * Math.max(0, 1 - distance / Math.max(outerMargin, 1));
  return Math.round(score);
}

export function computeAverageScore(scores: number[], minimumCount: number): number | null {
  if (scores.length < minimumCount) return null;
  const sum = scores.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / scores.length);
}
