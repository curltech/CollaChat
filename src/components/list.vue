<template lang="pug">
  q-layout
    q-page-container
      q-page
        q-toolbar
          q-btn(flat round dense icon="keyboard_arrow_left" @click="$store.changeBackupMigrationSubKind('default')")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('List')}}
        div.scroll.bg-c-white(:style="heightStyle")
          iframe(id="iframeContent" :src="url" frameborder="no" border="0" marginwidth="0" marginheight="0" allowtransparency="yes" scrolling="yes" style="width: 100%; height: 100%")
</template>
<script src="./list.vue.js" />