export type ComputationOperation =
  | 'CALCULATE'
  | 'TRANSFORM'
  | 'SIMULATE'
  | 'COMPARE'
  | 'AGGREGATE';

export interface ComputationRequest {
  operation: ComputationOperation;
  input: unknown;
  parameters?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface ComputationResult {
  success: boolean;
  output?: unknown;
  metadata?: Record<string, unknown>;
  error?: string;
}
