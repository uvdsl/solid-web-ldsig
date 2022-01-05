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
 
   <Suspense>
    <template #default>
       <KeyManager />
    </template>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
   <Toast position="bottom-right" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
// import Messenger from "@/components/Messenger.vue";
import Scribe from "@/components/Scribe.vue";
import KeyManager from "@/components/KeyManager.vue";

export default defineComponent({
  name: "Home",
  components: {
    Scribe,
    KeyManager,
  },
});
</script>

<style lang="scss"></style>
