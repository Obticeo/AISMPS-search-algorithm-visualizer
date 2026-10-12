# Algorithm Lab — Course-Faithful Search Visualizer & Execution Engine

An interactive, deterministic graph search algorithm visualizer and execution engine designed in strict accordance with the **AI: Search Methods for Problem Solving** curriculum.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)
![Vue 3](https://img.shields.io/badge/Vue.js-3.5-42b883.svg)
![Vite](https://img.shields.io/badge/Vite-6.1-646cff.svg)
![Tests](https://img.shields.io/badge/tests-22%20passed-brightgreen.svg)

---

## Features

- **Interactive Visualizer (Vue 3 + Vite)**:
  - **Top Step Controls**: Play, pause, step forward/backward, reset, jump to end, speed controls, and timeline scrubber.
  - **Synchronized Pseudocode Panel**: Indented, IDE-styled pseudocode with syntax highlighting that auto-centers around the active executing statement.
  - **Dynamic Graph Visualization**: SVG canvas displaying inspecting nodes (mint), inspecting edges (cyan dashed), visited nodes (luminous purple), visited tree edges matching `CLOSED`, and the final solution path (emerald).
  - **Inspection Panel**: Clean variable inspector updating `OPEN`, `CLOSED`, `nodePair`, `N`, and depth bounds at each step.

- **Deterministic Execution Engine**:
  - Step-by-step event recorder producing immutable snapshots.
  - Strict preservation of graph neighbor insertion order without arbitrary sorting.
  - Reversible cursor navigation (`stepForward`, `stepBackward`, `seek`, `reset`, `runToEnd`).

- **Algorithms Implemented**:
  - **Depth-First Search (DFS)**: `OPEN ← newPairs ++ (tail OPEN)`
  - **Breadth-First Search (BFS)**: `OPEN ← (tail OPEN) ++ newPairs`
  - **Simple Search-1**: Set-based search with OPEN only
  - **Simple Search-2**: Set-based search with OPEN and CLOSED
  - **DFID-N**: Depth-first iterative deepening filtering against OPEN and CLOSED
  - **DFID-C**: Depth-first iterative deepening filtering against OPEN and `[]` (reopening behavior)

- **Included Graph Configurations**:
  - **Practise 7-Node Search Graph**: Standard cyclic undirected graph with nodes `S, A, B, C, D, E, G`.
  - **Practise Binary Search Tree**: Full 15-node binary search tree (depth 3, goal `G`).
  - **Branching Graph**: Basic tree expansion test.
  - **Cycle Graph**: Demonstrating `RemoveSeen` and cycle handling.
  - **Unreachable Goal**: Demonstrating search termination on disconnected graphs.

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/obticeo/AISMPS-search-algorithm-visualizer.git
cd AISMPS-search-algorithm-visualizer

# Install dependencies
npm install

# Run the test suite (22 unit & golden-trace tests)
npm test

# Start the interactive dev server
npm run dev
```

Open the local development URL printed by Vite (typically `http://localhost:5173`).


---

## Test Suite

The test suite runs with Node's native test runner (`node --test`) and validates step-by-step invariants:

```bash
npm test
```

Includes golden traces for:
- DFS and BFS OPEN concatenation expressions
- Exact CLOSED insertion points relative to goal tests
- DFID depth bound increments and count updates
- Edge case handling across cycle graphs and binary trees

---

## License

MIT
