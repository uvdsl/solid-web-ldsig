<template>
  <!-- <div class="full-screen"> -->
  <!-- <Suspense>
    <template #default>
      <Messenger />
    </template>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense> -->
  <!-- </div> -->
  <Scribe />
</template>

<script lang="ts">
import { defineComponent } from "vue";
// import Messenger from "@/components/Messenger.vue";
import Scribe from "@/components/Scribe.vue";

export default defineComponent({
  name: "Home",
  components: {
    Scribe,
  },
});
</script>

<style lang="scss"></style>
