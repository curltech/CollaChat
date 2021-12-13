<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeSettingSubKind('default')")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('Advance Setting')}}
          //q-btn.text-primary(flat round icon="settings_backup_restore" @click="showRestoreDialog" no-caps)
        q-list
          //q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          //q-item(dense)
            q-item-section
              q-item-label {{$t('Enable UDP')}}
            q-item-section(side)
              q-toggle(v-model="udpSwitch" @input="changeUdpSwitch")
          //q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="subKind = 'myPeerEndPoints'")
            q-item-section
              q-item-label {{$t('MyNodes')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          //q-item(dense)
            q-item-section
              q-item-label {{$t('Enable Developer Options')}}
            q-item-section(side)
              q-toggle(v-model="developerOption" @input="applyDeveloperOption")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item(clickable v-ripple @click="subKind = 'developerOptions'")
            q-item-section
              q-item-label {{$t('Developer Options')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
      q-tab-panel(name="myPeerEndPoints" style="padding:0px 0px")
        myPeerEndPoints.drawcontent
      q-tab-panel(name="developerOptions" style="padding:0px 0px")
        developerOptions.drawcontent
    q-dialog(v-model="restoreDialog" persistent)
      q-card(style="width: 250px")
        q-bar(class="bg-primary text-c-grey-0")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section(align="center") {{$t('Restore initial settings?')}}
        q-card-section
          q-item
            q-item-section
              q-item-label {{$t('Enable DeveloperOption')}}
            q-item-section(side)
              q-checkbox(dense v-model="developerOptionSelected" color="primary")
          q-item
            q-item-section
              q-item-label {{$t('Enable UDP')}}
            q-item-section(side)
              q-checkbox(dense v-model="udpSwitchSelected" color="primary")
          q-item
            q-item-section
              q-item-label {{$t('MyNodes')}}
            q-item-section(side)
              q-checkbox(dense v-model="myPEPSelected" color="primary")
        q-card-actions(align="right")
          q-btn(color="primary" round unelevated icon="check" @click="restore")
    q-dialog(v-model="developerOptionDialog" persistent)
      q-card(style="width: 250px")
        q-bar(class="bg-primary text-c-grey-0")
          q-space
          q-btn(dense flat icon="close" v-close-popup @click="changeDeveloperOption(false)")
        q-card-section
          q-item
            q-item-section
              q-input.c-field(:label="$t('Please input Password')" autofocus filled clearable v-model="password" type="password" lazy-rules :rules="[]")
        q-card-actions(align="right")
          q-btn(round unelevated color="primary" icon="check" v-close-popup @click="changeDeveloperOption(true)")
</template>
<script src="./advanceSetting.vue.js" />