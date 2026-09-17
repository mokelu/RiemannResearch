export type DataOperation =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'QUERY';

export type DataResourceType =
  | 'space'
  | 'notebook'
  | 'document'
  | 'dataset'
  | 'file'
  | 'record'
  | 'workspace';

export interface DataResource {
  type: DataResourceType;
  id?: string;
  collection?: string;
}

export interface DataRequest {
  operation: DataOperation;
  resource: DataResource;
  input?: unknown;
  context?: Record<string, unknown>;
}

export interface DataResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
