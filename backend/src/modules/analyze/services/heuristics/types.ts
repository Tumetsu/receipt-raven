import { HeuristicIssue } from '../../../../domain/types.js';

/**
 * Result of a heuristic check
 * Returns HeuristicIssue if an issue is found, null otherwise
 */
export type HeuristicResult = HeuristicIssue | null;
