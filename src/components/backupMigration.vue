<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round dense icon="keyboard_arrow_left" @click="$store.changeGeneralSubKind('default')")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('Chat Records Backup and Migration')}}
        q-list
          q-item(v-if="$store.ifMobile()" clickable v-ripple @click="initMigrate")
            q-item-section
              q-item-label {{$t('Migrate (to another Mobile)')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(v-if="$store.ifMobile()" style="height:8px;margin-left:0px;margin-right:0px")
          //q-item(v-if="$store.ifMobile()" clickable v-ripple @click="subKind = 'tip'")
            q-item-section
              q-item-label {{$t('Backup and Restore')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          //q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(v-if="$store.ifMobile()" clickable v-ripple @click="initBackup")
            q-item-section
              q-item-label {{$t('Backup (Mobile to PC)')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          //q-separator.c-separator(v-if="$store.ifMobile()" style="margin-left:16px;width:calc(100% - 16px)")
          //q-item(v-if="!$store.ifMobile()" clickable v-ripple @click="initRestore")
          q-item(v-if="!$store.ifMobile()" clickable v-ripple @click="subKind = 'list'")
            q-item-section
              q-item-label {{$t('Restore (PC to Mobile)')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(v-if="!$store.ifMobile()" style="height:8px;margin-left:0px;margin-right:0px")
          q-item(v-if="!$store.ifMobile()" clickable v-ripple @click="initLocalBackup")
            q-item-section
              q-item-label {{$t('Backup (PC Local)')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(v-if="!$store.ifMobile()" style="margin-left:16px;width:calc(100% - 16px)")
          q-item(v-if="!$store.ifMobile()" clickable v-ripple @click="localRestore")
            q-item-section
              q-item-label {{$t('Restore (PC Local)')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
      q-tab-panel(name="selectChatRecord" style="padding:0px 0px")
        selectChatRecord.drawcontent
      q-tab-panel(name="tip" style="padding:0px 0px")
        tip.drawcontent
      q-tab-panel(name="list" style="padding:0px 0px")
        list.drawcontent
    q-uploader(style="display:none" ref="upload" @added="files => upload(files)" accept=".db")
    q-dialog(v-model="backupDialog" persistent)
      q-card(style="width: 250px")
        q-bar(class="bg-primary text-c-grey-0")
          q-item-label {{$t('Backup (Mobile to PC)')}}
          //q-space
          //q-btn(dense flat icon="close" v-close-popup)
        q-card-section(class="q-pa-lg")
          q-item-label {{$t('Please confirm on your computer to start the backup')}}
        q-card-actions(align="center")
          q-btn.btnIcon(unelevated color="primary" :label="$t('Cancel')" v-close-popup @click="cancelBackup")
</template>
<script src="./backupMigration.vue.js" />