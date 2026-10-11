import { createContext, finish } from "./common.js";

export function runSimpleSearch2(config) {
  const ctx = createContext({
    ...config, algorithmId: "simple-search-2",
    initialVariables: { OPEN: [config.start], CLOSED: [] }
  });
  const { emit, recorder } = ctx;
  let OPEN = [config.start];
  let CLOSED = [];
  emit({ line: 1, operation: "assign", statement: "OPEN ← {S}", explanation: "Initialize OPEN with S.", patch: { variables: { OPEN, CLOSED } }, changed: ["OPEN"] });
  emit({ line: 2, operation: "assign", statement: "CLOSED ← empty set", explanation: "Initialize CLOSED.", patch: { variables: { OPEN, CLOSED } }, changed: ["CLOSED"] });

  while (OPEN.length > 0) {
    const N = OPEN[0];
    emit({ line: 4, operation: "assign", statement: "Pick some node N from OPEN", explanation: `Deterministic application policy selects the first OPEN item: ${N}.`, patch: { currentNode: N, variables: { OPEN, CLOSED, N } }, changed: ["N"] });
    OPEN = OPEN.filter((node) => node !== N);
    emit({ line: 5, operation: "assign", statement: "OPEN ← OPEN − {N}", explanation: `Remove ${N} from OPEN.`, patch: { variables: { OPEN, CLOSED, N } }, changed: ["OPEN"] });
    if (!CLOSED.includes(N)) CLOSED.push(N);
    emit({ line: 6, operation: "assign", statement: "CLOSED ← CLOSED ∪ {N}", explanation: `Add ${N} to CLOSED.`, patch: { variables: { OPEN, CLOSED, N } }, changed: ["CLOSED"] });
    const goal = N === config.goal;
    emit({ line: 7, operation: "condition", statement: "if GoalTest(N) = TRUE", explanation: `GoalTest(${N}) is ${goal}.`, patch: { variables: { OPEN, CLOSED, N, goalTest: goal } }, changed: ["goalTest"] });
    if (goal) {
      finish(ctx, "success", N, 8, "return N", `Goal node ${N} found.`);
      return recorder.getEvents();
    }
    const neighbours = ctx.moveGen(N);
    emit({ line: 9, operation: "call", statement: "OPEN ← OPEN ∪ (MoveGen(N) − CLOSED)", explanation: `MoveGen(${N}) returned [${neighbours.join(", ")}].`, patch: { currentNeighbours: neighbours, variables: { OPEN, CLOSED, N, neighbours } }, changed: ["neighbours"] });
    const candidates = neighbours.filter((node) => !CLOSED.includes(node));
    emit({ line: 9, operation: "assign", statement: "MoveGen(N) − CLOSED", explanation: `Candidates after CLOSED filtering: [${candidates.join(", ")}].`, patch: { variables: { OPEN, CLOSED, N, neighbours, candidates } }, changed: ["candidates"] });
    for (const node of candidates) if (!OPEN.includes(node)) OPEN.push(node);
    emit({ line: 9, operation: "assign", statement: "OPEN ← OPEN ∪ (MoveGen(N) − CLOSED)", explanation: `OPEN now contains [${OPEN.join(", ")}] under the documented insertion-order policy.`, patch: { variables: { OPEN, CLOSED, N, neighbours, candidates } }, changed: ["OPEN"] });
  }
  finish(ctx, "failure", null, 10, "return null", "OPEN is empty; no goal was found.");
  return recorder.getEvents();
}
