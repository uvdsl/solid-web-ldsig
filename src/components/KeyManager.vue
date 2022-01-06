<template>
  <div class="p-inputgroup">
    <InputText
      v-model="keyName"
      @keyup.enter="createKeyPair(keyName)"
      placeholder="Create a new keypair."
    />
    <Button @click="createKeyPair(keyName)"> <i class="pi pi-key" /> </Button>
  </div>
  <Listbox
    v-if="!loading"
    v-model="selectedKey"
    :options="keys"
    optionLabel="label"
    @click="emitSelectedJWK"
  />
  <div v-else class="p-col-6 p-offset-3"  style="margin-top: 10px">
    <i class="pi pi-spin pi-key" />
    <span> Loading ...</span>
  </div>
</template>

<script lang="ts">
import { useSolidSession } from "@/composables/useSolidSession";
import { LDP } from "@/lib/namespaces";
import {
  createContainer,
  createResource,
  getLocationHeader,
  getResource,
  parseToN3,
} from "@/lib/solidRequests";
import { createECDSAKeyPair } from "@/lib/crypt";
import { Store } from "n3";
import { useToast } from "primevue/usetoast";
import { computed, defineComponent, ref, Ref, toRefs, watch } from "vue";

export default defineComponent({
  name: "KeyManager",
  components: {},
  emits: ["selectedKey"],
  setup(props, context) {
    const toast = useToast();
    const { authFetch, sessionInfo } = useSolidSession();
    const { webId } = toRefs(sessionInfo);
    const loading = ref(false);
    const baseURI = computed(() => {
      return webId?.value ? webId.value.split("/profile")[0] : undefined;
    });

    // const publicKeysRDF: Ref<Store> = ref(new Store());
    const privateKeysRDF: Ref<Store | undefined> = ref();
    const keys = computed(() => {
      const jwkQuads = privateKeysRDF.value?.getQuads(
        null,
        "https://w3id.org/security#privateKeyJwk",
        null,
        null
      );
      return jwkQuads
        ?.map((quad) => {
          return {
            uri: quad.subject.id,
            label: privateKeysRDF.value?.getObjects(
              quad.subject,
              "http://www.w3.org/2000/01/rdf-schema#label",
              null
            )[0]?.value,
            jwk: quad.object.value,
          };
        })
        .filter((key) => key.label);
    });
    const selectedKey: Ref<
      { uri: string; label: string; jwk: string } | undefined
    > = ref();
    const keyName = ref("");

    // get the keys
    const getContainerItems = async (containerURI: string) => {
      return getResource(containerURI, authFetch.value)
        .then((resp) => resp.text())
        .then((txt) => parseToN3(txt, containerURI))
        .then((parsedN3) => {
          const keyPromises = parsedN3.store
            .getObjects(null, LDP("contains"), null)
            .map((term) =>
              getResource(term.id, authFetch.value)
                .then((resp) => resp.text())
                .then((txt) => parseToN3(txt, term.id))
                .then((parsedN3) => parsedN3.store)
                .then((store) => store.getQuads(null, null, null, null))
            );
          return Promise.all(keyPromises);
        })
        .then((keyQuads) => new Store(keyQuads.flat()));
    };

    watch(
      () => baseURI.value,
      async () => {
        privateKeysRDF.value = undefined;
        if (baseURI.value) {
          loading.value = true;
          const publicKeyFolder = `${baseURI.value}/public/keys/`;
          const pubFolderPromise = getResource(publicKeyFolder).catch(
            //   publicKeysRDF.value =  await getContainerItems(publicKeyFolder).catch(
            (err) => {
              // make sure key directories exist
              if (err.message.includes("`404`")) {
                toast.add({
                  severity: "warn",
                  summary: "Public Key directory not found.",
                  detail: "Creating it now.",
                  life: 5000,
                });
                return createContainer(
                  `${baseURI.value}/public/`,
                  "keys",
                  authFetch.value
                );
              }
              return err;
            }
          );
          const privateKeyFolder = `${baseURI.value}/private/keys/`;
          privateKeysRDF.value = await getContainerItems(
            privateKeyFolder
          ).catch((err) => {
            // make sure key directories exist
            if (err.message.includes("`404`")) {
              toast.add({
                severity: "warn",
                summary: "Private Key directory not found.",
                detail: "Creating it now.",
                life: 5000,
              });
              return createContainer(
                `${baseURI.value}/private/`,
                "keys",
                authFetch.value
              );
            }
            return err;
          });
          pubFolderPromise.then(() => (loading.value = false));
        }
      },
      { immediate: true }
    );

    // embed keys in RDF
    const createRDFofKey = (label: string, jwk: string, pubKeyLoc?: string) => {
      let keyRDF = ` <>  <http://www.w3.org/2000/01/rdf-schema#label> "${label}" ;
      <https://w3id.org/security#controller> <${webId?.value}> ;
      <https://w3id.org/security#${
        pubKeyLoc ? "private" : "public"
      }KeyJwk> """${jwk}"""^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#JSON> `;
      keyRDF += pubKeyLoc
        ? `;
      <https://w3id.org/security#publicKey> <${pubKeyLoc}> .`
        : `.`;
      return keyRDF;
    };

    const createKeyPair = async (label: string) => {
      if (
        keyName.value === undefined ||
        keyName.value === null ||
        keyName.value == ""
      ) {
        toast.add({
          severity: "error",
          summary: "Error on key creation!",
          detail: "Please give it a name.",
          life: 5000,
        });
        return;
      }
      // generate new keypair
      let keyPair = await createECDSAKeyPair();
      let publicKey = keyPair.publicKey as CryptoKey;
      let privateKey = keyPair.privateKey as CryptoKey;

      // export the keypair as jwk
      const pubKeyJWK = await crypto.subtle
        .exportKey("jwk", publicKey)
        .then(JSON.stringify);
      const privKeyJWK = await crypto.subtle
        .exportKey("jwk", privateKey)
        .then(JSON.stringify);

      // store the keys in solid pod
      const publicKeyFolder = `${baseURI.value}/public/keys/`;
      const pubKeyCREATE = createResource(
        publicKeyFolder,
        createRDFofKey(label, pubKeyJWK),
        authFetch.value
      );
      const pubKeyLocation = await pubKeyCREATE.then(getLocationHeader);
      const privateKeyFolder = `${baseURI.value}/private/keys/`;
      const privKeyCREATE = createResource(
        privateKeyFolder,
        createRDFofKey(label, privKeyJWK, pubKeyLocation),
        authFetch.value
      );
      Promise.all([pubKeyCREATE, privKeyCREATE])
        .then(() => getContainerItems(privateKeyFolder))
        .then((rdf) => (privateKeysRDF.value = rdf))
        .then(() =>
          toast.add({
            severity: "success",
            summary: "Successful Save!",
            detail: "The keys have been saved in your Pod.",
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

    const emitSelectedJWK = () => {
      if (selectedKey.value) context.emit("selectedKey", selectedKey.value);
    };

    return {
      loading,
      createKeyPair,
      keyName,
      selectedKey,
      keys,
      emitSelectedJWK,
    };
  },
});
</script>

<style lang="scss"></style>
