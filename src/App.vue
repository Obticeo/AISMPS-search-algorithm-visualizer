<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { createExecution } from "./engine/createExecution.js";
import { defaultGraphs } from "./data/defaultGraphs.js";
import { algorithmOptions, pseudocode } from "./data/pseudocode.js";
import GraphCanvas from "./components/GraphCanvas.vue";
import ValueView from "./components/ValueView.vue";

const algorithmId = ref("dfs");
const graphId = ref("branching");
const start = ref("K");
const goal = ref("P");
const cursor = ref(0);
const events = ref([]);
const state = ref(null);
const playing = ref(false);
const speed = ref(850);
const error = ref("");
let timer = null;

const graph = computed(() => defaultGraphs.find((item) => item.id === graphId.value) ?? defaultGraphs[0]);
const selectedAlgorithm = computed(() => algorithmOptions.find((item) => item.id === algorithmId.value));
const currentEvent = computed(() => events.value[cursor.value] ?? null);
const lines = computed(() => pseudocode[algorithmId.value] ?? []);
const variables = computed(() => state.value?.variables ?? {});
const variableEntries = computed(() => Object.entries(variables.value));
const canBack = computed(() => cursor.value > 0);
const canForward = computed(() => cursor.value < events.value.length - 1);
const progress = computed(() => (events.value.length > 1 ? (cursor.value / (events.value.length - 1)) * 100 : 0));

function stopPlayback() {
  playing.value = false;
  if (timer) clearTimeout(timer);
  timer = null;
}

function loadExecution() {
  stopPlayback();
  error.value = "";
  try {
    const execution = createExecution({
      algorithmId: algorithmId.value,
      graph: graph.value,
      start: start.value,
      goal: goal.value
    });
    events.value = execution.getEvents();
    cursor.value = 0;
    state.value = events.value[0]?.after ?? null;
  } catch (e) {
    error.value = e.message;
    events.value = [];
    state.value = null;
  }
}

function seek(index) {
  if (!events.value.length) return;
  cursor.value = Math.max(0, Math.min(index, events.value.length - 1));
  state.value = events.value[cursor.value].after;
}

function next() {
  stopPlayback();
  seek(cursor.value + 1);
}

function previous() {
  stopPlayback();
  seek(cursor.value - 1);
}

function reset() {
  stopPlayback();
  seek(0);
}

function end() {
  stopPlayback();
  seek(events.value.length - 1);
}

function scheduleNext() {
  if (!playing.value) return;
  if (!canForward.value) {
    stopPlayback();
    return;
  }
  timer = setTimeout(() => {
    seek(cursor.value + 1);
    scheduleNext();
  }, Number(speed.value));
}

function togglePlay() {
  if (playing.value) {
    stopPlayback();
    return;
  }
  if (!canForward.value) seek(0);
  playing.value = true;
  scheduleNext();
}

function chooseGraph() {
  const g = graph.value;
  start.value = g.defaultStart;
  goal.value = g.defaultGoal;
  loadExecution();
}

function isLineActive(line) {
  if (!currentEvent.value) return false;
  const stmt = currentEvent.value.statement;
  if (!stmt || !line.statement) return false;
  if (stmt === line.statement) return true;
  if (stmt.includes("DB-DFS") && line.id === "call") return true;
  return false;
}

function formatCode(text) {
  if (!text) return "";
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  escaped = escaped.replace(
    /\b(function|while|if|return|repeat|until|else|null|TRUE|FALSE)\b/g,
    '<span class="code-kw">$1</span>'
  );

  escaped = escaped.replace(
    /\b(MoveGen|RemoveSeen|MakePairs|ReconstructPath|GoalTest|DB-DFS-N|DB-DFS-C|DFS|BFS|DFID_N|DFID_C|DB_DFS_N|DB_DFS_C|SimpleSearch1|SimpleSearch2|head|tail|length)\b/g,
    '<span class="code-fn">$1</span>'
  );

  escaped = escaped.replace(
    /\b(OPEN|CLOSED)\b/g,
    '<span class="code-struct">$1</span>'
  );

  escaped = escaped.replace(
    /(←|∪|−|\+\+)/g,
    '<span class="code-op">$1</span>'
  );

  return escaped;
}

const codeListRef = ref(null);

function scrollToActiveLine() {
  nextTick(() => {
    const container = codeListRef.value;
    if (!container) return;
    const activeEl = container.querySelector(".code-line.active");
    if (activeEl) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const offset = (activeRect.top - containerRect.top) - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
      container.scrollTo({
        top: container.scrollTop + offset,
        behavior: playing.value && Number(speed.value) < 600 ? "auto" : "smooth"
      });
    }
  });
}

watch(cursor, scrollToActiveLine);
watch([algorithmId, start, goal], () => {
  loadExecution();
  scrollToActiveLine();
});
onBeforeUnmount(stopPlayback);
loadExecution();
scrollToActiveLine();
</script>

<template>
  <main class="app-shell">

    <!-- Top Section: Configuration & Step Controls -->
    <section class="top-controls-section">
      <!-- Configuration Controls -->
      <div class="panel config-bar">
        <div class="config-field">
          <label for="algorithm">Algorithm</label>
          <select id="algorithm" v-model="algorithmId">
            <option v-for="item in algorithmOptions" :key="item.id" :value="item.id">{{ item.label }}</option>
          </select>
        </div>

        <div class="config-field">
          <label for="graph">Graph</label>
          <select id="graph" v-model="graphId" @change="chooseGraph">
            <option v-for="item in defaultGraphs" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>

        <div class="config-field-group">
          <div class="config-field compact">
            <label for="start">Start</label>
            <select id="start" v-model="start">
              <option v-for="node in graph.nodes" :key="node" :value="node">{{ node }}</option>
            </select>
          </div>
          <div class="config-field compact">
            <label for="goal">Goal</label>
            <select id="goal" v-model="goal">
              <option v-for="node in graph.nodes" :key="node" :value="node">{{ node }}</option>
            </select>
          </div>
        </div>

        <div class="config-field compact">
          <label for="speed-select">Speed</label>
          <select id="speed-select" v-model="speed" aria-label="Playback speed">
            <option value="1500">Slow</option>
            <option value="850">Normal</option>
            <option value="350">Fast</option>
          </select>
        </div>
      </div>

      <!-- Step Controls Bar -->
      <div class="panel step-controls-bar">
        <div class="controls-main-row">
          <div class="playback-buttons">
            <button class="btn icon-btn" title="Reset (first step)" aria-label="Reset" @click="reset">↺</button>
            <button class="btn icon-btn" title="Previous step" aria-label="Previous step" :disabled="!canBack" @click="previous">‹</button>
            <button class="btn play-btn" @click="togglePlay">
              <span class="play-icon">{{ playing ? "❚❚" : "▶" }}</span>
              <span>{{ playing ? "Pause" : "Play" }}</span>
            </button>
            <button class="btn icon-btn next-btn" title="Next step" aria-label="Next step" :disabled="!canForward" @click="next">›</button>
            <button class="btn icon-btn" title="Jump to end" aria-label="Jump to end" :disabled="!canForward" @click="end">↠</button>
          </div>

          <div class="step-meta">
            <span class="status-badge" :class="`status-${state?.status}`">{{ state?.status ?? "ready" }}</span>
            <span class="step-counter">
              Step <strong>{{ events.length ? cursor + 1 : 0 }}</strong> of <strong>{{ events.length }}</strong>
            </span>
          </div>
        </div>

        <div class="timeline" title="Execution progress">
          <div class="timeline-fill" :style="{ width: `${progress}%` }"></div>
        </div>

        <div class="current-step-details" v-if="currentEvent">
          <span class="operation-pill">{{ currentEvent.operation }}</span>
          <code class="step-statement">{{ currentEvent.statement }}</code>
          <span class="step-explanation">{{ currentEvent.explanation }}</span>
        </div>
      </div>
    </section>

    <!-- Main Columns: Pseudocode on Left, Graph on Right -->
    <section class="main-columns">
      <!-- Left: Pseudocode -->
      <div class="panel pseudocode-panel">
        <div class="panel-header">
          <h2>Pseudocode</h2>
        </div>
        <div class="code-list" ref="codeListRef">
          <div
            v-for="(line, index) in lines"
            :key="line.id"
            class="code-line"
            :class="{ active: isLineActive(line), 'is-header': line.isHeader }"
          >
            <span class="line-number">{{ index + 1 }}</span>
            <code :style="{ paddingLeft: `${(line.indent || 0) * 18}px` }">
              <span v-html="formatCode(line.text)"></span>
            </code>
          </div>
        </div>
      </div>

      <!-- Right: Graph -->
      <div class="panel graph-panel">
        <div class="panel-header">
          <h2>Graph</h2>
          <span class="header-pill">{{ graph.nodes.length }} nodes</span>
        </div>
        <GraphCanvas v-if="state" :graph="graph" :state="state" :events="events" :cursor="cursor" />
      </div>
    </section>

    <!-- Bottom: Variables -->
    <section class="panel variables-panel">
      <div class="panel-header">
        <h2>Variables</h2>
      </div>
      <div v-if="variableEntries.length" class="variables-grid">
        <div v-for="[name, value] in variableEntries" :key="name" class="variable-card">
          <div class="variable-name"><code>{{ name }}</code></div>
          <div class="variable-val"><ValueView :value="value" /></div>
        </div>
      </div>
      <div v-else class="empty-state">No variables recorded yet.</div>
    </section>

    <footer>
      <span>ALGORITHM LAB</span>
      <span>Deterministic Execution Engine Drives Display</span>
    </footer>

    <div v-if="error" class="error-toast" role="alert">{{ error }}</div>
  </main>
</template>
