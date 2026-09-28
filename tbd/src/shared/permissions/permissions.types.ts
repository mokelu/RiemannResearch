export type SubjectType =
  | 'user'
  | 'agent'
  | 'worker'
  | 'plugin';

export interface Subject {
  id: string;
  type: SubjectType;
  roles?: string[];
  metadata?: Record<string, unknown>;
}

export type Action =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXECUTE';

export type ResourceType =
  | 'notebook'
  | 'document'
  | 'artifact';

export interface Resource {
  type: ResourceType;
  id?: string;
  ownerId?: string;
}

export interface Context {
  ownerId?: string;
  requesterId?: string;
  workspaceId?: string;
}

export interface EvaluationInput {
  subject: Subject;
  action: Action;
  resource: Resource;
  context?: Context;
}

export type Decision =
  | 'ALLOW'
  | 'DENY';

export interface EvaluationResult {
  decision: Decision;
  reason?: string;
  failedRules?: string[];
  evaluatedAt: string;
}

export interface CompatibilityRule {
  subjectType: SubjectType;
  actions: Action[];
  resources: ResourceType[];
}
