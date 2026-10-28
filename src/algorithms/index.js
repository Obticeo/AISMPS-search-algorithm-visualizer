import { runSimpleSearch1 } from "./simpleSearch1.js";
import { runSimpleSearch2 } from "./simpleSearch2.js";
import { runDFS } from "./dfs.js";
import { runBFS } from "./bfs.js";
import { runDFIDN, runDFIDC } from "./dfid.js";
import { runBestFirstSearch } from "./bestFirstSearch.js";
import { runHillClimbing } from "./hillClimbing.js";
import { runBeamSearch } from "./beamSearch.js";
import { runTSPNearestNeighbour } from "./tspNearestNeighbour.js";
import { runTSPGreedy } from "./tspGreedy.js";
import { runTSPSavings } from "./tspSavings.js";

export const algorithms = {
  "simple-search-1": runSimpleSearch1,
  "simple-search-2": runSimpleSearch2,
  dfs:               runDFS,
  bfs:               runBFS,
  "dfid-n":          runDFIDN,
  "dfid-c":          runDFIDC,
  "best-first-search": runBestFirstSearch,
  "hill-climbing":     runHillClimbing,
  "beam-search":       runBeamSearch,
  "tsp-nearest-neighbour": runTSPNearestNeighbour,
  "tsp-greedy": runTSPGreedy,
  "tsp-savings": runTSPSavings
};
