/**
 * Beam-Search(S, w)
 * Week 3 notes §4.1 — pseudocode reproduced exactly.
 *
 * OPEN stores plain node names (not pairs). No CLOSED list.
 * Move-Gen(OPEN) generates all neighbours of all nodes in OPEN (preserving duplicates).
 * take(w, sort_h(neighbours)) keeps the best w nodes.
 * Terminates when goal found in OPEN, or h stops improving.
 *
 * Line numbers match the 12-line pseudocode in the notes.
 */
import { createContext, finish } from "./common.js";
import { sortNodesByH } from "../engine/helpers.js";

/** take(n, list): first n elements, or the whole list if shorter (§4.3). */
function take(n, list) {
  return list.slice(0, n);
}

/**
 * Move-Gen(OPEN) §4.2: concatenate MoveGen(X) for each X in OPEN.
 * Duplicates are preserved as the pseudocode specifies.
 */
function moveGenFromBeam(openList, ctx) {
  let neighbours = [];
  for (const X of openList) {
    neighbours = [...neighbours, ...ctx.moveGen(X)];
  }
  return neighbours;
}

export function runBeamSearch(config) {
  const hFn = config.hFunction ?? (() => 0);
  const w   = config.beamWidth ?? 3;

  const ctx = createContext({
    ...config,
    algorithmId: "beam-search",
    initialVariables: { OPEN: [config.start], N: config.start, bestEver: null, w, "h(N)": hFn(config.start), "h(bestEver)": null }
  });
  const { emit, recorder } = ctx;

  let OPEN    = [config.start];
  let N       = config.start;
  let bestEver = null;

  // Line 1: OPEN ← [S]
  emit({
    line: 1, operation: "assign",
    statement: "OPEN ← [S]",
    explanation: `Initialise beam OPEN = [${config.start}].`,
    patch: { currentNode: N, variables: { OPEN, N, bestEver, w } }, changed: ["OPEN"]
  });

  // Line 2: N ← S
  emit({
    line: 2, operation: "assign",
    statement: "N ← S",
    explanation: `Set N = ${N} (h=${hFn(N)}).`,
    patch: { currentNode: N, variables: { OPEN, N, bestEver, w, "h(N)": hFn(N) } }, changed: ["N"]
  });

  // do-while (lines 3–11)
  do {
    // Line 4: bestEver ← N
    bestEver = N;
    emit({
      line: 4, operation: "assign",
      statement: "bestEver ← N",
      explanation: `bestEver = ${bestEver} (h=${hFn(bestEver)}).`,
      patch: { currentNode: N, variables: { OPEN, N, bestEver, w, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver) } },
      changed: ["bestEver"]
    });

    // Line 5: if OPEN contains goal node
    const goalInOpen = OPEN.includes(config.goal);
    emit({
      line: 5, operation: "condition",
      statement: "if OPEN contains goal node",
      explanation: `OPEN = [${OPEN.join(", ")}]. Contains ${config.goal}? ${goalInOpen}.`,
      patch: { variables: { OPEN, N, bestEver, w, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver), goalInOpen } },
      changed: ["goalInOpen"]
    });

    if (goalInOpen) {
      // Line 6: return that goal node
      emit({
        line: 6, operation: "return",
        statement: "return goal node",
        explanation: `Goal ${config.goal} found in OPEN. Returning.`,
        patch: { variables: { OPEN, N, bestEver, w } }, changed: []
      });
      finish(ctx, "success", [config.goal], 6, "return goal node", `Goal ${config.goal} found in beam.`);
      return recorder.getEvents();
    }

    // Line 8: neighbours ← Move-Gen(OPEN)
    const neighbours = moveGenFromBeam(OPEN, ctx);
    emit({
      line: 8, operation: "assign",
      statement: "neighbours ← Move-Gen(OPEN)",
      explanation: `Generated ${neighbours.length} neighbour(s) (with duplicates): [${neighbours.join(", ")}].`,
      patch: { currentNeighbours: neighbours, variables: { OPEN, N, bestEver, w, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver), neighbours } },
      changed: ["neighbours"]
    });

    if (neighbours.length === 0) {
      // Can't expand — stuck
      emit({
        line: 12, operation: "return",
        statement: "return bestEver",
        explanation: `No neighbours generated. Beam exhausted. Returning ${bestEver}.`,
        patch: { variables: { OPEN, N, bestEver, w } }, changed: []
      });
      finish(ctx, "failure", [bestEver], 12, "return bestEver", "No neighbours — beam exhausted.");
      return recorder.getEvents();
    }

    // Line 9: OPEN ← take(w, sort_h(neighbours))
    const sortedNeighbours = sortNodesByH(neighbours, hFn);
    OPEN = take(w, sortedNeighbours);
    emit({
      line: 9, operation: "assign",
      statement: "OPEN ← take(w, sort_h(neighbours))",
      explanation: `sort_h → [${sortedNeighbours.map(n => `${n}(h=${hFn(n)})`).join(", ")}]. take(${w}) → [${OPEN.join(", ")}].`,
      patch: { variables: { OPEN, N, bestEver, w, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver) } },
      changed: ["OPEN"]
    });

    // Line 10: N ← head(OPEN)
    N = OPEN[0];
    emit({
      line: 10, operation: "assign",
      statement: "N ← head(OPEN)",
      explanation: `Best in new beam: N = ${N} (h=${hFn(N)}).`,
      patch: { currentNode: N, variables: { OPEN, N, bestEver, w, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver) } },
      changed: ["N"]
    });

    // Line 11: while h(N) is better than h(bestEver)
    const better = hFn(N) < hFn(bestEver);
    emit({
      line: 11, operation: "condition",
      statement: "while h(N) is better than h(bestEver)",
      explanation: `h(${N})=${hFn(N)} ${better ? "<" : "≥"} h(${bestEver})=${hFn(bestEver)} → ${better ? "continue" : "stop"}.`,
      patch: { variables: { OPEN, N, bestEver, w, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver) } },
      changed: []
    });

  } while (hFn(N) < hFn(bestEver));

  // Line 12: return bestEver
  emit({
    line: 12, operation: "return",
    statement: "return bestEver",
    explanation: `h stagnated. Returning ${bestEver} (h=${hFn(bestEver)}).`,
    patch: { variables: { OPEN, N, bestEver, w, "h(N)": hFn(N), "h(bestEver)": hFn(bestEver) } },
    changed: []
  });
  finish(ctx, "success", [bestEver], 12, "return bestEver", `Beam stagnated at ${bestEver}.`);
  return recorder.getEvents();
}
