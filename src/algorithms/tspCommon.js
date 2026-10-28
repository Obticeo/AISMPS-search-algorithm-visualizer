export function getEdgeCost(graph, u, v) {
  if (graph.edgeCosts && graph.edgeCosts[u] && graph.edgeCosts[u][v] !== undefined) {
    return graph.edgeCosts[u][v];
  }
  const pu = graph.positions[u];
  const pv = graph.positions[v];
  if (pu && pv) {
    return Math.hypot(pu.x - pv.x, pu.y - pv.y);
  }
  return 1;
}

export function getDegree(node, tourEdges) {
  let count = 0;
  for (const edge of tourEdges) {
    const parts = edge.split("->");
    if (parts[0] === node || parts[1] === node) count++;
  }
  return count;
}
