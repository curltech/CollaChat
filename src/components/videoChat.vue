<template lang="pug">
    q-dialog.bg-c-grey-0.text-c-grey-10(v-model="$store.state.videoDialog" id='videoDialog' persistent :maximized = 'ifMobileSize || $store.state.ifMobileStyle || fullSize')
        // single video
        q-card.message-dialog-card(:class="Platform.is.ios?'ios-linkman-video':'linkman-video'" v-if="$store.state.currentCallChat && ($store.state.currentCallChat.subjectType === SubjectType.CHAT) && $store.state.currentCallChat.callType === 'video'")
            q-toolbar-title.media-timer.single-video-media-timer(v-show="!Platform.is.ios && $store.state.currentCallChat && $store.state.currentCallChat.stream")
                span.text-primary(ref="mediaTimer")
            q-card-section.row.zoom-video-section.zoom-video-section-ios(v-if="Platform.is.ios" @click="zoomVideoChange" v-show = "$store.state.currentCallChat && $store.state.currentCallChat.stream")
                .col-9
                    q-toolbar-title.ios-single-video-media-timer(v-show="$store.state.currentCallChat && $store.state.currentCallChat.stream" align="center" style="line-height:20vh;")
                        span.text-primary(ref="mediaTimer")
                .col-3
                    video(ref='zoomVideo' autoplay='autoplay' style="float:right;height:20vh;width:auto;max-width:100%;")
            q-card-section.row.zoom-video-section(@click="zoomVideoChange" v-if="!Platform.is.ios" v-show = "$store.state.currentCallChat && $store.state.currentCallChat.stream")
                video(ref='zoomVideo' autoplay='autoplay')
            q-card-section.current-video-section(:class="Platform.is.ios?'current-video-section-ios':''" v-show ="$store.state.currentCallChat.stream")
                q-item(style="display:none")
                    q-item-section
                        span {{addStreamCount}}
                video(ref='currentVideo' autoplay = 'autoplay' style='width:auto;max-width:100%;display:inline-block;')
            q-card-section.linkman-video-section(v-if="$store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length === 1")
                q-item
                    q-item-section(avatar)
                        q-avatar
                            img(:src="Avatar($store.state.currentCallChat.subjectId)")
            q-card-section.linkman-avatar-section(v-if="$store.state.currentCallChat && !$store.state.currentCallChat.stream")
                img(:src="Avatar($store.state.currentCallChat.subjectId)")
            q-card-section.mini-btn-section(v-if = "!Platform.is.ios && $store.state.currentCallChat.stream" )
                q-btn.text-primary(flat round icon="close_fullscreen" @click="changeMiniVideoDialog")
            q-card-section.call-pending-section(v-if = '$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId] && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId].pending')
                q-spinner-dots(size="2rem")
            q-toolbar.linkman-video-toolbar.justify-center
                q-btn.text-primary(v-if = "(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream" unelevated round :icon="audioToggle === 'speaker'?'volume_up':'volume_off'" color='primary' @click="changeAudioToggle")
                q-btn.text-primary(v-if = "!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream" unelevated round :icon="chatMute?'volume_off':'volume_up'" color='primary' @click="changeChatMute")
                q-space(v-if = "$store.state.currentCallChat.stream")
                q-btn(unelevated round color="red" icon="call_end" @click="closeCall")
                q-space(v-if = "(canCall()===true) || $store.state.currentCallChat.stream")
                q-btn.text-primary(v-if = "$store.state.currentCallChat.stream" unelevated round color="primary" :icon="chatMic?'mic':'mic_off'"  @click="changeChatMic")
                q-btn.text-primary(unelevated round icon="call"  color="primary" @click="acceptSingleCall" v-if="canCall()===true")
        // group video or audio
        q-card.message-dialog-card(v-if="$store.state.currentCallChat && $store.state.currentCallChat.subjectType === SubjectType.GROUP_CHAT")
            q-card-section.group-video-section
                q-toolbar-title.media-timer-group(v-show="!Platform.is.ios || $store.state.currentCallChat.callType == 'audio'")
                    span.text-primary(ref="mediaTimer")
                // ios-video
                q-card(flat v-if="Platform.is.ios && $store.state.currentCallChat.callType == 'video' && $store.state.currentCallChat && $store.state.currentCallChat.stream")
                    q-card-section.row.zoom-video-section.zoom-video-section-ios(v-show = "$store.state.currentCallChat && $store.state.currentCallChat.stream")
                        .col-9
                            q-toolbar-title.media-timer-ios-group
                                span.text-primary(ref="mediaTimer")
                            div.scroll(style="height:17vh;width:74vw;")
                                q-list(v-if="$store.state.currentCallChat")
                                    template(v-for="(memberPeerId, index) in $store.state.currentCallChat.callMessage.content")
                                        q-item.text-c-grey-10(clickable v-ripple @click="iosGroupVideoFocus(index)" :class="index === 0 ? 'q-pt-none' : ''")
                                            q-item-section(avatar)
                                                q-avatar
                                                    img(:src="Avatar(memberPeerId)" style="width:35px;height:35px")
                                            q-item-section(style='text-align:left')
                                                q-item-label(lines="1") {{ getName(memberPeerId) }}
                                            q-item-section(side style="padding-left:0px")
                                                q-icon(name="videocam" color="secondary" v-if="groupFocusNum === index && $store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId]")
                                                q-icon(name="person" v-else :color="($store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId]) ? 'secondary' : 'c-grey'")
                            //q-btn.text-primary(unelevated round  style="padding-top:5px;padding-left:10px"  icon="cached" @click="iosGroupVideoFocus" v-if="$store.state.currentCallChat.stream")
                            //q-toolbar-title(align="center" class="text-c-grey-10") {{`${groupFocusNum}/${$store.state.currentCallChat.callMessage.content.length}`}}
                        .col-3
                            video(ref='zoomVideo' autoplay='autoplay' style="float:right;height:20vh;width:auto;max-width:100%;")
                    q-card-section.current-video-section.current-video-section-ios(v-show ="$store.state.currentCallChat.stream")
                        q-list.row.group-video-list(v-if="$store.state.currentCallChat && $store.state.currentCallChat.stream")
                            template(v-for="(memberPeerId, index) in $store.state.currentCallChat.callMessage.content")
                                q-item(v-if="groupFocusNum === index" style='padding:0;width:100%')
                                    q-item-section(v-if="$store.state.currentCallChat.stream" style="display:none")
                                        span {{$store.state.currentCallChat.stream.length}}
                                        span {{addStreamCount}}
                                        span {{index}}
                                    q-item-section(v-if="$store.state.currentCallChat.streamMap && !$store.state.currentCallChat.streamMap[memberPeerId]" )
                                        q-avatar(style = 'width:50vw;height:auto;padding-top:30px;margin-left:25vw' align='center')
                                            img(:src="($store.state.linkmanMap[memberPeerId] && $store.state.linkmanMap[memberPeerId].avatar) ? $store.state.linkmanMap[memberPeerId].avatar : $store.defaultActiveAvatar")
                                    q-item-section(style='margin:0;padding:0;width:100%;text-align:center;' v-if="$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId]")
                                        video(:ref='`memberVideo${memberPeerId}`' autoplay = 'autoplay' style="width:auto;display:inline-block;max-width:100%;")
                q-list.scroll.row.group-video-list(style="max-height:80vh" v-if="(!Platform.is.ios || Platform.is.ios && $store.state.currentCallChat.callType == 'audio')  && $store.state.currentCallChat && $store.state.currentCallChat.stream")
                    template(v-for="(memberPeerId, index) in $store.state.currentCallChat.callMessage.content")
                        q-item.group-video-item(:class="fullSize?'col-3':'col-6'")
                            q-item-section(v-if="$store.state.currentCallChat.stream" style="display:none")
                                span {{$store.state.currentCallChat.stream.length}}
                                span {{addStreamCount}}
                            q-item-section.group-video-par(style="width:100%" v-if="$store.state.currentCallChat.callType == 'video' && ($store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId]) && !Platform.is.ios")
                                video.groupVideo(:ref='`memberVideo${memberPeerId}`' @canplay="groupVideoOnplay" autoplay = 'autoplay')
                                //video.groupVideo(:ref='`memberVideo${memberPeerId}`' autoplay = 'autoplay')
                                //video(:ref='`memberVideo${memberPeerId}`' autoplay = 'autoplay')
                            q-item-section.group-video-par-else(v-else)
                                q-avatar(style = 'width:100%;height:auto;')
                                    img(:src="($store.state.linkmanMap[memberPeerId] && $store.state.linkmanMap[memberPeerId].avatar) ? $store.state.linkmanMap[memberPeerId].avatar : $store.defaultActiveAvatar"  @click="iosGroupVideoFocus")
                                q-item(style="justify-content: center;" v-if="$store.state.currentCallChat.callType != 'video'")
                                    span {{getName(memberPeerId)}}
                                    q-icon(size="20px" name="person" :color="$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId] ? 'secondary' : 'c-grey'")
                            q-item-section.call-pending-section(v-if = '$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId] && $store.state.currentCallChat.streamMap[memberPeerId].pending')
                                q-spinner-dots(size="2rem")
                        q-separator.c-separator-message(style="height:1px;margin-left:0px;margin-right:0px" v-if="index %2 !== 0")
            q-card-section.mini-btn-section.group-video-mini-btn.row(v-if = "(!Platform.is.ios || $store.state.currentCallChat.callType == 'audio') && $store.state.currentCallChat.stream")
                //.col-2
                q-btn.text-primary(flat round icon="close_fullscreen" style="font-size:12px" @click="changeMiniVideoDialog")
                    //q-btn(flat round color="primary" icon="fullscreen" @click="fullSize = true" v-if="!ifMobileSize && $store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1 && !fullSize")
                    //q-btn(flat round color="primary" icon="fullscreen_exit" @click="fullSize = false" v-if="!ifMobileSize && $store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1 && fullSize")
                //.col-10
            q-toolbar.group-video-toolbar.pc-group-video-toolbar
                q-btn.text-primary(v-if = "(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1" unelevated round :icon="audioToggle === 'speaker'?'volume_up':'volume_off'" color='primary' @click="changeAudioToggle")
                q-btn.text-primary(v-if = "!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1" color="primary" unelevated round :icon="chatMute?'volume_off':'volume_up'" @click="changeChatMute")
                q-space(v-if = "$store.state.currentCallChat.stream")
                q-btn(unelevated round color="red" icon="call_end" v-close-popup @click="closeCall")
                q-space(v-if = "(canCall()===true) || $store.state.currentCallChat.stream")
                q-btn.text-primary(v-if = "$store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1" unelevated round  color="primary" :icon="chatMic?'mic':'mic_off'" @click="changeChatMic")
        // single audio
        q-card.message-dialog-card(:class="Platform.is.ios?'ios-linkman-video':'linkman-video'" v-if="$store.state.currentCallChat && ($store.state.currentCallChat.subjectType === SubjectType.CHAT) && $store.state.currentCallChat.callType === 'audio'")
            q-toolbar(v-show='$store.state.currentCallChat && $store.state.currentCallChat.stream')
                q-toolbar-title.media-timer.single-video-media-timer
                    span.text-primary(ref="mediaTimer")
            q-card-section.linkman-avatar-section
                img(:src="Avatar($store.state.currentCallChat.subjectId)")
                q-item-section(style="display:none")
                    span {{addStreamCount}}
            q-toolbar.single-audio-toolbar.justify-center
                q-btn.text-primary(v-if = "(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream" unelevated round :icon="audioToggle === 'speaker'?'volume_up':'volume_off'" color='primary' @click="changeAudioToggle")
                q-btn.text-primary(v-if = "!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream" unelevated round :icon="chatMute?'volume_off':'volume_up'" color='primary' @click="changeChatMute")
                q-space(v-if = "$store.state.currentCallChat.stream")
                q-btn(unelevated round color="red" icon="call_end" v-close-popup @click="closeCall")
                q-space(v-if = "(canCall()===true) || $store.state.currentCallChat.stream")
                q-btn.text-primary(v-if = "$store.state.currentCallChat.stream"  unelevated round color="primary" :icon="chatMic?'mic':'mic_off'"  @click="changeChatMic")
                q-btn.text-primary(unelevated round icon="call" @click="acceptSingleCall" color="primary" v-if="canCall()===true")
            q-card-section.mini-btn-section.mini-single-audio-btn-section(v-if = "$store.state.currentCallChat.stream")
                q-btn.text-primary(flat round icon="close_fullscreen" @click="changeMiniVideoDialog")
            q-card-section.call-pending-section(v-if = '$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId] && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId].pending')
                q-spinner-dots(size="2rem")
</template>
<script src="./videoChat.vue.js" />
