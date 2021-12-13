<template>
  <div class="logout-button" @click="logout">
    <slot>
      <Button>Logout</Button>
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useSolidSession } from "../../composables/useSolidSession";

export default defineComponent({
  name: "LoginButton",
  setup() {
    const { logout } = useSolidSession();
    return { logout };
  },
});
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
