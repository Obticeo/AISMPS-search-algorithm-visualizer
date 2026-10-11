import { deepClone, deepFreeze } from "./clone.js";

export class EventRecorder {
  constructor(initialState) {
    this.events = [];
    this.record({
      sourceLine: null,
      operation: "initialize",
      statement: "Initialize algorithm state",
      explanation: "The algorithm has been initialized.",
      before: null,
      after: initialState,
      changedVariables: Object.keys(initialState.variables ?? {})
    });
  }

  record(event) {
    const snapshot = deepFreeze(deepClone(event.after));
    const recorded = deepFreeze({
      id: this.events.length,
      sourceLine: event.sourceLine ?? null,
      operation: event.operation,
      statement: event.statement,
      explanation: event.explanation ?? "",
      changedVariables: [...(event.changedVariables ?? [])],
      before: event.before == null ? null : deepFreeze(deepClone(event.before)),
      after: snapshot,
      callStack: deepClone(event.callStack ?? [])
    });
    this.events.push(recorded);
    return recorded;
  }

  getEvents() {
    return [...this.events];
  }
}
