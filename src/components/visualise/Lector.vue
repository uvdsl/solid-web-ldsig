<template>
  <div class="grid">
    <div class="col md:col-6 md:col-offset-3">
      <div class="p-inputgroup">
        <InputText
          placeholder="The URI of the Resource to search links for."
          v-model="uri"
          @keyup.enter="fetch"
        />
        <Button @click="fetch"> GET </Button>
      </div>
      <div class="progressbarWrapper">
        <ProgressBar v-if="isLoading" mode="indeterminate" />
      </div>
    </div>
    </div>
    <div class="grid">
      <div class="col">
        <GraphVizzard
          v-if="nodes.length != 0 && !isLoading"
          :nodes="nodes"
          :links="links"
          class="sizing"
          @selected="openScribe"
        />
    </div>
  </div>
  <div class="grid">
    <div class="col md:col-6 md:col-offset-3">
      <SpeedDial showIcon="pi pi-pencil" @click="openScribe('')" />
    </div>
  </div>
</template>

<script lang="ts">
import { useSolidSession } from "@/composables/useSolidSession";
import { verifyLDSignature } from "@/lib/ldsig";
import { getResource, parseToN3 } from "@/lib/solidRequests";
import { Store } from "n3";
import { useToast } from "primevue/usetoast";
import { defineComponent, ref, computed, Ref, watch } from "vue";
import GraphVizzard from "./GraphVizzard.vue";

interface Node {
  label: string;
  isValid?: boolean;
}
interface Link {
  source: Node;
  target: Node;
}

export default defineComponent({
  name: "Lector",
  components: { GraphVizzard },
  props: { inititalURI: String },
  emits: ["openScribe", "back", "saveURI"],
  setup(props, context) {
    const { authFetch } = useSolidSession();
    const toast = useToast();
    const isLoading = ref(false);

    const uri = ref(props.inititalURI as string);
    const isHTTP = computed(
      () => uri.value.startsWith("http://") || uri.value.startsWith("https://")
    );

    const links: Ref<Link[]> = ref([]);
    const nodes: Ref<Node[]> = ref([]);
    watch(links, () => {
      nodes.value = Object.values(visitedNodes);
      if (links.value.length == 0) {
        nodes.value = [];
        toast.add({
          severity: "error",
          summary: "No links?",
          detail: "Could not find any links.",
          life: 5000,
        });
      }
    });

    let visitedNodes: Record<string, Node> = {};

    const fetch = async () => {
      if (!isHTTP.value) {
        return;
      }
      isLoading.value = true;
      context.emit("saveURI", uri.value);
      toast.add({
        severity: "info",
        summary: "Hang on ...",
        detail: "Loading the graph.",
        life: 5000,
      });
      visitedNodes = {};
      traverse(uri.value)
        .then((data) => (links.value = data.linkage))
        .finally(() => (isLoading.value = false));
    };
    

    const traverse = async (
      uri: string
    ): Promise<{ node: Node; linkage: Link[] }> => {
      const vNode = visitedNodes[uri];
      if (vNode) {
        return { node: vNode, linkage: [] };
      }
      const { store } = await getResource(uri, authFetch.value)
        .then((resp) => resp.text())
        .then((txt) => parseToN3(txt, uri.split("__0x")[0]))
        .catch((err) => ({ store: new Store() }));
      // node
      const label = uri;
      const isValid = await verifyLDSignature(store);
      const node = { label, isValid };
      visitedNodes[uri] = node;
      // links
      const linking = getLinks(store);
      // .filter(
      // (linked_uri) => !visitedURIs.has(linked_uri)
      // );
      const references: { node: Node; linkage: Link[] }[] = [];
      for (const lnk of linking) {
        references.push(await traverse(lnk));
      }
      const linkage = references
        .map((ref) => [
          ...ref.linkage,
          {
            source: node,
            target: ref.node,
          },
        ])
        .flat();
      return { node, linkage };
    };

    const getLinks = (store: Store) => {
      const uris = store
        .getQuads(null, null, null, null)
        .map((quad) => {
          const result = [];
          if (quad.subject.id.includes("__0x"))
            result.push(quad.subject.id.split("#")[0]);
          if (quad.object.id.includes("__0x"))
            result.push(quad.object.id.split("#")[0]);
          return result;
        })
        .flat();
      const uniq = new Set(uris);
      return [...uniq.values()];
    };
    const back = () => {
      context.emit("back");
    };
    const openScribe = (selectedURI: string) => {
      context.emit("openScribe", selectedURI);
    };

    if (uri.value !== "") fetch();
    return {
      nodes,
      links,
      uri,
      fetch,
      isLoading,
      openScribe,
      back,
    };
  },
});
</script>

<style scoped lang="scss">
.grid {
  margin: 5px;
}
.p-inputgroup {
  padding-bottom: 0px;
}
.sizing {
  height: calc(100vh - 240px);
  width: 100%;
  max-height: calc(100vh - 240px);
  max-width: 100%;
}
.p-inputtextarea {
  width: 100%;
}
.border {
  border: 1px solid var(--surface-d);
  border-radius: 3px;
}
.border:hover {
  border: 1px solid var(--primary-color);
}

.progressbarWrapper {
  height: 2px;
  padding: 0px 9px 0px 9px;
  transform: translate(0, -1px);
}
.p-progressbar {
  height: 2px;
  padding-top: 0px;
  border-top-right-radius: 0;
  border-top-left-radius: 0;
}

::v-deep() {
  .p-speeddial {
    bottom: 0;
    right: calc(50% - 2rem);
    padding-bottom: 15px;
  }
}
</style>