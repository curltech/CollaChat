<template lang="pug">
  div
    q-dialog(v-model="$store.state.mergeMessageDialog" persistent :maximized = 'ifMobileSize || $store.state.ifMobileStyle')
      q-card.bg-c-grey-0(style="min-width:40vw")
        q-toolbar
          q-btn.text-primary(flat round icon="clear" v-close-popup @click="closeMergeMessageDialog")
        q-card-section(v-if="$store.state.currentMergeMessage && $store.state.currentMergeMessage.mergeMessages")
          template(v-for="(message,index) in $store.state.currentMergeMessage.mergeMessages")
            messageContent(v-bind:message = "message" entry = "mergeMessage")
</template>
<script src="./mergeMessageDialog.vue.js" />
