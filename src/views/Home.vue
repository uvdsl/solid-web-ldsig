<template>
  <Lector v-if="!selected" @openScribe="select(1)" @back="unselect" />
  <Scribe v-if="selected" @back="unselect" />

  <Toast position="bottom-right" />
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import Scribe from "@/components/create/Scribe.vue";
import Lector from "@/components/visualise/Lector.vue";

export default defineComponent({
  name: "Home",
  components: { Scribe, Lector },
  setup() {
    const selected = ref(0);
    const select = (i: number) => {
      selected.value = i;
    };
    const unselect = () => {
      select(0);
    };
    return {
      select,
      selected,
      unselect,
    };
  },
});
</script>

<style lang="scss" scoped>
.p-card {
  margin: 5px;
}
</style>
