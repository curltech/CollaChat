<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? 'padding-right:54px' : ''") {{$t('Account Information')}}
        q-list
          q-item(clickable v-ripple @click="showAvatar")
            q-item-section
              q-item-label {{$t('Avatar')}}
            q-item-section(avatar)
              q-avatar(size="32px")
                img(:src="$store.state.myselfPeerClient.avatar ? $store.state.myselfPeerClient.avatar : $store.defaultActiveAvatar")
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="enterName")
            q-item-section
              q-item-label {{$t('UserName')}}
            q-item-section(side) {{ $store.state.myselfPeerClient && $store.state.myselfPeerClient.name ? $store.state.myselfPeerClient.name : '' }}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="enterMobile")
            q-item-section
              q-item-label {{$t('Mobile')}}
            q-item-section(side) {{ $store.state.myselfPeerClient && $store.state.myselfPeerClient.mobile ? $store.state.myselfPeerClient.mobile : '' }}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple)
            q-item-section(side)
              q-item-label.text-c-black {{$t('Peer Id')}}
            q-item-section
              q-item-label(caption lines="3" style="word-break:break-all") {{ $store.state.myselfPeerClient ? $store.state.myselfPeerClient.peerId : '' }}
            q-item-section(side)
              q-btn.text-primary(flat dense round icon="content_copy" v-clipboard:copy="$store.state.myselfPeerClient ? $store.state.myselfPeerClient.peerId : ''" v-clipboard:success="onCopySuccess" v-clipboard:error="onCopyFailure")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="enterQRCode")
            q-item-section
              q-item-label {{$t('QR Code')}}
            q-item-section(avatar)
              q-icon.text-primary(name="qr_code")
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item(class="text-c-grey-10")
            q-item-section(side)
              q-item-label(caption) {{$t('Instances') + '(' + ($store.peerClients ? $store.peerClients.length + 1 : 1) + ')'}}
          q-item(clickable v-ripple active-class="text-primary" active)
              q-item-section(avatar)
                  q-icon(:name="$store.state.myselfPeerClient.clientDevice === 'DESKTOP' ? 'desktop_windows' : 'smartphone'")
              q-item-section
                q-item-label(caption lines="1") {{ $t('Id: ') + $store.state.myselfPeerClient.clientId }}
                  q-icon(v-if="$store.displayActiveStatus" class="q-pl-sm" name="person" color="secondary")
                q-item-label(caption lines="1") {{ $t('Device: ') + $store.state.myselfPeerClient.clientType }}
                q-item-label(caption lines="1") {{ $t('LastUpdateTime: ') + date.formatDate($store.state.myselfPeerClient.lastUpdateTime, 'YYYY-MM-DD HH:mm:ss') }}
                q-item-label(caption lines="1") {{ $t('LastAccessTime: ') + date.formatDate($store.state.myselfPeerClient.lastAccessTime, 'YYYY-MM-DD HH:mm:ss') }}
                q-item-label(caption lines="8" style="word-break:break-all") {{ $t('LastAccessNode: ') + GetAddressLabel($store.state.myselfPeerClient.connectPeerId) }}
          q-separator.c-separator(inset="item" v-if="$store.peerClients && $store.peerClients.length > 0")
          div(v-for="(peerClient, index) in ($store.peerClients ? $store.peerClients : [])" :key="peerClient.clientId")
            q-item(clickable v-ripple)
              q-item-section(avatar)
                  q-icon(:name="peerClient.clientDevice === 'DESKTOP' ? 'desktop_windows' : 'smartphone'")
              q-item-section
                q-item-label(caption lines="1") {{ $t('Id: ') + peerClient.clientId }}
                  q-icon(v-if="$store.displayActiveStatus" class="q-pl-sm" name="person" :color="peerClient.clientDevice === $store.state.myselfPeerClient.clientDevice ? 'c-grey' : (peerClient.activeStatus === 'Up' ? 'secondary' : 'c-grey')")
                q-item-label(caption lines="1") {{ $t('Device: ') + peerClient.clientType }}
                //q-item-label(caption lines="1") {{ $t('LastUpdateTime: ') + date.formatDate(peerClient.lastUpdateTime, 'YYYY-MM-DD HH:mm:ss') }}
                q-item-label(caption lines="1") {{ $t('LastAccessTime: ') + date.formatDate(peerClient.lastAccessTime, 'YYYY-MM-DD HH:mm:ss') }}
                q-item-label(caption lines="8" style="word-break:break-all") {{ $t('LastAccessNode: ') + GetAddressLabel(peerClient.connectPeerId) }}
            q-separator.c-separator(inset="item" v-if="$store.peerClients && index < $store.peerClients.length - 1")
            //q-separator.c-separator(v-if="$store.peerClients && index === $store.peerClients.length - 1")
      q-tab-panel#avatarContainer(:style="heightStyle" name="avatar" style="padding:0px 0px" align="center")
        q-toolbar(style="z-index: 999")
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          q-toolbar-title(align="center" class="text-c-grey-10") {{$t('Avatar')}}
          q-btn(flat round icon="more_horiz" color="primary" @click="operateAvatar")
        img#avatarImg
        canvas#avatar(class="hidden")
      q-tab-panel#alloycropContainer(:style="heightStyle" name="showPhoto" style="padding:0px 0px" align="center")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="showPhotoBack")
          q-toolbar-title(align="center") {{ $t('Change Avatar') }}
          q-btn.text-primary(flat round icon="check" @click="changeAvatar")
        div.fixed-center#crop_result(v-if="$store.ifMobile()" :class="showCrop ? '' : 'hidden'")
        q-img(v-if="$store.ifMobile()" :class="showCrop ? 'hidden' : ''" style="width:100%;max-height:calc(100% - 50px)" :src="avatarSrc")
        img#photoImg(v-if="!$store.ifMobile()")
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
                  img(:src="$store.state.myselfPeerClient.avatar ? $store.state.myselfPeerClient.avatar : $store.defaultActiveAvatar")
                span(class="text-h6 q-pl-sm") {{$store.state.myselfPeerClient && $store.state.myselfPeerClient.name ? $store.state.myselfPeerClient.name : ''}}
              q-card-section(align="center" class="q-pt-md")
                canvas#qrCode
              q-card-section(class="q-pt-none")
                div(class="text-center text-c-grey-10 text-caption") {{$t('Scan QR code to add me into your contacts')}}
      q-tab-panel(name="selectChat" style="padding:0px 0px")
        selectChat.drawcontent
      q-tab-panel(:style="heightStyle" name="name" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          q-toolbar-title(align="center") {{ $t('Change Name') }}
          q-btn(flat round icon="check" @click="changeName" :disable="!name" :class="name?'text-primary':'c-grey-0'")
        q-form(ref="formChangeName" @submit="changeName" class="q-pa-sm")
          q-input.c-field(autofocus filled :label="$t('UserName')" clearable v-model="name" lazy-rules :rules="[ val => val && val.length > 0 || $t('Please input Name')]")
      q-tab-panel(:style="heightStyle" name="mobile" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          q-toolbar-title(align="center") {{ $t('Change Mobile') }}
          q-btn.text-primary(flat round icon="check" @click="changeMobile")
        q-form(ref="formChangeMobile" @submit="changeMobile" class="q-pa-sm")
          q-select.c-field(:label="$t('Country/Region')" filled flat v-model="countryRegion_" :options="options"
            clearable
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            @filter="filterFnAutoselect"
            @filter-abort="abortFilterFn")
            template(v-slot:no-option)
              q-item
                q-item-section(class="text-c-grey-0") {{$t('No results')}}
          p
          div(class="row justify-between")
            div(class="col-4")
              q-input.c-field(:label="$t('Code')" prefix="+" filled clearable v-model="code_" lazy-rules :rules="[val => val && val.length > 0 || $t('Code')]")
            div(class="col-8 q-pl-xs")
              q-input.c-field(autofocus :label="$t('Mobile')" filled clearable v-model="mobile_" lazy-rules :rules="[]")
    q-uploader(style="display:none" ref="upload" @added="files => upload(files)" accept=".jpg, image/*")
</template>
<script src="./accountInformation.vue.js" />