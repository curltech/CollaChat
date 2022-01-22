<template lang="pug">
  div.bg-c-grey-0
    q-toolbar
      q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeReceivedListSubKind('default')")
      q-toolbar-title(align="center" style="padding-right:54px") {{$t('My Requests')}}
    q-list
      div(v-for="(linkmanRequest, index) in $store.state.linkmanRequests" v-if="linkmanRequest.senderPeerId === $store.state.myselfPeerClient.peerId" :key="linkmanRequest._id")
        q-item(class="q-px-xs")
          q-item-section(avatar bolder)
            q-avatar(size="32px")
              img(:src="linkmanRequest.avatar ? linkmanRequest.avatar : $store.defaultActiveAvatar")
          q-item-section
            q-item-label {{ linkmanRequest.name }}
            q-item-label(caption lines="1") {{ $t('Mobile: ') + (linkmanRequest.mobile ? linkmanRequest.mobile : '') }}
            q-item-label(caption lines="3" style="word-break:break-all") {{ $t('PeerId: ') + linkmanRequest.receiverPeerId }}
            q-item-label(caption lines="10") {{ $t('InviteMessage: ') + linkmanRequest.message }}
            q-item-label(caption lines="1") {{ $t('CreateDate: ') + date.formatDate(linkmanRequest.createDate, 'YYYY-MM-DD HH:mm:ss') }}
          q-item-section(side :class="(linkmanRequest.status === RequestStatus.SENT || linkmanRequest.status === RequestStatus.RECEIVED) ? 'hidden' : ''")
            q-item-label(caption lines="1") {{ $t(linkmanRequest.status) }}
          q-item-section(side :class="(linkmanRequest.status === RequestStatus.SENT || linkmanRequest.status === RequestStatus.RECEIVED) ? '' : 'hidden'")
            q-btn.text-primary(dense round flat icon="person_add_disabled" @click="ignoreRequest(linkmanRequest)")
        q-separator.c-separator(inset="item" v-if="index < $store.state.linkmanRequests.length - 1")
        q-separator.c-separator(v-if="index === $store.state.linkmanRequests.length - 1")
</template>
<script src="./sentList.vue.js" />