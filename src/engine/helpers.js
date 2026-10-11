/** Source-level membership check. List order is not modified. */
export function occursIn(node, list) {
  return list.some((item) => item === node || item?.node === node);
}

/** MakePairs(nodeList, parent), preserving nodeList order. */
export function makePairs(nodeList, parent) {
  if (nodeList.length === 0) return [];
  return [{ node: nodeList[0], parent }, ...makePairs(nodeList.slice(1), parent)];
}

/** MakePairs(nodeList, parent, depth), preserving nodeList order. */
export function makeDepthPairs(nodeList, parent, depth) {
  if (nodeList.length === 0) return [];
  return [
    { node: nodeList[0], parent, depth },
    ...makeDepthPairs(nodeList.slice(1), parent, depth)
  ];
}

/**
 * RemoveSeen(nodeList, OPEN, CLOSED).
 * Accepts node identifiers in nodeList and pair/triple records in OPEN/CLOSED.
 * Retains candidates in their original order and does not independently deduplicate
 * repeated candidates unless the source procedure's membership arguments exclude them.
 */
export function removeSeen(nodeList, open, closed) {
  if (nodeList.length === 0) return [];
  const node = nodeList[0];
  const seen = occursIn(node, open) || occursIn(node, closed);
  return seen
    ? removeSeen(nodeList.slice(1), open, closed)
    : [node, ...removeSeen(nodeList.slice(1), open, closed)];
}

/** Find the first node-parent pair whose node matches the requested node. */
export function skipTo(parent, nodePairs) {
  if (nodePairs.length === 0) return [];
  if (nodePairs[0].node === parent) return nodePairs;
  return skipTo(parent, nodePairs.slice(1));
}

/**
 * ReconstructPath(nodePair, CLOSED) following the PDF's ordered-list approach.
 * The nodePair itself is the initial entry; parent links are resolved in CLOSED.
 */
export function reconstructPath(nodePair, closed) {
  const [node, parent] = [nodePair.node, nodePair.parent];
  let path = [node];
  let currentParent = parent;
  let remaining = [...closed];

  while (currentParent !== null && currentParent !== undefined) {
    const matches = skipTo(currentParent, remaining);
    if (matches.length === 0) {
      throw new Error(`Cannot reconstruct path: parent ${currentParent} not found in CLOSED.`);
    }
    const pair = matches[0];
    path = [currentParent, ...path];
    currentParent = pair.parent;
    // The PDF advances CLOSED to the matched entry's tail before reading the next head.
    remaining = matches;
  }
  return path;
}

/** Depth-aware lookup used by the DFID-C source procedure. */
export function skipToDepth(parent, depth, nodePairs) {
  if (nodePairs.length === 0) return [];
  const first = nodePairs[0];
  if (first.node === parent && first.depth === depth) return nodePairs;
  return skipToDepth(parent, depth, nodePairs.slice(1));
}

export function reconstructDepthPath(nodePair, closed) {
  let path = [nodePair.node];
  let parent = nodePair.parent;
  let depth = nodePair.depth;
  let remaining = [...closed];

  while (parent !== null && parent !== undefined) {
    const matches = skipToDepth(parent, depth - 1, remaining);
    if (matches.length === 0) {
      throw new Error(`Cannot reconstruct depth path: (${parent}, depth ${depth - 1}) not found.`);
    }
    const pair = matches[0];
    path = [parent, ...path];
    parent = pair.parent;
    depth = pair.depth;
    remaining = matches;
  }
  return path;
}
