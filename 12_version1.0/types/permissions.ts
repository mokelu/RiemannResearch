export type SubjectType =
  | 'user'
  | 'agent'
  | 'worker'
  | 'app';

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
  | 'EXECUTE'
  | 'APPROVE';

export type ResourceType =
  | 'space'
  | 'notebook'
  | 'document'
  | 'dataset'
  | 'file'
  | 'workflow'
  | 'function'
  | 'plugin'
  | 'agent'
  | 'workspace'
  | 'account'
  | 'resource';

export interface Resource {
  type: ResourceType;
  id?: string;
  ownerId?: string;
  attributes?: Record<string, unknown>;
}

export interface Context {
  metadata?: Record<string, unknown>;
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
  resources?: ResourceType[];
}
