<template>
  <div class="p-grid">
    <div class="p-inputgroup p-col-6 p-offset-3">
      <!-- list go here -->
      <InputText
        placeholder="The URI of the Resource to do actions on."
        v-model="uri"
        @keyup.enter="fetch"
      />
      <Button @click="fetch"> GET </Button>
    </div>
    <div class="p-col-6 p-offset-3">
      <Textarea v-model="content" class="sizing" />
    </div>
  </div>
  <div class="p-grid">
    <div class="p-inputgroup p-col-6 p-offset-3">
      <SpeedDial
        :model="speedDialActions"
        type="semi-circle"
        :radius="75"
        showIcon="pi pi-ellipsis-h"
        :tooltipOptions="{ position: 'top' }"
      />
    </div>
  </div>
  <KeyDialog
    @selectedCryptoKey="resumeSaveAction"
    @hide="displayKeyDialog = false"
    :display="displayKeyDialog"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, toRefs } from "vue";
import { useSolidSession } from "@/composables/useSolidSession";

import { useToast } from "primevue/usetoast";
import {
  putResource,
  deleteResource,
  getResource,
  parseToN3,
} from "@/lib/solidRequests";
import { toTTL } from "@/lib/n3Extensions";
import { createLDSignature } from "@/lib/ldsig";

import KeyDialog from "@/components/KeyDialog.vue";
import { sign } from "@/lib/crypt";
import { Writer } from "n3";

export default defineComponent({
  name: "Scribe",
  components: { KeyDialog },
  setup() {
    const toast = useToast();
    const { authFetch, sessionInfo } = useSolidSession();
    const { webId } = toRefs(sessionInfo);
    const displayKeyDialog = ref(false);
    // const n3Store = ref();
    // const n3Prefixes = ref();

    // uri of the information resource
    const uri = ref("");
    const isHTTP = computed(
      () => uri.value.startsWith("http://") || uri.value.startsWith("https://")
    );
    const addSuffix = (uri: string, suffix: string) => {
      if (uri.includes("__0x")) {
        const end_index = uri.lastIndexOf("__0x");
        uri = uri.substring(0, end_index);
        console.log(uri);
      }
      uri += "__0x" + suffix;
      return uri;
    };

    // content of the information resource
    const content = ref("");

    const addLDSig = async (rdf: string, rdf_sig: string) => {
      const { store, prefixes } = await parseToN3(`${rdf}\n${rdf_sig}`, "");
      const writer = new Writer({ format: "turtle*", prefixes });
      writer.addQuads(store.getQuads(null, null, null, null));
      let message = "";
      writer.end((err, res) => (message = res));
      return message;
    };

    // get content of information resource
    const fetch = async () => {
      if (!isHTTP.value) {
        return;
      }
      const txt = await getResource(uri.value, authFetch.value)
        .catch((err) => {
          toast.add({
            severity: "error",
            summary: "Error on fetch!",
            detail: err,
            life: 5000,
          });
          throw new Error(err);
        })
        .then((resp) => resp.text());
      //   const parsedN3 =
      await parseToN3(txt, uri.value.split("__0x")[0])
        .catch((err) => {
          toast.add({
            severity: "error",
            summary: "Error while parsing!",
            detail: err,
            life: 5000,
          });
          //   throw new Error(err);
        })
        .finally(() => (content.value = txt));
    };

    const resumeSaveAction = async (key: {
      uri: string;
      label: string;
      pubKeyLoc: string;
      jwk: string;
    }) => {
      displayKeyDialog.value = false;

      const { rdf_signature, hash, signature } = await createLDSignature(
        content.value,
        key,
        webId?.value as string,
        new Date()
      );
      // console.log("Hash:", hash);
      // console.log("Signature:", signature);
      uri.value = addSuffix(uri.value, signature);
      content.value = await addLDSig(content.value, rdf_signature);
      putResource(uri.value, content.value, authFetch.value)
        .then(() =>
          toast.add({
            severity: "success",
            summary: "Successful Save!",
            detail: "The workflow has been put at the URI.",
            life: 5000,
          })
        )
        .catch((err) =>
          toast.add({
            severity: "error",
            summary: "Error on save!",
            detail: err,
            life: 5000,
          })
        );
    };

    // Speeddial
    const speedDialActions = [
      {
        label: "Save",
        icon: "pi pi-save",
        tooltipOptions: "left",
        command: async () => {
          if (!isHTTP.value) {
            toast.add({
              severity: "error",
              summary: "Missing URI to save at!",
              detail: "Specify a HTTP-URI in the search bar.",
              life: 5000,
            });
            return;
          }
          requestCryptoKey();
          // const hashHex = await hashRDF(content.value);
          // uri.value = addSuffix(uri.value, hashHex);

          // putResource(uri.value, content.value, authFetch.value)
          //   .then(() =>
          //     toast.add({
          //       severity: "success",
          //       summary: "Successful Save!",
          //       detail: "The workflow has been put at the URI.",
          //       life: 5000,
          //     })
          //   )
          //   .catch((err) =>
          //     toast.add({
          //       severity: "error",
          //       summary: "Error on save!",
          //       detail: err,
          //       life: 5000,
          //     })
          //   );
        },
      },
      {
        label: "Check Syntax",
        icon: "pi pi-question",
        command: () => {
          parseToN3(content.value, uri.value)
            .catch((err) => {
              toast.add({
                severity: "error",
                summary: "Error while parsing!",
                detail: err,
                life: 5000,
              });
              throw new Error(err);
            })
            .then(() =>
              toast.add({
                severity: "success",
                summary: "Correct Syntax.",
                detail: "Good job!",
                life: 5000,
              })
            );
        },
      },
      // {
      //   label: "Prettify Triples\n(removes comments)",
      //   icon: "pi pi-star",
      //   command: () => {
      //     parseToN3(content.value, uri.value)
      //       .catch((err) => {
      //         toast.add({
      //           severity: "error",
      //           summary: "Error while parsing!",
      //           detail: err,
      //           life: 5000,
      //         });
      //         throw new Error(err);
      //       })
      //       .then(
      //         (parsedN3) =>
      //           //   n3Store.value = parsedN3.store;
      //           //   n3Prefixes.value = parsedN3.prefixes;
      //           (content.value = toTTL(
      //             parsedN3.store,
      //             parsedN3.prefixes,
      //             uri.value
      //           ))
      //       )
      //       .then(() =>
      //         toast.add({
      //           severity: "success",
      //           summary: "Prettified Triples!",
      //           detail: "But all your comments are gone.",
      //           life: 5000,
      //         })
      //       );
      //   },
      // },
      {
        label: "Delete",
        icon: "pi pi-times",
        command: () => {
          if (!isHTTP.value) {
            toast.add({
              severity: "error",
              summary: "Missing URI to delete!",
              detail: "Specify a HTTP-URI in the search bar.",
              life: 5000,
            });
            return;
          }
          deleteResource(uri.value, authFetch.value)
            .then(() =>
              toast.add({
                severity: "warn",
                summary: "Successful Delete!",
                detail: "The resource has been deleted.",
                life: 5000,
              })
            )
            .catch((err) =>
              toast.add({
                severity: "error",
                summary: "Error on delete!",
                detail: err,
                life: 5000,
              })
            );
        },
      },
    ];

    const requestCryptoKey = () => {
      displayKeyDialog.value = true;
    };
    return {
      resumeSaveAction,
      displayKeyDialog,
      uri,
      fetch,
      content,
      speedDialActions,
    };
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.p-grid {
  margin: 5px;
}
.p-inputgroup {
  width: 50%;
}
// TextArea {
// height: 100%;
// width: 100%;
// max-height: 100%;
// max-width: 100%;
//   margin-bottom: 10px;
// }
::v-deep() {
  .p-speeddial {
    bottom: 0;
    right: calc(50% - 2rem);
    padding-bottom: 15px;
  }
  .sizing {
    height: calc(100vh - 240px);
    width: 100%;
    max-height: calc(100vh - 240px);
    max-width: 100%;
  }
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
</style>
