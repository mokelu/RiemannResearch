import { Surreal } from "surrealdb";
import type { Notebook } from "./notebook";

const surreal = new Surreal();
await surreal.connect("ws://localhost:8000");
await surreal.signin({ username: "root", password: "root" });
await surreal.use({ namespace: "app", database: "main" });

// The <Notebook> here is just an ordinary generic you're supplying
// yourself, the same way you'd write Array<string> — it's telling
// TypeScript "trust me, what comes back looks like this." Nothing
// is being inferred or derived — you're asserting the shape, not
// having it computed for you.
const created = await surreal.create<Notebook>("notebooks", {
  name: "SPY mean reversion",
});
