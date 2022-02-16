<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeSettingSubKind('default')")
        q-card(flat)
          q-card-section(align="center" class="q-pa-none")
            q-img(src="@/assets/colla.png" style="height: 120px; width: 137px")
          q-card-section
            div(class="text-center text-primary text-h6") {{$t('Secure Your Collaboration')}}
          q-card-section
            q-list
              q-item(dense)
                q-item-section(avatar)
                  q-icon.text-primary(name="info")
                q-item-section
                  q-item-label {{$t('About Colla')}}
              q-separator.c-separator
              q-item(v-if="$store.macos === true" v-ripple)
                q-item-section
                  q-item-label {{$t('Current Version')}}
                q-item-section(side)
                  q-item-label {{ $store.currentVersion }}
              q-item(v-if="$store.macos !== true" clickable v-ripple @click="$store.versionUpdate()")
                q-item-section
                  q-item-label {{$t('Version Update')}}
                q-item-section(side)
                  q-item-label {{ $store.currentVersion }}
                  q-badge(v-if="$store.latestVersion !== $store.currentVersion" color="red" floating rounded) New
                q-item-section(side)
                  q-icon(name="keyboard_arrow_right")
              q-separator.c-separator
              q-item(clickable v-ripple @click="subKind = 'tos'")
                q-item-section
                  q-item-label {{$t('Terms Of Service')}}
                q-item-section(side)
                  q-icon(name="keyboard_arrow_right")
          q-card-section
            q-list
              q-item(dense)
                q-item-section(avatar)
                  q-icon.text-primary(name="send")
                q-item-section
                  q-item-label {{$t('Contact Us')}}
              q-separator.c-separator
              q-item
                q-item-section
                  q-item-label {{$t('Peer Id')}}
                  q-item-label(caption lines="3" style="word-break:break-all") {{collaPeerId}}
                q-item-section(side style="padding-left:0px")
                  q-btn(flat dense round color="primary" icon="content_copy" v-clipboard:copy="collaPeerId" v-clipboard:success="onCopySuccess" v-clipboard:error="onCopyFailure")
              q-separator.c-separator
              q-item(clickable v-ripple @click="enterQRCode")
                q-item-section
                  q-item-label {{$t('QR Code')}}
                q-item-section(avatar)
                  q-icon(color="primary" name="qr_code")
                q-item-section(side)
                  q-icon(name="keyboard_arrow_right")
              q-separator.c-separator
              q-item(clickable v-ripple @click="")
                q-item-section
                  q-item-label {{$t('Website')}}
                q-item-section(side)
                  q-item-label {{website}}
                //q-item-section(side)
                  q-icon(name="keyboard_arrow_right")
                q-item-section(side style="padding-left:0px")
                  q-btn(flat dense round color="primary" icon="content_copy" v-clipboard:copy="website" v-clipboard:success="onCopySuccess" v-clipboard:error="onCopyFailure")
              q-separator.c-separator
              q-item(clickable v-ripple @click="")
                q-item-section
                  q-item-label {{$t('GitHub')}}
                q-item-section(side)
                  q-item-label {{github}}
                //q-item-section(side)
                  q-icon(name="keyboard_arrow_right")
                q-item-section(side style="padding-left:0px")
                  q-btn(flat dense round color="primary" icon="content_copy" v-clipboard:copy="github" v-clipboard:success="onCopySuccess" v-clipboard:error="onCopyFailure")
      q-tab-panel(name="tos" style="padding:0px 0px")
        tos.drawcontent
      q-tab-panel(:style="heightStyle" name="qrCode" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          //q-toolbar-title(align="center") {{$t('QR Code')}}
          q-space
          q-btn.text-primary(flat round icon="more_horiz" @click="operateQRCode")
        q-card(flat class="fixed-center q-pa-none")
          q-card-section#qrCodeCard(class="q-pa-xs")
            q-card(flat class="q-pa-sm")
              q-card-section(class="q-pb-none")
                q-avatar
                  img(:src="$store.defaultActiveAvatar")
                span(class="text-h6 q-pl-sm") Colla
              q-card-section(align="center" class="q-pt-md")
                canvas#qrCode
              q-card-section(class="q-pt-none")
                div(class="text-center text-caption") {{$t('Scan QR code to add me into your contacts')}}
      q-tab-panel(name="selectChat" style="padding:0px 0px")
        selectChat.drawcontent
</template>
<script src="./about.vue.js" />