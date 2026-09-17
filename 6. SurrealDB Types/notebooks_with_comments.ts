import { table, t } from "surqlize";
// 1. TypeScript object describing the table
const notebooks = table("notebooks", {
  id: t.string(),   // 32-char alphanumeric — minted once at creation, never edited
  name: t.string(), // the human label — editable at will, never load-bearing for addressing
});

// 2. TypeScript type of one row
type Notebook = (typeof notebooks)["type"];

// 3. A value with that type
const notebook: Notebook = {
  id: "f3a9c2e18b7d4605a2c1f7e3b9d84c26",
  name: "ES — index macro",
};