<template>
  <!-- <Scribe /> -->

  <Lector />

  <Toast position="bottom-right" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
// import Scribe from "@/components/create/Scribe.vue";
import Lector from "@/components/visualise/Lector.vue";

export default defineComponent({
  name: "Home",
  components: { Lector },
});
</script>

<style lang="scss"></style>
