# AI SMPS 2023 — Week 3 Algorithms (Ver. 2)
**Prepared by S. Baskaran**

> Source transcription: original wording and algorithm logic are retained as closely as possible. Formatting and damaged symbols have been normalized for text/LLM readability. The TSP Algorithms section is intentionally excluded.

---

## 1. Node Order

MoveGen determines the order in which nodes are generated, and algorithms determine the order in which nodes are inspected. Some algorithms follow MoveGen order and some reorder the nodes.

For each algorithm discussed in this course, study the order in which nodes are added to and removed from OPEN/CLOSED lists and other data structures.

It is important to understand how list structures are constructed, accessed and printed. Study the `cons` and `append` operators and pay attention to the order in which items are cons-ed (added) and appended to lists.

**WARNING:** While answering auto-graded short-answer type questions, it is important to maintain the algorithm-specific node order; otherwise, the auto-grader will mark the answer as wrong and there are no partial marks.

**WARNING:** Often, participants understand the concepts correctly and may follow a different variation of an algorithm or a different implementation of `cons` and `append` operators. They may arrive at a practically viable solution but with a different node order. In this case, the auto-grader will mark the answer as wrong.

---

## 2. Tie Breaking a Pool of Best Nodes

MoveGen determines the order in which nodes are generated, and algorithms determine the order in which nodes are inspected. Some algorithms follow MoveGen order and some reorder the nodes.

Cost-based (deterministic or heuristic) algorithms select the best node in each iteration. Often there will be a pool of best nodes with the same cost, and we do not know which nodes lead to a solution.

In a real-world scenario, an additional criterion (external to the algorithm) may be provided to filter the pool of best nodes, or else a random node may be selected from the pool. Each such selection may potentially lead to a different solution or no solution at all.

A pool of best nodes makes it difficult to set up all possible answers for an auto-graded question, so we use node label to break ties.

**Tie-breaking rule:** When multiple nodes have the same (best) cost, sort those nodes in alphabetical order of node label and select nodes from the head of the sorted list.

This tie-breaker helps us to focus on the algorithm and not get beat up on the finer details of a (made-up) toy problem.

On the other hand, outside the scope of auto-graded assignments and exams, we urge you to investigate all the problems/solutions/algorithms and find ways to improve them. Wish you the best.

---

## 3. Algorithms

This is a continuation of algorithms published in Week 2 Notes.

### 3.1 Best-First-Search(S)

```text
Best-First-Search(S)
1.  OPEN   ← [(S, null, h(S))]
2.  CLOSED ← empty list
3.  while OPEN is not empty:
4.      nodePair ← head(OPEN)
5.      (N, _, _) ← nodePair
6.      if GoalTest(N) = true:
7.          return ReconstructPath(nodePair, CLOSED)
8.      else:
9.          CLOSED ← nodePair : CLOSED
10.         neighbours ← MoveGen(N)
11.         newNodes ← RemoveSeen(neighbours, OPEN, CLOSED)
12.         newPairs ← MakePairs(newNodes, N)
13.         OPEN ← sort_h(newPairs ++ tail(OPEN))
14. return empty list
```

### 3.2 Hill-Climbing(S)

```text
Hill-Climbing(S)
1.  N ← S
2.  do:
3.      bestEver ← N
4.      N ← head(sort_h(MoveGen(bestEver)))
5.  while h(N) is better than h(bestEver)
6.  return bestEver
```

### 3.3 Variable-Neighbourhood-Descent(S)

```text
Variable-Neighbourhood-Descent(S)
1.  MoveGenList ← MoveGen1 : MoveGen2 : ... : MoveGenn : []
2.  bestNode ← S
3.  while MoveGenList is not empty:
4.      bestNode ← Hill-Climbing(bestNode, head(MoveGenList))
5.      MoveGenList ← tail(MoveGenList)
6.  return bestNode
```

### 3.4 Best-Neighbour-Search(S)

```text
Best-Neighbour-Search(S)
1.  N ← S
2.  bestEver ← S
3.  until some termination condition:
4.      N ← best Move-Gen(N)
5.      if N is better than bestEver:
6.          bestEver ← N
7.  return bestEver
```

### 3.5 Iterated-Hill-Climbing(N)

```text
Iterated-Hill-Climbing(N)
1.  bestNode ← random candidate solution
2.  repeat N times:
3.      currentBest ← Hill-Climbing(new random candidate solution)
4.      if h(currentBest) is better than h(bestNode):
5.          bestNode ← currentBest
6.  return bestNode
```

---

## 4. Beam Search

We will use the following version of Beam Search in assignments and exams because it is assignment-friendly and prevents infinite loops.

Here, `sort_h` sorts from best to worst h-values.

### 4.1 Beam-Search(S, w)

```text
Beam-Search(S, w)
1.  OPEN ← [S]
2.  N ← S
3.  do:
4.      bestEver ← N
5.      if OPEN contains goal node:
6.          return that goal node
7.      else:
8.          neighbours ← Move-Gen(OPEN)
9.          OPEN ← take(w, sort_h(neighbours))
10.         N ← head(OPEN)    # best in new layer
11. while h(N) is better than h(bestEver)
12. return bestEver
```

### 4.2 Move-Gen(OPEN)

```text
Move-Gen(OPEN)
1.  neighbours ← []
2.  for each X in OPEN:
3.      neighbours ← neighbours ++ Move-Gen(X)
4.  return neighbours    # the list preserves duplicates
```

### 4.3 Definition of take

`take(n, LIST)` returns at most `n` values from the beginning of `LIST`.

Examples:

```text
take(3, [o, u, t, r, u, n]) = [o, u, t]
take(3, [a, t])             = [a, t]
take(3, [a])                = [a]
take(3, [])                 = []
```

---

## 5. Notation used in this transcription

These formatting notes clarify the notation represented in the source; they do not add algorithm steps.

- `[]` means an empty list.
- `head(LIST)` means the first item in a list.
- `tail(LIST)` means the list after removing its first item.
- `x : LIST` represents consing/prepending `x` to a list.
- `A ++ B` represents concatenating lists `A` and `B`.
- `sort_h(LIST)` means sorting according to `h`-values. For Beam Search, the source explicitly says this is from best to worst `h`-values.
- `_` means a value is ignored.
- `h(N)` is retained as written in the source; its meaning depends on the course's heuristic/cost convention.
- “Better than” is retained as the source's comparison phrase; do not assume whether this means numerically larger or smaller without the course's convention.

---

## Scope

Included:
- Node Order instructions
- Tie Breaking a Pool of Best Nodes instructions
- Best-First-Search
- Hill-Climbing
- Variable-Neighbourhood-Descent
- Best-Neighbour-Search
- Iterated-Hill-Climbing
- Beam Search
- Move-Gen(OPEN)
- `take` definition and examples

Excluded:
- The entire **TSP Algorithms** section (Nearest-Neighbour-Heuristic, Greedy-Heuristic, and Savings-Heuristic).
