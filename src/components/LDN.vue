<template>
  <Card class="margined">
    <template #title>
      {{ uri }}
    </template>
    <template #content>
      <span v-if="!error" style="white-space: pre-line;">
      {{ ldn }}
      </span>
      <span v-else style="color:red">
        {{ error }}
      </span>
    </template>
    <template #footer>
      <Button
        icon="pi pi-times"
        label="Delete"
        class="p-button-primary"
        @click="deleteResource(uri, authFetch)"
      />
    </template>
  </Card>
</template>

<script lang="ts">
import { useSolidSession } from "@/composables/useSolidSession";
import { toTTL } from "@/lib/n3Extensions";
import { getResource, parseToN3, deleteResource } from "@/lib/solidRequests";
import { defineComponent, ref } from "vue";
export default defineComponent({
  name: "Messenger",
  components: {},
  props: {
    uri: { default: "" },
  },
  setup(props) {
    const { authFetch } = useSolidSession();
    let ldn = ref("Message loading.");
    let error = ref()
    getResource(props.uri, authFetch.value)
      .then((resp) => resp.text())
      // .then((txt) => (ldn.value = txt))
      .then((txt) => {
        return parseToN3(txt, props.uri).then((parsedN3) =>
          ldn.value = toTTL(parsedN3.store, parsedN3.prefixes, props.uri)
        );
      })
      .catch((err) => (error.value = err));

    return { ldn, authFetch, deleteResource, error };
  },
});
</script>

<style scoped>
.margined {
  margin-top: 5px;
  margin-bottom: 5px;
}
</style>