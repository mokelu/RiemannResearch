export type ApplicationOperation =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXECUTE';

export interface ApplicationRequest {
  operation: ApplicationOperation;
  target: string;
  input?: unknown;
  context?: Record<string, unknown>;
}

export interface ApplicationResult {
  success: boolean;
  output?: unknown;
  error?: string;
}
