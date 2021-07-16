<template lang="pug">
  div
    q-chat-message(@click ='avatarClick($event,message)' v-if='isShowRecalld(message)' :name = "getName(message)" :avatar = "getAvatar(message)" :stamp= "getStamp(message)"  :sent="isSent(message)" text-color="grey-10" bg-color="primary")
      span {{$t('This message has been recalld')}}
    q-chat-message(@click ='avatarClick($event,message)' v-else-if='message.destroyTime && !message.opened &&  message.senderPeerId !== $store.state.myselfPeerClient.peerId' :name = "getName(message)" :avatar = "getAvatar(message)" :stamp= "getStamp(message)"  :sent="isSent(message)" text-color="grey-10" bg-color="primary")
        q-btn(dark-percentage unelevated color="secondary" text-color="grey-1" @click="openDestroyMessage(message)")
            span {{$t('Open Timing Message')}}
    q-chat-message(v-else-if="message.status !== ChatMessageStatus.RECALL" @click ='avatarClick($event,message)' :class = "entry === 'message'?'':'list-message'" :name = "getName(message)" :avatar = "getAvatar(message)" :stamp= "getStamp(message)"  :sent="isSent(message)" text-color="grey-10" bg-color="primary")
      //q-btn.btnIcon.q-mr-sm.resend-btn(v-if = " entry === 'message' && isResend(message)" flat round dense icon="sync" @click="attemptConnect(message)")
      span.message-text(v-if="message.contentType === ChatContentType.TEXT" v-html="message.content")
      div(v-if="message.contentType === ChatContentType.AUDIO_HISTORY || message.contentType === ChatContentType.VIDEO_HISTORY")
        q-icon(:name="message.contentType === ChatContentType.VIDEO_HISTORY?'videocam':'call'")
        span  {{message.content}}
      img(v-if="message.contentType === ChatContentType.IMAGE" :src="message.thumbnail" @click = '$store.getMessageFileAndOpen(message)')
      mobileAudio(v-if="message.contentType === ChatContentType.VOICE" :src="message.thumbnail" )
      q-btn(v-if = "message.contentType === ChatContentType.FILE" :loading="message.percent?true:false" :percentage="message.percent ? message.percent :0" dark-percentage unelevated color="secondary" text-color="grey-1" @click="$store.getMessageFileAndOpen(message)" icon="cloud_download" style="width: 100%")
        span {{message.content}}
      q-btn(v-if = "message.contentType === ChatContentType.AUDIO" flat round icon="play_arrow" :label="message.content?message.content:''" @click = '$store.getMessageFileAndOpen(message)')
      div(v-if = "message.contentType === ChatContentType.VIDEO"  @click = '$store.getMessageFileAndOpen(message)')
        q-icon.video-thumbnail-icon( size="32px" name="play_circle_outline")
        img.video-thumbnail-img(:src="message.thumbnail")
      q-btn(v-if = "message.contentType === ChatContentType.VIDEO_INVITATION ||message.contentType == ChatContentType.AUDIO_INVITATION" color="secondary" text-color="grey-1" @click="acceptGroupCall(message)" :icon="message.contentType=='videoInvitation'?'videocam':'call'" style="width: 100%")
        span(v-if="message.contentType === ChatContentType.VIDEO_INVITATION") {{$t('join video')}}
        span(v-if="message.contentType === ChatContentType.AUDIO_INVITATION") {{$t('join audio')}}
      q-card.personal-card(v-if="message.contentType === ChatContentType.CARD" @click="openCard(message)")
        q-item
          q-item-section(avatar)
            q-avatar
              img(:src="message.content.avatar?message.content.avatar:$store.defaultActiveAvatar")
          q-item-section
            q-item-label {{message.content.name}}
        q-separator.c-separator
        p {{$t('Personal Card')}}
      q-card.personal-card(v-if="message.contentType === ChatContentType.CHAT" @click="openMergeMessage(message)")
        q-item
          q-item-section
            q-item-label(overline) {{message.title+$t('Chat Records')}}
            q-item-label {{message.content}}
        q-separator.c-separator
        p {{$t('Chat Records')}}
      q-card.personal-card(v-if="message.contentType === ChatContentType.NOTE" @click="openNoteMessage(message)")
        notePreview(v-bind:item = "message" entry = "message")
      q-spinner-dots(size="2rem" v-if = "(message.contentType === ChatContentType.IMAGE || message.contentType === ChatContentType.VIDEO || message.contentType === ChatContentType.FILE || message.contentType === ChatContentType.NOTE) && message.loading")
      q-badge.countdown-badge( style="bottom:-4px;top:unset" v-if="message.countDown") {{message.countDown}}
      q-badge(floating v-if = "(message.contentType === ChatContentType.IMAGE || message.contentType === ChatContentType.VIDEO || message.contentType === ChatContentType.FILE || message.contentType === ChatContentType.NOTE)") {{message.fileSize}}
      q-badge(floating style="bottom:-4px;top:unset" v-if="message.destroyTime && message.senderPeerId === $store.state.myselfPeerClient.peerId")
          q-icon(name="alarm")
</template>
<script src="./messageContent.vue.js"/>
