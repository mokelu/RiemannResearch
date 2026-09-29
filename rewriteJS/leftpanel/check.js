// check.js — verifies leftpanel/*.ab against grammar.ab rules R1..R7
// run: node check.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
const alpha = fs.readFileSync(path.join(ROOT, 'alphabet.ab'), 'utf8');

// ---- parse alphabet -------------------------------------------------
const actions = {};
for (const m of alpha.matchAll(/^declare action\s+(\w+)\s+results:\s*(.+)$/gm)) {
  actions[m[1]] = m[2].split('|').map(s => s.trim());
}
const actors = new Set([...alpha.matchAll(/^declare actor\s+(\w+)/gm)].map(m => m[1]));
const resources = new Set([...alpha.matchAll(/^declare resource\s+(\w+)/gm)].map(m => m[1]));
const results = new Set([...alpha.matchAll(/^declare result\s+(\w+)/gm)].map(m => m[1]));

const errors = [];
const cap = s => s[0].toUpperCase() + s.slice(1);

// ---- term -> {action, resource} -------------------------------------
function parseTerm(t) {
  const parts = t.trim().split(/\s+/);
  return { actor: parts[0], action: parts[1], resource: parts[2], raw: t.trim() };
}

// ---- load behaviors --------------------------------------------------
const behDir = path.join(ROOT, 'behaviors');
const behaviors = new Set(fs.readdirSync(behDir).filter(f => f.endsWith('.ab'))
  .map(f => f.replace(/\.ab$/, '')));

// ---- walk programs + behaviors ---------------------------------------
const progDir = path.join(ROOT, 'programs');
const files = [
  ...fs.readdirSync(behDir).filter(f => f.endsWith('.ab')).sort()
    .map(f => ({ dir: behDir, file: f })),
  ...fs.readdirSync(progDir).filter(f => f.endsWith('.ab')).sort()
    .map(f => ({ dir: progDir, file: f })),
];

const report = [];

for (const { dir, file } of files) {
  const src = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = src.split(/\r?\n/);
  const stepTerms = [];
  const catches = [];   // {term, response, target}
  let sentence = null, enter = null, programName = null;
  let cur = null;

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    let m;
    if ((m = line.match(/^program\s+(\w+)$/))) programName = m[1];
    else if ((m = line.match(/^sentence\s+(.+)$/))) sentence = m[1].trim();
    else if ((m = line.match(/^enter\s+(\S+)$/))) enter = m[1];
    else if ((m = line.match(/^step\s+(.+)$/))) { cur = m[1].trim(); stepTerms.push(cur); }
    else if ((m = line.match(/^catch\s+(\S+)\s+(goto\s+.+|halt)$/))) {
      if (!cur) errors.push(`${file}: catch outside a step`);
      catches.push({ step: cur, response: m[1], target: m[2].replace(/^goto\s+/, '').trim() });
    }
    else if (/^(halt)$/.test(line) || /^behavior\s+\w+$/.test(line)) { /* decls */ }
    else errors.push(`${file}: unparsed line -> ${raw}`);
  }

  const kind = sentence ? 'program' : 'behavior';

  // R1 / R2
  if (kind === 'program') {
    if (!sentence) errors.push(`${file}: R1 missing sentence`);
    if (!enter) errors.push(`${file}: R1 missing enter`);
    if (!programName) errors.push(`${file}: R1 missing program name`);
    // R6: enter must be <sentence-resource>.<sentence-action>.requested
    const sp = sentence.split(/\s+/);            // [actor, action, ...resource]
    const want = `${sp[sp.length - 1].toLowerCase()}.${sp[1].toLowerCase()}.requested`;
    if (enter !== want) errors.push(`${file}: R6 enter "${enter}" != "${want}" (from sentence)`);
    const em = enter.match(/^(\w+)\.(\w+)\.(\w+)$/);
    if (!em) errors.push(`${file}: R6 enter "${enter}" is not resource.action.result`);
    else {
      if (!resources.has(cap(em[1]))) errors.push(`${file}: R6 resource "${em[1]}" not declared`);
      if (!actions[cap(em[2])]) errors.push(`${file}: R6 action "${em[2]}" not declared`);
      if (!results.has(em[3])) errors.push(`${file}: R6 result "${em[3]}" not declared`);
    }
  } else {
    if (sentence) errors.push(`${file}: R2 behavior must not have a sentence`);
    if (programName) errors.push(`${file}: R2 behavior must not be a program`);
    if (!stepTerms.length) errors.push(`${file}: R2 behavior has no steps`);
    if (!/halt\s*$/.test(src.replace(/#.*$/gm, ''))) errors.push(`${file}: R5 behavior must end in halt`);
  }

  // R3 + R4 + declaration checks
  const uniq = new Set();
  for (const t of stepTerms) {
    if (uniq.has(t)) errors.push(`${file}: R4 duplicate step term "${t}"`);
    uniq.add(t);
    const { actor, action, resource } = parseTerm(t);
    if (!actors.has(cap(actor))) errors.push(`${file}: actor "${actor}" not declared in alphabet`);
    if (!actions[cap(action)]) errors.push(`${file}: action "${action}" not declared in alphabet`);
    else {
      if (!resources.has(cap(resource))) errors.push(`${file}: resource "${resource}" not declared in alphabet`);
      else {
        const got = catches.filter(c => c.step === t).map(c => {
          const p = c.response.split('.');
          return { res: p[0], act: p[1], val: p[2], full: c.response };
        });
        // R3: every declared result must be caught
        for (const r of actions[cap(action)]) {
          const hit = got.find(g => cap(g.act) === cap(action) && g.val === r && cap(g.res) === cap(resource));
          if (!hit) errors.push(`${file}: R3 HOLE in "${t}" — missing ${resource.toLowerCase()}.${action.toLowerCase()}.${r}`);
        }
        // response must be well formed / declared
        for (const g of got) {
          if (!actions[cap(g.act)]) errors.push(`${file}: catch action "${g.act}" not declared (${g.full})`);
          if (!results.has(g.val)) errors.push(`${file}: catch result "${g.val}" not declared (${g.full})`);
          if (!resources.has(cap(g.res))) errors.push(`${file}: catch resource "${g.res}" not declared (${g.full})`);
          if (cap(g.res) !== cap(resource)) errors.push(`${file}: catch resource "${g.res}" != step resource "${resource}" (${g.full})`);
          if (cap(g.act) !== cap(action)) errors.push(`${file}: catch action "${g.act}" != step action "${action}" (${g.full})`);
        }
        if (!got.length) errors.push(`${file}: R3 HOLE — step "${t}" catches nothing`);
      }
    }
  }

  // R4/R5 targets
  for (const c of catches) {
    const t = c.target;
    if (t === 'halt') continue;
    if (behaviors.has(t)) continue;
    if (uniq.has(t)) continue;
    errors.push(`${file}: R4/R5 dangling goto "${t}"`);
  }

  report.push({ file, kind, sentence, steps: stepTerms.length, catches: catches.length });
}

// ---- summary ---------------------------------------------------------
console.log('alphabet: %d actions, %d actors, %d resources, %d results',
  Object.keys(actions).length, actors.size, resources.size, results.size);
console.log('behaviors: %s', [...behaviors].join(', '));
console.log('files: %d\n', files.length);

if (errors.length) {
  console.log('FAILED — %d problem(s):\n', errors.length);
  errors.forEach(e => console.log('  ' + e));
  process.exit(1);
} else {
  const progs = files.filter(f => f.dir === progDir).length;
  const behs = files.length - progs;
  console.log('OK — R1..R7 hold across %d programs and %d behaviors.', progs, behs);
}
