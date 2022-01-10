<template>
  <Toolbar>
    <template #start>
      <Avatar v-if="img" :image="img" shape="circle" />
      <a :href="webId">
        <span>{{ name }}</span>
      </a>
    </template>
    <template #end>
      <LoginButton v-if="!isLoggedIn" />
      <LogoutButton v-if="isLoggedIn" />
    </template>
  </Toolbar>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, Ref, watch } from "vue";
import LoginButton from "@/components/standard/buttons/LoginButton.vue";
import LogoutButton from "@/components/standard/buttons/LogoutButton.vue";
import { useSolidSession } from "@/composables/useSolidSession";
import { getResource, parseToN3 } from "@/lib/solidRequests";
import { VCARD } from "@/lib/namespaces";

export default defineComponent({
  name: "HeaderBar",
  components: {
    LoginButton,
    LogoutButton,
  },
  setup() {
    const { sessionInfo, authFetch } = useSolidSession();
    const { isLoggedIn, webId } = toRefs(sessionInfo);
    let name: Ref<string | undefined> = ref();
    let img: Ref<string | undefined> = ref();

    async function getPersonalData(webId: string) {
      const parsedN3 = await getResource(webId, authFetch.value)
        .then((resp) => resp.text())
        .then((respText) => parseToN3(respText, webId));
      let query = parsedN3.store.getObjects(webId, VCARD("hasPhoto"), null);
      const i = query.length > 0 ? query[0].value : undefined;
      query = parsedN3.store.getObjects(webId, VCARD("fn"), null);
      const n = query.length > 0 ? query[0].value : undefined;
      return { n, i };
    }

    if (webId !== undefined)
      watch(webId, () => {
        if (webId.value !== undefined) {
          getPersonalData(webId.value).then((pd) => {
            name.value = pd.n;
            img.value = pd.i;
          });
        } else {
          name.value = undefined;
          img.value = undefined;
        }
      });

    return { isLoggedIn, webId, name, img };
  },
});
</script>

<style lang="scss">
.p-toolbar-group-left {
  span {
    margin-left: 10px;
    font-size: 150%;
  }
}

a {
  color: inherit; /* blue colors for links too */
  text-decoration: inherit; /* no underline */
}
</style>
