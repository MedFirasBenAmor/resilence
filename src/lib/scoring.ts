export const TECHNICAL_SCORE_CRITERIA = [
  "code_quality",
  "problem_solving",
  "technical_autonomy",
  "documentation",
  "delivery_quality",
] as const;

export const MATURITY_SCORE_CRITERIA = [
  "communication",
  "reliability",
  "teamwork",
  "deadline_respect",
  "initiative",
] as const;

export type TechnicalScoreCriterion = (typeof TECHNICAL_SCORE_CRITERIA)[number];
export type MaturityScoreCriterion = (typeof MATURITY_SCORE_CRITERIA)[number];

type ScoreEntry<T extends string> = {
  criterion: T;
  score: number;
};

function calculateAverage(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

export function validateScoreRange(score: number) {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

export function requireCommentForLowScore(scores: number[], comment: string) {
  const hasLowScore = scores.some((score) => score <= 2);
  return !hasLowScore || comment.trim().length >= 10;
}

export function calculateTechnicalAverage(
  scores: Array<ScoreEntry<TechnicalScoreCriterion> | number>,
) {
  const values = scores.map((entry) => (typeof entry === "number" ? entry : entry.score));
  return calculateAverage(values);
}

export function calculateMaturityAverage(
  scores: Array<ScoreEntry<MaturityScoreCriterion> | number>,
) {
  const values = scores.map((entry) => (typeof entry === "number" ? entry : entry.score));
  return calculateAverage(values);
}

export function calculateGlobalScore(
  technicalAverage: number,
  maturityAverage: number,
) {
  return calculateAverage([technicalAverage, maturityAverage]);
}

export const TECHNICAL_SCORE_LABELS: Record<TechnicalScoreCriterion, string> = {
  code_quality: "Code quality",
  problem_solving: "Problem solving",
  technical_autonomy: "Technical autonomy",
  documentation: "Documentation",
  delivery_quality: "Delivery quality",
};

export const MATURITY_SCORE_LABELS: Record<MaturityScoreCriterion, string> = {
  communication: "Communication",
  reliability: "Reliability",
  teamwork: "Teamwork",
  deadline_respect: "Deadline respect",
  initiative: "Initiative",
};
