<script setup>
import { computed } from "vue";

const props = defineProps({
  graph:    { type: Object,  required: true },
  state:    { type: Object,  required: true },
  events:   { type: Array,   default: () => [] },
  cursor:   { type: Number,  default: 0 },
  /** Map of node → h-value, supplied by parent for heuristic algorithms */
  hValues:  { type: Object,  default: () => ({}) },
});

// ─── Grid-paper mode detection ─────────────────────────────────────────────
// A graph opts-in by supplying gridCols, gridRows and gridPositions.
// Graphs without those fields use the original layout / circle logic unchanged.
const isGridMode = computed(() =>
  !!(props.graph.gridCols && props.graph.gridRows && props.graph.gridPositions)
);

// SVG canvas dimensions — never changed so existing graphs remain pixel-perfect
const SVG_W = 620;
const SVG_H = 330;

// ─── Node radius ───────────────────────────────────────────────────────────
const nodeRadius = computed(() => {
  if (props.graph.nodeRadius) return props.graph.nodeRadius;
  if (isGridMode.value) return 13;            // compact for grid cells
  return props.graph.nodes.length > 10 ? 19 : 24;
});

const tagY = computed(() => nodeRadius.value + 15);

// ─── Grid-paper geometry ───────────────────────────────────────────────────
// Padding = nodeRadius so that:
//   • node at col=0       → center x = r  → left  circle edge = 0  (flush left)
//   • node at col=gridCols→ center x = SVG_W-r → right circle edge = SVG_W (flush right)
// Same logic applies vertically.
// The grid lines therefore span exactly from r to SVG_W-r / SVG_H-r,
// which means the outermost grid lines coincide with the outermost node centres.

const cellW = computed(() => {
  if (!isGridMode.value) return 0;
  const r = nodeRadius.value;
  return (SVG_W - 2 * r) / props.graph.gridCols;
});

const cellH = computed(() => {
  if (!isGridMode.value) return 0;
  const r = nodeRadius.value;
  return (SVG_H - 2 * r) / props.graph.gridRows;
});

// Convert integer grid (col, row) → SVG pixel (x, y)
function gridToPixel(col, row) {
  const r = nodeRadius.value;
  return {
    x: r + col * cellW.value,
    y: r + row * cellH.value,
  };
}

// ─── Grid lines (dashed graph-paper lines) ─────────────────────────────────
const gridLines = computed(() => {
  if (!isGridMode.value) return { vertical: [], horizontal: [] };
  const { gridCols, gridRows } = props.graph;
  const r  = nodeRadius.value;
  const x0 = r,            x1 = SVG_W - r;   // left / right pixel boundaries
  const y0 = r,            y1 = SVG_H - r;   // top  / bottom pixel boundaries
  const vertical   = [];
  const horizontal = [];
  for (let c = 0; c <= gridCols; c++) {
    vertical.push({ x: r + c * cellW.value, y1: y0, y2: y1 });
  }
  for (let rr = 0; rr <= gridRows; rr++) {
    horizontal.push({ y: r + rr * cellH.value, x1: x0, x2: x1 });
  }
  return { vertical, horizontal };
});

// ─── Node pixel positions ───────────────────────────────────────────────────
// Grid mode  → derived from gridPositions using gridToPixel()
// Layout     → use the graph's pre-set layout object  (existing behaviour)
// Fallback   → evenly-spaced ellipse                  (existing behaviour)
const positions = computed(() => {
  if (isGridMode.value) {
    return Object.fromEntries(
      Object.entries(props.graph.gridPositions).map(([node, { col, row }]) => [
        node,
        gridToPixel(col, row),
      ])
    );
  }
  if (props.graph.layout) return props.graph.layout;

  // Original circle fallback — untouched
  const count   = props.graph.nodes.length;
  const centerX = 310, centerY = 160, rx = 220, ry = 105;
  return Object.fromEntries(
    props.graph.nodes.map((node, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
      return [node, { x: centerX + rx * Math.cos(angle), y: centerY + ry * Math.sin(angle) }];
    })
  );
});

// ─── h-value display helper ────────────────────────────────────────────────
function hLabel(node) {
  const v = props.hValues[node];
  return v !== undefined ? `h=${v}` : null;
}

// ─── Edge state helpers (unchanged from original) ──────────────────────────
const pathEdges = computed(() => {
  const set = new Set();
  const res = props.state.result;
  if (Array.isArray(res) && res.length >= 2) {
    for (let i = 0; i < res.length - 1; i++) set.add(`${res[i]}->${res[i + 1]}`);
  }
  return set;
});

const activeEdge = computed(() => {
  const pair = props.state.variables?.nodePair;
  if (pair && typeof pair === "object" && pair.parent && pair.node)
    return `${pair.parent}->${pair.node}`;
  return null;
});

const visitedEdges = computed(() => {
  const set = new Set();
  const closed = props.state.variables?.CLOSED ?? [];
  if (Array.isArray(closed)) {
    for (const item of closed) {
      if (item && typeof item === "object" && item.parent && item.node)
        set.add(`${item.parent}->${item.node}`);
    }
  }
  return set;
});

function getEdgeStatus(from, to) {
  const key = `${from}->${to}`;
  if (pathEdges.value.has(key))    return "path";
  if (activeEdge.value === key)    return "current";
  if (visitedEdges.value.has(key)) return "visited";
  return "default";
}

// ─── Edge geometry (unchanged from original) ───────────────────────────────
const edges = computed(() => {
  const list = [];
  const r    = nodeRadius.value + 2;

  for (const from of props.graph.nodes) {
    const neighbours = props.graph.adjacency[from] ?? [];
    for (const to of neighbours) {
      const p1 = positions.value[from];
      const p2 = positions.value[to];
      if (!p1 || !p2) continue;

      const hasReverse = (props.graph.adjacency[to] ?? []).includes(from);
      const dx   = p2.x - p1.x;
      const dy   = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) continue;

      let pathD = "";
      if (hasReverse) {
        // Use graph.layout flag to pick curve amount — same heuristic as before
        const h  = props.graph.layout || isGridMode.value ? 16 : 24;
        const nx = -dy / dist;
        const ny =  dx / dist;
        const cp = { x: (p1.x + p2.x) / 2 + nx * h, y: (p1.y + p2.y) / 2 + ny * h };

        const d1x = cp.x - p1.x, d1y = cp.y - p1.y;
        const dist1 = Math.hypot(d1x, d1y);
        const startX = p1.x + (d1x / dist1) * r;
        const startY = p1.y + (d1y / dist1) * r;

        const d2x = cp.x - p2.x, d2y = cp.y - p2.y;
        const dist2 = Math.hypot(d2x, d2y);
        const endX = p2.x + (d2x / dist2) * r;
        const endY = p2.y + (d2y / dist2) * r;

        pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${cp.x.toFixed(1)} ${cp.y.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
      } else {
        const startX = p1.x + (dx / dist) * r;
        const startY = p1.y + (dy / dist) * r;
        const endX   = p2.x - (dx / dist) * r;
        const endY   = p2.y - (dy / dist) * r;
        pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
      }

      list.push({ from, to, key: `${from}->${to}`, pathD, status: getEdgeStatus(from, to) });
    }
  }
  return list;
});

// ─── Node CSS classes (unchanged from original) ────────────────────────────
function nodeClass(node) {
  const classes = ["node"];
  if (props.state.start       === node) classes.push("start");
  if (props.state.goal        === node) classes.push("goal");
  if (props.state.currentNode === node) classes.push("current");
  const vars = props.state.variables ?? {};
  if ((vars.OPEN   ?? []).some((item) => (typeof item === "string" ? item : item.node) === node)) classes.push("open");
  if ((vars.CLOSED ?? []).some((item) => (typeof item === "string" ? item : item.node) === node)) classes.push("closed");
  if ((props.state.result ?? []).includes?.(node)) classes.push("path");
  return classes.join(" ");
}
</script>

<template>
  <div class="graph-wrap">
    <svg
      class="graph-svg"
      viewBox="0 0 620 330"
      role="img"
      aria-label="Algorithm graph visualization"
    >
      <defs>
        <marker id="arrow-default" markerWidth="9"  markerHeight="9"  refX="7.5" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7.5,3.5 z" fill="#4e627d" />
        </marker>
        <marker id="arrow-visited" markerWidth="10" markerHeight="10" refX="8"   refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L8,3.5 z"   fill="#c084fc" />
        </marker>
        <marker id="arrow-current" markerWidth="10" markerHeight="10" refX="8"   refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L8,3.5 z"   fill="#38bdf8" />
        </marker>
        <marker id="arrow-path"    markerWidth="11" markerHeight="11" refX="8.5" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L8.5,3.5 z" fill="#34d399" />
        </marker>
      </defs>

      <!-- ═══ GRID PAPER background (only rendered in grid mode) ═══════════ -->
      <g v-if="isGridMode" class="grid-paper">
        <!-- Outer border — connects the four corner grid intersections -->
        <rect
          :x="nodeRadius" :y="nodeRadius"
          :width="SVG_W - 2 * nodeRadius" :height="SVG_H - 2 * nodeRadius"
          class="grid-border"
        />
        <!-- Interior vertical dashed lines -->
        <line
          v-for="(vl, i) in gridLines.vertical"
          :key="`v${i}`"
          :x1="vl.x" :y1="vl.y1"
          :x2="vl.x" :y2="vl.y2"
          class="grid-line"
        />
        <!-- Interior horizontal dashed lines -->
        <line
          v-for="(hl, i) in gridLines.horizontal"
          :key="`h${i}`"
          :x1="hl.x1" :y1="hl.y"
          :x2="hl.x2" :y2="hl.y"
          class="grid-line"
        />
      </g>

      <!-- ═══ Graph Edges ══════════════════════════════════════════════════ -->
      <g class="edges">
        <path
          v-for="edge in edges"
          :key="edge.key"
          :d="edge.pathD"
          :class="['graph-edge', `edge-${edge.status}`]"
          :marker-end="`url(#arrow-${edge.status})`"
        />
      </g>

      <!-- ═══ Graph Nodes ══════════════════════════════════════════════════ -->
      <g
        v-for="node in graph.nodes"
        :key="node"
        :transform="`translate(${positions[node].x},${positions[node].y})`"
      >
        <circle :class="nodeClass(node)" :r="nodeRadius" />
        <text class="node-label" text-anchor="middle" dominant-baseline="central">{{ node }}</text>

        <!-- START / GOAL tag (unchanged) -->
        <text v-if="state.start === node"     class="node-tag" :y="tagY" text-anchor="middle">START</text>
        <text v-else-if="state.goal === node" class="node-tag" :y="tagY" text-anchor="middle">GOAL</text>

        <!-- h-value badge: shown in grid mode when hValues are provided -->
        <text
          v-if="isGridMode && hLabel(node) !== null"
          class="h-value-label"
          :y="-(nodeRadius + 4)"
          text-anchor="middle"
        >{{ hLabel(node) }}</text>
      </g>
    </svg>

    <!-- ═══ Legend ════════════════════════════════════════════════════════ -->
    <div class="legend">
      <span><i class="dot current-dot"></i>Current</span>
      <span><i class="dot open-dot"></i>OPEN</span>
      <span><i class="dot closed-dot"></i>CLOSED</span>
      <span><i class="edge-dot current-edge-dot"></i>Inspecting</span>
      <span><i class="edge-dot visited-edge-dot"></i>Seen</span>
      <span><i class="edge-dot path-edge-dot"></i>Solution</span>
      <span v-if="isGridMode"><i class="h-badge-dot"></i>h-value</span>
    </div>
  </div>
</template>
