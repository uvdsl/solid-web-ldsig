<template>
  <!-- <Scribe /> -->

  <GraphVizzard :nodes="nodes" :links="links"/>

  <Toast position="bottom-right" />
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
// import Scribe from "@/components/Scribe.vue";
import GraphVizzard from "@/components/visualise/GraphVizzard.vue";

export default defineComponent({
  name: "Home",
  components: {
    GraphVizzard,
  },
  setup() {
    const nodes = ref([
      { label: "a", isValid: true },
      { label: "b", isValid: true },
      { label: "c", isValid: true },
      { label: "d", isValid: true },
    ]);
    const links = ref([
      { source: nodes.value[0], target: nodes.value[1], hasVerifiedSource: true },
      { source: nodes.value[0], target: nodes.value[2], hasVerifiedSource: true },
      { source: nodes.value[2], target: nodes.value[3], hasVerifiedSource: true },
    ]);
    return {
      nodes,
      links,
    };
  },
});
</script>

<style lang="scss"></style>
