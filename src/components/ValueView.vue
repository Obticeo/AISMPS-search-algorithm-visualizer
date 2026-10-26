<script setup>
defineProps({ value: { default: null } });

function format(value) {
  if (value === undefined) return "—";
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(format).join(", ")}]`;
  if (typeof value === "object") {
    if ("node" in value && "parent" in value) {
      const fields = [value.node, value.parent ?? "null"];
      if ("depth" in value) fields.push(value.depth);
      if ("h" in value) fields.push(value.h);
      return `(${fields.join(", ")})`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}
</script>

<template><code class="value-view">{{ format(value) }}</code></template>
