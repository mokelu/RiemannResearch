/**
 * Reads raw .ab text into a unit: one program or one behavior.
 *
 * Line based, `#` comments stripped, blank lines skipped. Follows grammar.ab:
 *
 *   program <Name> / sentence <term> / enter <response> / <body>
 *   behavior <Name> / <body>
 *   step <term> ( catch <response> (goto <target> | halt) )*
 */

export function parseAb(text, file) {
  const unit = {
    file,
    kind: null,
    name: null,
    sentence: null,
    enter: null,
    steps: [],
    errors: [],
  };
  let cur = null;

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/#.*$/, "").trim();
    if (!line) continue;
    let m;

    if ((m = line.match(/^program\s+(\S+)$/))) {
      unit.kind = "program";
      unit.name = m[1];
    } else if ((m = line.match(/^behavior\s+(\S+)$/))) {
      unit.kind = "behavior";
      unit.name = m[1];
    } else if ((m = line.match(/^sentence\s+(.+)$/))) {
      unit.sentence = m[1].trim();
    } else if ((m = line.match(/^enter\s+(\S+)$/))) {
      unit.enter = m[1];
    } else if ((m = line.match(/^step\s+(.+)$/))) {
      cur = { term: m[1].trim(), index: unit.steps.length, catches: [] };
      unit.steps.push(cur);
    } else if ((m = line.match(/^catch\s+(\S+)\s+(goto\s+.+|halt)\s*$/))) {
      if (!cur) {
        unit.errors.push(`${file}:${i + 1} catch with no step above it`);
        continue;
      }
      const raw = m[2].trim();
      const isHalt = raw === "halt";
      cur.catches.push({
        response: m[1],
        target: isHalt ? "halt" : raw.replace(/^goto\s+/, "").trim(),
        isHalt,
      });
    } else {
      unit.errors.push(`${file}:${i + 1} unparsed: ${line}`);
    }
  }

  if (!unit.name) unit.name = file.replace(/\.ab$/, "").split("/").pop();
  return unit;
}

/** `system create file onto folder` -> parts. */
export function termParts(term) {
  const p = term.split(/\s+/);
  return {
    actor: p[0] ?? "",
    action: p[1] ?? "",
    resource: p[2] ?? "",
    onto: p[3] === "onto" ? p[4] : null,
  };
}
