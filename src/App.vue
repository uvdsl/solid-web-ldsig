<template>
  <HeaderBar />
  <!-- <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </div> -->
  <router-view />
  <Dialog
    header="We updated the App!"
    v-model:visible="isOpen"
    position="bottomright"
  >
    <div>Please save your progress.</div>
    <div>Use the latest version.</div>
    <template #footer>
      <Button label="Update" autofocus @click="refreshApp" />
    </template>
  </Dialog>
</template>

<script lang="ts">
import HeaderBar from "@/components/standard/HeaderBar.vue";
import { defineComponent, ref, watch } from "vue";
import { useServiceWorkerUpdate } from "@/composables/useServiceWorkerUpdate";
export default defineComponent({
  name: "Home",
  components: {
    HeaderBar,
  },
  setup() {
    const { hasUpdatedAvailable, refreshApp } = useServiceWorkerUpdate();
    const isOpen = ref(false);
    watch(hasUpdatedAvailable, () => {
      isOpen.value = hasUpdatedAvailable.value;
    });
    return {
      isOpen,
      refreshApp,
    };
  },
});
</script>

<style lang="scss">
html {
  width: 100vw;
  height: 100vh;
}
body {
  margin: 0px;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: var(--surface-b);
  font-family: var(--font-family);
  font-weight: 400;
  color: var(--text-color);
}
#app {
  height: 100%;
  width: 100%;
}
/* width */
::-webkit-scrollbar {
  // display: none; // but when I do, it looks sweet.
  background: var(--surface-d);
  height: 200px;
  width: 5px;
}

/* Track */
::-webkit-scrollbar-track {
  border: none;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: var(--primary-color);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: cadetblue;
}
</style>
