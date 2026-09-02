/**
 * Decomposed 4-Factor Donor Reliability Vector Engine
 * Replaces generic reliability with a transparent, multi-dimensional vector.
 */

export interface DonorHistoryContext {
  totalRequests: number;
  acceptedRequests: number;
  completedDonations: number;
  noShows: number;
  avgResponseMinutes: number;
}

export interface ReliabilityVector {
  acceptanceScore: number;  // 30% weight
  attendanceScore: number;  // 30% weight
  responseScore: number;    // 20% weight
  completionScore: number;  // 20% weight
  overallReliability: number;
  factorContributions: {
    acceptance: number;
    attendance: number;
    response: number;
    completion: number;
  };
}

/**
 * Computes the 4-factor reliability vector and derived overall composite score.
 */
export function computeReliabilityVector(history: DonorHistoryContext): ReliabilityVector {
  // 1. Acceptance Score: proportion of dispatched requests accepted
  const acceptanceScore =
    history.totalRequests > 0
      ? Math.min(1.0, history.acceptedRequests / history.totalRequests)
      : 0.85; // Prior for new donors

  // 2. Attendance Score: penalty for no-shows post-acceptance
  const effectiveAccepted = Math.max(1, history.acceptedRequests);
  const attendanceScore = Math.max(0.0, Math.min(1.0, 1.0 - (history.noShows / effectiveAccepted)));

  // 3. Response Score: normalized response latency (0 to 60 mins)
  const responseScore = Math.max(0.1, Math.min(1.0, 1.0 - Math.min(60, history.avgResponseMinutes) / 60));

  // 4. Completion Score: successful donation completion rate
  const completionScore =
    history.acceptedRequests > 0
      ? Math.min(1.0, history.completedDonations / history.acceptedRequests)
      : 0.9;

  // Composite weighting: 30% accept, 30% attend, 20% response, 20% complete
  const wAccept = 0.3;
  const wAttend = 0.3;
  const wResponse = 0.2;
  const wComplete = 0.2;

  const overall =
    acceptanceScore * wAccept +
    attendanceScore * wAttend +
    responseScore * wResponse +
    completionScore * wComplete;

  return {
    acceptanceScore: Math.round(acceptanceScore * 100) / 100,
    attendanceScore: Math.round(attendanceScore * 100) / 100,
    responseScore: Math.round(responseScore * 100) / 100,
    completionScore: Math.round(completionScore * 100) / 100,
    overallReliability: Math.round(overall * 100) / 100,
    factorContributions: {
      acceptance: Math.round(acceptanceScore * wAccept * 100) / 100,
      attendance: Math.round(attendanceScore * wAttend * 100) / 100,
      response: Math.round(responseScore * wResponse * 100) / 100,
      completion: Math.round(completionScore * wComplete * 100) / 100,
    },
  };
}
