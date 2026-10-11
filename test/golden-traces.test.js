import test from "node:test";
import assert from "node:assert/strict";
import { createExecution } from "../src/engine/createExecution.js";

const graph = {
  id: "golden-kef",
  nodes: ["K", "E", "F", "J", "P"],
  adjacency: {
    K: ["E", "F"],
    E: ["J", "P"],
    F: [],
    J: [],
    P: []
  }
};

const nodes = (pairs) => pairs.map((pair) => pair.node);

test("GOLDEN DFS: current OPEN head remains until source line 12", () => {
  const events = createExecution({
    algorithmId: "dfs", graph, start: "K", goal: "P"
  }).getEvents();

  const closedEvent = events.find((e) => e.statement === "CLOSED ← nodePair : CLOSED");
  assert.deepEqual(nodes(closedEvent.after.variables.OPEN), ["K"]);
  assert.deepEqual(nodes(closedEvent.after.variables.CLOSED), ["K"]);

  const firstExpansion = events.find((e) => e.statement === "OPEN ← newPairs ++ (tail OPEN)");
  assert.deepEqual(nodes(firstExpansion.after.variables.OPEN), ["E", "F"]);

  const secondExpansion = events.filter((e) => e.statement === "OPEN ← newPairs ++ (tail OPEN)")[1];
  assert.deepEqual(nodes(secondExpansion.after.variables.OPEN), ["J", "P", "F"]);

  const result = events.at(-1).after;
  assert.equal(result.status, "success");
  assert.deepEqual(result.result, ["K", "E", "P"]);
});

test("GOLDEN BFS: tail OPEN is concatenated before newPairs", () => {
  const events = createExecution({
    algorithmId: "bfs", graph, start: "K", goal: "P"
  }).getEvents();

  const firstExpansion = events.find((e) => e.statement === "OPEN ← (tail OPEN) ++ newPairs");
  assert.deepEqual(nodes(firstExpansion.after.variables.OPEN), ["E", "F"]);

  const secondExpansion = events.filter((e) => e.statement === "OPEN ← (tail OPEN) ++ newPairs")[1];
  assert.deepEqual(nodes(secondExpansion.after.variables.OPEN), ["F", "J", "P"]);

  const selected = events
    .filter((e) => e.statement === "nodePair ← head OPEN")
    .map((e) => e.after.currentNode);
  assert.deepEqual(selected, ["K", "E", "F", "J", "P"]);
  assert.deepEqual(events.at(-1).after.result, ["K", "E", "P"]);
});

test("GOLDEN DFID-N: depth-bound iterations and counts are recorded", () => {
  const events = createExecution({
    algorithmId: "dfid-n", graph, start: "K", goal: "P"
  }).getEvents();

  const bounds = events
    .filter((e) => e.statement === "depthBound ← depthBound + 1")
    .map((e) => e.after.variables.depthBound);
  assert.deepEqual(bounds, [1, 2, 3]);

  const countUpdates = events
    .filter((e) => e.statement === "count ← count + length newPairs")
    .map((e) => e.after.variables.count);
  assert.deepEqual(countUpdates, [2, 2, 4]);

  assert.deepEqual(events.at(-1).after.result, ["K", "E", "P"]);
});

test("GOLDEN DFID-C: helper call visibly passes an empty CLOSED argument", () => {
  const events = createExecution({
    algorithmId: "dfid-c", graph, start: "K", goal: "P"
  }).getEvents();

  const calls = events.filter((e) => e.statement === "newNodes ← RemoveSeen(neighbours, OPEN, [])");
  assert.ok(calls.length > 0);
  for (const event of calls) {
    assert.deepEqual(event.after.variables.removeSeenClosedArgument, []);
  }
  assert.deepEqual(events.at(-1).after.result, ["K", "E", "P"]);
});

test("GOLDEN Simple Search-1: ordered deterministic policy visits K,E,F,J,P", () => {
  const events = createExecution({
    algorithmId: "simple-search-1", graph, start: "K", goal: "P"
  }).getEvents();
  const selected = events
    .filter((e) => e.statement === "Pick some node N from OPEN")
    .map((e) => e.after.variables.N);
  assert.deepEqual(selected, ["K", "E", "F", "J", "P"]);
  assert.equal(events.at(-1).after.result, "P");
});

test("GOLDEN Simple Search-2: CLOSED is updated before the goal test", () => {
  const events = createExecution({
    algorithmId: "simple-search-2", graph, start: "K", goal: "P"
  }).getEvents();
  const firstClosed = events.find((e) => e.statement === "CLOSED ← CLOSED ∪ {N}");
  assert.deepEqual(firstClosed.after.variables.CLOSED, ["K"]);
  const goalTest = events.find((e) => e.statement === "if GoalTest(N) = TRUE");
  assert.deepEqual(goalTest.after.variables.CLOSED, ["K"]);
  assert.equal(events.at(-1).after.result, "P");
});
