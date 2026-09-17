import { table, t } from "surqlize";
// 1. Define the 'notebook' table schema
export const notebook = table("notebook", {
  // SurrealDB automatically provides the record ID, but if you want 
  // to enforce/describe a custom 32-character string or standard ID:
  id: t.string(), 
  name: t.string(),
});

// 2. Derive the TypeScript type for a single Notebook record
export type Notebook = (typeof notebook)["type"];

// 3. Example instance matching the type
const myNotebook: Notebook = {
  id: "notebook:a1b2c3d4e5f678901234567890abcdef", // 32-char alphanumeric ID scope
  name: "BTC Volatility Breakout",
};