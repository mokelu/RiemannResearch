import { ZenEngine } from "@gorules/zen-engine";

const engine = new ZenEngine();

const decision = engine.createDecision(content);

const result = await decision.evaluate({
  input: 15
});
