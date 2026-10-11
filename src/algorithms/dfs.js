import { createContext, finish } from "./common.js";
import { makePairs, removeSeen, reconstructPath } from "../engine/helpers.js";

export function runDFS(config) {
  const ctx = createContext({
    ...config, algorithmId: "dfs",
    initialVariables: { OPEN: [{ node: config.start, parent: null }], CLOSED: [] }
  });
  const { emit, recorder } = ctx;
  let OPEN = [{ node: config.start, parent: null }];
  let CLOSED = [];

  emit({ line: 1, operation: "assign", statement: "OPEN ← (S, null) : []", explanation: "Initialize OPEN with the start node-parent pair.", patch: { variables: { OPEN, CLOSED } }, changed: ["OPEN"] });
  emit({ line: 2, operation: "assign", statement: "CLOSED ← empty list", explanation: "Initialize CLOSED as an empty ordered list.", patch: { variables: { OPEN, CLOSED } }, changed: ["CLOSED"] });

  while (OPEN.length > 0) {
    const nodePair = OPEN[0];
    emit({ line: 4, operation: "assign", statement: "nodePair ← head OPEN", explanation: `Select the head pair (${nodePair.node}, ${nodePair.parent ?? "null"}).`, patch: { currentPair: nodePair, currentNode: nodePair.node, variables: { OPEN, CLOSED, nodePair } }, changed: ["nodePair"] });
    const N = nodePair.node;
    emit({ line: 5, operation: "assign", statement: "(N, _) ← nodePair", explanation: `Extract N = ${N}.`, patch: { variables: { OPEN, CLOSED, nodePair, N } }, changed: ["N"] });

    const goal = N === config.goal;
    emit({ line: 6, operation: "condition", statement: "if GoalTest(N) = TRUE", explanation: `GoalTest(${N}) is ${goal}.`, patch: { variables: { OPEN, CLOSED, nodePair, N, goalTest: goal } }, changed: ["goalTest"] });
    if (goal) {
      const path = reconstructPath(nodePair, CLOSED);
      emit({ line: 7, operation: "call", statement: "return ReconstructPath(nodePair, CLOSED)", explanation: `Reconstructed path: ${path.join(" → ")}.`, patch: { variables: { OPEN, CLOSED, nodePair, N, goalTest: goal, path } }, changed: ["path"] });
      finish(ctx, "success", path, 7, "return ReconstructPath(nodePair, CLOSED)", "Goal found.");
      return recorder.getEvents();
    }

    CLOSED = [nodePair, ...CLOSED];
    emit({ line: 8, operation: "assign", statement: "CLOSED ← nodePair : CLOSED", explanation: "Prepend the current pair to CLOSED.", patch: { variables: { OPEN, CLOSED, nodePair, N } }, changed: ["CLOSED"] });
    const neighbours = ctx.moveGen(N);
    emit({ line: 9, operation: "assign", statement: "neighbours ← MoveGen(N)", explanation: `Neighbors in configured order: [${neighbours.join(", ")}].`, patch: { currentNeighbours: neighbours, variables: { OPEN, CLOSED, nodePair, N, neighbours } }, changed: ["neighbours"] });
    const newNodes = removeSeen(neighbours, OPEN, CLOSED);
    emit({ line: 10, operation: "assign", statement: "newNodes ← RemoveSeen(neighbours, OPEN, CLOSED)", explanation: `Retained nodes in original order: [${newNodes.join(", ")}].`, patch: { variables: { OPEN, CLOSED, nodePair, N, neighbours, newNodes } }, changed: ["newNodes"] });
    const newPairs = makePairs(newNodes, N);
    emit({ line: 11, operation: "assign", statement: "newPairs ← MakePairs(newNodes, N)", explanation: "Create node-parent pairs preserving newNodes order.", patch: { variables: { OPEN, CLOSED, nodePair, N, neighbours, newNodes, newPairs } }, changed: ["newPairs"] });
    OPEN = [...newPairs, ...OPEN.slice(1)];
    emit({ line: 12, operation: "assign", statement: "OPEN ← newPairs ++ (tail OPEN)", explanation: "Place newPairs before the previous OPEN tail, preserving both list orders.", patch: { variables: { OPEN, CLOSED, nodePair, N, neighbours, newNodes, newPairs } }, changed: ["OPEN"] });
  }
  finish(ctx, "failure", [], 13, "return empty list", "OPEN is empty; no path was found.");
  return recorder.getEvents();
}
