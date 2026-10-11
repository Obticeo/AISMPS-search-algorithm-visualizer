import { runSimpleSearch1 } from "./simpleSearch1.js";
import { runSimpleSearch2 } from "./simpleSearch2.js";
import { runDFS } from "./dfs.js";
import { runBFS } from "./bfs.js";
import { runDFIDN, runDFIDC } from "./dfid.js";

export const algorithms = {
  "simple-search-1": runSimpleSearch1,
  "simple-search-2": runSimpleSearch2,
  dfs: runDFS,
  bfs: runBFS,
  "dfid-n": runDFIDN,
  "dfid-c": runDFIDC
};
