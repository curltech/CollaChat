<template lang="pug">
  div.bg-c-grey-0
    q-toolbar
      q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeDeveloperOptionsSubKind('default')")
      q-toolbar-title(align="center" style="padding-right:54px") {{$t('Debug Info')}}
      q-input.c-field(:disable="$store.state.myselfPeerClient.localDataCryptoSwitch===true" debounce="100" filled dense v-model="searchText" :placeholder="placeholder2" input-class="iconfont" style="width: 86%" :prefix="searchPrefix" @keyup="searchKeyup" @input="searchinput")
        template(slot="append")
          q-icon(v-if="searchText" name="cancel" class="cursor-pointer" @click.stop="searchText = null;searching = false")
      q-toolbar(insert)
          q-input.c-field(dense readonly v-model="searchDate" :placeholder="$t('Date')" input-class="text-center" style="width: 33% !important")
            template(v-slot:append)
              q-icon(v-if="searchDate" name="cancel" class="cursor-pointer" @click.stop="cleanSearchDate")
              q-icon(name="event" color="primary" class="cursor-pointer")
                q-popup-proxy(ref="qDateProxy" transition-show="scale" transition-hide="scale")
                  q-date(v-model="searchDate" @input="searchDateInput" minimal mask="YYYY-MM-DD")
    q-list(v-if="searching")
      q-item(v-for="(message, index) in messageResultList" :key="message.messageId" clickable v-ripple @click="messageResultSelected(message, index)")
        q-item-section(avatar)
          q-avatar
            img(:src="message.senderPeerId === message.ownerPeerId ? ($store.state.myselfPeerClient.avatar ? $store.state.myselfPeerClient.avatar : $store.defaultActiveAvatar) : ($store.state.linkmanMap[message.senderPeerId].avatar ? $store.state.linkmanMap[message.senderPeerId].avatar : $store.defaultActiveAvatar)")
        q-item-section
          q-item-label( lines="1") {{ message.senderPeerId === message.ownerPeerId?$store.state.myselfPeerClient.name:$store.state.linkmanMap[message.senderPeerId].name }}
          q-item-label(caption v-html="message.highlighting")
        q-item-section(side top) {{detailDateFormat(message.createDate)}}
</template>
<script src="./debugInfo.vue.js" />
