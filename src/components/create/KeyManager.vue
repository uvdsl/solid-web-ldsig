<template>
  <div class="p-inputgroup">
    <InputText
      v-model="keyName"
      @keyup.enter="createKeyPair(keyName)"
      placeholder="Create a new keypair."
    />
    <Button @click="createKeyPair(keyName)">
      <i class="pi pi-plus" v-bind:class="{ 'pi-spin': isLoading }" />
    </Button>
  </div>
  <Listbox
    v-if="!isLoading"
    v-model="selectedKey"
    :options="keys"
    optionLabel="label"
    @click="emitSelectedJWK"
  />
  <div v-else class="p-col-6 p-offset-3" style="margin-top: 10px">
    <span> Loading ...</span>
  </div>
</template>

<script lang="ts">
import { useSolidSession } from "@/composables/useSolidSession";
import { JWK, LDP, SEC } from "@/lib/namespaces";
import {
  createContainer,
  createResource,
  getLocationHeader,
  getResource,
  parseToN3,
  putResource,
} from "@/lib/solidRequests";
import { createECDSAKeyPair } from "@/lib/crypt";
import { Store, Term } from "n3";
import { useToast } from "primevue/usetoast";
import { computed, defineComponent, ref, Ref, toRefs, watch } from "vue";
import { addSuffix, signLD, createRDFofKey } from "@/lib/ldsig";

export default defineComponent({
  name: "KeyManager",
  components: {},
  emits: ["selectedKey"],
  setup(props, context) {
    const toast = useToast();
    const { authFetch, sessionInfo } = useSolidSession();
    const { webId } = toRefs(sessionInfo);
    const isLoading = ref(false);
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
          const uri = quad.subject.id
          const label = privateKeysRDF.value?.getObjects(quad.subject,"http://www.w3.org/2000/01/rdf-schema#label",null)[0]?.value
          const pubKeyLoc = privateKeysRDF.value?.getObjects(quad.subject,"https://w3id.org/security#publicKey",null)[0]?.id
          const jwkTerm = privateKeysRDF.value?.getObjects(quad.subject,SEC('privateKeyJwk'), null)[0] as Term;
          const jwk = {
            alg: privateKeysRDF.value?.getObjects(jwkTerm,JWK('alg'), null)[0].value,
            crv: privateKeysRDF.value?.getObjects(jwkTerm,JWK('crv'), null)[0].value,
            d: privateKeysRDF.value?.getObjects(jwkTerm,JWK('d'), null)[0].value,
            ext: privateKeysRDF.value?.getObjects(jwkTerm,JWK('ext'), null)[0].value === "true",
            kty: privateKeysRDF.value?.getObjects(jwkTerm,JWK('kty'), null)[0].value,
            x: privateKeysRDF.value?.getObjects(jwkTerm,JWK('x'), null)[0].value,
            y: privateKeysRDF.value?.getObjects(jwkTerm,JWK('y'), null)[0].value,
            key_ops: privateKeysRDF.value?.getObjects(jwkTerm,JWK('key_ops'), null).map(e => e.value)
          }
          return {
            uri,
            label,
            pubKeyLoc,
            jwk
          };
        })
        .filter((key) => key.label);
    });
    const selectedKey: Ref<
      { uri: string; label: string; pubKeyLoc: string; jwk: string } | undefined
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
          isLoading.value = true;
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
              )
                .then(getLocationHeader)
                .then(getContainerItems);
            }
            return err;
          });
          pubFolderPromise.then(() => (isLoading.value = false));
        }
      },
      { immediate: true }
    );

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
      isLoading.value = true;
      // generate new keypair
      let keyPair = await createECDSAKeyPair();
      let publicKey = keyPair.publicKey as CryptoKey;
      let privateKey = keyPair.privateKey as CryptoKey;

      // export the keypair as jwk
      const pubKeyJWK = await crypto.subtle.exportKey("jwk", publicKey);
      const privKeyJWK = await crypto.subtle.exportKey("jwk", privateKey);

      // store the keys in solid pod
      const publicKeyFolder = `${baseURI.value}/public/keys/`;
      let publicKeyContent = createRDFofKey(label, webId?.value as string, pubKeyJWK);
      const pubKeyCREATE = createResource(
        publicKeyFolder,
        publicKeyContent,
        authFetch.value
      );
      let pubKeyLocation = await pubKeyCREATE.then(getLocationHeader).then(loc => loc.split('.ttl')[0]);

      const { rdf_string, hash, signature } = await signLD(
        pubKeyLocation, // base uri == "here"
        publicKeyContent,
        privKeyJWK,
        "#key", // keyLoc = "here"#key 
        webId?.value as string,
        new Date()
      );

      pubKeyLocation = addSuffix(pubKeyLocation, signature);
      publicKeyContent = rdf_string;
      const pubKeyPUT = putResource(
        pubKeyLocation,
        publicKeyContent,
        authFetch.value
      );

      const privateKeyFolder = `${baseURI.value}/private/keys/`;
      const privKeyCREATE = createResource(
        privateKeyFolder,
        createRDFofKey(label, webId?.value as string, privKeyJWK, `${pubKeyLocation}#key`),
        authFetch.value
      );

      // finshing moves, get the updated list of private keys.
      Promise.all([pubKeyCREATE, pubKeyPUT, privKeyCREATE])
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
        )
        .finally(() => (isLoading.value = false));
    };

    const emitSelectedJWK = () => {
      if (selectedKey.value) context.emit("selectedKey", selectedKey.value);
    };

    return {
      isLoading,
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
