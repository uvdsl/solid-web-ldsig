<template>
  <div class="grid">
    <div class="col md:col-6 md:col-offset-3">
      <div class="p-inputgroup">
        <!-- list go here -->
        <InputText
          placeholder="The URI of the Resource to do actions on."
          v-model="uri"
          @keyup.enter="fetch"
          :disabled="isLoading"
        />
        <Button @click="fetch" :disabled="isLoading"> GET </Button>
      </div>
      <div class="progressbarWrapper">
        <ProgressBar v-if="isLoading" mode="indeterminate" />
      </div>
    </div>
  </div>
  <div class="grid">
    <div class="col md:col-6 md:col-offset-3">
      <Textarea v-model="content" class="sizing" />
    </div>
  </div>
  <div class="grid">
    <div class="col md:col-6 md:col-offset-3">
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
import { defineComponent, ref, computed, toRefs, watch } from "vue";
import { useSolidSession } from "@/composables/useSolidSession";

import { useToast } from "primevue/usetoast";
import {
  putResource,
  deleteResource,
  getResource,
  parseToN3,
} from "@/lib/solidRequests";
import { addSuffix, signLD, verifyLDSignature } from "@/lib/ldsig";

import KeyDialog from "@/components/create/KeyDialog.vue";

export default defineComponent({
  name: "Scribe",
  components: { KeyDialog },
  props: { inititalURI: String , demoContent: String},
  emits: ["back", "fetchFinished"],
  setup(props, context) {
    const toast = useToast();
    const { authFetch, sessionInfo } = useSolidSession();
    const { webId } = toRefs(sessionInfo);
    const displayKeyDialog = ref(false);
    // const n3Store = ref();
    // const n3Prefixes = ref();

    const isLoading = ref(false);

    // uri of the information resource
    const uri = ref(props.inititalURI as string);
    const isHTTP = computed(
      () => uri.value.startsWith("http://") || uri.value.startsWith("https://")
    );

    // content of the information resource
    const content = ref(props.demoContent as string);

    // get content of information resource
    const fetch = async () => {
      if (!isHTTP.value) {
        return;
      }
      isLoading.value = true;
      const txt = await getResource(uri.value, authFetch.value)
        .catch((err) => {
          toast.add({
            severity: "error",
            summary: "Error on fetch!",
            detail: err,
            life: 5000,
          });
          isLoading.value = false;
          throw new Error(err);
        })
        .then((resp) => resp.text());
      //   const parsedN3 =
      const base_uri = uri.value.split("__0x")[0];
      const sigValUri = uri.value.split("__0x")[1]?.split("#")[0]; // if there is the anchor tag in the end
      await parseToN3(txt, base_uri)
        .then((parsedN3) => verifyLDSignature(parsedN3.store, sigValUri))
        .then((check) => {
          if (check.isVerified) {
            toast.add({
              severity: "success",
              summary: "Looks good!",
              detail: "Linked Data Signature verified.",
              life: 5000,
            });
          } else {
            let duration = 5000;
            if (!check.details?.assertedOK) {
              toast.add({
                severity: "error",
                summary: "LDS Verification Error (1)",
                detail:
                  "The resource does not assert all statements coverd by its signature.",
                life: duration,
              });
              duration += 2500;
            }
            if (!check.details?.signatureOK) {
              toast.add({
                severity: "error",
                summary: "LDS Verification Error (2)",
                detail:
                  "The signature did not check out with the covered statements.",
                life: duration,
              });
              duration += 2500;
            }
            if (!check.details?.uriOK) {
              toast.add({
                severity: "error",
                summary: "LDS Verification Error (3)",
                detail: "The signature does not match with the SignedURI.",
                life: duration,
              });
            }
          }
        })
        .catch((err) => {
          toast.add({
            severity: "error",
            summary: "Error!",
            detail: err,
            life: 5000,
          });
          //   throw new Error(err);
        })
        .finally(() => {
          content.value = txt;
          isLoading.value = false;
          context.emit("fetchFinished"); // for demo
        });
    };
    if (uri.value !== "") fetch();
    watch(
      () => props.inititalURI,
      () => {
        if (uri.value !== (props.inititalURI as string)) {
          uri.value = props.inititalURI as string;
          fetch();
        }
      },
      // { immediate: true }
    );

    const resumeSaveAction = async (key: {
      uri: string;
      label: string;
      pubKeyLoc: string;
      jwk: any; // JsonWebKey
    }) => {
      displayKeyDialog.value = false;

      const { rdf_string, hash, signature } = await signLD(
        uri.value,
        content.value,
        key.jwk,
        key.pubKeyLoc,
        webId?.value as string,
        new Date()
      );
      // console.log("Hash:", hash);
      // console.log("Signature:", signature);
      uri.value = addSuffix(uri.value, signature);
      content.value = rdf_string;
    };

    // Speeddial
    const speedDialActions = [
      {
        label: "Save Resource",
        icon: "pi pi-save",
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
          putResource(uri.value, content.value, authFetch.value)
            .then(() =>
              toast.add({
                severity: "success",
                summary: "Successful Save!",
                detail: "The resource has been put at the URI.",
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
        },
      },
      {
        label: "Create Signature",
        icon: "pi pi-key",
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
        },
      },
      {
        label: "Check Syntax",
        icon: "pi pi-code",
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
      {
        label: "Delete Resource",
        icon: "pi pi-trash",
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
      {
        label: "Back to Graph View",
        icon: "pi pi-arrow-left",
        command: () => {
          back();
        },
      },
    ];

    const requestCryptoKey = () => {
      displayKeyDialog.value = true;
    };

    const back = () => {
      context.emit("back");
    };
    return {
      resumeSaveAction,
      displayKeyDialog,
      uri,
      fetch,
      content,
      speedDialActions,
      back,
      isLoading,
    };
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
#back {
  position: absolute;
  margin: 2px;
}
.grid {
  margin: 5px;
}
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
.progressbarWrapper {
  height: 2px;
  // padding: 0px 9px 0px 9px;
  transform: translate(0, -1px);
}
.p-progressbar {
  height: 2px;
  padding-top: 0px;
  border-top-right-radius: 0;
  border-top-left-radius: 0;
}
</style>
