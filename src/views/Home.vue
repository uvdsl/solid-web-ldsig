<template>
  <Lector
    v-if="!selected"
    @openScribe="select"
    @saveURI="saveLectorURI"
    :inititalURI="lectorURI"
    @fetchFinished="contDemo"
  />
  <Scribe v-if="selected" @back="unselect" :inititalURI="scribeURI" @fetchFinished="contDemo" />

  <!-- Demo Dialog -->

  <Dialog header="Welcome to the Live Demo!" v-model:visible="openedDemo"  position="bottom">
    <div class="flex flex-wrap align-items-center" >
      <div style="margin:15px 0px 15px 0px;">Check out our:</div>
      <div class="flex justify-content-between">
      <Button label="Website" class="p-button-rounded" style="margin-left:10px" @click="refWebsite" />
      <Button label="Code" class="p-button-rounded" style="margin-left:10px" @click="refCode" />
      <Button label="Paper" class="p-button-rounded" style="margin-left:10px" @click="refPaper" />
    </div>
    </div>
    <div>
    <p>
      In this demo, we showcase Linked Data Signatures, Signed URIs and the
      resulting document graph.
    </p>
    <p>
      The app has two views: 
      <ul>
        <li> With the {{!selected ? 'current' : 'other'}} one, where you can visualise a graph of documents that are available at a Signed URI. </li>
        <li> With the {{selected ? 'current' : 'other'}}  one, GET resources from the Web, edit them, sign them, and PUT them at a Signed URI. </li>
      </ul>
      You can activate the demo mode by clicking the "Demo Me"-Button.
      <br/>
      To disable demo mode, click the "Got it"-Button.
      <br /> 
      To bring the current demo dialog back, click the "Help!"-Button which will appear in the bottom right corner of your screen.
    </p>
    </div>
    <template #footer>
      <Button
        label="Demo me!"
        class="p-button-outlined"
        autofocus
        @click="showDemo"
      />
      <Button
        label="Got it!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo = false"
      />
    </template>
  </Dialog>

<Dialog header="Now you see a colorful graph!" v-model:visible="openedDemo2" position="bottom">
  <p>
    Each node represents a document that is available at a Signed URI.<br />
    Each edge represents a link to another document via a Signed URI.
  </p>
   <p>
    A green colored node indicates that the all verification steps were successful.<br />
    A red colored node indicates that some verification step was unsuccessful.
  </p>
  <p>
    Click on the red colored node to inspect the resource in detail! <br />
    You will be taken to the other view of this app, but I will be there to help you.
  </p>
<template #footer>
      <Button
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo2 = false; demoSelect();"
      />
      <Button
        label="Got it!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo2 = false; isInDemoMode = 0; lectorURI=''"
      />
    </template>
  </Dialog>

<Dialog header="Hello there!" v-model:visible="openedDemo3" position="bottom">
  <p>
    The resource you selected has been
  </p>
   <p>
    A green colored node indicates that the all verification steps were successful.<br />
    A red colored node indicates that some verification step was unsuccessful.
  </p>
  <p>
    Click on the red colored node to inspect the resource in detail! <br />
    You will be taken to the other view of this app, but I will be there to help you.
  </p>
<template #footer>
      <Button
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo3 = false; demoSelect();"
      />
      <Button
        label="Got it!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo3 = false; isInDemoMode = 0; lectorURI='';"
      />
    </template>
  </Dialog>

  <div class="floating">
    <Button
      label="Help!"
      class="p-button-outlined"
      v-if="!openedDemo"
      @click="openCurrentDemoDialog"
    />
  </div>

  <Toast
    position="bottom-right"
    :breakpoints="{ '420px': { width: '100%', right: '0', left: '0' } }"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import Scribe from "@/components/create/Scribe.vue";
import Lector from "@/components/visualise/Lector.vue";
import { useToast } from "primevue/usetoast";

export default defineComponent({
  name: "Home",
  components: { Scribe, Lector },
  setup() {
    const toast = useToast();
    const openedDemo = ref(true);
    const openedDemo2 = ref(false);
    const openedDemo3 = ref(false);
    const isInDemoMode = ref(0);
    const selected = ref(0);
    const scribeURI = ref("");
    const lectorURI = ref("");
    const select = (uri: string) => {
      // for demo
      if (isInDemoMode.value == 2) {
        openedDemo2.value = false;
      }
      // for usual
      console.log(uri);
      scribeURI.value = uri;
      selected.value = 1;
    };
    const unselect = () => {
      selected.value = 0;
    };
    const saveLectorURI = (uri: string) => {
      lectorURI.value = uri;
    };

    // demo
    const openCurrentDemoDialog = () => {
      console.log(isInDemoMode.value);
      switch (isInDemoMode.value) {
        case 2:
          if (selected.value == 1) {
            toast.add({
              severity: "info",
              summary: "Wrong View!",
              detail: "Swith the View using the Speeddial at the bottom.",
              life: 5000,
            });
            return;
          }
          openedDemo2.value = true;
          break;
        case 3:
          if (selected.value == 0) {
            toast.add({
              severity: "info",
              summary: "Wrong View!",
              detail: "Swith the View using the Speeddial at the bottom.",
              life: 5000,
            });
            return;
          }
          openedDemo3.value = true;
          break;
        default:
          openedDemo.value = true;
      }
    };
    const showDemo = () => {
      openedDemo.value = false;
      if (selected.value == 1) {
        toast.add({
          severity: "info",
          summary: "Switch View!",
          detail:
            "Go back to the GraphViz using the Speeddial at the bottom to start the demo.",
          life: 5000,
        });
        return;
      }
      // activateDemoMode
      lectorURI.value =
        "https://uvdsl.solid.aifb.kit.edu/public/test.ttl__0x877d43e73d5db37e1c335fddcffb475f8a01be513952eccf0ac9d45d7c1657ac9d8d2e097f5dc3e4fe5bffc78b7ee1c77fbed31e2b77c8ef51c867f6ebcb8256";
      isInDemoMode.value = 1;
    };
    const refWebsite = () =>
      window
        .open("http://uvdsl.solid.aifb.kit.edu/conf/2022/eswc-demo-ldsig/", "")
        ?.focus();
    const refCode = () =>
      window.open("https://github.com/uvdsl/solid-web-ldsig", "")?.focus();
    const refPaper = () =>
      window
        .open(
          "http://uvdsl.solid.aifb.kit.edu/conf/2022/eswc-demo-ldsig/paper.pdf",
          ""
        )
        ?.focus();

    const contDemo = () => {
      console.log(isInDemoMode.value);
      switch (isInDemoMode.value) {
        case 1:
          isInDemoMode.value = 2;
          openedDemo2.value = true;
          break;
        case 2:
          if (
            scribeURI.value !==
              "https://uvdsl.solid.aifb.kit.edu/public/test.ttl__0xde959346ae4f31782ba7d9a936f905c5d297c07617848ceabc287004c03d3ea09942304da5cc7ae81129b61f379fe7382485e3f499c367a461f055ee50544736" &&
            selected.value == 1
          ) {
            toast.add({
              severity: "info",
              summary: "Mind Tricks!",
              detail:
                "This is not the resource you are looking for. Go back and try!",
              life: 5000,
            });
            isInDemoMode.value = 1;
            break;
          }
          isInDemoMode.value = 3;
          openedDemo3.value = true;
          break;
      }
    };
    const demoSelect = () => {
      select(
        "https://uvdsl.solid.aifb.kit.edu/public/test.ttl__0xde959346ae4f31782ba7d9a936f905c5d297c07617848ceabc287004c03d3ea09942304da5cc7ae81129b61f379fe7382485e3f499c367a461f055ee50544736"
      );
    };
    return {
      select,
      selected,
      unselect,
      scribeURI,
      lectorURI,
      saveLectorURI,
      openCurrentDemoDialog,
      openedDemo,
      showDemo,
      isInDemoMode,
      contDemo,
      openedDemo2,
      demoSelect,
      openedDemo3,
      refWebsite,
      refCode,
      refPaper,
    };
  },
});
</script>

<style lang="scss" scoped>
.floating {
  position: absolute;
  bottom: 28px;
  right: 15px;
}
</style>
