import test from "node:test";
import assert from "node:assert/strict";
import { createExecution } from "../src/engine/createExecution.js";
import { defaultGraphs } from "../src/data/defaultGraphs.js";

const branching = defaultGraphs.find((g) => g.id === "branching");

test("DFS uses newPairs ++ tail OPEN and finds the expected path", () => {
  const ex = createExecution({ algorithmId: "dfs", graph: branching, start: "K", goal: "P" });
  const events = ex.getEvents();
  assert.ok(events.some((e) => e.statement === "OPEN ← newPairs ++ (tail OPEN)"));
  ex.runToEnd();
  assert.equal(ex.getState().status, "success");
  assert.deepEqual(ex.getState().result, ["K", "E", "P"]);
});

test("BFS uses tail OPEN ++ newPairs and finds the expected path", () => {
  const ex = createExecution({ algorithmId: "bfs", graph: branching, start: "K", goal: "P" });
  const events = ex.getEvents();
  assert.ok(events.some((e) => e.statement === "OPEN ← (tail OPEN) ++ newPairs"));
  ex.runToEnd();
  assert.equal(ex.getState().status, "success");
  assert.deepEqual(ex.getState().result, ["K", "E", "P"]);
});

test("DFS and BFS have different OPEN states after expanding start", () => {
  const dfs = createExecution({ algorithmId: "dfs", graph: branching, start: "K", goal: "P" }).getEvents();
  const bfs = createExecution({ algorithmId: "bfs", graph: branching, start: "K", goal: "P" }).getEvents();
  const dfsOpen = dfs.find((e) => e.statement === "OPEN ← newPairs ++ (tail OPEN)").after.variables.OPEN;
  const bfsOpen = bfs.find((e) => e.statement === "OPEN ← (tail OPEN) ++ newPairs").after.variables.OPEN;
  assert.deepEqual(dfsOpen.map((p) => p.node), ["E", "F"]);
  assert.deepEqual(bfsOpen.map((p) => p.node), ["E", "F"]);
  // A branching graph with two children preserves order in both; later expansions distinguish them.
  assert.notDeepEqual(
    dfs.filter((e) => e.statement === "nodePair ← head OPEN").map((e) => e.after.currentNode),
    bfs.filter((e) => e.statement === "nodePair ← head OPEN").map((e) => e.after.currentNode)
  );
});

test("Simple Search-1 succeeds and returns the goal node", () => {
  const ex = createExecution({ algorithmId: "simple-search-1", graph: branching, start: "K", goal: "P" });
  ex.runToEnd();
  assert.equal(ex.getState().status, "success");
  assert.equal(ex.getState().result, "P");
});

test("Simple Search-2 terminates on an unreachable goal", () => {
  const graph = defaultGraphs.find((g) => g.id === "unreachable");
  const ex = createExecution({ algorithmId: "simple-search-2", graph, start: "S", goal: "Z" });
  ex.runToEnd();
  assert.equal(ex.getState().status, "failure");
  assert.equal(ex.getState().result, null);
});

test("DFID-N finds a goal and exposes depth-bound variables", () => {
  const ex = createExecution({ algorithmId: "dfid-n", graph: branching, start: "K", goal: "P" });
  ex.runToEnd();
  assert.equal(ex.getState().status, "success");
  assert.deepEqual(ex.getState().result, ["K", "E", "P"]);
  assert.ok(ex.getEvents().some((e) => e.after.variables.depthBound !== undefined));
});

test("DFID-C passes an empty CLOSED argument to RemoveSeen", () => {
  const ex = createExecution({ algorithmId: "dfid-c", graph: branching, start: "K", goal: "P" });
  const event = ex.getEvents().find((e) => e.statement === "newNodes ← RemoveSeen(neighbours, OPEN, [])");
  assert.ok(event);
  assert.deepEqual(event.after.variables.removeSeenClosedArgument, []);
});

test("execution navigation replays immutable snapshots", () => {
  const ex = createExecution({ algorithmId: "bfs", graph: branching, start: "K", goal: "P" });
  const initial = ex.getState();
  ex.stepForward();
  assert.notEqual(ex.getCursor(), 0);
  ex.stepBackward();
  assert.equal(ex.getCursor(), 0);
  assert.deepEqual(ex.getState(), initial);
  ex.runToEnd();
  assert.equal(ex.getState().status, "success");
  ex.reset();
  assert.equal(ex.getState().status, "running");
});

test("invalid start node is rejected", () => {
  assert.throws(() => createExecution({
    algorithmId: "dfs", graph: branching, start: "NOT-A-NODE", goal: "P"
  }), /Unknown start node/);
});

test("IITM 7-node search graph finds path to goal G with DFS and BFS", () => {
  const g7 = defaultGraphs.find((g) => g.id === "iitm-7node");
  assert.ok(g7);
  const dfsEx = createExecution({ algorithmId: "dfs", graph: g7, start: "S", goal: "G" });
  dfsEx.runToEnd();
  assert.equal(dfsEx.getState().status, "success");
  assert.equal(dfsEx.getState().result[0], "S");
  assert.equal(dfsEx.getState().result.at(-1), "G");

  const bfsEx = createExecution({ algorithmId: "bfs", graph: g7, start: "S", goal: "G" });
  bfsEx.runToEnd();
  assert.equal(bfsEx.getState().status, "success");
  assert.equal(bfsEx.getState().result[0], "S");
  assert.equal(bfsEx.getState().result.at(-1), "G");
});

test("IITM Binary Search Tree finds depth-3 goal G with BFS and DFID-N", () => {
  const tree = defaultGraphs.find((g) => g.id === "iitm-binary-tree");
  assert.ok(tree);
  const bfsEx = createExecution({ algorithmId: "bfs", graph: tree, start: "S", goal: "G" });
  bfsEx.runToEnd();
  assert.equal(bfsEx.getState().status, "success");
  assert.deepEqual(bfsEx.getState().result, ["S", "B", "F", "G"]);

  const dfidEx = createExecution({ algorithmId: "dfid-n", graph: tree, start: "S", goal: "G" });
  dfidEx.runToEnd();
  assert.equal(dfidEx.getState().status, "success");
  assert.deepEqual(dfidEx.getState().result, ["S", "B", "F", "G"]);
});
