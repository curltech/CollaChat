<template lang="pug">
    q-dialog.bg-c-grey-0.text-c-grey-10(v-model="$store.state.videoDialog" id='videoDialog' persistent :maximized = 'ifMobileSize || $store.state.ifMobileStyle || fullSize')
        //single video
        q-card.message-dialog-card(:class="dialogSizeClass" v-if="$store.state.currentCallChat && ($store.state.currentCallChat.subjectType === SubjectType.CHAT) && $store.state.currentCallChat.callType === 'video'")
            q-card-section.current-video-section(v-show ="$store.state.currentCallChat.stream")
                q-item(style="display:none")
                    q-item-section
                        span {{addStreamCount}}
                video(ref='currentVideo' autoplay = 'autoplay')
            q-card-section.linkman-video-section(v-if="$store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length === 1 && !Platform.is.ios")
                q-item
                    q-item-section(avatar)
                        q-avatar
                            img(:src="Avatar($store.state.currentCallChat.subjectId)")
            q-card-section.linkman-avatar-section(v-if="$store.state.currentCallChat && !$store.state.currentCallChat.stream")
                img(:src="Avatar($store.state.currentCallChat.subjectId)")
            q-card-section.zoom-video-section(v-if="!Platform.is.ios" @click="zoomVideoChange" v-show = "$store.state.currentCallChat && $store.state.currentCallChat.stream")
                video(ref='zoomVideo' autoplay='autoplay')
            q-card-section.mini-btn-section(v-if = "!Platform.is.ios && $store.state.currentCallChat.stream" )
                q-btn.btnIcon(flat round color="primary" icon="remove_circle" @click="changeMiniVideoDialog")
            q-card-section.call-pending-section(v-if = '$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId] && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId].pending')
                q-spinner-dots(size="2rem")
            q-toolbar.linkman-video-toolbar.justify-center
                q-toolbar-title.media-timer(:class="Platform.is.ios?'':'text-white'" align="center")
                    span(ref="mediaTimer")
                q-btn.btnIcon(unelevated round color="primary" icon="cached" @click="zoomVideoChange" v-if="Platform.is.ios && $store.state.currentCallChat.stream")
                q-btn.btnIcon(v-if = " $store.state.currentCallChat.stream && (Platform.is.android || showMore)" unelevated round color="primary" :icon="audioToggle === 'speaker'?'volume_off':'volume_up'" @click="changeAudioToggle")
                q-btn.btnIcon(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream) ||((ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && showMore)" unelevated round color="primary" :icon="chatMute?'volume_off':'volume_up'" @click="changeChatMute")
                q-space(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle)&& !(canCall()===true)) || $store.state.currentCallChat.stream")
                q-btn.btnIcon(unelevated round color="red" icon="call_end" @click="closeCall")
                q-space
                q-btn.btnIcon(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream) ||((ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && showMore)" unelevated round color="primary" :icon="chatMic?'mic':'mic_off'"  @click="changeChatMic")
                q-btn.btnIcon(unelevated round color="primary" icon="call" @click="acceptSingleCall" v-if="canCall()===true")
                q-space(v-if="$store.state.currentCallChat && !$store.state.currentCallChat.stream && (ifMobileSize || $store.state.ifMobileStyle)")
                q-btn.btnIcon(unelevated round color="primary" icon="more_horiz" @click="showMoreChange" v-if="ifMobileSize || $store.state.ifMobileStyle")
        //group video or audio
        q-card.message-dialog-card(:class="Platform.is.ios?'ios-linkman-video':'linkman-video'" v-if="$store.state.currentCallChat && $store.state.currentCallChat.subjectType === SubjectType.GROUP_CHAT")
            q-toolbar.group-video-toolbar
                q-toolbar-title.media-timer(align="center")
                    span(ref="mediaTimer")
                q-btn.btnIcon(v-if = "(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1" unelevated round color="primary" :icon="audioToggle === 'speaker'?'volume_off':'volume_up'" @click="changeAudioToggle")
                q-btn.btnIcon(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1) ||((ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1 && showMore)" unelevated round color="primary" :icon="chatMute?'volume_off':'volume_up'" @click="changeChatMute")
                q-space(v-if = "!(ifMobileSize || $store.state.ifMobileStyle) || ($store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1)")
                q-btn(unelevated round color="red" icon="call_end" v-close-popup @click="closeCall")
                q-space
                q-btn.btnIcon(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1) ||((ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1 && showMore)" unelevated round color="primary" :icon="chatMic?'mic':'mic_off'" @click="changeChatMic")
                q-btn.btnIcon(unelevated round color="primary" icon="more_horiz" @click="showMoreChange" v-if="ifMobileSize || $store.state.ifMobileStyle")
            q-card-section.group-video-section
                q-list.row.group-video-list(v-if="$store.state.currentCallChat && $store.state.currentCallChat.stream")
                    template(v-for="(memberPeerId, index) in $store.state.currentCallChat.callMessage.content")
                        q-item.group-video-item(:class="fullSize?'col-3':'col-6'" )
                            q-item-section(v-if="$store.state.currentCallChat.stream" style="display:none")
                                span {{$store.state.currentCallChat.stream.length}}
                                span {{addStreamCount}}
                            q-item-section.group-video-par(style="width:100%" v-if="$store.state.currentCallChat.callType == 'video' && ($store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId])")
                                video(:ref='`memberVideo${memberPeerId}`' autoplay = 'autoplay')
                            q-item-section(v-else)
                                q-avatar(style = 'width:100%;height:auto;')
                                    img(:src="($store.state.linkmanMap[memberPeerId] && $store.state.linkmanMap[memberPeerId].avatar) ? $store.state.linkmanMap[memberPeerId].avatar : $store.defaultActiveAvatar")
                                q-item(style="justify-content: center;" v-if="$store.state.currentCallChat.callType != 'video'")
                                    span {{getName(memberPeerId)}}
                                    q-icon(size="20px" name="person" :color="$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId] ? 'secondary' : 'c-grey'")
                            q-item-section.call-pending-section(v-if = '$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId] && $store.state.currentCallChat.streamMap[memberPeerId].pending')
                                q-spinner-dots(size="2rem")
                        q-separator.c-separator-message(style="height:1px;margin-left:0px;margin-right:0px" v-if="index %2 !== 0") 
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
                q-btn.btnIcon(v-if = "(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream" unelevated round color="primary" :icon="audioToggle === 'speaker'?'volume_off':'volume_up'" @click="changeAudioToggle")
                q-btn.btnIcon(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream) ||((ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && showMore)" unelevated round  color="primary" :icon="chatMute?'volume_off':'volume_up'" @click="changeChatMute")
                q-space(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle)&& !(canCall()===true)) || $store.state.currentCallChat.stream")
                q-btn.btnIcon(unelevated round color="red" icon="call_end" v-close-popup @click="closeCall")
                q-space
                q-btn.btnIcon(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream) ||((ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && showMore)"  unelevated round color="primary" :icon="chatMic?'mic':'mic_off'"  @click="changeChatMic")
                q-btn.btnIcon(unelevated round color="primary" icon="call" @click="acceptSingleCall" v-if="canCall()===true")
                q-space(v-if="$store.state.currentCallChat && !$store.state.currentCallChat.stream && (ifMobileSize || $store.state.ifMobileStyle)")
                q-btn.btnIcon(unelevated round color="primary" icon="more_horiz" @click="showMoreChange" v-if="ifMobileSize || $store.state.ifMobileStyle")
            q-card-section.mini-btn-section(v-if = "!Platform.is.ios && $store.state.currentCallChat.stream" )
                q-btn.btnIcon(flat round color="primary" icon="remove_circle" @click="changeMiniVideoDialog")
            q-card-section.call-pending-section(v-if = '$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId] && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId].pending')
                q-spinner-dots(size="2rem")
</template>
<script src="./videoChat.vue.js" />
