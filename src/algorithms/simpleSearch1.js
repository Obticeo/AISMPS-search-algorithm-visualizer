import { createContext, finish } from "./common.js";

export function runSimpleSearch1(config) {
  const ctx = createContext({
    ...config, algorithmId: "simple-search-1",
    initialVariables: { OPEN: [config.start] }
  });
  const { emit, recorder } = ctx;
  let OPEN = [config.start];
  emit({ line: 1, operation: "assign", statement: "OPEN ← {S}", explanation: "Initialize OPEN with S.", patch: { variables: { OPEN } }, changed: ["OPEN"] });

  while (OPEN.length > 0) {
    const N = OPEN[0]; // Explicit deterministic policy for the source's "pick some node".
    emit({ line: 3, operation: "assign", statement: "Pick some node N from OPEN", explanation: `Deterministic application policy selects the first OPEN item: ${N}.`, patch: { currentNode: N, variables: { OPEN, N } }, changed: ["N"] });
    OPEN = OPEN.filter((node) => node !== N);
    emit({ line: 4, operation: "assign", statement: "OPEN ← OPEN − {N}", explanation: `Remove ${N} from OPEN.`, patch: { variables: { OPEN, N } }, changed: ["OPEN"] });
    const goal = N === config.goal;
    emit({ line: 5, operation: "condition", statement: "if GoalTest(N) = TRUE", explanation: `GoalTest(${N}) is ${goal}.`, patch: { variables: { OPEN, N, goalTest: goal } }, changed: ["goalTest"] });
    if (goal) {
      finish(ctx, "success", N, 6, "return N", `Goal node ${N} found.`);
      return recorder.getEvents();
    }
    const neighbours = ctx.moveGen(N);
    emit({ line: 7, operation: "call", statement: "OPEN ← OPEN ∪ MoveGen(N)", explanation: `MoveGen(${N}) returned [${neighbours.join(", ")}].`, patch: { currentNeighbours: neighbours, variables: { OPEN, N, neighbours } }, changed: ["neighbours"] });
    // Set union semantics: preserve existing OPEN members and add only absent nodes.
    for (const node of neighbours) if (!OPEN.includes(node)) OPEN.push(node);
    emit({ line: 7, operation: "assign", statement: "OPEN ← OPEN ∪ MoveGen(N)", explanation: `OPEN now contains [${OPEN.join(", ")}] under the documented insertion-order policy.`, patch: { variables: { OPEN, N, neighbours } }, changed: ["OPEN"] });
  }
  finish(ctx, "failure", null, 8, "return null", "OPEN is empty; no goal was found.");
  return recorder.getEvents();
}
