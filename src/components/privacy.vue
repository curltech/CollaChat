<template lang="pug">
  div
    q-tab-panels.bg-c-grey-0(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
         q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeSettingSubKind('default')")
         q-toolbar-title(align="center" style="padding-right:54px") {{$t('Privacy')}}
        q-list
          q-item(clickable v-ripple @click="subKind = 'blackList'")
            q-item-section
              q-item-label {{$t('Blacklist')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="showLockListDialog")
            q-item-section
              q-item-label {{$t('Locklist')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="subKind = 'visibilitySetting'")
            q-item-section
              q-item-label {{$t('Visibility Setting')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
      q-tab-panel(:style="heightStyle" name="visibilitySetting" style="padding:0px 0px")
        q-toolbar
         q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
         q-toolbar-title(align="center" style="padding-right:54px") {{$t('Visibility Setting')}}
        q-list
          q-item
            q-item-section
              q-item-label {{$t('Peer Id')}}
            q-item-section(side)
              q-toggle(v-model="peerIdSwitch" @input="changePeerIdSwitch")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item
            q-item-section
              q-item-label {{$t('UserName')}}
            q-item-section(side)
              q-toggle(v-model="nameSwitch" @input="changeNameSwitch")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item
            q-item-section
              q-item-label {{$t('Mobile')}}
            q-item-section(side)
              q-toggle(v-model="mobileNumberSwitch" @input="changeMobileNumberSwitch")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item
            q-item-section
              q-item-label {{$t('Group Chat')}}
            q-item-section(side)
              q-toggle(v-model="groupChatSwitch" @input="changeGroupChatSwitch")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item
            q-item-section
              q-item-label {{$t('QR Code')}}
            q-item-section(side)
              q-toggle(v-model="qrCodeSwitch" @input="changeQrCodeSwitch")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item
            q-item-section
              q-item-label {{$t('Contact Card')}}
            q-item-section(side)
              q-toggle(v-model="contactCardSwitch" @input="changeContactCardSwitch")
      q-tab-panel(name="blackList" style="padding:0px 0px")
        blackList.drawcontent
      q-tab-panel(name="lockList" style="padding:0px 0px")
        lockList.drawcontent
    q-dialog(v-model="lockListDialog" persistent)
      q-card
        q-bar(class="bg-primary text-c-grey-0")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section
          q-form(ref="formLockList" @submit="lockList")
            q-input.c-field(:label="$t('Please input Password')" autofocus dense filled clearable v-model="password" type="password" lazy-rules :rules="[]")
        q-card-actions(align="right")
          q-btn(color="primary" icon="check" round unelevated v-close-popup @click="lockList")
</template>
<script src="./privacy.vue.js" />