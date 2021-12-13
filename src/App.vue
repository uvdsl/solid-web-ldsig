<template>
  <HeaderBar />
  <!-- <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </div> -->
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HeaderBar from "@/components/HeaderBar.vue";
export default defineComponent({
  name: "Home",
  components: {
    HeaderBar,
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
