export const defaultGraphs = [
  {
    id: "heuristic-19node",
    name: "19-Node Heuristic Graph",
    description: "Graph from Week-3 notes. Nodes have grid-paper coordinates for Manhattan / Euclidean heuristic computation.",
    // Node order determines MoveGen order — preserve adjacency-list order.
    nodes: ["S", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"],
    adjacency: {
      A: ["B", "C", "D", "F"],
      B: ["A", "C", "D", "E", "H"],
      C: ["A", "B", "E", "S"],
      D: ["A", "B", "F", "H", "L"],
      E: ["B", "C", "H", "J", "S"],
      F: ["A", "D", "G", "L"],
      G: ["F", "N"],
      H: ["B", "D", "E", "J", "K"],
      I: ["M", "R", "S"],
      J: ["E", "H", "M"],
      K: ["H", "L", "O"],
      L: ["D", "F", "K", "O"],
      M: ["I", "J", "P", "Q", "R", "S"],
      N: ["G", "O"],
      O: ["K", "L", "N"],
      P: ["M", "Q"],
      Q: ["M", "P", "R"],
      R: ["I", "M", "Q"],
      S: ["C", "E", "I", "M"]
    },
    defaultStart: "S",
    defaultGoal: "G",
    // ── Grid-paper coordinates ────────────────────────────────────────────
    // Source coordinates are Cartesian (origin bottom-left, y-up).
    // Converted to SVG grid (origin top-left, row = gridRows - y):
    //   gridCols = 16  (max x = 16 at node I)
    //   gridRows = 12  (max y = 12 at nodes A, C)
    //   col = x,  row = 12 - y
    gridCols: 16,
    gridRows: 12,
    gridPositions: {
      A: { col:  4, row:  0 },   // [4,12]  → row = 12-12 = 0
      B: { col:  8, row:  2 },   // [8,10]  → row = 12-10 = 2
      C: { col: 11, row:  0 },   // [11,12] → row = 12-12 = 0
      D: { col:  5, row:  3 },   // [5,9]   → row = 12-9  = 3
      E: { col: 12, row:  4 },   // [12,8]  → row = 12-8  = 4
      F: { col:  2, row:  4 },   // [2,8]   → row = 12-8  = 4
      G: { col:  0, row:  9 },   // [0,3]   → row = 12-3  = 9  ← goal (flush left)
      H: { col:  8, row:  5 },   // [8,7]   → row = 12-7  = 5
      I: { col: 16, row:  9 },   // [16,3]  → row = 12-3  = 9  (flush right)
      J: { col: 11, row:  7 },   // [11,5]  → row = 12-5  = 7
      K: { col:  6, row:  7 },   // [6,5]   → row = 12-5  = 7
      L: { col:  3, row:  7 },   // [3,5]   → row = 12-5  = 7
      M: { col: 12, row:  9 },   // [12,3]  → row = 12-3  = 9
      N: { col:  2, row: 11 },   // [2,1]   → row = 12-1  = 11
      O: { col:  5, row: 10 },   // [5,2]   → row = 12-2  = 10
      P: { col:  9, row: 10 },   // [9,2]   → row = 12-2  = 10
      Q: { col: 11, row: 12 },   // [11,0]  → row = 12-0  = 12 (flush bottom)
      R: { col: 15, row: 12 },   // [15,0]  → row = 12-0  = 12 (flush bottom)
      S: { col: 15, row:  5 }    // [15,7]  → row = 12-7  = 5  ← start (flush right)
    }
  },

  {
    id: "branching",
    name: "Branching graph",
    description: "Basic expansion and OPEN ordering.",
    nodes: ["K", "E", "F", "J", "P", "Q"],
    adjacency: {
      K: ["E", "F"],
      E: ["J", "P"],
      F: ["Q"],
      J: [],
      P: [],
      Q: []
    },
    defaultStart: "K",
    defaultGoal: "P"
  },
  {
    id: "practise-7node",
    name: "Practise 7-Node Search Graph",
    description: "Undirected graph from IIT Madras lecture (S, A, B, C, D, E, G) with cycles and multiple paths.",
    nodes: ["S", "A", "B", "C", "D", "E", "G"],
    adjacency: {
      S: ["A", "C"],
      A: ["B", "C", "D", "S"],
      B: ["A", "D", "E"],
      C: ["A", "D", "S"],
      D: ["A", "B", "C", "E", "G"],
      E: ["B", "D", "G"],
      G: ["D", "E"]
    },
    defaultStart: "S",
    defaultGoal: "G",
    layout: {
      S: { x: 120, y: 50 },
      A: { x: 270, y: 100 },
      B: { x: 490, y: 100 },
      C: { x: 65, y: 175 },
      D: { x: 270, y: 220 },
      E: { x: 550, y: 220 },
      G: { x: 410, y: 295 }
    }
  },
  {
    id: "practise-binary-tree",
    name: "Practise Binary Search Tree",
    description: "Full 15-node binary search tree from IIT Madras lecture with goal G at depth 3.",
    nodes: ["S", "A", "B", "C", "D", "E", "F", "H", "I", "J", "K", "L", "M", "G", "N"],
    adjacency: {
      S: ["A", "B"],
      A: ["C", "D"],
      B: ["E", "F"],
      C: ["H", "I"],
      D: ["J", "K"],
      E: ["L", "M"],
      F: ["G", "N"],
      H: [],
      I: [],
      J: [],
      K: [],
      L: [],
      M: [],
      G: [],
      N: []
    },
    defaultStart: "S",
    defaultGoal: "G",
    nodeRadius: 19,
    layout: {
      S: { x: 310, y: 38 },
      A: { x: 170, y: 110 },
      B: { x: 450, y: 110 },
      C: { x: 95, y: 185 },
      D: { x: 245, y: 185 },
      E: { x: 375, y: 185 },
      F: { x: 525, y: 185 },
      H: { x: 55, y: 270 },
      I: { x: 135, y: 270 },
      J: { x: 205, y: 270 },
      K: { x: 285, y: 270 },
      L: { x: 335, y: 270 },
      M: { x: 415, y: 270 },
      G: { x: 485, y: 270 },
      N: { x: 565, y: 270 }
    }
  },
  {
    id: "cycle",
    name: "Cycle and shared descendants",
    description: "Demonstrates RemoveSeen and cycle handling.",
    nodes: ["A", "B", "C", "D", "G"],
    adjacency: {
      A: ["B", "C"],
      B: ["C", "D"],
      C: ["A", "D"],
      D: ["B", "G"],
      G: []
    },
    defaultStart: "A",
    defaultGoal: "G"
  },
  {
    id: "unreachable",
    name: "Unreachable goal",
    description: "The goal is isolated from the start component.",
    nodes: ["S", "A", "B", "Z"],
    adjacency: {
      S: ["A"],
      A: ["B"],
      B: [],
      Z: []
    },
    defaultStart: "S",
    defaultGoal: "Z"
  }
];
