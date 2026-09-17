export type ResourceOperation =
  | 'ALLOCATE'
  | 'RELEASE'
  | 'RESERVE'
  | 'CHECK';

export type ResourceType =
  | 'compute'
  | 'storage'
  | 'execution'
  | 'connection'
  | 'provider';

export interface ResourceRequest {
  operation: ResourceOperation;
  resource: ResourceType;
  amount?: number;
  unit?: string;
  context?: Record<string, unknown>;
}

export interface ResourceResult {
  success: boolean;
  allocated?: number;
  unit?: string;
  error?: string;
}
