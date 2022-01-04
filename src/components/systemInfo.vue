<template lang="pug">
  div.bg-c-grey-0(:style="heightStyle")
    q-toolbar
      q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeDeveloperOptionsSubKind('default')")
      q-toolbar-title(align="center" style="padding-right:54px") {{$t('System Info')}}
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
          q-item-label(caption, lines="10", style="word-break:break-all") {{ $t('userAgent: ') + device.userAgent }}
      q-item
        q-item-section
          q-item-label.text-h6 {{ $t('MediaDevice') }}
          q-item-label(
            caption,
            lines="4",
            style="word-break:break-all",
            v-for="(mediaDevice, index) in mediaDevices",
            :key="index"
          ) {{ mediaDevice.kind + ': ' + mediaDevice.label }}
      q-item
        q-item-section
          q-item-label.text-h6 {{ $t('Webrtc') }}
          q-item-label(caption, lines="1") {{ $t('isSupportInsertableStream: ') + isSupportInsertableStream }}
          q-item-label(caption, lines="1") {{ $t('getUserMedia: ') + getUserMedia }}
          q-item-label(caption, lines="1") {{ $t('getDisplayMedia: ') + getDisplayMedia }}
      q-item
        q-item-section
          q-item-label.text-h6 {{ $t('Constraints') }}
          q-item-label(caption, lines="20", style="word-break:break-all") {{ constraints }}
      q-item
        q-item-section
          q-item-label.text-h6 {{ $t('MimeType') }}
          q-item-label(
            caption,
            lines="4",
            style="word-break:break-all",
            v-for="(mimeType, index) in mimeTypes",
            :key="index"
          ) {{ mimeType }}
</template>
<script src="./systemInfo.vue.js" />
