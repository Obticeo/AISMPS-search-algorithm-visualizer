import { createContext, finish } from "./common.js";
import { getEdgeCost } from "./tspCommon.js";

export function runTSPSavings(config) {
  const ctx = createContext({
    ...config,
    algorithmId: "tsp-savings",
    initialVariables: { tourEdges: [], savingsList: [], baseCity: null }
  });
  const { emit, recorder } = ctx;
  const nodes = config.graph.nodes;
  const N = nodes.length;

  const baseCity = config.start;
  emit({ line: 1, operation: "assign", statement: "n ← select a base city from N cities", explanation: `Selected base city: ${baseCity}.`, patch: { currentNode: baseCity, variables: { baseCity, tourEdges: [] } }, changed: ["baseCity"] });

  const tourEdges = [];
  const tours = {};
  for (const node of nodes) {
    if (node !== baseCity) {
      tourEdges.push(`${baseCity}->${node}`);
      tourEdges.push(`${node}->${baseCity}`);
      tours[node] = node;
    }
  }
  emit({ line: 2, operation: "assign", statement: "construct (N − 1) sub-tours...", explanation: `Created ${N-1} round-trip subtours from ${baseCity}.`, patch: { variables: { baseCity, tourEdges } }, changed: ["tourEdges"] });

  let savingsList = [];
  emit({ line: 3, operation: "assign", statement: "savingsList ← empty list", explanation: "Initialized empty savings list.", patch: { variables: { baseCity, tourEdges, savingsList: [] } }, changed: ["savingsList"] });

  emit({ line: 4, operation: "loop", statement: "for each non-base city a:", explanation: "Iterating non-base cities.", patch: { variables: { baseCity, tourEdges, savingsList: [] } }, changed: [] });

  const rawSavings = [];
  for (const a of nodes) {
    if (a === baseCity) continue;
    for (const b of nodes) {
      if (b === baseCity) continue;
      if (b > a) {
        emit({ line: 5, operation: "loop", statement: "for each non-base city b, if b > a:", explanation: `Pair (${a}, ${b}).`, patch: { variables: { baseCity, tourEdges, savingsList } }, changed: [] });

        const costNA = getEdgeCost(config.graph, baseCity, a);
        const costNB = getEdgeCost(config.graph, baseCity, b);
        const costAB = getEdgeCost(config.graph, a, b);
        const savings = costNA + costNB - costAB;

        emit({ line: 6, operation: "assign", statement: "savings ← cost(n, a) + cost(n, b) − cost(a, b)", explanation: `savings(${a},${b}) = ${costNA} + ${costNB} - ${costAB} = ${savings}.`, patch: { variables: { baseCity, tourEdges, savingsList, evaluatingEdge: `${a}->${b}` } }, changed: ["evaluatingEdge"] });

        rawSavings.push({ a, b, savings });
        savingsList = rawSavings.map(s => `(${s.a},${s.b},${s.savings})`);
        emit({ line: 7, operation: "assign", statement: "savingsList ← (a, b, savings) : savingsList", explanation: `Added (${a}, ${b}, ${savings}) to savingsList.`, patch: { variables: { baseCity, tourEdges, savingsList } }, changed: ["savingsList"] });
      }
    }
  }

  rawSavings.sort((x, y) => y.savings - x.savings);
  savingsList = rawSavings.map(s => `(${s.a},${s.b},${s.savings})`);
  emit({ line: 8, operation: "assign", statement: "sort savingsList in descending order of savings", explanation: `Sorted savingsList. Top: ${rawSavings[0] ? rawSavings[0].savings : 'none'}.`, patch: { variables: { baseCity, tourEdges, savingsList, evaluatingEdge: null } }, changed: ["savingsList", "evaluatingEdge"] });

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
      return true;
    }
    return false;
  }

  for (const item of rawSavings) {
    emit({ line: 9, operation: "loop", statement: "for each tuple (a, b, _) in savingsList:", explanation: `Considering merge for (${item.a}, ${item.b}) with savings ${item.savings}.`, patch: { variables: { baseCity, tourEdges, savingsList, evaluatingEdge: `${item.a}->${item.b}` } }, changed: ["evaluatingEdge"] });

    const hasBaseA = tourEdges.includes(`${baseCity}->${item.a}`) || tourEdges.includes(`${item.a}->${baseCity}`);
    const hasBaseB = tourEdges.includes(`${baseCity}->${item.b}`) || tourEdges.includes(`${item.b}->${baseCity}`);
    if (find(item.a) !== find(item.b) && hasBaseA && hasBaseB) {
      emit({ line: 10, operation: "condition", statement: "if edges (n, a) and (n, b) are in two different tours:", explanation: `${item.a} and ${item.b} are in different tours. Merging.`, patch: { variables: { baseCity, tourEdges, savingsList, evaluatingEdge: `${item.a}->${item.b}` } }, changed: [] });

      let idxA = tourEdges.indexOf(`${baseCity}->${item.a}`);
      if (idxA === -1) idxA = tourEdges.indexOf(`${item.a}->${baseCity}`);
      if (idxA !== -1) tourEdges.splice(idxA, 1);

      let idxB = tourEdges.indexOf(`${baseCity}->${item.b}`);
      if (idxB === -1) idxB = tourEdges.indexOf(`${item.b}->${baseCity}`);
      if (idxB !== -1) tourEdges.splice(idxB, 1);

      emit({ line: 11, operation: "assign", statement: "remove edges (n, a) and (n, b)", explanation: `Removed edges between ${baseCity} and ${item.a}/${item.b}.`, patch: { variables: { baseCity, tourEdges, savingsList, evaluatingEdge: `${item.a}->${item.b}` } }, changed: ["tourEdges"] });

      tourEdges.push(`${item.a}->${item.b}`);
      union(item.a, item.b);

      emit({ line: 12, operation: "assign", statement: "insert the edge (a, b)", explanation: `Inserted edge ${item.a}->${item.b}.`, patch: { variables: { baseCity, tourEdges, savingsList, evaluatingEdge: `${item.a}->${item.b}` } }, changed: ["tourEdges"] });
    }
  }

  emit({ line: 13, operation: "assign", statement: "return the final tour", explanation: "Tour complete.", patch: { variables: { baseCity, tourEdges, savingsList, evaluatingEdge: null } }, changed: ["evaluatingEdge"] });

  finish(ctx, "success", tourEdges, 13, "return the final tour", "TSP Savings tour complete.");
  return recorder.getEvents();
}
