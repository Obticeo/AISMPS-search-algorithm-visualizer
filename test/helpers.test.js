import test from "node:test";
import assert from "node:assert/strict";
import { makePairs, makeDepthPairs, removeSeen, reconstructPath, reconstructDepthPath } from "../src/engine/helpers.js";

test("MakePairs preserves input order", () => {
  assert.deepEqual(makePairs(["E", "F", "G"], "K"), [
    { node: "E", parent: "K" },
    { node: "F", parent: "K" },
    { node: "G", parent: "K" }
  ]);
});

test("depth MakePairs preserves input order and depth", () => {
  assert.deepEqual(makeDepthPairs(["E", "F"], "K", 2), [
    { node: "E", parent: "K", depth: 2 },
    { node: "F", parent: "K", depth: 2 }
  ]);
});

test("RemoveSeen preserves order and filters OPEN/CLOSED membership", () => {
  const open = [{ node: "B", parent: "A" }];
  const closed = [{ node: "C", parent: "A" }];
  assert.deepEqual(removeSeen(["D", "B", "E", "C"], open, closed), ["D", "E"]);
});

test("ReconstructPath follows ordered CLOSED parent pairs", () => {
  const closed = [
    { node: "B", parent: "A" },
    { node: "A", parent: null }
  ];
  assert.deepEqual(reconstructPath({ node: "G", parent: "B" }, closed), ["A", "B", "G"]);
});

test("depth-aware path reconstruction respects parent depth", () => {
  const closed = [
    { node: "B", parent: "A", depth: 1 },
    { node: "A", parent: null, depth: 0 }
  ];
  assert.deepEqual(reconstructDepthPath({ node: "G", parent: "B", depth: 2 }, closed), ["A", "B", "G"]);
});
