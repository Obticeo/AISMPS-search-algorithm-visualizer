/**
 * Best-First-Search(S)
 * Week 3 notes §3.1 — pseudocode reproduced exactly.
 *
 * OPEN stores triples (node, parent, h).
 * sort_h sorts ascending by h; alphabetical tie-break (§2).
 * Goal node always has h = 0 (computed externally from gridPositions).
 */
import { createContext, finish } from "./common.js";
import { removeSeen, reconstructPath, makeHPairs, sortByH } from "../engine/helpers.js";

export function runBestFirstSearch(config) {
  const hFn = config.hFunction ?? (() => 0);

  const initOPEN = [{ node: config.start, parent: null, h: hFn(config.start) }];
  const ctx = createContext({
    ...config,
    algorithmId: "best-first-search",
    initialVariables: { OPEN: initOPEN, CLOSED: [] }
  });
  const { emit, recorder } = ctx;

  let OPEN   = [{ node: config.start, parent: null, h: hFn(config.start) }];
  let CLOSED = [];

  // Line 1
  emit({
    line: 1, operation: "assign",
    statement: "OPEN ← [(S, null, h(S))]",
    explanation: `Initialise OPEN with start triple (${config.start}, null, h=${hFn(config.start)}).`,
    patch: { variables: { OPEN, CLOSED } }, changed: ["OPEN"]
  });
  // Line 2
  emit({
    line: 2, operation: "assign",
    statement: "CLOSED ← empty list",
    explanation: "Initialise CLOSED as an empty ordered list.",
    patch: { variables: { OPEN, CLOSED } }, changed: ["CLOSED"]
  });

  while (OPEN.length > 0) {
    // Line 4
    const nodePair = OPEN[0];
    emit({
      line: 4, operation: "assign",
      statement: "nodePair ← head(OPEN)",
      explanation: `Select head: (${nodePair.node}, ${nodePair.parent ?? "null"}, h=${nodePair.h}).`,
      patch: { currentPair: nodePair, currentNode: nodePair.node, variables: { OPEN, CLOSED, nodePair } },
      changed: ["nodePair"]
    });

    // Line 5
    const N = nodePair.node;
    emit({
      line: 5, operation: "assign",
      statement: "(N, _, _) ← nodePair",
      explanation: `Extract node N = ${N}.`,
      patch: { variables: { OPEN, CLOSED, nodePair, N } }, changed: ["N"]
    });

    // Line 6
    const isGoal = N === config.goal;
    emit({
      line: 6, operation: "condition",
      statement: "if GoalTest(N) = true",
      explanation: `GoalTest(${N}) = ${isGoal}.`,
      patch: { variables: { OPEN, CLOSED, nodePair, N, goalTest: isGoal } }, changed: ["goalTest"]
    });

    if (isGoal) {
      // Line 7
      const path = reconstructPath(nodePair, CLOSED);
      emit({
        line: 7, operation: "call",
        statement: "return ReconstructPath(nodePair, CLOSED)",
        explanation: `Path: ${path.join(" → ")}.`,
        patch: { variables: { OPEN, CLOSED, nodePair, N, path } }, changed: ["path"]
      });
      finish(ctx, "success", path, 7, "return ReconstructPath(nodePair, CLOSED)", "Goal found.");
      return recorder.getEvents();
    }

    // Line 9 (else branch)
    CLOSED = [nodePair, ...CLOSED];
    emit({
      line: 9, operation: "assign",
      statement: "CLOSED ← nodePair : CLOSED",
      explanation: "Prepend current triple to CLOSED.",
      patch: { variables: { OPEN, CLOSED, nodePair, N } }, changed: ["CLOSED"]
    });

    // Line 10
    const neighbours = ctx.moveGen(N);
    emit({
      line: 10, operation: "assign",
      statement: "neighbours ← MoveGen(N)",
      explanation: `Neighbours in order: [${neighbours.join(", ")}].`,
      patch: { currentNeighbours: neighbours, variables: { OPEN, CLOSED, nodePair, N, neighbours } },
      changed: ["neighbours"]
    });

    // Line 11
    const newNodes = removeSeen(neighbours, OPEN, CLOSED);
    emit({
      line: 11, operation: "assign",
      statement: "newNodes ← RemoveSeen(neighbours, OPEN, CLOSED)",
      explanation: `Unseen nodes: [${newNodes.join(", ")}].`,
      patch: { variables: { OPEN, CLOSED, nodePair, N, neighbours, newNodes } }, changed: ["newNodes"]
    });

    // Line 12
    const newPairs = makeHPairs(newNodes, N, hFn);
    emit({
      line: 12, operation: "assign",
      statement: "newPairs ← MakePairs(newNodes, N)",
      explanation: `Triples: [${newPairs.map(p => `(${p.node},h=${p.h})`).join(", ")}].`,
      patch: { variables: { OPEN, CLOSED, nodePair, N, neighbours, newNodes, newPairs } },
      changed: ["newPairs"]
    });

    // Line 13: OPEN ← sort_h(newPairs ++ tail(OPEN))
    OPEN = sortByH([...newPairs, ...OPEN.slice(1)]);
    emit({
      line: 13, operation: "assign",
      statement: "OPEN ← sort_h(newPairs ++ tail(OPEN))",
      explanation: `Sorted OPEN by h↑. Head: (${OPEN[0]?.node}, h=${OPEN[0]?.h}).`,
      patch: { variables: { OPEN, CLOSED, nodePair, N, neighbours, newNodes, newPairs } },
      changed: ["OPEN"]
    });
  }

  // Line 14
  finish(ctx, "failure", [], 14, "return empty list", "OPEN exhausted; no path found.");
  return recorder.getEvents();
}
