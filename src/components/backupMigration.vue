<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeGeneralSubKind('default')")
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
          //q-item(v-if="!$store.ifMobile()" clickable v-ripple @click="subKind = 'list'")
          q-item(v-if="!$store.ifMobile()" clickable v-ripple @click="initRestore")
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
    q-uploader(style="display:none" ref="localRestoreUpload" @added="files => localRestoreUpload(files)" accept=".db")
    q-uploader(style="display:none" ref="restoreUpload" @added="files => restoreUpload(files)" accept=".db")
</template>
<script src="./backupMigration.vue.js" />