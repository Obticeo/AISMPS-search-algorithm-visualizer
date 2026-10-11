<script setup>
import { computed } from "vue";

const props = defineProps({
  graph: { type: Object, required: true },
  state: { type: Object, required: true },
  events: { type: Array, default: () => [] },
  cursor: { type: Number, default: 0 }
});

const positions = computed(() => {
  if (props.graph.layout) {
    return props.graph.layout;
  }
  const count = props.graph.nodes.length;
  const centerX = 310, centerY = 160, rx = 220, ry = 105;
  return Object.fromEntries(props.graph.nodes.map((node, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i / count);
    return [node, { x: centerX + rx * Math.cos(angle), y: centerY + ry * Math.sin(angle) }];
  }));
});

const nodeRadius = computed(() => {
  if (props.graph.nodeRadius) return props.graph.nodeRadius;
  return props.graph.nodes.length > 10 ? 19 : 24;
});

const tagY = computed(() => nodeRadius.value + 15);

// Result path edges
const pathEdges = computed(() => {
  const set = new Set();
  const res = props.state.result;
  if (Array.isArray(res) && res.length >= 2) {
    for (let i = 0; i < res.length - 1; i++) {
      set.add(`${res[i]}->${res[i + 1]}`);
    }
  }
  return set;
});

// Active edge being explored, derived directly from the current nodePair variable
const activeEdge = computed(() => {
  const pair = props.state.variables?.nodePair;
  if (pair && typeof pair === "object" && pair.parent && pair.node) {
    return `${pair.parent}->${pair.node}`;
  }
  return null;
});

// Visited edges, derived directly from the CLOSED variable
const visitedEdges = computed(() => {
  const set = new Set();
  const closed = props.state.variables?.CLOSED ?? [];
  if (Array.isArray(closed)) {
    for (const item of closed) {
      if (item && typeof item === "object" && item.parent && item.node) {
        set.add(`${item.parent}->${item.node}`);
      }
    }
  }
  return set;
});

function getEdgeStatus(from, to) {
  const key = `${from}->${to}`;
  if (pathEdges.value.has(key)) return "path";
  if (activeEdge.value === key) return "current";
  if (visitedEdges.value.has(key)) return "visited";
  return "default";
}

const edges = computed(() => {
  const list = [];
  const r = nodeRadius.value + 2;

  for (const from of props.graph.nodes) {
    const neighbours = props.graph.adjacency[from] ?? [];
    for (const to of neighbours) {
      const p1 = positions.value[from];
      const p2 = positions.value[to];
      if (!p1 || !p2) continue;

      const hasReverse = (props.graph.adjacency[to] ?? []).includes(from);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);

      if (dist === 0) continue;

      let pathD = "";
      if (hasReverse) {
        // Curve mutual reverse edges so they never overlap
        const h = props.graph.layout ? 16 : 24;
        const nx = -dy / dist;
        const ny = dx / dist;
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
        // Straight line from boundary to boundary
        const startX = p1.x + (dx / dist) * r;
        const startY = p1.y + (dy / dist) * r;
        const endX = p2.x - (dx / dist) * r;
        const endY = p2.y - (dy / dist) * r;

        pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
      }

      const status = getEdgeStatus(from, to);
      list.push({
        from,
        to,
        key: `${from}->${to}`,
        pathD,
        status
      });
    }
  }
  return list;
});

function nodeClass(node) {
  const classes = ["node"];
  if (props.state.start === node) classes.push("start");
  if (props.state.goal === node) classes.push("goal");
  if (props.state.currentNode === node) classes.push("current");
  const vars = props.state.variables ?? {};
  if ((vars.OPEN ?? []).some((item) => (typeof item === "string" ? item : item.node) === node)) classes.push("open");
  if ((vars.CLOSED ?? []).some((item) => (typeof item === "string" ? item : item.node) === node)) classes.push("closed");
  if ((props.state.result ?? []).includes?.(node)) classes.push("path");
  return classes.join(" ");
}
</script>

<template>
  <div class="graph-wrap">
    <svg class="graph-svg" viewBox="0 0 620 330" role="img" aria-label="Algorithm graph visualization">
      <defs>
        <marker id="arrow-default" markerWidth="9" markerHeight="9" refX="7.5" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7.5,3.5 z" fill="#4e627d" />
        </marker>
        <marker id="arrow-visited" markerWidth="10" markerHeight="10" refX="8" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L8,3.5 z" fill="#c084fc" />
        </marker>
        <marker id="arrow-current" markerWidth="10" markerHeight="10" refX="8" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L8,3.5 z" fill="#38bdf8" />
        </marker>
        <marker id="arrow-path" markerWidth="11" markerHeight="11" refX="8.5" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L8.5,3.5 z" fill="#34d399" />
        </marker>
      </defs>

      <!-- Graph Edges -->
      <g class="edges">
        <path
          v-for="edge in edges"
          :key="edge.key"
          :d="edge.pathD"
          :class="['graph-edge', `edge-${edge.status}`]"
          :marker-end="`url(#arrow-${edge.status})`"
        />
      </g>

      <!-- Graph Nodes -->
      <g v-for="node in graph.nodes" :key="node" :transform="`translate(${positions[node].x},${positions[node].y})`">
        <circle :class="nodeClass(node)" :r="nodeRadius" />
        <text class="node-label" text-anchor="middle" dominant-baseline="central">{{ node }}</text>
        <text v-if="state.start === node" class="node-tag" :y="tagY" text-anchor="middle">START</text>
        <text v-else-if="state.goal === node" class="node-tag" :y="tagY" text-anchor="middle">GOAL</text>
      </g>
    </svg>

    <!-- Legend -->
    <div class="legend">
      <span><i class="dot current-dot"></i>Inspecting Node</span>
      <span><i class="dot open-dot"></i>OPEN</span>
      <span><i class="dot closed-dot"></i>Visited (CLOSED)</span>
      <span><i class="edge-dot current-edge-dot"></i>Inspecting Edge</span>
      <span><i class="edge-dot visited-edge-dot"></i>Visited Edge</span>
      <span><i class="edge-dot path-edge-dot"></i>Result Path</span>
    </div>
  </div>
</template>
