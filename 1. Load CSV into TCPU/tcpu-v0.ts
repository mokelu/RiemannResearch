import { IOContract } from '.'
import { Model as Table } from '@ironcalc/wasm';
export default class TCPU {
  constructor(table_name) {
    // 1. We create a new table with this below.
    // 2. Once we have this table created. It automatically comes with the "sheet1".
    this.table = new Table(table_name, 'en', 'UTC', 'en');
    // 3. Then below we create a dictionary to store all the sheets we have on this table.
    this.sheetRegistry = new Map();
    this.sheetRows = {};
  }

  // CREATE_SHEET: Create a named sheet with headers. Following V1 pattern.
  CREATE_SHEET(name, headers) {
    if (this.sheetRegistry.has(name)) {
      return this.sheetRegistry.get(name);
    }
    const idx = this.sheetRegistry.size;
    this.table.newSheet();
    this.table.renameSheet(idx, name);
    // Write headers to row 1, columns 1..N
    headers.forEach((h, i) => this.table.setUserInput(idx, 1, i + 1, h));
    this.sheetRegistry.set(name, idx);
    this.sheetRows[name] = 2;
    this[name + 'SheetIdx'] = idx;
    this.table.evaluate();
    return idx;
  }

LOAD(param1: WorldData[], param2: string): number {
  const headers = Object.keys(param1[0]);
  const dataRows = param1;

  const idx = this.CREATE_SHEET(param2, headers);

  dataRows.forEach((row, ri) => {
    headers.forEach((header, ci) => {
      this.table.setUserInput(
        idx,
        ri + 2,
        ci + 1,
        row[header]
      );
    });

    this.sheetRows[param2]++;

  });

  this.table.evaluate();
  return idx;
}
}
