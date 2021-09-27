<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(name="selectChatRecord" style="padding:0px 0px")
        selectChatRecord.drawcontent
      q-tab-panel(name="selectContacts" style="padding:0px 0px")
        selectContacts.drawcontent
      q-tab-panel(name="selectGroupChat" style="padding:0px 0px")
        selectGroupChat.drawcontent
</template>
<script src="./selectChat.vue.js" />
