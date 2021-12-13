<template lang="pug">
  div
    q-dialog(v-model="$store.state.noteMessageDialog" persistent :maximized = 'ifMobileSize || $store.state.ifMobileStyle')
      q-card.bg-c-grey-0(style="min-width:40vw")
        q-toolbar
          q-btn.text-primary(flat round icon="clear" v-close-popup @click="closeNoteMessageDialog")
        q-card-section(v-if="$store.state.noteMessageSrc")
          div(v-html = "$store.state.noteMessageSrc")

</template>
<script src="./noteMessageDialog.vue.js" />
