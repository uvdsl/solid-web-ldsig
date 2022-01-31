<template>
  <Dialog
    header="Choose your private key."
    v-model:visible="showKeyDialog"
    modal
    @hide="emitHide"
  >
    <KeyManager @selectedKey="setSelectedKey" />
    <template #footer>
      <Button label="sign" @click="emitSelectedKey" />
    </template>
  </Dialog>

</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import KeyManager from "@/components/create/KeyManager.vue";
import { useToast } from "primevue/usetoast";

export default defineComponent({
  name: "Keydialog",
  components: {
    KeyManager,
  },
  props: { display: Boolean },
  emits: ["selectedCryptoKey", "hide"],
  setup(props, context) {
    const toast = useToast();
    const showKeyDialog = ref(false);
    watch(
      () => props.display,
      () => {
        showKeyDialog.value = props.display;
      }
    );

    let selectedKey: { uri: string; label: string; pubKeyLoc: string, jwk: string };

    const setSelectedKey = (key: {
      uri: string;
      label: string;
      pubKeyLoc: string;
      jwk: string;
    }) => {
      selectedKey = key;
    };

    const emitSelectedKey = async () => {
      if (!selectedKey) {
        toast.add({
          severity: "error",
          summary: "Error on key selection!",
          detail: "Please select a key.",
          life: 5000,
        });
        return;
      }
    //   const key = await importKey(JSON.parse(selectedKey.jwk));
    //   context.emit("selectedCryptoKey", key);
      context.emit("selectedCryptoKey", selectedKey);
    };

    const emitHide = () => {
      return context.emit("hide");
    };
    return {
      showKeyDialog,
      setSelectedKey,
      emitSelectedKey,
      emitHide,
    };
  },
});
</script>

<style lang="scss"></style>
