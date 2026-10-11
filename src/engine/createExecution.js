import { algorithms } from "../algorithms/index.js";
import { validateGraph } from "./graph.js";

export function createExecution({ algorithmId, graph, start, goal }) {
  validateGraph(graph, start, goal);
  const runner = algorithms[algorithmId];
  if (!runner) throw new Error(`Unknown algorithm: ${algorithmId}`);

  const events = runner({ graph, start, goal });
  let cursor = 0;

  return {
    getEvents: () => [...events],
    getCursor: () => cursor,
    getState: () => events[cursor].after,
    canStepForward: () => cursor < events.length - 1,
    canStepBackward: () => cursor > 0,
    stepForward() {
      if (cursor < events.length - 1) cursor += 1;
      return events[cursor].after;
    },
    stepBackward() {
      if (cursor > 0) cursor -= 1;
      return events[cursor].after;
    },
    reset() {
      cursor = 0;
      return events[cursor].after;
    },
    runToEnd() {
      cursor = events.length - 1;
      return events[cursor].after;
    },
    seek(index) {
      if (!Number.isInteger(index) || index < 0 || index >= events.length) {
        throw new RangeError(`Invalid event index: ${index}`);
      }
      cursor = index;
      return events[cursor].after;
    }
  };
}
