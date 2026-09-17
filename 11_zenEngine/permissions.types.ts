// Define system subjects
export type SubjectType = 'user' | 'agent' | 'worker' | 'plugin';

export interface PermissionSubject {
  id: string;
  type: SubjectType;
  roles?: string[];
  metadata?: Record<string, unknown>;
}

// Actions subject to permission checks
export type PermissionAction = 
  | 'CREATE' 
  | 'READ' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'EXECUTE' 
  | 'APPROVE';

// Trading resources needing guardrails
export type ResourceType = 
  | 'order' 
  | 'position' 
  | 'strategy' 
  | 'account' 
  | 'api_key' 
  | 'workflow';

export interface PermissionResource {
  type: ResourceType;
  id?: string;
  ownerId?: string;
  attributes?: Record<string, unknown>;
}

// Environmental and trading risk context
export interface PermissionContext {
  accountBalance?: number;
  tradeValue?: number;
  dailyLossTotal?: number;
  maxAllowedDrawdown?: number;
  isMarketOpen?: boolean;
  timeOfEvaluation: string; // ISO String
  ipAddress?: string;
}

// GoRules Engine Input Payload
export interface PermissionEvaluationInput {
  subject: PermissionSubject;
  action: PermissionAction;
  resource: PermissionResource;
  context: PermissionContext;
}

// Decision outcome
export type DecisionOutcome = 'ALLOW' | 'DENY';

export interface PermissionEvaluationResult {
  decision: DecisionOutcome;
  reason?: string;
  failedRules?: string[];
  evaluatedAt: string;
}

// Dynamic Rule Definition
export interface CompatibilityRule {
  subjectType: SubjectType;
  allowedActions: Record<ResourceType, PermissionAction[]>;
}

export interface GuardrailCondition {
  field: keyof PermissionContext;
  operator: 'GTE' | 'LTE' | 'EQ' | 'NEQ' | 'IN';
  value: unknown;
}