<template>
  <Button @click="createKeyPair"> boop! </Button>
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
import { Store } from "n3";
import { useToast } from "primevue/usetoast";
import { computed, defineComponent, Ref, toRefs, watch } from "vue";

export default defineComponent({
  name: "KeyManager",
  components: {},
  async setup() {
    const toast = useToast();
    const { authFetch, sessionInfo } = useSolidSession();
    const { webId } = toRefs(sessionInfo);
    const baseURI = computed(() => {
      return webId?.value ? webId.value.split("/profile")[0] : undefined;
    });

    // embed keys in RDF
    const createRDFofKey = (jwk: string, pubKeyLoc?: string) => {
      let keyRDF = 
` <>  <https://w3id.org/security#controller> <${webId?.value}> ;
      <https://w3id.org/security#${(pubKeyLoc)?'private':'public'}KeyJwk> """${jwk}"""^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#JSON> `;
      keyRDF += pubKeyLoc
        ? `;
      <https://w3id.org/security#publicKey> <${pubKeyLoc}> .`
        : `.`;
      return keyRDF;
    };

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
      async (first, second) => {
        if (baseURI.value) {
          const publicKeyFolder = `${baseURI.value}/public/keys/`;
          const publicKeyRDF = await getContainerItems(publicKeyFolder).catch(
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
          console.log(publicKeyRDF)
          const privateKeyFolder = `${baseURI.value}/private/keys/`;
          const privateKeyURIs = await getContainerItems(privateKeyFolder).catch(
            (err) => {
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
            }
          );
          console.log(privateKeyURIs)
        }
      }
    );

    const createKeyPair = async () => {
      // generate new keypair
      let keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true,
        ["sign", "verify"]
      );
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
      const pubKeyCREATE = createResource(
        `${baseURI.value}/public/keys/`,
        createRDFofKey(pubKeyJWK),
        authFetch.value
      );
      const pubKeyLocation = await pubKeyCREATE.then(getLocationHeader);
      const privKeyCREATE = createResource(
        `${baseURI.value}/private/keys/`,
        createRDFofKey(pubKeyJWK, pubKeyLocation),
        authFetch.value
      );
      Promise.all([pubKeyCREATE, privKeyCREATE])
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

    const importKey = async (jwk: any) => {
      // I know, I know, but typescript is confused here.
      return crypto.subtle.importKey(
        "jwk",
        jwk,
        {
          name: "ECDSA",
          namedCurve: jwk.crv as string,
        },
        jwk.ext as boolean,
        jwk.key_ops as any // I know, I know, but typescript is confused here.
      );
    };

    // signature creation
    const sign = async (message: string, privateKey: CryptoKey) => {
      const encMsg = new TextEncoder().encode(message);
      return window.crypto.subtle
        .sign(
          {
            name: "ECDSA",
            hash: { name: "SHA-256" },
          },
          privateKey,
          encMsg
        )
        .then((arrBuf) =>
          Array.from(new Uint8Array(arrBuf))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        );
    };

    // on GET of message
    const verify = async (
      message: string,
      signature: Buffer,
      publicKey: CryptoKey
    ) => {
      const encMsg = new TextEncoder().encode(message);
      // retrieve pubKey from LDProof

      return window.crypto.subtle.verify(
        {
          name: "ECDSA",
          hash: { name: "SHA-256" },
        },
        publicKey,
        signature,
        encMsg
      );
    };

    return {
      createKeyPair,
      sign,
      verify,
    };
  },
});
</script>

<style lang="scss"></style>
