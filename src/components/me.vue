<template lang="pug">
  div(:class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'bg-c-grey-1 heightMobileSize-me' : 'bg-c-grey-1 heightMobileStyle-me') : 'bg-c-grey-1 heightStyle-me'")
    q-list
      q-item(clickable v-ripple @click="$store.changeKind('accountInformation', 'me');$store.toggleDrawer(true)" class="q-py-md")
        q-item-section(avatar)
          q-avatar(size="48px")
            img(:src="$store.state.myselfPeerClient.avatar ? $store.state.myselfPeerClient.avatar : $store.defaultActiveAvatar")
        q-item-section
          q-item-label(class="text-h6") {{ $store.state.myselfPeerClient.givenName ? $store.state.myselfPeerClient.givenName : $store.state.myselfPeerClient.name }}
          q-item-label(caption lines="1") {{ $t('Mobile: ') + ($store.state.myselfPeerClient.mobile ? $store.state.myselfPeerClient.mobile : '') }}
        q-item-section(side)
          q-icon(name="qr_code" color="primary")
        q-item-section(side)
          q-icon.text-c-black(v-if="ifMobileSize || $store.state.ifMobileStyle" name="keyboard_arrow_right")
      //q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
      q-item(clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'" class="text-c-grey-9" :active="$store.getKind() === 'collection'" @click="$store.changeKind('collection', 'me');$store.toggleDrawer(true);$store.collectionEntry=''")
        q-item-section(avatar)
          q-icon.text-primary(name="bookmarks")
        q-item-section {{$t('Collection')}}
        q-item-section(avatar)
          q-icon(v-if="ifMobileSize || $store.state.ifMobileStyle" name="keyboard_arrow_right")
      //q-separator.c-separator(inset="item")
      //q-item(clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'" class="text-c-grey-9" :active="$store.getKind() === 'wallet'" @click="$store.changeKind('wallet', 'me');$store.toggleDrawer(true)")
        q-item-section(avatar)
          q-icon.text-primary(name="account_balance_wallet")
        q-item-section {{$t('Wallet')}}
        q-item-section(avatar)
          q-icon(v-if="ifMobileSize || $store.state.ifMobileStyle" name="keyboard_arrow_right")
      //q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
      q-item(clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'" class="text-c-grey-9" :active="$store.getKind() === 'setting'" @click="$store.changeKind('setting', 'me');$store.toggleDrawer(true)")
        q-item-section(avatar)
          q-icon.text-primary(name="settings")
        q-item-section {{$t('Settings')}}
        q-item-section(avatar)
          q-badge(v-if="$store.macos !== true && $store.latestVersion !== $store.currentVersion" color="red" floating rounded) New
          q-icon(v-if="ifMobileSize || $store.state.ifMobileStyle" name="keyboard_arrow_right")
      //q-separator.c-separator
</template>
<script src="./me.vue.js" />
