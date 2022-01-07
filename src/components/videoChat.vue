<template lang="pug">
    q-dialog.bg-c-grey-0.text-c-grey-10(v-model="$store.state.videoDialog" id='videoDialog' persistent :maximized = 'ifMobileSize || $store.state.ifMobileStyle || fullSize')
        //single video
        q-card.message-dialog-card(:class="dialogSizeClass" v-if="$store.state.currentCallChat && ($store.state.currentCallChat.subjectType === SubjectType.CHAT) && $store.state.currentCallChat.callType === 'video'")
            q-card-section.row.zoom-video-section.zoom-video-section-ios( v-if="Platform.is.ios" @click="zoomVideoChange" v-show = "$store.state.currentCallChat && $store.state.currentCallChat.stream")
                .col-6
                    q-btn.text-primary(unelevated round icon="cached" style="margin-top:5px" v-if="$store.state.currentCallChat.stream")
                .col-6
                    video(ref='zoomVideo' autoplay='autoplay' style="float:right;height:20vh;")
            q-card-section.row.zoom-video-section(@click="zoomVideoChange" v-if="!Platform.is.ios" v-show = "$store.state.currentCallChat && $store.state.currentCallChat.stream")
                    video(ref='zoomVideo' autoplay='autoplay')
            q-card-section.current-video-section.current-video-section-ios(v-show ="$store.state.currentCallChat.stream")
                q-item(style="display:none")
                    q-item-section
                        span {{addStreamCount}}
                video(ref='currentVideo' autoplay = 'autoplay')
            q-card-section.linkman-video-section(v-if="$store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length === 1")
                q-item
                    q-item-section(avatar)
                        q-avatar
                            img(:src="Avatar($store.state.currentCallChat.subjectId)")
            q-card-section.linkman-avatar-section(v-if="$store.state.currentCallChat && !$store.state.currentCallChat.stream")
                img(:src="Avatar($store.state.currentCallChat.subjectId)")
            q-card-section.mini-btn-section(v-if = "!Platform.is.ios && $store.state.currentCallChat.stream" )
                q-btn.text-primary(flat round icon="remove_circle" @click="changeMiniVideoDialog")
            q-card-section.call-pending-section(v-if = '$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId] && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId].pending')
                q-spinner-dots(size="2rem")
            q-toolbar.linkman-video-toolbar.justify-center
                q-toolbar-title.media-timer(:class="Platform.is.ios?'media-timer-ios-group':'text-white'" align="center")
                    span(ref="mediaTimer")
                q-fab(color="primary" push :icon="chatMute ?'volume_off':(audioToggle === 'speaker'?'speaker':'volume_up')" v-if = "(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream" direction="right" padding="xs")
                    q-fab-action(color="primary" @click="changeDropdownChatMute('mute')" icon="volume_off")
                    q-fab-action(color="primary" @click="changeDropdownChatMute('speaker')" icon="speaker")
                    q-fab-action(color="primary" @click="changeDropdownChatMute('earpiece')" icon="volume_up")
                q-btn.text-primary(v-if = "!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream" unelevated round :icon="chatMute?'volume_off':'volume_up'" color='primary' @click="changeChatMute")
                q-space(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle)&& !(canCall()===true)) || $store.state.currentCallChat.stream")
                q-btn(unelevated round color="red" icon="call_end" @click="closeCall")
                q-space
                q-btn.text-primary(v-if = "$store.state.currentCallChat.stream" unelevated round color="primary" :icon="chatMic?'mic':'mic_off'"  @click="changeChatMic")
                q-btn.text-primary(unelevated round icon="call"  color="primary" @click="acceptSingleCall" v-if="canCall()===true")
        //group video or audio
        q-card.message-dialog-card(v-if="$store.state.currentCallChat && $store.state.currentCallChat.subjectType === SubjectType.GROUP_CHAT")
            q-card-section.group-video-section
                //ios-video
                q-card(v-if="Platform.is.ios && $store.state.currentCallChat.callType == 'video' && $store.state.currentCallChat && $store.state.currentCallChat.stream")
                    q-card-section.row.zoom-video-section.zoom-video-section-ios(v-show = "$store.state.currentCallChat && $store.state.currentCallChat.stream")
                        .col-6
                            q-btn.text-primary(unelevated round  style="padding-top:5px;padding-left:10px"  icon="cached" @click="iosGroupVideoFocus" v-if="$store.state.currentCallChat.stream")
                            q-toolbar-title(align="center" class="text-c-grey-10") {{`${groupFocusNum}/${$store.state.currentCallChat.callMessage.content.length}`}}
                        .col-6
                            video(ref='zoomVideo' autoplay='autoplay' style="float:right;height:20vh")
                    q-card-section.current-video-section.current-video-section-ios(v-show ="$store.state.currentCallChat.stream")
                        q-list.row.group-video-list(v-if="$store.state.currentCallChat && $store.state.currentCallChat.stream")
                            template(v-for="(memberPeerId, index) in $store.state.currentCallChat.callMessage.content")
                                q-item(v-if="groupFocusNum === index + 1" style='padding:0;width:100%')
                                    q-item-section(v-if="$store.state.currentCallChat.stream" style="display:none")
                                        span {{$store.state.currentCallChat.stream.length}}
                                        span {{addStreamCount}}
                                        span {{index}}
                                    q-item-section(v-if="$store.state.currentCallChat.streamMap && !$store.state.currentCallChat.streamMap[memberPeerId]" )
                                        q-avatar(style = 'width:50vw;height:auto;padding-top:30px;margin-left:25vw' align='center')
                                            img(:src="($store.state.linkmanMap[memberPeerId] && $store.state.linkmanMap[memberPeerId].avatar) ? $store.state.linkmanMap[memberPeerId].avatar : $store.defaultActiveAvatar")
                                    q-item-section(style='margin:0;padding:0;width:100%' v-if="$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId]")
                                        video(:ref='`memberVideo${memberPeerId}`' autoplay = 'autoplay')
                q-list.row.group-video-list(v-if="(!Platform.is.ios || Platform.is.ios && $store.state.currentCallChat.callType == 'audio')  && $store.state.currentCallChat && $store.state.currentCallChat.stream")
                    template(v-for="(memberPeerId, index) in $store.state.currentCallChat.callMessage.content")
                        q-item.group-video-item(:class="fullSize?'col-3':'col-6'")
                            q-item-section(v-if="$store.state.currentCallChat.stream" style="display:none")
                                span {{$store.state.currentCallChat.stream.length}}
                                span {{addStreamCount}}
                            q-item-section.group-video-par(style="width:100%" v-if="$store.state.currentCallChat.callType == 'video' && ($store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId]) && !Platform.is.ios")
                                video(:ref='`memberVideo${memberPeerId}`' autoplay = 'autoplay')
                            q-item-section(v-else)
                                q-avatar(style = 'width:100%;height:auto;')
                                    img(:src="($store.state.linkmanMap[memberPeerId] && $store.state.linkmanMap[memberPeerId].avatar) ? $store.state.linkmanMap[memberPeerId].avatar : $store.defaultActiveAvatar"  @click="iosGroupVideoFocus")
                                q-item(style="justify-content: center;" v-if="$store.state.currentCallChat.callType != 'video'")
                                    span {{getName(memberPeerId)}}
                                    q-icon(size="20px" name="person" :color="$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId] ? 'secondary' : 'c-grey'")
                            q-item-section.call-pending-section(v-if = '$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId] && $store.state.currentCallChat.streamMap[memberPeerId].pending')
                                q-spinner-dots(size="2rem")
                            q-item-section(v-if="Platform.is.ios && $store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[memberPeerId] && $store.state.currentCallChat.streamMap[memberPeerId].focus" style="position:fixed;width:100vw;z-index:99;height:100vh;background:#FFF;left:0;")
                                q-btn.text-primary(flat round icon="remove_circle" @click="iosGroupVideoFocus")
                                video(:ref='`memberVideo${memberPeerId}`' autoplay = 'autoplay' style="height:92vh")
                        q-separator.c-separator-message(style="height:1px;margin-left:0px;margin-right:0px" v-if="index %2 !== 0") 
            q-card-section.mini-btn-section(v-if = "!Platform.is.ios && $store.state.currentCallChat.stream" )
                q-btn.text-primary(flat round icon="remove_circle" @click="changeMiniVideoDialog")
                q-btn(flat round color="primary" icon="fullscreen" @click="fullSize = true" v-if="!ifMobileSize && $store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1 && !fullSize")
                q-btn(flat round color="primary" icon="fullscreen_exit" @click="fullSize = false" v-if="!ifMobileSize && $store.state.currentCallChat && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1 && fullSize")
            q-toolbar.group-video-toolbar.pc-group-video-toolbar
                q-toolbar-title.media-timer(:class="Platform.is.ios?'media-timer-ios-group':''" align="center")
                    span(ref="mediaTimer")
                q-btn.text-primary(v-if = "!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1" unelevated round :icon="audioToggle === 'speaker'?'volume_off':'volume_up'" @click="changeAudioToggle")
                q-fab(color="primary" push :icon="chatMute ?'volume_off':(audioToggle === 'speaker'?'speaker':'volume_up')" v-if = "(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1 " direction="right" padding="xs")
                    q-fab-action(color="primary" @click="changeDropdownChatMute('mute')" icon="volume_off")
                    q-fab-action(color="primary" @click="changeDropdownChatMute('speaker')" icon="speaker")
                    q-fab-action(color="primary" @click="changeDropdownChatMute('earpiece')" icon="volume_up")
                q-btn.text-primary(v-if = "!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1" color="primary" unelevated round :icon="chatMute?'volume_off':'volume_up'" @click="changeChatMute")
                q-space(v-if = "(ifMobileSize || $store.state.ifMobileStyle) || ($store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1)")
                q-btn(unelevated round color="red" icon="call_end" v-close-popup @click="closeCall")
                q-space
                q-btn.text-primary(v-if = "$store.state.currentCallChat.stream && $store.state.currentCallChat.stream.length > 1" unelevated round  color="primary" :icon="chatMic?'mic':'mic_off'" @click="changeChatMic")
        //single audio
        q-card.message-dialog-card(:class="Platform.is.ios?'ios-linkman-video':'linkman-video'" v-if="$store.state.currentCallChat && ($store.state.currentCallChat.subjectType === SubjectType.CHAT) && $store.state.currentCallChat.callType === 'audio'")
            q-card-section.linkman-avatar-section
                img(:src="Avatar($store.state.currentCallChat.subjectId)")
                q-item-section(style="display:none")
                    span {{addStreamCount}}
            q-toolbar.justify-center
                q-toolbar-title.media-timer(align="center")
                    span(ref="mediaTimer")
                q-btn.text-primary(v-if = "(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream   && !Platform.is.android" unelevated round :icon="audioToggle === 'speaker'?'volume_off':'volume_up'" @click="changeAudioToggle")
                q-btn-dropdown.text-primary.chatmute-dropdown(:icon="chatMute?'volume_off':'volume_up'" v-if = "Platform.is.android && $store.state.currentCallChat.stream" style ='width:10vw')
                    q-list
                        q-item( clickable v-close-popup @click="changeDropdownChatMute('mute')")
                            q-item-section
                                q-item-label {{$t('Mute')}}
                        q-item(clickable v-close-popup @click="changeDropdownChatMute('earpiece')")
                            q-item-section
                                q-item-label {{$t('Earphone')}}
                        q-item(clickable v-close-popup @click="changeDropdownChatMute('speaker')")
                            q-item-section
                                q-item-label {{$t('Microphone')}}
                q-btn.text-primary(v-if = "!(ifMobileSize || $store.state.ifMobileStyle) && $store.state.currentCallChat.stream" unelevated round :icon="chatMute?'volume_off':'volume_up'" @click="changeChatMute")
                q-space(v-if = "(!(ifMobileSize || $store.state.ifMobileStyle)&& !(canCall()===true)) || $store.state.currentCallChat.stream")
                q-btn(unelevated round color="red" icon="call_end" v-close-popup @click="closeCall")
                q-space
                q-btn.text-primary(v-if = "$store.state.currentCallChat.stream"  unelevated round color="primary" :icon="chatMic?'mic':'mic_off'"  @click="changeChatMic")
                q-btn.text-primary(unelevated round icon="call" @click="acceptSingleCall" v-if="canCall()===true")
                q-space(v-if="$store.state.currentCallChat && !$store.state.currentCallChat.stream && (ifMobileSize || $store.state.ifMobileStyle)")
            q-card-section.mini-btn-section(v-if = "!Platform.is.ios && $store.state.currentCallChat.stream" )
                q-btn.text-primary(flat round icon="remove_circle" @click="changeMiniVideoDialog")
            q-card-section.call-pending-section(v-if = '$store.state.currentCallChat.streamMap && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId] && $store.state.currentCallChat.streamMap[$store.state.currentCallChat.subjectId].pending')
                q-spinner-dots(size="2rem")
</template>
<script src="./videoChat.vue.js" />
