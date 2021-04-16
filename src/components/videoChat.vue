<template lang="pug">
  q-dialog.bg-c-grey-0.text-c-grey-10(v-model="$store.state.videoDialog" id='videoDialog' persistent :maximized = 'ifMobileSize || $store.state.ifMobileStyle || fullSize')
    //single video
    q-card.message-dialog-card(:class="dialogSizeClass" v-if="$store.state.currentCallChat && ($store.state.currentCallChat.subjectType === SubjectType.CHAT) && $store.state.currentCallChat.callType === 'video'")
      q-toolbar.linkman-video-toolbar.justify-center
        q-toolbar-title.media-timer(:class="Platform.is.ios?'':'text-white'" align="center")
          span(ref="mediaTimer")
        q-btn.btnIcon(v-if = "$store.state.currentCallChat.stream" unelevated round color="primary" :icon="chatMute?'volume_off':'volume_up'" @click="changeChatMute")
        q-space(v-if = "$store.state.currentCallChat.stream")
        q-btn.btnIcon(unelevated round color="red" icon="call_end" @click="closeCall")
        q-space(v-if = "$store.state.currentCallChat.stream")
        q-btn.btnIcon(v-if = "$store.state.currentCallChat.stream" unelevated round color="primary" :icon="chatMic?'mic':'mic_off'"  @click="changeChatMic")
        q-space(v-if="canCall()===true")
        q-btn.btnIcon(unelevated round color="primary" icon="call" @click="acceptSingleCall" v-if="canCall()===true")
        q-btn.btnIcon(unelevated round color="primary" icon="cached" @click="zoomVideoChange" v-if="Platform.is.ios")
      q-card-section.current-video-section(v-show ="$store.state.currentCallChat.stream")
        q-item(style="display:none")
          q-item-section
            span {{addStreamCount}}
        video(ref='currentVideo' :class="ifMobileSize || $store.state.ifMobileStyle ?'full-height':'current-linkman-video'" :muted = '($refs.currentVideo && $refs.currentVideo.srcObject === $store.state.currentCallChat.streamMap[$store.state.currentCallChat.ownerPeerId]  || chatMute) ? true : false' autoplay = 'autoplay')
      q-card-section.linkman-video-section(v-if="$store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length === 1 && !Platform.is.ios")
        q-item
          q-item-section(avatar)
            q-avatar
              img(:src="Avatar($store.state.currentCallChat.subjectId)")
      q-card-section.linkman-avatar-section(v-if="$store.state.currentCallChat && !$store.state.currentCallChat.stream")
        img(:src="Avatar($store.state.currentCallChat.subjectId)")
      q-card-section.zoom-video-section(v-if="!Platform.is.ios" @click="zoomVideoChange" v-show = "$store.state.currentCallChat && $store.state.currentCallChat.stream")
        video(ref='zoomVideo' autoplay='autoplay'  :muted = '($refs.zoomVideo && $refs.zoomVideo.srcObject === $store.state.currentCallChat.streamMap[$store.state.currentCallChat.ownerPeerId] || chatMute) ? true : false')
      q-card-section.mini-btn-section(v-if = "!Platform.is.ios && $store.state.currentCallChat.stream" )
        q-btn.btnIcon(flat round color="primary" icon="remove_circle" @click="changeMiniVideoDialog")
    //group video or audio
    q-card.message-dialog-card(:class="Platform.is.ios?'ios-linkman-video':'linkman-video'" v-if="$store.state.currentCallChat && $store.state.currentCallChat.subjectType === SubjectType.GROUP_CHAT")
      q-toolbar.group-video-toolbar
        q-toolbar-title.media-timer(align="center")
          span(ref="mediaTimer")
        q-btn.btnIcon(v-if = "$store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1" unelevated round color="primary" :icon="chatMute?'volume_off':'volume_up'" @click="changeChatMute")
        q-space(v-if = "$store.state.currentCallChat.stream")
        q-btn(unelevated round color="red" icon="call_end" v-close-popup @click="closeCall")
        q-space(v-if = "$store.state.currentCallChat.stream")
        q-btn.btnIcon(v-if = "$store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1" unelevated round color="primary" :icon="chatMic?'mic':'mic_off'" @click="changeChatMic")
      q-card-section.group-video-section
        q-list.row.group-video-list(v-if="$store.state.currentCallChat && $store.state.currentCallChat.stream")
          q-item.group-video-item(:class="fullSize?'col-3':'col-6'" v-for="(memberPeerId, index) in $store.state.currentCallChat.callMessage.content" :key="index")
            q-item-section(v-if="$store.state.currentCallChat.stream" style="display:none")
              span {{$store.state.currentCallChat.stream.length}}
              span {{addStreamCount}}
            q-item-section.group-video-par(style="width:100%" v-if="$store.state.currentCallChat.callType == 'video' && ($store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId])")
              //.video-w
              video(:ref='`memberVideo${memberPeerId}`' :muted = '(memberPeerId === $store.state.currentCallChat.ownerPeerId || chatMute) ? true : false' autoplay = 'autoplay')
              //img(style="position:absolute;top:0;left:0;z-index:9;width:100%;padding:0;height:100%;" :src="$store.state.linkmanMap[memberPeerId].avatar")
            q-item-section(v-else)
              q-avatar(style = 'width:100%;height:auto;')
                img(:src="($store.state.linkmanMap[memberPeerId] && $store.state.linkmanMap[memberPeerId].avatar) ? $store.state.linkmanMap[memberPeerId].avatar : $store.defaultActiveAvatar")
              q-item(style="justify-content: center;" v-if="$store.state.currentCallChat.callType != 'video'")
                span {{getName(memberPeerId)}}
                q-icon(size="20px" name="person" :color="$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId] ? 'secondary' : 'c-grey'")
      q-card-section.mini-btn-section(v-if = "!Platform.is.ios && $store.state.currentCallChat.stream" )
        q-btn.btnIcon(flat round color="primary" icon="remove_circle" @click="changeMiniVideoDialog")
        q-btn(flat round color="primary" icon="fullscreen" @click="fullSize = true" v-if="!ifMobileSize && $store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1 && !fullSize")
        q-btn(flat round color="primary" icon="fullscreen_exit" @click="fullSize = false" v-if="!ifMobileSize && $store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1 && fullSize")

    //single audio
    q-card.message-dialog-card(:class="Platform.is.ios?'ios-linkman-video':'linkman-video'" v-if="$store.state.currentCallChat && ($store.state.currentCallChat.subjectType === SubjectType.CHAT) && $store.state.currentCallChat.callType === 'audio'")
      q-card-section.linkman-avatar-section
        img(:src="Avatar($store.state.currentCallChat.subjectId)")
        q-item-section(style="display:none")
          span {{addStreamCount}}
      q-toolbar.justify-center
        q-toolbar-title.media-timer(align="center")
          span(ref="mediaTimer")
        q-btn.btnIcon(v-if = "$store.state.currentCallChat.stream" unelevated round  color="primary" :icon="chatMute?'volume_off':'volume_up'" @click="changeChatMute")
        q-space(v-if = "$store.state.currentCallChat.stream")
        q-btn.btnIcon(unelevated round color="red" icon="call_end" v-close-popup @click="closeCall")
        q-space(v-if = "$store.state.currentCallChat.stream")
        q-btn.btnIcon(v-if = "$store.state.currentCallChat.stream"  unelevated round color="primary" :icon="chatMic?'mic':'mic_off'"  @click="changeChatMic")
        q-space(v-if="canCall()===true")
        q-btn.btnIcon(unelevated round color="primary" icon="call" @click="acceptSingleCall" v-if="canCall()===true")
      q-card-section.mini-btn-section(v-if = "!Platform.is.ios && $store.state.currentCallChat.stream" )
        q-btn.btnIcon(flat round color="primary" icon="remove_circle" @click="changeMiniVideoDialog")
</template>
<script src="./videoChat.vue.js" />
