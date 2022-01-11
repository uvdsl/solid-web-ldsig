<template>
  <div class="p-grid">
    <div class="p-col-6 p-offset-3">
      <div class="p-inputgroup p-col-6">
        <InputText
          placeholder="The URI of the Resource to do actions on."
          v-model="uri"
          @keyup.enter="fetch"
        />
        <Button @click="fetch"> GET </Button>
      </div>
      <div class="progressbarWrapper">
        <ProgressBar v-if="isLoading" mode="indeterminate" />
      </div>
    </div>
    <div class="p-col-12">
      <GraphVizzard
        :nodes="nodes"
        :links="links"
        class="sizing"
        :key="renderKey"
      />
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
  setup() {
    const renderKey = ref(false);
    const { authFetch } = useSolidSession();
    const toast = useToast();
    const isLoading = ref(false);

    const uri = ref("");
    const isHTTP = computed(
      () => uri.value.startsWith("http://") || uri.value.startsWith("https://")
    );

    const links: Ref<Link[]> = ref([]);
    const nodes: Ref<Node[]> = ref([]);
    watch(links, () => {
      nodes.value = Object.values(visitedNodes);
      if (links.value.length == 0) renderKey.value = !renderKey.value;
      // rerender vizzard
    });

    let visitedNodes: Record<string, Node> = {};

    const fetch = async () => {
      if (!isHTTP.value) {
        return;
      }
      isLoading.value = true;
      toast.add({
        severity: "warn",
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

    return {
      renderKey,
      nodes,
      links,
      uri,
      fetch,
      isLoading,
    };
  },
});
</script>

<style scoped lang="scss">
.p-grid {
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
</style>