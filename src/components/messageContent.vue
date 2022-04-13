<template lang="pug">
  div
    q-chat-message(@click ='avatarClick($event,message)' v-if='isShowRecalld(message)' :name = "getName(message)" :avatar = "getAvatar(message)" :stamp= "getStamp(message)"  :sent="isSent(message)" text-color="grey-10" bg-color="primary")
      span {{$t('This message has been recalled')}}
    q-chat-message(@click ='avatarClick($event,message)' v-else-if='message.destroyTime && !message.opened &&  message.senderPeerId !== $store.state.myselfPeerClient.peerId' :name = "getName(message)" :avatar = "getAvatar(message)" :stamp= "getStamp(message)"  :sent="isSent(message)" text-color="grey-10" bg-color="primary")
        q-btn(dark-percentage unelevated color="secondary" text-color="grey-1" @click="openDestroyMessage(message)")
            span {{$t('Open Timing Message')}}
    q-chat-message(v-else-if="message.status !== ChatMessageStatus.RECALL" @click ='avatarClick($event,message)' :class = "entry === 'message'?'':'list-message'" :name = "getName(message)" :avatar = "getAvatar(message)" :stamp= "getStamp(message)"  :sent="isSent(message)" text-color="grey-10" bg-color="primary")
      div.message-text(v-if="message.contentType === ChatContentType.TEXT" )
        template(v-for="(htmlPart, index) in htmlConvert(message.content)")
          span(v-html='htmlPart.text' v-if="htmlPart.type === 'text'")
          span.message-text-link(v-html='htmlPart.text' v-if="htmlPart.type === 'link'" @click='openInnerBrowers(htmlPart)')
      div(v-if="message.contentType === ChatContentType.AUDIO_HISTORY || message.contentType === ChatContentType.VIDEO_HISTORY")
        q-icon(:name="message.contentType === ChatContentType.VIDEO_HISTORY?'videocam':'call'")
        span  {{message.content}}
      img(v-if="message.contentType === ChatContentType.IMAGE" :src="message.thumbnail" @click = '$store.getMessageFileAndOpen(message)')
      mobileAudio(v-if="message.contentType === ChatContentType.VOICE" :src="message.thumbnail" )
      q-btn(v-if = "message.contentType === ChatContentType.FILE" :loading="message.percent?true:false" :percentage="message.percent ? message.percent :0" dark-percentage unelevated color="secondary" text-color="grey-1" @click="$store.getMessageFileAndOpen(message)" icon="cloud_download" style="width: 100%")
        span {{message.content}}
      q-btn(v-if = "message.contentType === ChatContentType.AUDIO" flat round icon="play_arrow" :label="message.content?message.content:''" @click = '$store.getMessageFileAndOpen(message)')
      div(v-if = "message.contentType === ChatContentType.VIDEO"  @click = '$store.getMessageFileAndOpen(message)')
        q-img(:src="message.thumbnail" style="width: 100px;")
          q-icon(size="32px" name="play_circle_outline" color="white" style="top: 50%; left: 50%; margin-top: -16px; margin-left: -16px;")
      div(v-if="message.subjectType === SubjectType.CHAT && (message.contentType === ChatContentType.VIDEO_INVITATION ||message.contentType == ChatContentType.AUDIO_INVITATION)")
        q-icon(:name="message.contentType === ChatContentType.VIDEO_INVITATION?'videocam':'call'")
        span(v-if="message.contentType === ChatContentType.VIDEO_INVITATION") {{$t('videoInvitation')}}
        span(v-if="message.contentType === ChatContentType.AUDIO_INVITATION") {{$t('audioInvitation')}}
      q-btn(v-if = "message.subjectType === SubjectType.GROUP_CHAT && (message.contentType === ChatContentType.VIDEO_INVITATION ||message.contentType == ChatContentType.AUDIO_INVITATION)" color="secondary" text-color="grey-1" @click="acceptGroupCall(message)" :icon="message.contentType=='videoInvitation'?'videocam':'call'" style="width: 100%")
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
      q-card.personal-card(v-if="message.contentType === ChatContentType.CHANNEL" @click="openChannel(message)")
        q-item
          q-item-section(avatar)
            q-avatar
              img(:src="message.content.avatar?message.content.avatar:$store.defaultActiveAvatar")
          q-item-section
            q-item-label {{message.content.name}}
        q-separator.c-separator
        p {{$t('Channel')}}
      q-card(flat v-if="message.contentType === ChatContentType.ARTICLE"  @click="openArticle(message)")
            q-card-section(class="q-pa-none")
              q-img(:src="message.content.cover ? message.content.cover : $store.defaultChannelArticleCover" style="min-width:200px;")
            q-card-section(class="q-py-md")
              q-item-label(class="text-h6") {{ message.content.title }}
              q-item-label(v-if="message.content.abstract" class="q-py-sm" caption :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{ message.content.abstract }}
      q-card.personal-card(v-if="message.contentType === ChatContentType.CHAT" @click="openMergeMessage(message)")
        q-item
          q-item-section
            q-item-label(overline) {{message.title+$t('Chat Records')}}
            q-item-label {{message.content}}
        q-separator.c-separator
        p {{$t('Chat Records')}}
      q-card.personal-card(v-if="message.contentType === ChatContentType.NOTE" @click="openNoteMessage(message)")
        notePreview(v-bind:item = "message" entry = "message")
      //q-spinner-dots(size="2rem" v-if = "(message.contentType === ChatContentType.IMAGE || message.contentType === ChatContentType.VIDEO || message.contentType === ChatContentType.FILE || message.contentType === ChatContentType.NOTE) && message.loading")
      q-badge.countdown-badge( style="bottom:-4px;top:unset" v-if="message.countDown") {{message.countDown}}
      q-badge(floating v-if = "(message.contentType === ChatContentType.IMAGE || message.contentType === ChatContentType.VIDEO || message.contentType === ChatContentType.FILE || message.contentType === ChatContentType.NOTE)") {{message.fileSize}}
      q-badge(floating style="bottom:-4px;top:unset" v-if="message.destroyTime && message.senderPeerId === $store.state.myselfPeerClient.peerId")
          q-icon(name="alarm")
</template>
<script src="./messageContent.vue.js"/>
