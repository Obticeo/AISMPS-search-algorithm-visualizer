import { createContext, finish } from "./common.js";
import { getEdgeCost } from "./tspCommon.js";

export function runTSPNearestNeighbour(config) {
  const ctx = createContext({
    ...config,
    algorithmId: "tsp-nearest-neighbour",
    initialVariables: { tourEdges: [] }
  });
  const { emit, recorder } = ctx;
  const nodes = config.graph.nodes;
  const N = nodes.length;

  emit({ line: 1, operation: "assign", statement: "Compute the cost of all the edges", explanation: "Edge costs are available.", patch: { variables: { tourEdges: [] } }, changed: [] });

  let currentCity = config.start;
  const tourEdges = [];
  const visited = new Set([currentCity]);

  emit({ line: 2, operation: "assign", statement: "Start at some city", explanation: `Starting at city ${currentCity}.`, patch: { currentNode: currentCity, variables: { currentCity, tourEdges } }, changed: ["currentCity"] });

  while (tourEdges.length < N) {
    emit({ line: 3, operation: "loop", statement: "repeat", explanation: `Building tour. Currently ${tourEdges.length} edges.`, patch: { variables: { currentCity, tourEdges } }, changed: [] });

    if (tourEdges.length === N - 1) {
      const startCity = config.start;
      const edge = `${currentCity}->${startCity}`;
      tourEdges.push(edge);
      emit({ line: 4, operation: "assign", statement: "Move to the nearest neighbour...", explanation: `Closing the loop: ${currentCity} to ${startCity}.`, patch: { currentNode: startCity, variables: { currentCity: startCity, tourEdges } }, changed: ["currentCity", "tourEdges"] });
      currentCity = startCity;
      break;
    }

    let nearest = null;
    let minCost = Infinity;

    for (const neighbor of config.graph.adjacency[currentCity] || []) {
      if (!visited.has(neighbor)) {
        const cost = getEdgeCost(config.graph, currentCity, neighbor);
        if (cost < minCost) {
          minCost = cost;
          nearest = neighbor;
        }
      }
    }

    if (!nearest) {
      finish(ctx, "failure", [], 4, "Move to the nearest neighbour...", "Stuck: no unvisited neighbours available.");
      return recorder.getEvents();
    }

    emit({ line: 5, operation: "condition", statement: "close the loop prematurely", explanation: `Checking if adding ${nearest} closes loop prematurely.`, patch: { variables: { currentCity, tourEdges, evaluatingEdge: `${currentCity}->${nearest}` } }, changed: ["evaluatingEdge"] });
    emit({ line: 6, operation: "condition", statement: "or form branches/forks", explanation: `Checking if adding ${nearest} forms branches.`, patch: { variables: { currentCity, tourEdges, evaluatingEdge: null } }, changed: ["evaluatingEdge"] });

    const edge = `${currentCity}->${nearest}`;
    tourEdges.push(edge);
    visited.add(nearest);

    emit({ line: 4, operation: "assign", statement: "Move to the nearest neighbour...", explanation: `Moved to ${nearest} with cost ${minCost}.`, patch: { currentNode: nearest, variables: { currentCity: nearest, tourEdges } }, changed: ["currentCity", "tourEdges"] });
    currentCity = nearest;
  }

  finish(ctx, "success", tourEdges, 4, "Move to the nearest neighbour...", "TSP Nearst Neighbour tour complete.");
  return recorder.getEvents();
}
