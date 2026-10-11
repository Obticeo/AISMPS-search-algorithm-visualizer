# Source decisions and open validation items

## Source-defined requirements

- DFS line 12: `OPEN ← newPairs ++ (tail OPEN)`.
- BFS line 12: `OPEN ← (tail OPEN) ++ newPairs`.
- DFID-N uses `RemoveSeen(neighbours, OPEN, CLOSED)`.
- DFID-C uses `RemoveSeen(neighbours, OPEN, [])`.
- Neighbor generation and list operations must preserve their specified order.
- DFID node records include depth.

## Application policy (not uniquely specified by source)

Simple Search-1/2 say to pick "some node" from OPEN. The engine chooses the first item in its internal insertion-ordered representation for reproducibility. This policy should be clearly disclosed in the UI.

## Must be validated before educational release

1. Compare helper and path reconstruction behavior with any official worked course examples.
2. Confirm all line references and statements against the PDF's rendered pages.
3. Verify exact DFID-N/C count behavior against hand-derived golden traces.
4. Expand golden trace tests for cycles and multiple paths.
5. Review edge cases where the same node appears more than once in a neighbor list. The source helper filters membership against OPEN/CLOSED, but does not separately specify duplicate elimination among repeated items in the same `nodeList`.
6. Confirm Simple Search set-union display policy with course expectations.
