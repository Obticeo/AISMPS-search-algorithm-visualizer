import { createContext, finish } from "./common.js";
import { getEdgeCost, getDegree } from "./tspCommon.js";

export function runTSPGreedy(config) {
  const ctx = createContext({
    ...config,
    algorithmId: "tsp-greedy",
    initialVariables: { tourEdges: [], sortedEdges: [] }
  });
  const { emit, recorder } = ctx;
  const nodes = config.graph.nodes;
  const N = nodes.length;

  emit({ line: 1, operation: "assign", statement: "Compute the cost of all the edges", explanation: "Edge costs are available.", patch: { variables: { tourEdges: [] } }, changed: [] });

  const allEdges = [];
  for (const u of nodes) {
    for (const v of config.graph.adjacency[u] || []) {
      if (u < v) {
        const cost = getEdgeCost(config.graph, u, v);
        allEdges.push({ u, v, cost, id: `${u}->${v}` });
      }
    }
  }

  allEdges.sort((a, b) => a.cost - b.cost);
  const sortedEdges = allEdges.map(e => e.id);
  emit({ line: 2, operation: "assign", statement: "Sort the edges by cost", explanation: `Sorted ${allEdges.length} edges by cost.`, patch: { variables: { tourEdges: [], sortedEdges } }, changed: ["sortedEdges"] });

  const tourEdges = [];
  const parent = {};
  nodes.forEach(n => parent[n] = n);
  function find(i) {
    if (parent[i] === i) return i;
    return find(parent[i]);
  }
  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return false;
    }
    return true;
  }

  let edgeIdx = 0;
  while (tourEdges.length < N && edgeIdx < allEdges.length) {
    emit({ line: 3, operation: "loop", statement: "repeat", explanation: `Finding next edge. Currently ${tourEdges.length} edges.`, patch: { variables: { tourEdges, sortedEdges } }, changed: [] });

    const edge = allEdges[edgeIdx++];
    emit({ line: 5, operation: "condition", statement: "close the loop prematurely", explanation: `Checking if ${edge.id} forms a premature cycle.`, patch: { variables: { tourEdges, sortedEdges, evaluatingEdge: edge.id } }, changed: ["evaluatingEdge"] });

    const cycle = find(edge.u) === find(edge.v);
    const isPrematureCycle = cycle && tourEdges.length < N - 1;

    emit({ line: 6, operation: "condition", statement: "or form branches/forks", explanation: `Checking if ${edge.id} exceeds degree 2.`, patch: { variables: { tourEdges, sortedEdges, evaluatingEdge: edge.id } }, changed: [] });

    const degU = getDegree(edge.u, tourEdges);
    const degV = getDegree(edge.v, tourEdges);
    const formsBranch = degU >= 2 || degV >= 2;

    if (!isPrematureCycle && !formsBranch) {
      union(edge.u, edge.v);
      tourEdges.push(edge.id);
      emit({ line: 4, operation: "assign", statement: "Add the shortest available edge...", explanation: `Added edge ${edge.id} (cost: ${edge.cost}).`, patch: { variables: { tourEdges, sortedEdges, evaluatingEdge: null } }, changed: ["tourEdges", "evaluatingEdge"] });
    } else {
       emit({ line: 4, operation: "assign", statement: "Add the shortest available edge...", explanation: `Rejected edge ${edge.id} (cost: ${edge.cost}).`, patch: { variables: { tourEdges, sortedEdges, evaluatingEdge: null } }, changed: ["evaluatingEdge"] });
    }
  }

  finish(ctx, "success", tourEdges, 4, "Add the shortest available edge...", "TSP Greedy tour complete.");
  return recorder.getEvents();
}
