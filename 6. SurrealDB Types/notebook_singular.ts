import { table, t } from "surqlize";
// The table. Notice: only `name` is declared.
const notebook = table("notebook", {
  name: t.string(),
});

type Notebook = (typeof notebook)["type"];

const myNotebook: Notebook = {
  id: "notebook:01H8XK9Q2M4P7R3T6V8W0YZABC",
  name: "BTC Momentum",
};