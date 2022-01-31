<template>
  <Lector v-if="!selected" @openScribe="select" @back="unselect" @saveURI="saveLectorURI" :inititalURI="lectorURI"/>
  <Scribe v-if="selected" @back="unselect" :inititalURI="scribeURI"/>

    <Toast
    position="bottom-right"
    :breakpoints="{ '420px': { width: '100%', right: '0', left: '0' } }"
  /> 
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
    const scribeURI = ref("");
    const lectorURI = ref("");
    const select = (uri: string) => {
      console.log(uri)
      scribeURI.value = uri;
      selected.value = 1
    };
    const unselect = () => {
      selected.value = 0
    };
    const saveLectorURI = (uri:string) => {
      lectorURI.value = uri;
    }
    return {
      select,
      selected,
      unselect,
      scribeURI,
      lectorURI,
      saveLectorURI
    };
  },
});
</script>

<style lang="scss" scoped>
.p-card {
  margin: 5px;
}
</style>
