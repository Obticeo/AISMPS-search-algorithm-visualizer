/**
 * Hill-Climbing(S)
 * Week 3 notes §3.2 — pseudocode reproduced exactly.
 *
 * Local search: no OPEN/CLOSED lists. Moves to the best neighbour as long as
 * it strictly improves h. Terminates at a local optimum (or the goal).
 *
 * Note: "better than" = lower h (ascending sort, lower distance = better).
 * Line numbers match the 6-line pseudocode in the notes.
 */
import { createContext, finish } from "./common.js";
import { sortByH } from "../engine/helpers.js";

export function runHillClimbing(config) {
  const hFn = config.hFunction ?? (() => 0);

  const ctx = createContext({
    ...config,
    algorithmId: "hill-climbing",
    initialVariables: { N: config.start, bestEver: null, "h(N)": hFn(config.start), "h(bestEver)": null }
  });
  const { emit, recorder } = ctx;

  let N = config.start;
  let bestEver = null;

  // Line 1: N ← S
  emit({
    line: 1, operation: "assign",
    statement: "N ← S",
    explanation: `Set N = ${N} (h=${hFn(N)}).`,
    patch: { currentNode: N, variables: { N, bestEver, "h(N)": hFn(N), "h(bestEver)": null } },
    changed: ["N"]
  });

  // do-while (lines 2–5)
  do {
    // Line 3: bestEver ← N
    bestEver = N;
    emit({
      line: 3, operation: "assign",
      statement: "bestEver ← N",
      explanation: `bestEver = ${bestEver} (h=${hFn(bestEver)}).`,
      patch: { currentNode: N, variables: { N, bestEver, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver) } },
      changed: ["bestEver"]
    });

    // Line 4: N ← head(sort_h(MoveGen(bestEver)))
    const neighbours = ctx.moveGen(bestEver);
    if (neighbours.length === 0) {
      // Stuck — no neighbours; return bestEver (local optimum by default)
      emit({
        line: 4, operation: "assign",
        statement: "N ← head(sort_h(MoveGen(bestEver)))",
        explanation: `MoveGen(${bestEver}) = [] — no neighbours. Stuck.`,
        patch: { currentNeighbours: [], variables: { N, bestEver, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver), neighbours: [] } },
        changed: ["neighbours"]
      });
      // Line 6: return bestEver
      emit({
        line: 6, operation: "return",
        statement: "return bestEver",
        explanation: `No neighbours — returning local optimum ${bestEver} (h=${hFn(bestEver)}).`,
        patch: { variables: { N, bestEver, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver) } },
        changed: []
      });
      finish(ctx, "success", [bestEver], 6, "return bestEver", `Stuck at ${bestEver}; no neighbours.`);
      return recorder.getEvents();
    }

    const sorted = sortByH(neighbours.map(node => ({ node, h: hFn(node) })));
    N = sorted[0].node;
    emit({
      line: 4, operation: "assign",
      statement: "N ← head(sort_h(MoveGen(bestEver)))",
      explanation: `Sorted neighbours by h↑: [${sorted.map(p => `${p.node}(h=${p.h})`).join(", ")}]. Head → N = ${N}.`,
      patch: {
        currentNode: N,
        currentNeighbours: neighbours,
        variables: { N, bestEver, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver), neighbours }
      },
      changed: ["N", "neighbours"]
    });

    // Line 5: while h(N) is better than h(bestEver)
    const better = hFn(N) < hFn(bestEver);
    emit({
      line: 5, operation: "condition",
      statement: "while h(N) is better than h(bestEver)",
      explanation: `h(${N})=${hFn(N)} ${better ? "<" : "≥"} h(${bestEver})=${hFn(bestEver)} → ${better ? "loop again" : "stop"}.`,
      patch: { variables: { N, bestEver, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver) } },
      changed: []
    });

  } while (hFn(N) < hFn(bestEver));

  // Line 6: return bestEver
  emit({
    line: 6, operation: "return",
    statement: "return bestEver",
    explanation: `Local optimum reached. Returning ${bestEver} (h=${hFn(bestEver)}).`,
    patch: { variables: { N, bestEver, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver) } },
    changed: []
  });
  finish(ctx, "success", [bestEver], 6, "return bestEver", `Local optimum: ${bestEver}.`);
  return recorder.getEvents();
}
