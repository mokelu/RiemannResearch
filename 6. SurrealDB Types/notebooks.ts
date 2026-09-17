import { table, t } from "surqlize";

const notebooks = table("notebooks", {
  id: t.string(),
  name: t.string(),
});

type Notebook = (typeof notebooks)["type"];

const example: Notebook = {
  id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  name: "My Notebook",
};