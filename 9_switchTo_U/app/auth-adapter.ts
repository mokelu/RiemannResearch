export interface AuthSubject {
  type: "user" | "extension";
  id: string;
}

export interface AuthResource {
  type: string; // e.g. "Notebook", "Lens", "Workspace"
  id: string;
  attributes?: Record<string, any>;
}

export interface PermissionRequest {
  subject: AuthSubject;
  action: "create" | "read" | "update" | "delete" | "archive" | "manage";
  resource: AuthResource;
}

export interface IAuthorizationAdapter {
  can(request: PermissionRequest): Promise<boolean>;
}