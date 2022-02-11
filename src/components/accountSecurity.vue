<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeSettingSubKind('default')")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('Account Security')}}
        q-list
          q-item(clickable v-ripple @click="showChangePassword")
            q-item-section
              q-item-label {{$t('Change Password')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="showResetKeyDialog")
            q-item-section
              q-item-label {{$t('Reset Key')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="showExportIDDialog")
            q-item-section
              q-item-label {{$t('Export ID')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="showDestroyIDDialog")
            q-item-section
              q-item-label {{ $t('Destroy ID') }}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
      q-tab-panel(:style="heightStyle" name="changePassword" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          q-toolbar-title(align="center") {{$t('Change Password')}}
          q-btn.text-primary(flat round icon="check" @click="changePassword")
        q-form(ref="formChangePassword" @submit="changePassword" class="q-pa-sm")
          //div(style="margin-left:12px" class="text-c-grey-10 q-my-sm") {{ $t('OldPassword') }}
          q-input.c-field(autofocus :label="$t('OldPassword')" filled clearable v-model="changePasswordData.oldPassword" type="password" lazy-rules :rules="[ val => val && val.length > 0 || $t('Please input OldPassword')]")
          //div(style="margin-left:12px" class="text-c-grey-10 q-my-sm") {{ $t('NewPassword') }}
          q-input.c-field(:label="$t('NewPassword')" filled clearable v-model="changePasswordData.newPassword" type="password" lazy-rules :rules="[ val => val && val.length > 0 || $t('Please input NewPassword')]")
          //div(style="margin-left:12px" class="text-c-grey-10 q-my-sm") {{ $t('NewRepeatPassword') }}
          q-input.c-field(:label="$t('NewRepeatPassword')" filled clearable v-model="changePasswordData.newRepeatPassword" type="password" lazy-rules :rules="[ val => val && val.length > 0 || $t('Please input NewRepeatPassword')]")
      q-tab-panel(:style="heightStyle" name="qrCode" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          //q-toolbar-title(align="center") {{$t('QR Code')}}
          q-space
          q-btn.text-primary(flat round icon="more_horiz" @click="operateQRCode")
        q-card(flat class="fixed-center q-pa-none")
          q-card-section.bg-white#qrCodeCard(class="q-pa-xs")
            q-card.bg-white(flat class="q-pa-sm")
              q-card-section(class="q-pb-none")
                q-list
                  q-item
                    q-item-section(avatar)
                      q-avatar
                        img(:src="$store.state.myselfPeerClient.avatar ? $store.state.myselfPeerClient.avatar : $store.defaultActiveAvatar")
                    q-item-section(side)
                      q-item-label(class="text-h6 text-dark") {{ $store.state.myselfPeerClient && $store.state.myselfPeerClient.name ? $store.state.myselfPeerClient.name : '' }}
                      q-item-label(caption class="text-dark") {{ $t('Scan QR code to import ID') }}
              q-card-section(align="center" class="q-pt-md")
                //canvas#qrCode
                div#qrCode
              //q-card-section(class="q-pt-none")
                div(class="text-center text-c-grey-10 text-caption") {{ $t('Scan QR code to import ID') }}
      q-tab-panel(name="selectChat" style="padding:0px 0px")
        selectChat.drawcontent
    q-dialog(v-model="resetKeyDialog" persistent)
      q-card(style="width: 250px")
        q-bar(class="bg-primary text-c-grey-0")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section
          q-form(ref="formResetKey" @submit="resetKey")
            q-input.c-field(:label="$t('Please input Password')" autofocus filled clearable v-model="password" type="password" lazy-rules :rules="[]")
        q-card-actions(align="right")
          q-btn(round unelevated color="primary" icon="check" v-close-popup @click="resetKey")
    q-dialog(v-model="exportIDDialog" persistent)
      q-card(style="width: 250px")
        q-bar(class="bg-primary text-c-grey-0")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section
          q-form(ref="formExportKey" @submit="exportID")
            q-input.c-field(:label="$t('Please input Password')" autofocus filled clearable v-model="password" type="password" lazy-rules :rules="[]")
        q-card-actions(align="right")
          q-btn.text-primary(round unelevated icon="check" v-close-popup @click="exportID")
    q-dialog(v-model="destroyIDDialog" persistent)
      q-card
        q-bar(class="bg-primary text-c-grey-0")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section
          q-form(ref="formDestroyID" @submit="destroyID")
            q-input.c-field(:label="$t('Please input Password')" autofocus filled clearable v-model="password" type="password" lazy-rules :rules="[]")
        q-card-section
          q-item-label(class="text-red") {{$t('SERIOUS WARNING: This operation will remove all information related to this ID from this device forever, please be cautious!!!')}}
        q-card-actions(align="right")
          q-btn.text-primary(round unelevated icon="check" v-close-popup @click="destroyID")
</template>
<script src="./accountSecurity.vue.js" />