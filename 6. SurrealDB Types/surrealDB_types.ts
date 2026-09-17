import { table, t } from "surqlize";

// 1. TypeScript object describing the table
const user = table("user", {
  name: t.string(),
  age: t.number(),
});

// 2. TypeScript type of one row
type User = (typeof user)["type"];

// 3. A value with that type
const person: User = {
  name: "John",
  age: 24,
};
