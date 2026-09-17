export type IdentityType =
  | 'user'
  | 'agent'
  | 'worker'
  | 'app';

export interface Identity {
  id: string;
  type: IdentityType;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface IdentityContext {
  metadata?: Record<string, unknown>;
}

export interface IdentityResult {
  identity: Identity;
  authenticated: boolean;
}
