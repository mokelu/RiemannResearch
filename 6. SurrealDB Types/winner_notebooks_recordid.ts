import { table, t } from "surqlize";
import { RecordId } from "surrealdb";

// 1. TypeScript object describing the table
const notebooks = table("notebooks", {
  name: t.string(),
});

// 2. TypeScript type of one row
type Notebook = (typeof notebooks)["type"];

// 3. A value with that type
const notebook: Notebook = {
  id: new RecordId("notebooks", "8f3ma9vqz1x7k2n0dq5rt6wc"),
  name: "SPY mean reversion",
};
