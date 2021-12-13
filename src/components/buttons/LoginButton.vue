<template>
  <div class="login-button" @click="isDisplaingIDPs = !isDisplaingIDPs">
    <slot>
      <Button>Login</Button>
    </slot>
  </div>
  <Dialog
    :visible="isDisplaingIDPs"
    position="topright"
    header="Identity Provider"
    :closable="false"
    :draggable="false"
  >
    <div id="idps">
        <div class="idp p-inputgroup">
        <InputText
          placeholder="https://your.idp"
          type="text"
          v-model="idp"
          @keyup.enter="login(idp)"
        />
        <Button> > </Button>
      </div>
        <Button
        class="idp"
          @click="
            idp = 'https://solidcommunity.net';
            login(idp);
            isDisplaingIDPs = !isDisplaingIDPs;
          "
        >
          https://solidcommunity.net
        </Button>
        <Button
        class="idp"
          @click="
            idp = 'https://solidweb.org';
            login(idp);
            isDisplaingIDPs = !isDisplaingIDPs;
          "
        >
          https://solidweb.org
        </Button>
        <Button
        class="idp"
          @click="
            idp = 'https://solidweb.me';
            login(idp);
            isDisplaingIDPs = !isDisplaingIDPs;
          "
        >
          https://solidweb.me
        </Button>
        <Button
        class="idp"
          @click="
            idp = 'https://inrupt.net';
            login(idp);
            isDisplaingIDPs = !isDisplaingIDPs;
          "
        >
          https://inrupt.net
        </Button>
    </div>
    <template #footer>
      <Button
        label="close"
        icon="pi pi-times"
        class="p-button-text"
        @click="isDisplaingIDPs = !isDisplaingIDPs"
      />
    </template>
  </Dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useSolidSession } from "../../composables/useSolidSession";

export default defineComponent({
  name: "LoginButton",
  setup() {
    const { login } = useSolidSession();
    const isDisplaingIDPs = ref(false);
    const idp = ref("");
    return { login, isDisplaingIDPs, idp };
  },
});
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
#idps {
  display: flex;
  flex-direction: column;
  .idp {
      margin-top: 5px;
  margin-bottom: 5px;
  }
}
</style>
