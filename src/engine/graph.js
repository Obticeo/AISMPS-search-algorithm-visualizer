export function validateGraph(graph, start, goal) {
  if (!graph || !Array.isArray(graph.nodes) || !graph.adjacency) {
    throw new TypeError("Graph must define nodes and adjacency.");
  }
  const nodeSet = new Set(graph.nodes);
  if (nodeSet.size !== graph.nodes.length) {
    throw new Error("Graph node identifiers must be unique.");
  }
  if (!nodeSet.has(start)) throw new Error(`Unknown start node: ${start}`);
  if (!nodeSet.has(goal)) throw new Error(`Unknown goal node: ${goal}`);

  for (const node of graph.nodes) {
    if (!Array.isArray(graph.adjacency[node])) {
      throw new Error(`Missing ordered adjacency list for node: ${node}`);
    }
    for (const neighbour of graph.adjacency[node]) {
      if (!nodeSet.has(neighbour)) {
        throw new Error(`Unknown neighbour ${neighbour} in adjacency list for ${node}`);
      }
    }
  }
  return true;
}

export function moveGen(graph, node) {
  if (!(node in graph.adjacency)) throw new Error(`No adjacency list for node: ${node}`);
  // Copy the configured sequence. Never sort it.
  return [...graph.adjacency[node]];
}
