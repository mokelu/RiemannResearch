import { AbilityBuilder, createMongoAbility, MongoAbility } from "@casl/ability";
import { IAuthorizationAdapter, PermissionRequest } from "./auth-adapter";

type AppAbility = MongoAbility<[string, string]>;

export class LocalCaslAdapter implements IAuthorizationAdapter {
  private ability: AppAbility;

  constructor(rules?: Array<{ action: string; subject: string }>) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (rules && rules.length > 0) {
      rules.forEach(r => can(r.action, r.subject));
    } else {
      // Local single-user default: full ownership over all objects
      can("manage", "all");
    }

    this.ability = build();
  }

  async can(req: PermissionRequest): Promise<boolean> {
    // Evaluates in-memory (< 0.01ms) with zero network calls
    return this.ability.can(req.action, req.resource.type);
  }
}