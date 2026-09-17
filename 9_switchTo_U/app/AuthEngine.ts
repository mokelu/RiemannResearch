import { IAuthorizationAdapter, PermissionRequest } from "./auth-adapter";
import { LocalCaslAdapter } from "./LocalCaslAdapter";
import { CloudOpenFgaAdapter } from "./CloudOpenFgaAdapter";
import { OpenFgaClient } from "@openfga/sdk";

export class AuthEngine implements IAuthorizationAdapter {
  private activeDriver: IAuthorizationAdapter;

  constructor(isCloudMode: boolean, openFgaConfig?: any) {
    if (isCloudMode && openFgaConfig) {
      const client = new OpenFgaClient(openFgaConfig);
      this.activeDriver = new CloudOpenFgaAdapter(client);
    } else {
      this.activeDriver = new LocalCaslAdapter();
    }
  }

  // Unified call used everywhere across your UI, Plugin Hosts, and API routes
  async can(request: PermissionRequest): Promise<boolean> {
    return this.activeDriver.can(request);
  }
}