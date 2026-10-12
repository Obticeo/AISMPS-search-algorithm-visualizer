export const defaultGraphs = [
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
