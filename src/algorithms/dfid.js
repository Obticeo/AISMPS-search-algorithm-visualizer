import { createContext, finish } from "./common.js";
import { makeDepthPairs, removeSeen, reconstructDepthPath } from "../engine/helpers.js";

function runDepthLimited(config, variant, depthBound, outerContext) {
  let count = 0;
  let OPEN = [{ node: config.start, parent: null, depth: 0 }];
  let CLOSED = [];
  const emit = outerContext.emit;

  emit({ line: 10, operation: "assign", statement: "count ← 0", explanation: `Begin ${variant} depth-limited search at bound ${depthBound}.`, patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound } }, changed: ["count"] });
  emit({ line: 11, operation: "assign", statement: "OPEN ← (S, null, 0) : []", explanation: "Initialize OPEN with the start triple.", patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound } }, changed: ["OPEN"] });
  emit({ line: 12, operation: "assign", statement: "CLOSED ← empty list", explanation: "Initialize CLOSED as an empty list for this depth-bound iteration.", patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound } }, changed: ["CLOSED"] });

  while (OPEN.length > 0) {
    const nodePair = OPEN[0];
    const N = nodePair.node;
    const depth = nodePair.depth;
    emit({ line: 14, operation: "assign", statement: "nodePair ← head OPEN", explanation: `Select (${N}, ${nodePair.parent ?? "null"}, ${depth}).`, patch: { currentPair: nodePair, currentNode: N, variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair } }, changed: ["nodePair"] });
    emit({ line: 15, operation: "assign", statement: "(N, _, depth) ← nodePair", explanation: `Extract N = ${N}, depth = ${depth}.`, patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth } }, changed: ["N", "depth"] });
    const goal = N === config.goal;
    emit({ line: 16, operation: "condition", statement: "if GoalTest(N) = TRUE", explanation: `GoalTest(${N}) is ${goal}.`, patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth, goalTest: goal } }, changed: ["goalTest"] });
    if (goal) {
      const path = reconstructDepthPath(nodePair, CLOSED);
      emit({ line: 17, operation: "return", statement: "return (count, ReconstructPath(nodePair, CLOSED))", explanation: `Depth-limited search found ${path.join(" → ")}.`, patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth, path } }, changed: ["path"] });
      return { count, path };
    }

    CLOSED = [nodePair, ...CLOSED];
    emit({ line: 18, operation: "assign", statement: "CLOSED ← nodePair : CLOSED", explanation: "Prepend the current triple to CLOSED.", patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth } }, changed: ["CLOSED"] });
    if (depth < depthBound) {
      const neighbours = outerContext.moveGen(N);
      emit({ line: 20, operation: "assign", statement: "neighbours ← MoveGen(N)", explanation: `Neighbors: [${neighbours.join(", ")}].`, patch: { currentNeighbours: neighbours, variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth, neighbours } }, changed: ["neighbours"] });
      const closedArgument = variant === "N" ? CLOSED : [];
      const newNodes = removeSeen(neighbours, OPEN, closedArgument);
      emit({ line: 21, operation: "assign", statement: variant === "N" ? "newNodes ← RemoveSeen(neighbours, OPEN, CLOSED)" : "newNodes ← RemoveSeen(neighbours, OPEN, [])", explanation: variant === "N" ? "Filter against OPEN and CLOSED." : "Filter against OPEN and an empty list, as specified for DFID-C.", patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth, neighbours, newNodes, removeSeenClosedArgument: closedArgument } }, changed: ["newNodes"] });
      const newPairs = makeDepthPairs(newNodes, N, depth + 1);
      emit({ line: 22, operation: "assign", statement: "newPairs ← MakePairs(newNodes, N, depth + 1)", explanation: "Create depth-aware triples in newNodes order.", patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth, neighbours, newNodes, newPairs } }, changed: ["newPairs"] });
      OPEN = [...newPairs, ...OPEN.slice(1)];
      emit({ line: 23, operation: "assign", statement: "OPEN ← newPairs ++ tail OPEN", explanation: "Prepend newPairs to the previous OPEN tail.", patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth, neighbours, newNodes, newPairs } }, changed: ["OPEN"] });
      count = count + newPairs.length;
      emit({ line: 24, operation: "assign", statement: "count ← count + length newPairs", explanation: `count is now ${count}.`, patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth, neighbours, newNodes, newPairs } }, changed: ["count"] });
    } else {
      OPEN = OPEN.slice(1);
      emit({ line: 25, operation: "assign", statement: "OPEN ← tail OPEN", explanation: `Depth ${depth} reached the bound; do not expand this node.`, patch: { variables: { ...outerContext.state.variables, count, OPEN, CLOSED, depthBound, nodePair, N, depth } }, changed: ["OPEN"] });
    }
  }
  return { count, path: [] };
}

export function runDFID(config, variant) {
  const algorithmId = variant === "N" ? "dfid-n" : "dfid-c";
  const ctx = createContext({
    ...config, algorithmId,
    initialVariables: { count: -1, path: [], depthBound: 0, previousCount: null, OPEN: [], CLOSED: [] }
  });
  const { emit, recorder } = ctx;
  let count = -1;
  let path = [];
  let depthBound = 0;

  emit({ line: 1, operation: "assign", statement: "count ← -1", explanation: "Initialize count to -1.", patch: { variables: { count, path, depthBound, previousCount: null, OPEN: [], CLOSED: [] } }, changed: ["count"] });
  emit({ line: 2, operation: "assign", statement: "path ← empty list", explanation: "Initialize path.", patch: { variables: { count, path, depthBound, previousCount: null, OPEN: [], CLOSED: [] } }, changed: ["path"] });
  emit({ line: 3, operation: "assign", statement: "depthBound ← 0", explanation: "Begin with depth bound zero.", patch: { variables: { count, path, depthBound, previousCount: null, OPEN: [], CLOSED: [] } }, changed: ["depthBound"] });

  let guard = 0;
  while (true) {
    if (++guard > (config.maxOuterIterations ?? 1000)) throw new Error("DFID iteration guard exceeded.");
    const previousCount = count;
    emit({ line: 5, operation: "assign", statement: "previousCount ← count", explanation: `Save previous count ${count}.`, patch: { variables: { count, path, depthBound, previousCount, OPEN: [], CLOSED: [] } }, changed: ["previousCount"] });
    const result = runDepthLimited(config, variant, depthBound, ctx);
    count = result.count;
    path = result.path;
    emit({ line: 6, operation: "call", statement: variant === "N" ? "(count, path) ← DB-DFS-N(S, depthBound)" : "(count, path) ← DB-DFS-C(S, depthBound)", explanation: `Inner search returned count=${count}, path=[${path.join(", ")}].`, patch: { variables: { count, path, depthBound, previousCount, OPEN: [], CLOSED: [] } }, changed: ["count", "path"] });
    depthBound += 1;
    emit({ line: 7, operation: "assign", statement: "depthBound ← depthBound + 1", explanation: `Increase depth bound to ${depthBound}.`, patch: { variables: { count, path, depthBound, previousCount, OPEN: [], CLOSED: [] } }, changed: ["depthBound"] });

    const stop = path.length > 0 || previousCount === count;
    emit({ line: 8, operation: "condition", statement: "until (path is not empty) or (previousCount = count)", explanation: `Stop condition is ${stop}.`, patch: { variables: { count, path, depthBound, previousCount, OPEN: [], CLOSED: [], stopCondition: stop } }, changed: ["stopCondition"] });
    if (stop) break;
  }
  finish(ctx, path.length ? "success" : "failure", path, 9, "return path", path.length ? `Goal found: ${path.join(" → ")}.` : "No path was found.");
  return recorder.getEvents();
}

export const runDFIDN = (config) => runDFID(config, "N");
export const runDFIDC = (config) => runDFID(config, "C");
