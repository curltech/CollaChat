<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{$t('Contacts Requests')}}
          q-btn.text-primary(flat round icon="send" @click="subKind = 'sentList'")
        q-list
          div(v-for="(linkmanRequest, index) in $store.state.linkmanRequests" v-if="linkmanRequest.receiverPeerId === $store.state.myselfPeerClient.peerId" :key="linkmanRequest._id")
            q-item(class="q-px-xs")
              q-item-section(avatar bolder)
                q-avatar(size="64px")
                  img(:src="linkmanRequest.avatar ? linkmanRequest.avatar : $store.defaultActiveAvatar")
              q-item-section
                q-item-label {{ linkmanRequest.name }}
                q-item-label(caption lines="1") {{ $t('Mobile: ') + (linkmanRequest.mobile ? linkmanRequest.mobile : '') }}
                q-item-label(caption lines="3" style="word-break:break-all") {{ $t('PeerId: ') + linkmanRequest.senderPeerId }}
                q-item-label(caption lines="10") {{ $t('InviteMessage: ') + linkmanRequest.message }}
                q-item-label(caption lines="1") {{ $t('CreateDate: ') + date.formatDate(linkmanRequest.createDate, 'YYYY-MM-DD HH:mm:ss') }}
              q-item-section(side :class="linkmanRequest.status === RequestStatus.RECEIVED ? 'hidden' : ''")
                q-item-label(caption lines="1") {{ $t(linkmanRequest.status) }}
              q-item-section(side :class="linkmanRequest.status === RequestStatus.RECEIVED ? '' : 'hidden'")
                q-btn(color="primary" dense round flat icon="person_add" @click="acceptRequest(linkmanRequest)")
              q-item-section(side :class="linkmanRequest.status === RequestStatus.RECEIVED ? '' : 'hidden'")
                q-btn.text-primary(dense round flat icon="person_add_disabled" @click="ignoreRequest(linkmanRequest)")
            q-separator.c-separator(inset="item" v-if="index < $store.state.linkmanRequests.length - 1")
            q-separator.c-separator(v-if="index === $store.state.linkmanRequests.length - 1")
      q-tab-panel(name="sentList" style="padding:0px 0px")
        sentList.drawcontent
      q-tab-panel(name="findContacts" style="padding:0px 0px")
        findContacts.drawcontent
</template>
<script src="./receivedList.vue.js" />