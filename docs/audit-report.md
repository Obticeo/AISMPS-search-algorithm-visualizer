# Algorithm Engine Audit Report

## Audit basis

Compared the existing engine with the pseudocode in the supplied IIT Madras Week 2 Algorithms PDF (pages 2–7). This report distinguishes source-defined behavior from application policy.

## Correctness discrepancies found and fixed

### 1. DFS/BFS removed OPEN's head too early and twice

**Source:** PDF page 3, lines 4–12.

The source reads `head OPEN`, adds the selected pair to CLOSED, computes neighbors/newNodes/newPairs, and then removes the current head through the `tail OPEN` expression at line 12.

**Previous implementation:** removed the OPEN head immediately when updating CLOSED, then applied `tail OPEN` again in the line-12 update. This could drop the next node from OPEN.

**Fix:** retain the current head through the intermediate assignments. Apply the tail exactly once in the source OPEN update:
- DFS: `newPairs ++ (tail OPEN)`
- BFS: `(tail OPEN) ++ newPairs`

### 2. DFID-N/DFID-C also removed OPEN's head too early

**Source:** PDF pages 5–6, lines 14–25.

The current triple must remain in OPEN through CLOSED update, neighbor generation, filtering, and pair creation. The source line 23 or line 25 performs the tail operation.

**Previous implementation:** removed the head before line 18 and then removed another head at line 23/25.

**Fix:** only remove the current head in the exact source OPEN update.

### 3. Path reconstruction advanced beyond the matched CLOSED entry

**Source:** PDF page 4, `ReconstructPath`, lines 9–10; page 7, depth-aware reconstruction, lines 9–10.

The source assigns `CLOSED ← SkipTo(...)`, where `SkipTo` returns the suffix beginning at the matched entry. The next operation reads the head of that suffix.

**Previous implementation:** advanced to `matches.slice(1)`, skipping the matched entry.

**Fix:** retain the matched suffix for the next source operation. Added tests for ordinary and depth-aware reconstruction.

## Preserved source distinctions

- DFS and BFS retain their exact, different line-12 OPEN expressions.
- DFID-N calls `RemoveSeen(neighbours, OPEN, CLOSED)`.
- DFID-C calls `RemoveSeen(neighbours, OPEN, [])`.
- Neighbor order remains the configured adjacency-list order.
- `MakePairs` preserves input order.

## Application policy, not a PDF rule

Simple Search-1 and Simple Search-2 say to pick “some node” from OPEN. The PDF does not specify a unique selection policy. The implementation uses the first item in an insertion-ordered representation for deterministic replay. The UI must disclose this policy.

## Golden trace tests added

`test/golden-traces.test.js` includes explicit expected-state checks for:
- DFS intermediate OPEN/CLOSED and line-12 ordering.
- BFS OPEN order and selected-node sequence.
- DFID depth bounds and count updates.
- DFID-C's empty CLOSED argument to `RemoveSeen`.
- Simple Search-1 deterministic node-selection policy.
- Simple Search-2 CLOSED-before-goal-test order.

## Remaining validation required before educational release

These tests are golden fixtures derived from the source procedure and a declared sample graph; they are not official course-provided expected traces. Before release, cross-check additional traces against worked course examples, especially DFID behavior on cyclic graphs and repeated-neighbor inputs.
