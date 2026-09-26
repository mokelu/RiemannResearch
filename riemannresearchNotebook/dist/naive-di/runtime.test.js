import { describe, expect, it } from "vitest";
import { validateNaiveDI } from "./validate.js";
import { materialize, RuntimeNode } from "./runtime.js";
/**
 * A slightly richer graph than the example: a chain plus evidence feeding in.
 * The top level carries only `nodes` and `relations` by decision — prose is a
 * renderer's output, not part of the contract.
 */
const graphData = {
    nodes: [
        { id: "n1", text: "John is a dog.", tag: "ASSUMPTION" },
        { id: "n2", text: "John has four legs.", tag: "CONSEQUENCE" },
        { id: "n3", text: "John is an animal.", tag: "INFERENCE" },
        { id: "e1", text: "I saw John walking on four legs.", tag: "EVIDENCE" },
    ],
    relations: [
        { from: "n1", relation: "IMPLIES", to: "n2" },
        { from: "n2", relation: "IMPLIES", to: "n3" },
        { from: "e1", relation: "SUPPORTS", to: "n2" },
    ],
};
function build(data) {
    const result = validateNaiveDI(data);
    if (!result.valid)
        throw new Error(result.errors.join("; "));
    return materialize(result.data);
}
describe("materialize", () => {
    it("turns valid data into runtime nodes carrying registered tags", () => {
        const graph = build(graphData);
        expect(graph.size).toBe(4);
        expect(graph.node("n1")).toBeInstanceOf(RuntimeNode);
        expect(graph.node("n1")?.tag).toBe("ASSUMPTION");
    });
    it("wires relations to real node objects, not to id strings", () => {
        const graph = build(graphData);
        const [wire] = graph.outgoing("n1");
        expect(wire?.relation).toBe("IMPLIES");
        expect(wire?.from.id).toBe("n1");
        expect(wire?.to).toBe(graph.node("n2"));
        expect(wire?.id).toBe("n1 -[IMPLIES]-> n2");
    });
    it("keeps a relation named whatever the AI chose", () => {
        const graph = build({
            nodes: [
                { id: "j", text: "John", tag: "ENTITY" },
                { id: "d", text: "dog", tag: "PROPERTY" },
            ],
            relations: [{ from: "j", relation: "is", to: "d" }],
        });
        expect(graph.next("j", "is").map((n) => n.id)).toEqual(["d"]);
        expect(graph.relations()[0]?.relation).toBe("is");
        expect(graph.next("j", "IMPLIES")).toEqual([]);
    });
    it("answers a component-style query by tag", () => {
        const graph = build(graphData);
        expect(graph.nodesTagged("CONSEQUENCE").map((n) => n.id)).toEqual(["n2"]);
        expect(graph.nodesTagged("ASSUMPTION", "INFERENCE").map((n) => n.id)).toEqual([
            "n1",
            "n3",
        ]);
    });
    it("walks both directions, with and without a relation filter", () => {
        const graph = build(graphData);
        expect(graph.next("n1").map((n) => n.id)).toEqual(["n2"]);
        expect(graph.previous("n2").map((n) => n.id)).toEqual(["n1", "e1"]);
        expect(graph.previous("n2", "SUPPORTS").map((n) => n.id)).toEqual(["e1"]);
        expect(graph.previous("n2", "IMPLIES").map((n) => n.id)).toEqual(["n1"]);
    });
    it("follows a chain transitively", () => {
        const graph = build(graphData);
        expect(graph.closure("n1").map((n) => n.id)).toEqual(["n2", "n3"]);
        expect(graph.closure("n2").map((n) => n.id)).toEqual(["n3"]);
        expect(graph.closure("n3")).toEqual([]);
    });
    it("names where the reasoning starts and stops", () => {
        const graph = build(graphData);
        expect(graph.roots().map((n) => n.id)).toEqual(["n1", "e1"]);
        expect(graph.leaves().map((n) => n.id)).toEqual(["n3"]);
    });
    it("round-trips back to plain data", () => {
        const graph = build(graphData);
        expect(graph.toJSON()).toEqual({
            nodes: graphData.nodes,
            relations: graphData.relations,
        });
    });
});
describe("the runtime is unreachable without the validator", () => {
    it("refuses raw JSON at compile time", () => {
        const raw = { nodes: [], relations: [] };
        // The validated stamp is required, so raw JSON does not compile here.
        // If that enforcement ever breaks, tsc flags this line as an unused
        // directive and `npm run check` fails.
        // @ts-expect-error - no VALIDATED stamp on a hand-written object
        const attempted = () => materialize(raw);
        expect(attempted).toBeDefined();
    });
    it("rejects a cycle rather than hanging", () => {
        const graph = build({
            nodes: [
                { id: "a", text: "A.", tag: "CLAIM" },
                { id: "b", text: "B.", tag: "CLAIM" },
            ],
            relations: [
                { from: "a", relation: "IMPLIES", to: "b" },
                { from: "b", relation: "IMPLIES", to: "a" },
            ],
        });
        expect(graph.closure("a").map((n) => n.id)).toEqual(["b"]);
    });
    it("refuses a duplicate id at the boundary, not in the runtime", () => {
        const result = validateNaiveDI({
            nodes: [
                { id: "n1", text: "First.", tag: "CLAIM" },
                { id: "n1", text: "Second.", tag: "CLAIM" },
            ],
            relations: [],
        });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/appears more than once/);
    });
});
