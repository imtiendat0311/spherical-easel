<template>
  <v-btn
    id="style-icon"
    icon
    size="small"
    v-if="minified"
    style="
      position: fixed;
      right: 0;
      border-radius: 8px;
      background-color: #002108;
      color: white;
    "
    @click="minified = !minified">
    <v-tooltip activator="parent" location="bottom">
      {{ t("showDrawer") }}
    </v-tooltip>
    <v-icon>mdi-palette</v-icon>
  </v-btn>
  <transition>
    <div v-if="!minified" class="vertical-nav-drawer">
      <LabelStyle :panel="StyleEditPanels.Label"></LabelStyle>
      <FrontBackStyle :panel="StyleEditPanels.Front"></FrontBackStyle>
      <FrontBackStyle :panel="StyleEditPanels.Back"></FrontBackStyle>

      <div id="visibility-control">
        <span>
          {{ t("label") }}
          <v-icon color="black">mdi-eye</v-icon>
        </span>
        <span>
          {{ t("object") }}
          <v-icon color="black">mdi-eye</v-icon>
        </span>
      </div>
      <v-btn icon size="x-small" @click="minified = !minified">
        <v-icon>mdi-chevron-double-right</v-icon>
      </v-btn>
    </div>
  </transition>
</template>
<i18n lang="json">
{
  "en": {
    "showDrawer": "Show Style Drawer",
    "label": "Label",
    "object": "Object"
  },
  "id": {
    "showDrawer": "Buka Panel Gaya Tampilan",
    "label": "Label",
    "object": "Objek"
  }
}
</i18n>
<style scoped>
.vertical-nav-drawer {
  background-color: white;
  border: solid 1px grey 0.5;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);

  border-radius: 0.5em;
  height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}

#visibility-control {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.v-enter-active,
.v-leave-active {
  transition: all 300ms ease-out;
}
.v-enter-from,
.v-leave-to {
  transform: translateX(100%) scale(0);
}
.v-enter-to,
.v-leave-from {
  transform: translateX(0%) scale(1);
}
</style>
<script setup lang="ts">
import { ref } from "vue";
import { StyleEditPanels } from "@/types/Styles";
import { useI18n } from "vue-i18n";
import LabelStyle from "./LabelStyle.vue";
import FrontBackStyle from "./FrontBackStyle.vue";
const minified = ref(true);
const { t } = useI18n();
</script>
