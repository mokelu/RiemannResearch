import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const META = new Set(["alphabet.ab","grammar.ab"]);
const root = path.resolve(import.meta.dirname, "..", "rewriteJS");
const files = [];
(function walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})) {
  const p = path.join(d,e.name);
  if (e.isDirectory()) walk(p); else if (e.name.endsWith(".ab") && !META.has(e.name)) files.push(p);
}})(root);

const { parseAb } = await import(pathToFileURL(path.join(import.meta.dirname,"src","parse.js")));
const { buildGraph } = await import(pathToFileURL(path.join(import.meta.dirname,"src","graph.js")));
const { startState, take, current, exitsOf } = await import(pathToFileURL(path.join(import.meta.dirname,"src","runner.js")));

const units = {};
for (const f of files) { const u = parseAb(fs.readFileSync(f,"utf8"), f); units[u.name]=u; }
const known = new Set(Object.keys(units));
const graphs = {}; for (const [n,u] of Object.entries(units)) graphs[n]=buildGraph(u,known);

let bad = 0;
for (const [n,u] of Object.entries(units)) {
  const g = graphs[n];
  const errs = [...u.errors];
  const ids = new Set(g.nodes.map(x=>x.id));
  if (u.kind==="program" && !ids.has("n0")) errs.push("no first step");
  if (u.kind==="program" && !ids.has("entry")) errs.push("no entry node");
  for (const e of g.edges) if(!ids.has(e.target)) errs.push("dangling edge -> "+e.target);
  const reach = new Set(); const q=[g.first];
  while(q.length){ const id=q.shift(); if(reach.has(id))continue; reach.add(id);
    for(const e of g.edges) if(e.source===id) q.push(e.target); }
  for (const id of ids) if(!reach.has(id)) errs.push("unreachable: "+id);
  if (errs.length){ bad++; console.log("FAIL "+u.name+": "+errs.join("; ")); }
}

for (const [n,g] of Object.entries(graphs)) {
  if (g.unit.kind!=="program") continue;
  let s = startState(g); let steps=0;
  while(!s.done && steps++ < 200){
    const opts = exitsOf(graphs[current(s).unit], s);
    if(!opts.length){ console.log("STUCK "+n+" at "+current(s).node); bad++; break; }
    s = take(s, graphs[current(s).unit], opts[0].id);
  }
  if (steps>=200){ console.log("RUNAWAY "+n); bad++; }
}

const progs = Object.values(units).filter(u=>u.kind==="program").length;
console.log(bad===0 ? `OK  ${progs} programs, ${(units ? Object.keys(units).length-progs : 0)} behaviors — all reachable, all runs halt` : `${bad} problem(s)`);

