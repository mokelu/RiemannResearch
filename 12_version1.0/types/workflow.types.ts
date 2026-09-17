export type WorkflowOperation =
  | 'START'
  | 'PAUSE'
  | 'RESUME'
  | 'CANCEL'
  | 'EXECUTE';

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  metadata?: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: string;
  input?: unknown;
  metadata?: Record<string, unknown>;
}

export interface WorkflowRequest {
  operation: WorkflowOperation;
  workflow: Workflow;
  input?: unknown;
}

export interface WorkflowResult {
  success: boolean;
  output?: unknown;
  step?: string;
  error?: string;
}
