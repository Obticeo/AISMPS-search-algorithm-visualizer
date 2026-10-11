import { moveGen } from "../engine/graph.js";
import { deepClone } from "../engine/clone.js";
import { EventRecorder } from "../engine/recorder.js";

export function initialState(algorithmId, start, goal, variables, status = "running") {
  return {
    algorithmId, start, goal, status, result: null,
    variables: deepClone(variables),
    currentNode: null,
    currentPair: null,
    currentNeighbours: [],
    currentLine: null,
    callStack: []
  };
}

export function createContext({ algorithmId, graph, start, goal, initialVariables }) {
  const recorder = new EventRecorder(initialState(algorithmId, start, goal, initialVariables));
  let state = initialState(algorithmId, start, goal, initialVariables);
  const emit = ({ line, operation, statement, explanation, patch = {}, changed = [] }) => {
    const before = deepClone(state);
    state = { ...state, ...deepClone(patch), currentLine: line };
    const after = deepClone(state);
    recorder.record({
      sourceLine: line, operation, statement, explanation,
      before, after, changedVariables: changed
    });
  };
  return {
    graph, start, goal, recorder, emit,
    get state() { return state; },
    set state(next) { state = deepClone(next); },
    moveGen(node) { return moveGen(graph, node); }
  };
}

export function finish(ctx, status, result, line, statement, explanation) {
  ctx.emit({
    line, operation: "return", statement, explanation,
    patch: { status, result },
    changed: ["status", "result"]
  });
}
