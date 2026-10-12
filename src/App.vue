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
const sidebarOpen = ref(true);
let timer = null;

function handleRun() {
    loadExecution();
    sidebarOpen.value = false;
    if (!playing.value) {
        togglePlay();
    }
}

function openMenu() {
    stopPlayback();
    sidebarOpen.value = true;
}

const graph = computed(
    () =>
        defaultGraphs.find((item) => item.id === graphId.value) ??
        defaultGraphs[0],
);
const selectedAlgorithm = computed(() =>
    algorithmOptions.find((item) => item.id === algorithmId.value),
);
const currentEvent = computed(() => events.value[cursor.value] ?? null);
const lines = computed(() => pseudocode[algorithmId.value] ?? []);
const variables = computed(() => state.value?.variables ?? {});
const variableEntries = computed(() => Object.entries(variables.value));
const openEntry = computed(() =>
    "OPEN" in variables.value ? ["OPEN", variables.value.OPEN] : null,
);
const closedEntry = computed(() =>
    "CLOSED" in variables.value ? ["CLOSED", variables.value.CLOSED] : null,
);
const otherVariableEntries = computed(() =>
    Object.entries(variables.value).filter(
        ([k]) => k !== "OPEN" && k !== "CLOSED",
    ),
);
const canBack = computed(() => cursor.value > 0);
const canForward = computed(() => cursor.value < events.value.length - 1);
const progress = computed(() =>
    events.value.length > 1
        ? (cursor.value / (events.value.length - 1)) * 100
        : 0,
);

const changedVariables = computed(
    () => currentEvent.value?.changedVariables ?? [],
);

function isVariableChanged(name) {
    return changedVariables.value.includes(name);
}

function isOpenOrClosedList(name, value) {
    return (name === "OPEN" || name === "CLOSED") && Array.isArray(value);
}

function seekByTimeline(event) {
    if (!events.value.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetIndex = Math.round(ratio * (events.value.length - 1));
    stopPlayback();
    seek(targetIndex);
}

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
            goal: goal.value,
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
        '<span class="code-kw">$1</span>',
    );

    escaped = escaped.replace(
        /\b(MoveGen|RemoveSeen|MakePairs|ReconstructPath|GoalTest|DB-DFS-N|DB-DFS-C|DFS|BFS|DFID_N|DFID_C|DB_DFS_N|DB_DFS_C|SimpleSearch1|SimpleSearch2|head|tail|length)\b/g,
        '<span class="code-fn">$1</span>',
    );

    escaped = escaped.replace(
        /\b(OPEN|CLOSED)\b/g,
        '<span class="code-struct">$1</span>',
    );

    escaped = escaped.replace(
        /(←|∪|−|\+\+)/g,
        '<span class="code-op">$1</span>',
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
            const offset =
                activeRect.top -
                containerRect.top -
                container.clientHeight / 2 +
                activeEl.clientHeight / 2;
            container.scrollTo({
                top: container.scrollTop + offset,
                behavior:
                    playing.value && Number(speed.value) < 600
                        ? "auto"
                        : "smooth",
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
        <!-- Backdrop to close sidebar on outside click -->
        <div
            v-if="sidebarOpen"
            class="sidebar-backdrop"
            @click="sidebarOpen = false"
        ></div>

        <!-- Slide-over Sidebar Drawer (Attached to left edge of screen) -->
        <aside
            class="panel sidebar-panel edge-sidebar"
            :class="{ 'is-open': sidebarOpen }"
            aria-label="Configuration Sidebar"
        >
            <div class="panel-header sidebar-header">
                <button
                    class="btn collapse-btn"
                    @click="sidebarOpen = false"
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                >
                    <span class="collapse-icon"
                        ><svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="lucide lucide-chevrons-left preview-icon"
                        >
                            <path d="m11 17-5-5 5-5" />
                            <path d="m18 17-5-5 5-5" /></svg
                    ></span>
                </button>
            </div>

            <div class="sidebar-content">
                <div class="sidebar-field">
                    <label for="algorithm">Algorithm</label>
                    <select id="algorithm" v-model="algorithmId">
                        <option
                            v-for="item in algorithmOptions"
                            :key="item.id"
                            :value="item.id"
                        >
                            {{ item.label }}
                        </option>
                    </select>
                </div>

                <div class="sidebar-field">
                    <label for="graph">Graph</label>
                    <select id="graph" v-model="graphId" @change="chooseGraph">
                        <option
                            v-for="item in defaultGraphs"
                            :key="item.id"
                            :value="item.id"
                        >
                            {{ item.name }}
                        </option>
                    </select>
                </div>

                <div class="sidebar-field-row">
                    <div class="sidebar-field">
                        <label for="start">Start</label>
                        <select id="start" v-model="start">
                            <option
                                v-for="node in graph.nodes"
                                :key="node"
                                :value="node"
                            >
                                {{ node }}
                            </option>
                        </select>
                    </div>
                    <div class="sidebar-field">
                        <label for="goal">Goal</label>
                        <select id="goal" v-model="goal">
                            <option
                                v-for="node in graph.nodes"
                                :key="node"
                                :value="node"
                            >
                                {{ node }}
                            </option>
                        </select>
                    </div>
                </div>


                <div class="sidebar-actions">
                    <button
                        class="btn btn-run"
                        @click="handleRun"
                        title="Apply configuration, run, and hide sidebar"
                    >
                        <span class="run-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-play preview-icon"><path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z"/><circle cx="12" cy="12" r="10"/></svg></span>
                        <span>Run</span>
                    </button>
                </div>
            </div>
        </aside>

        <!-- Main Content Area: Full Width (Top: Variables, Bottom: Pseudocode & Graph) -->
        <div class="main-content-area">
            <!-- TOP: Variable Section (spans across both columns) -->
            <section class="panel variables-panel">
                <div class="panel-header variables-header">
                    <div class="panel-header-title">
                        <button
                            v-if="!sidebarOpen"
                            class="btn menu-toggle-btn inline-menu-btn"
                            @click="openMenu"
                            title="Open configuration menu"
                            aria-label="Open menu"
                        >
                            <span class="menu-icon"
                                ><svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="lucide lucide-settings-2 preview-icon"
                                >
                                    <path d="M14 17H5" />
                                    <path d="M19 7h-9" />
                                    <circle cx="17" cy="17" r="3" />
                                    <circle cx="7" cy="7" r="3" /></svg
                            ></span>
                            <span>Menu</span>
                        </button>
                        <h2>Variables</h2>
                    </div>
                </div>
                <div
                    v-if="variableEntries.length"
                    class="variables-panel-layout"
                >
                    <!-- OPEN list: fixed 25% width -->
                    <div
                        v-if="openEntry"
                        class="variable-cell primary-list-cell open-list-cell"
                        :class="{ 'cell-changed': isVariableChanged('OPEN') }"
                    >
                        <div class="cell-heading">
                            <code>OPEN</code>
                            <span
                                v-if="isVariableChanged('OPEN')"
                                class="change-dot"
                                title="Modified in this step"
                            ></span>
                        </div>
                        <div class="cell-body">
                            <ValueView :value="openEntry[1]" />
                        </div>
                    </div>

                    <!-- CLOSED list: fixed 25% width -->
                    <div
                        v-if="closedEntry"
                        class="variable-cell primary-list-cell closed-list-cell"
                        :class="{ 'cell-changed': isVariableChanged('CLOSED') }"
                    >
                        <div class="cell-heading">
                            <code>CLOSED</code>
                            <span
                                v-if="isVariableChanged('CLOSED')"
                                class="change-dot"
                                title="Modified in this step"
                            ></span>
                        </div>
                        <div class="cell-body">
                            <ValueView :value="closedEntry[1]" />
                        </div>
                    </div>

                    <!-- Other variables: remaining 50% width in compact subgrid -->
                    <div class="other-variables-container">
                        <div
                            v-for="[name, value] in otherVariableEntries"
                            :key="name"
                            class="variable-cell standard-var-cell"
                            :class="{ 'cell-changed': isVariableChanged(name) }"
                        >
                            <div class="cell-heading">
                                <code>{{ name }}</code>
                                <span
                                    v-if="isVariableChanged(name)"
                                    class="change-dot"
                                    title="Modified in this step"
                                ></span>
                            </div>
                            <div class="cell-body">
                                <ValueView :value="value" />
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state">No variables recorded yet.</div>
            </section>

            <!-- BOTTOM: 2 Columns (Pseudocode Left, Graph Right with Graph controls at bottom) -->
            <div class="workspace-columns">
                <!-- Left Column: Pseudocode Section -->
                <div class="panel pseudocode-panel">
                    <div class="panel-header">
                        <h2>Pseudocode</h2>
                        <span class="header-pill">{{
                            selectedAlgorithm?.label
                        }}</span>
                    </div>
                    <div class="code-list" ref="codeListRef">
                        <div
                            v-for="(line, index) in lines"
                            :key="line.id"
                            class="code-line"
                            :class="{
                                active: isLineActive(line),
                                'is-header': line.isHeader,
                            }"
                        >
                            <span class="line-number">{{ index + 1 }}</span>
                            <code
                                :style="{
                                    paddingLeft: `${(line.indent || 0) * 18}px`,
                                }"
                            >
                                <span v-html="formatCode(line.text)"></span>
                            </code>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Graph Section (with Graph controls at bottom) -->
                <div class="panel graph-panel">
                    <div class="panel-header">
                        <h2>Graph</h2>
                        <span class="header-pill"
                            >{{ graph.nodes.length }} nodes</span
                        >
                    </div>

                    <GraphCanvas
                        v-if="state"
                        :graph="graph"
                        :state="state"
                        :events="events"
                        :cursor="cursor"
                    />

                    <!-- Graph Controls (merged at the bottom under graph canvas) -->
                    <div class="graph-step-controls">
                        <!-- Timeline / Progress bar with end bar handle: =========| -->
                        <div
                            class="timeline"
                            title="Click to seek"
                            @click="seekByTimeline"
                        >
                            <div
                                class="timeline-fill"
                                :style="{ width: `${progress}%` }"
                            >
                                <div class="timeline-handle"></div>
                            </div>
                        </div>

                        <!-- Controls row: buttons + status + step counter -->
                        <div class="controls-main-row">
                            <div class="playback-buttons">
                                <button
                                    class="btn icon-btn"
                                    title="Reset (first step)"
                                    aria-label="Reset"
                                    @click="reset"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="lucide lucide-rotate-ccw preview-icon"
                                    >
                                        <path
                                            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                                        />
                                        <path d="M3 3v5h5" />
                                    </svg>
                                </button>
                                <button
                                    class="btn icon-btn"
                                    title="Previous step"
                                    aria-label="Previous step"
                                    :disabled="!canBack"
                                    @click="previous"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="lucide lucide-chevron-first preview-icon"
                                    >
                                        <path d="m17 18-6-6 6-6" />
                                        <path d="M7 6v12" />
                                    </svg>
                                </button>
                                <button
                                    class="btn play-btn"
                                    @click="togglePlay"
                                >
                                    <span class="play-icon">
                                        <svg
                                            v-if="!playing"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            class="lucide lucide-play preview-icon"
                                        >
                                            <path
                                                d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
                                            />
                                        </svg>

                                        <svg
                                            v-else
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            class="lucide lucide-pause preview-icon"
                                        >
                                            <rect
                                                x="14"
                                                y="3"
                                                width="5"
                                                height="18"
                                                rx="1"
                                            />
                                            <rect
                                                x="5"
                                                y="3"
                                                width="5"
                                                height="18"
                                                rx="1"
                                            />
                                        </svg>
                                    </span>
                                    <span>{{
                                        playing ? "Pause" : "Play"
                                    }}</span>
                                </button>
                                <button
                                    class="btn icon-btn next-btn"
                                    title="Next step"
                                    aria-label="Next step"
                                    :disabled="!canForward"
                                    @click="next"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-last preview-icon"><path d="m7 18 6-6-6-6"/><path d="M17 6v12"/></svg>
                                </button>
                                <button
                                    class="btn icon-btn"
                                    title="Jump to end"
                                    aria-label="Jump to end"
                                    :disabled="!canForward"
                                    @click="end"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fast-forward preview-icon"><path d="M12 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 12 18z"/><path d="M2 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 2 18z"/></svg>
                                </button>
                            </div>

                            <div class="step-meta">
                                <span class="step-counter">
                                    Step
                                    <strong>{{
                                        events.length ? cursor + 1 : 0
                                    }}</strong>
                                    of <strong>{{ events.length }}</strong>
                                </span>
                            </div>
                            <div class="speed-control">
                                <button
                                    type="button"
                                    v-for="option in [
                                        { label: '.5×', value: 1500 },
                                        { label: '1×', value: 850 },
                                        { label: '2×', value: 350 }
                                    ]"
                                    :key="option.value"
                                    class="speed-option"
                                    :class="{ active: speed === option.value }"
                                    :aria-pressed="speed === option.value"
                                    @click="speed = option.value"
                                >
                                    {{ option.label }}
                                </button>
                            </div>
                        </div>

                        <!-- Current step details (Operation pill, statement, explanation) -->
                        <div class="current-step-details" v-if="currentEvent">
                            <span class="operation-pill">{{
                                currentEvent.operation
                            }}</span>
                            <code class="step-statement">{{
                                currentEvent.statement
                            }}</code>
                            <span class="step-explanation">{{
                                currentEvent.explanation
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="error" class="error-toast" role="alert">{{ error }}</div>
    </main>
</template>
