<template>
  <Dialog
    header="Choose your private key."
    v-model:visible="showKeyDialog"
    :modal="!demoMode"
    @hide="emitHide"
  >
    <KeyManager @selectedKey="setSelectedKey" />

      <Dialog v-model:visible="demoMode" position="top" :closable="false" modal>
        Create a Key Pair and sign the resource:
        <p>
        <ul>
          <li> <span class="text-primary">provide a name</span> for a new key pair </li>
          <li> Then, hit the <span class="text-primary">"+"-Button</span> to create it</li>
          <li> <span class="text-primary">Select the key</span> from the list</li>
          <li> Then, hit the <span class="text-primary">"sign"-Button</span> to continue</li>
        </ul>
        </p>
         <p>
          You can then hit <span class="text-primary">"Continue!"</span> on the other dialog.
    </p>
        <p> 
      Do so <b>now</b>.
        </p>
       
  </Dialog>

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
  props: { display: Boolean, demo: Boolean },
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
    const demoMode = ref(false)
    watch (() => props.demo, () => demoMode.value =  props.demo, {immediate:true})

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
      demoMode
    };
  },
});
</script>

<style lang="scss"></style>
