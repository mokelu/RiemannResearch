import { OpenFgaClient } from "@openfga/sdk";
import { IAuthorizationAdapter, PermissionRequest } from "./auth-adapter";

export class CloudOpenFgaAdapter implements IAuthorizationAdapter {
  private fga: OpenFgaClient;

  constructor(fgaClient: OpenFgaClient) {
    this.fga = fgaClient;
  }

  async can(req: PermissionRequest): Promise<boolean> {
    // Translates the unified request into an OpenFGA relationship query
    const { allowed } = await this.fga.check({
      user: `${req.subject.type}:${req.subject.id}`,
      relation: req.action,
      object: `${req.resource.type.toLowerCase()}:${req.resource.id}`,
    });

    return allowed ?? false;
  }
}