<template lang="pug">
div(
  :class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1 heightMobileStyle-me' : 'bg-c-grey-1 heightStyle-me'"
)
  q-toolbar.header-toolbar(
    :class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'"
  )
    //- q-btn.btnIcon(flat round dense icon="person_add" @click="start")
    //- q-btn.btnIcon(flat round dense icon="person_add" @click="stop")
    q-btn.btnIcon(flat round dense icon="person_add" @click="capture")
  q-separator.c-separator(inset="item")
  q-list
    q-item
      q-item-section
        q-item-label.text-h6 {{ $t('Device') }}
        q-item-label(caption, lines="1") {{ $t('platform: ') + device.platform }}
        q-item-label(caption, lines="1") {{ $t('browser: ') + device.browser }}
        q-item-label(caption, lines="1") {{ $t('version: ') + device.version }}
        q-item-label(caption, lines="1") {{ $t('device: ') + device.device }}
        q-item-label(caption, lines="1") {{ $t('cordova: ') + device.cordova }}
        q-item-label(caption, lines="1") {{ $t('touch: ') + device.touch }}
        q-item-label(caption, lines="1") {{ $t('webStorage: ') + device.webStorage }}
        q-item-label(caption, lines="4") {{ $t('userAgent: ') + device.userAgent }}
        q-item-label.text-h6 {{ $t('MediaDevice') }}
        q-item-label(
          caption,
          lines="4",
          v-for="(mediaDevice, index) in mediaDevices",
          :key="index"
        ) {{ mediaDevice.kind + ':' + mediaDevice.label }}
        q-item-label.text-h6 {{ $t('Constraints') }}
        q-item-label(caption, lines="4") {{ $t('constraints: ') + constraints }}
        q-item-label.text-h6 {{ $t('MimeType') }}
        q-item-label(
          caption,
          lines="4",
          v-for="(mimeType, index) in mimeTypes",
          :key="index"
        ) {{ mimeType }}
        q-item-label.text-h6 {{ $t('Webrtc') }}
        q-item-label(caption, lines="1") {{ $t('isSupportInsertableStream: ') + isSupportInsertableStream }}
        q-item-label(caption, lines="1") {{ $t('getUserMedia: ') + getUserMedia }}
        q-item-label(caption, lines="1") {{ $t('getDisplayMedia: ') + getDisplayMedia }}
</template>
<script src="./developer.vue.js" />
