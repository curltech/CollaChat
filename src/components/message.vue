<template lang="pug">
  div.bg-c-grey-0.drawHeightStyle(v-if="$store.state.currentChat")
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(name="default" style="padding:0px 0px")
        q-toolbar.header-toolbar.bg-c-grey-message(:class="$store.state.currentChat.subjectId ? '' : 'hidden'")
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round icon="keyboard_arrow_left" @click="messageBack")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{ ChatTitle($store.state.currentChat) }}
          q-btn.text-primary(flat round icon="more_horiz" @click="enterDetail")
        q-separator.c-separator-message.header-mar-top(style="height:1px;margin-left:0px;margin-right:0px")
        #talk.q-pa-md.bg-c-grey-message.row.justify-center.scroll.q-chat-message(:class=" !$store.ifMobile() && !(ifMobileSize || $store.state.ifMobileStyle) ? 'talk-height-pc' :(ifMobileSize ? 'talk-height-mobileSize2' : (keyboardMode ==='keyboard' ? 'talk-height-mobileStyle1':(keyboardMode ==='moreHalf'  ? 'talk-height-mobileStyle3' : 'talk-height-mobileStyle2') ))")
          q-infinite-scroll(style="width:100%" @load="load_message" reverse debounce="500" :offset="250")
            template(slot="loading")
              .row.justify-center.q-my-md
                q-spinner(color="primary" name="dots" size="40px")
            q-chat-message(v-if="$store.state.currentChat && $store.state.currentChat.noMoreMessageTag" @touchstart="preventDefault" :label="$t('No more messages')")
            template(v-for="(message,index) in $store.state.currentChat.messages")
              div.chat-message(:class="messageMultiSelectMode?'message_multiselect_checkboxwrap':''")
                q-checkbox.message_multiselect_checkbox(dense v-model="messageMultiSelectedVal" v-if='message.messageType === P2pChatMessageType.CHAT_LINKMAN && messageMultiSelectMode' :val="message")
                messageContent(v-if='message.messageType === P2pChatMessageType.CHAT_LINKMAN || (message.messageType === P2pChatMessageType.CALL_REQUEST && message.contentType !== ChatContentType.CALL_JOIN_REQUEST)' v-bind:message = "message" entry = "message" v-bind:showContacts='showContacts')
                q-menu(touch-position context-menu v-if='message.messageType === P2pChatMessageType.CHAT_LINKMAN && message.status === ChatMessageStatus.NORMAL')
                  q-list(dense style="min-width: 100px")
                    q-item(v-if='message.contentType === ChatContentType.TEXT && !message.countDown' clickable @click="copyMessage(message,index)" v-close-popup)
                      q-item-section {{$t('Copy')}}
                    q-item(clickable @click="deleteMessage(message,index)" v-close-popup)
                      q-item-section {{$t('Delete')}}
                    q-item(clickable v-if="!isRecallTimeLimit(message)" @click="recallMessage(message,index)" v-close-popup)
                      q-item-section {{$t('Recall')}}
                    q-item(clickable v-if='!message.countDown' @click="forwardMessage([message])" v-close-popup)
                      q-item-section {{$t('Forward')}}
                    q-item(clickable v-if='!message.countDown' @click="collectMessage(message, index)" v-close-popup)
                      q-item-section {{$t('Collection')}}
                    q-item(v-if='message.contentType === ChatContentType.TEXT && !message.countDown' clickable @click="quoteMessage(message,index)" v-close-popup)
                      q-item-section {{$t('Quote')}}
                    q-item(clickable v-if='!message.countDown' @click="openMessageMultiSelect" v-close-popup)
                      q-item-section {{$t('MultiSelect')}}
                q-chat-message(v-if='message.messageType === P2pChatMessageType.CHAT_SYS && message.contentType === ChatContentType.EVENT' :label="detailDateFormat(message.createDate)+'</br>'+ message.content")
                q-chat-message(v-if='message.messageType === P2pChatMessageType.CHAT_SYS && message.contentType === ChatContentType.TIME' :label="detailDateFormat(message.content)")
        .message-editor-wrap(:class="$store.ifMobile() || (ifMobileSize || $store.state.ifMobileStyle) ? 'bg-c-grey-message-editor' : 'bg-c-grey-message-editor-pc'")
          .message-editor-area
            q-toolbar.row(style="height:40px;min-height:40px" v-if="!$store.ifMobile() && !(ifMobileSize || $store.state.ifMobileStyle) && !messageMultiSelectMode")
              q-btn.text-primary.q-mr-sm(round flat icon="alarm" :disable ='!(!ifSelfChat && $store.state.currentChat && $store.state.currentChat.subjectType === SubjectType.CHAT)' @click='destroyClock = true')
                q-popup-edit(v-model="destroyClock" content-class="" style='width:100px')
                  q-option-group(:options="clockOptions" label="Notifications" type="radio" v-model="$store.state.currentChat.destroyTime")
              q-btn.text-primary.q-mr-sm(round flat icon="insert_emoticon" @click="switchEmoji")
              div(v-if="emojiShow" @mouseleave = 'emojiPickerBlur')
                vEmojiPicker.bg-c-grey-0.emoji-dialog#emojiPicker(@select="selectEmoji")
              q-btn.text-primary.q-mr-sm(round flat icon="videocam" :disable="ifSelfChat" @click="initiateCallRequest('video')")
              q-btn.text-primary.q-mr-sm(round flat icon="call" :disable="ifSelfChat" @click="initiateCallRequest('audio')")
              q-btn.text-primary.q-mr-sm(round flat icon="mic" @click="capture('audio')")
              q-btn.text-primary.q-mr-sm(round flat icon="camera" @click="capture('video')")
              q-btn.text-primary.q-mr-sm(round flat icon="bookmarks" @click="openCollection")
              q-btn.text-primary.q-mr-sm(round flat icon="account_box" @click="selectLinkmanCard")
              q-btn.text-primary.q-mr-sm(round flat icon="folder" @click="$refs.messageUpload.pickFiles()")
            q-toolbar.message-operate-wrap(v-if='messageMultiSelectMode' :class = '$store.ifMobile() || (ifMobileSize || $store.state.ifMobileStyle) ? "message-operate-wrap-mobile" : "message-operate-wrap-pc"')
              q-btn-group.full-width(flat spread stretch)
                q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('Forward')" icon="forward" @click="multiForwardMessage('single')")
                q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('MultiForward')" icon="forward" @click="multiForwardMessage('multi')")
                q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('MultiCollection')" icon="bookmarks" @click="multiCollectionMessage()")
                q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('Cancel')" icon="cancel" @click="cancelMessageMultiSelect")
            q-toolbar.message-operate-wrap(v-if="!messageMultiSelectMode" :class = '$store.ifMobile() || (ifMobileSize || $store.state.ifMobileStyle) ? "message-operate-wrap-mobile" : "message-operate-wrap-pc"')
              q-btn.text-primary(v-if="$store.ifMobile() || (ifMobileSize || $store.state.ifMobileStyle)" round flat icon ='add_circle_outline' @click = "more")
              q-input.c-field.message-editor(type='textarea' autogrow ref='editor' rows='1' filled input-style='resize:none;max-height:98px;line-height:30px;' name="editor" id="editor" v-model= '$store.state.currentChat.tempText' :class = '$store.ifMobile() || (ifMobileSize || $store.state.ifMobileStyle) ? "message-editor-mobile" : "message-editor-pc"'
                @keyup="editorKeyup" @focus="editorFocus" @blur="editorBlur" @paste="editorPaste" @drop="editorDrop")
              q-btn.text-primary(v-if="$store.ifMobile() || (ifMobileSize || $store.state.ifMobileStyle)" round flat icon="send" @click = "preSend")
            q-toolbar.no-padding(style='flex-wrap:wrap' v-if="($store.ifMobile() || (ifMobileSize || $store.state.ifMobileStyle)) && keyboardMode === 'more' && !messageMultiSelectMode")
              .col-12
                q-carousel(v-model="slide" swipeable animated padding control-text-color="c-grey" style="height: 210px")
                  q-carousel-slide(name="slide1" class="q-pa-md")
                    q-btn-group(flat spread stretch)
                      q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('Destroy')" icon="alarm" :disable ='!(!ifSelfChat && $store.state.currentChat && $store.state.currentChat.subjectType === SubjectType.CHAT)' @click="destroyClock = true")
                        q-popup-edit(v-model="destroyClock" content-class="" style='width:100px')
                          q-option-group(:options="clockOptions" label="Notification" type="radio" v-model="$store.state.currentChat.destroyTime")
                      q-btn.text-primary.btnMessage(no-caps)
                        form#messageUploadForm(style="margin-top:-15px")
                          label(for="messageUpload" class="notranslate material-icons q-icon text-primary" aria-hidden="true") folder
                          input#messageUpload(type="file" multiple="multiple" class="visually-hidden" @change="uploadMessageFileMobile()" accept="")
                          label(for="messageUpload" class="text-primary" style="font-size: 12px;font-weight: 500;") {{ $t('File') }}
                      q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('Take Photo')" icon="photo_camera" @click="capture('image')")
                      q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('Take Video')" icon="camera" @click="capture('video')")
                    q-btn-group(flat spread stretch)
                      q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('Voice Call')" icon="call" :disable="ifSelfChat" @click="initiateCallRequest('audio')")
                      q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('Video Call')" icon="videocam" :disable="ifSelfChat" @click="initiateCallRequest('video')")
                      q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('Collection')" icon="bookmarks" @click="openCollection")
                      q-btn.text-primary.btnMessage(flat stack no-caps :label="$t('Contact Card')" icon="account_box" @click="selectLinkmanCard")
                  //q-carousel-slide(name="slide2" class="q-pa-md")
              .col-12.text-center
                .audio-touch#audio-touch(@touchstart="audioTouchStart" @touchmove="audioTouchMove" @touchend="audioTouchEnd")
                  q-icon(size="16px" name="mic" style="vertical-align: text-top;")
                  span#audio-touch-text {{ $t('Hold to talk')}}
      q-tab-panel(name="CHATDetails" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="backToDefault")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('Chat Details')}}
        q-list
          q-item
            q-item-section(avatar style="justify-content: flex-end;") {{$store.state.currentChat && $store.state.linkmanMap[$store.state.currentChat.subjectId] ? ($store.state.linkmanMap[$store.state.currentChat.subjectId].givenName ? $store.state.linkmanMap[$store.state.currentChat.subjectId].givenName : $store.state.linkmanMap[$store.state.currentChat.subjectId].name) : ''}}
              q-btn(dense flat round @click="showContacts($store.state.currentChat.subjectId)")
                q-avatar(size="56px")
                  img(:src="$store.state.currentChat && $store.state.linkmanMap[$store.state.currentChat.subjectId] ? ($store.state.linkmanMap[$store.state.currentChat.subjectId].avatar ? $store.state.linkmanMap[$store.state.currentChat.subjectId].avatar : $store.defaultActiveAvatar) : null")
              q-icon(v-if="$store.displayActiveStatus" size="16px" name="person" :color="$store.state.currentChat && $store.state.linkmanMap[$store.state.currentChat.subjectId] && $store.state.linkmanMap[$store.state.currentChat.subjectId].activeStatus === ActiveStatus.UP ? 'secondary' : 'grey-1'")
            q-item-section(avatar style="justify-content: flex-end;")
              q-btn.text-primary(dense flat round size="28px" icon="add" @click="showAddGroupChatAndMember")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item(clickable v-ripple @click="showSearchChatHistory")
            q-item-section
              q-item-label {{$t('Search Chat History')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="confirmCleanChatHistory")
            q-item-section
              q-item-label {{$t('Clean Chat History')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item(v-if="$store.state.currentChat && $store.state.currentChat.subjectId !== $store.state.myselfPeerClient.peerId")
            q-item-section
              q-item-label {{$t('Alert New Message')}}
            q-item-section(side)
              q-toggle(v-if="$store.state.currentChat && $store.state.linkmanMap[$store.state.currentChat.subjectId]" v-model="$store.state.linkmanMap[$store.state.currentChat.subjectId].notAlert" @input="changeNotAlertSwitch")
          q-separator.c-separator(v-if="$store.state.currentChat && $store.state.currentChat.subjectId !== $store.state.myselfPeerClient.peerId" style="margin-left:16px;width:calc(100% - 16px)")
          q-item
            q-item-section
              q-item-label {{$t('Sticky Top')}}
            q-item-section(side)
              q-toggle(v-if="$store.state.currentChat && $store.state.linkmanMap[$store.state.currentChat.subjectId]" v-model="$store.state.linkmanMap[$store.state.currentChat.subjectId].top" @input="changeTopSwitch")
          q-item(v-if="$store.state.currentChat && $store.state.linkmanMap[$store.state.currentChat.subjectId]")
            q-item-section
              q-item-label {{$t('Recall Time Limit')}}
            q-item-section(side)
              q-toggle(v-model="$store.state.linkmanMap[$store.state.currentChat.subjectId].myselfRecallTimeLimit" @input="changeRecallTimeLimit")
          q-item(v-if="$store.state.currentChat && $store.state.linkmanMap[$store.state.currentChat.subjectId]")
            q-item-section
              q-item-label {{$t('Recall Alert')}}
            q-item-section(side)
              q-toggle(v-model="$store.state.linkmanMap[$store.state.currentChat.subjectId].myselfRecallAlert" @input="changeRecallAlert")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item
            q-item-section(align="center")
              q-btn.bg-primary.text-grey-1(:label="$t('Remove Chat')" unelevated no-caps @click="confirmRemoveChat")
      // group chat ///////////////////////////////////////////////////////////////////////////////////
      q-tab-panel(name="GROUP_CHATDetails" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('Chat Details') + ($store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId] && $store.state.groupChatMap[$store.state.currentChat.subjectId].groupMembers ? '(' + $store.state.groupChatMap[$store.state.currentChat.subjectId].groupMembers.length + ')' : '')}}
        q-list
          q-item
            q-item-section(avatar style="justify-content: flex-end;" v-for="(groupChatMember, index) in ($store.state.groupChatMap[$store.state.currentChat.subjectId] ? $store.state.groupChatMap[$store.state.currentChat.subjectId].groupMembers : [])" v-if="groupChatMember.memberType === MemberType.OWNER && groupChatMember.memberPeerId === $store.state.myselfPeerClient.peerId" :key="groupChatMember.memberPeerId") {{ $store.state.myselfPeerClient.name.length > 3 ? $store.state.myselfPeerClient.name.substr(0, 3) + '...' : $store.state.myselfPeerClient.name }}
              q-avatar(size="56px")
                img(:src="$store.state.myselfPeerClient.avatar ? $store.state.myselfPeerClient.avatar : $store.defaultActiveAvatar")
              q-icon(v-if="$store.displayActiveStatus" size="16px" name="person" color="secondary")
            q-item-section(avatar style="justify-content: flex-end;" v-for="(groupChatMember, index) in ($store.state.groupChatMap[$store.state.currentChat.subjectId] ? $store.state.groupChatMap[$store.state.currentChat.subjectId].groupMembers : [])" v-if="groupChatMember.memberType === MemberType.OWNER && groupChatMember.memberPeerId !== $store.state.myselfPeerClient.peerId" :key="groupChatMember.memberPeerId") {{ groupChatMemberName(groupChatMember) }}
              q-btn(dense flat round @click="showContacts(groupChatMember.memberPeerId)")
                q-avatar(size="56px")
                  img(:src="groupChatMemeberAvatar(groupChatMember)")
              q-icon(v-if="$store.displayActiveStatus" size="16px" name="person" :color="groupChatMember.memberPeerId === $store.state.myselfPeerClient.peerId || ($store.state.linkmanMap[groupChatMember.memberPeerId] && $store.state.linkmanMap[groupChatMember.memberPeerId].activeStatus === ActiveStatus.UP) ? 'secondary' : 'grey-1'")
            q-item-section(avatar style="justify-content: flex-end;" v-for="(groupChatMember, index) in ($store.state.groupChatMap[$store.state.currentChat.subjectId] ? $store.state.groupChatMap[$store.state.currentChat.subjectId].groupMembers : [])" v-if="groupChatMember.memberType !== MemberType.OWNER && groupChatMember.memberPeerId === $store.state.myselfPeerClient.peerId" :key="groupChatMember.memberPeerId") {{ $store.state.myselfPeerClient.name.length > 3 ? $store.state.myselfPeerClient.name.substr(0, 3) + '...' : $store.state.myselfPeerClient.name }}
              q-avatar(size="56px")
                img(:src="$store.state.myselfPeerClient.avatar ? $store.state.myselfPeerClient.avatar : $store.defaultActiveAvatar")
              q-icon(v-if="$store.displayActiveStatus" size="16px" name="person" color="secondary")
            q-item-section(avatar style="justify-content: flex-end;" v-for="(groupChatMember, index) in ($store.state.groupChatMap[$store.state.currentChat.subjectId] ? $store.state.groupChatMap[$store.state.currentChat.subjectId].groupMembers : [])" v-if="groupChatMember.memberType !== MemberType.OWNER && groupChatMember.memberPeerId !== $store.state.myselfPeerClient.peerId" :key="groupChatMember.memberPeerId") {{ groupChatMemberName(groupChatMember) }}
              q-btn(dense flat round @click="showContacts(groupChatMember.memberPeerId)")
                q-avatar(size="56px")
                  img(:src="groupChatMemeberAvatar(groupChatMember)")
              q-icon(v-if="$store.displayActiveStatus" size="16px" name="person" :color="$store.state.linkmanMap[groupChatMember.memberPeerId] && $store.state.linkmanMap[groupChatMember.memberPeerId].activeStatus === ActiveStatus.UP ? 'secondary' : 'grey-1'")
            q-item-section(avatar v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)")
              q-btn.text-primary(dense flat round size="28px" icon="add" @click="showAddGroupChatMember")
            q-item-section(avatar v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)")
              q-btn.text-primary(dense flat round size="28px" icon="remove" @click="showSelectGroupChatMember")
            q-item-section(avatar v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)")
              q-btn.text-primary(dense flat round size="24px" icon="clear" @click="confirmDisbandGroupChat")
          q-separator.c-separator.message-sep-2
          q-item(clickable v-ripple @click="showOwnershipHandover")
            q-item-section
              q-item-label {{ ifIAmEffectiveGroupOwner($store.state.currentChat) ? $t('Ownership Handover') : $t('Group Owner') }}
            q-item-section(side) {{ groupChatOwnerName() }}
            q-item-section(avatar v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)")
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator.message-sep-1
          q-item(clickable v-ripple @click="showModifyGroupChat")
            q-item-section
              q-item-label {{$t('Group Name')}}
            q-item-section(side) {{ $store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId] && $store.state.groupChatMap[$store.state.currentChat.subjectId].name ? $store.state.groupChatMap[$store.state.currentChat.subjectId].name : '' }}
            q-item-section(avatar v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)")
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator.message-sep-1
          q-item(clickable v-ripple @click="showModifyGroupChat")
            q-item-section
              q-item-label {{$t('Group Description')}}
              q-item-label(caption lines="3") {{ $store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId] && $store.state.groupChatMap[$store.state.currentChat.subjectId].description ? $store.state.groupChatMap[$store.state.currentChat.subjectId].description : '' }}
            q-item-section(avatar v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)")
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator.message-sep-1
          q-item
            q-item-section
              q-item-label {{$t('Recall Time Limit')}}
            q-item-section(side)
              q-toggle(v-if="$store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId]" :disable="!ifIAmEffectiveGroupOwner($store.state.currentChat)" v-model="$store.state.groupChatMap[$store.state.currentChat.subjectId].recallTimeLimit" @input="changeRecallTimeLimit")
          q-separator.c-separator.message-sep-1
          q-item
            q-item-section
              q-item-label {{$t('Recall Alert')}}
            q-item-section(side)
              q-toggle(v-if="$store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId]" :disable="!ifIAmEffectiveGroupOwner($store.state.currentChat)" v-model="$store.state.groupChatMap[$store.state.currentChat.subjectId].recallAlert" @input="changeRecallAlert")
          q-separator.c-separator.message-sep-2
          q-item(clickable v-ripple @click="showModifyGroupChat")
            q-item-section
              q-item-label {{$t('Given Name')}}
            q-item-section(side) {{ $store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId] && $store.state.groupChatMap[$store.state.currentChat.subjectId].givenName ? $store.state.groupChatMap[$store.state.currentChat.subjectId].givenName : '' }}
            q-item-section(avatar v-if="$store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId] && $store.state.groupChatMap[$store.state.currentChat.subjectId].status === GroupStatus.Effective")
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator.message-sep-1
          //q-item(clickable v-ripple @click="showModifyGroupChat")
          //  q-item-section
          //    q-item-label {{$t('Tags')}}
          //  q-item-section(side) {{ $store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId] && $store.state.groupChatMap[$store.state.currentChat.subjectId].tag ? $store.state.groupChatMap[$store.state.currentChat.subjectId].tag : '' }}
          //  q-item-section(avatar)
          //    q-icon(name="keyboard_arrow_right" color="c-grey-10")
          //q-separator.c-separator.message-sep-1
          q-item(clickable v-ripple @click="showModifyGroupChat")
            q-item-section
              q-item-label {{$t('My Alias')}}
            q-item-section(side) {{ $store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId] && $store.state.groupChatMap[$store.state.currentChat.subjectId].myAlias ? $store.state.groupChatMap[$store.state.currentChat.subjectId].myAlias : '' }}
            q-item-section(avatar v-if="$store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId] && $store.state.groupChatMap[$store.state.currentChat.subjectId].status === GroupStatus.Effective")
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator.message-sep-2
          q-item(clickable v-ripple @click="enterGroupFile")
            q-item-section
              q-item-label {{$t('Group File')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator.message-sep-2
          q-item(clickable v-ripple @click="showSearchChatHistory")
            q-item-section
              q-item-label {{$t('Search Chat History')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator.message-sep-1
          q-item(clickable v-ripple @click="confirmCleanChatHistory")
            q-item-section
              q-item-label {{$t('Clean Chat History')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right" color="c-grey-10")
          q-separator.c-separator.message-sep-2
          q-item
            q-item-section
              q-item-label {{$t('Alert New Message')}}
            q-item-section(side)
              q-toggle(v-if="$store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId]" :disable="!ifIAmEffectiveGroupOwner($store.state.currentChat)" v-model="$store.state.groupChatMap[$store.state.currentChat.subjectId].notAlert" @input="changeNotAlertSwitch")
          q-separator.c-separator.message-sep-1
          q-item
            q-item-section
              q-item-label {{$t('Sticky Top')}}
            q-item-section(side)
              q-toggle(v-if="$store.state.currentChat && $store.state.groupChatMap[$store.state.currentChat.subjectId]" :disable="!ifIAmEffectiveGroupOwner($store.state.currentChat)" v-model="$store.state.groupChatMap[$store.state.currentChat.subjectId].top" @input="changeTopSwitch")
          q-separator.c-separator.message-sep-2
          q-item
            q-item-section(align="center")
              q-btn.bg-primary.text-grey-1(:label="$t('Remove GroupChat')" unelevated no-caps @click="confirmRemoveGroupChat")
      q-tab-panel(name="contactsDetails" style="padding:0px 0px")
        contactsDetails.drawcontent
      q-tab-panel(name="findContacts" style="padding:0px 0px")
        findContacts.drawcontent
      q-tab-panel(name="selectContacts" style="padding:0px 0px")
        selectContacts.drawcontent
      q-tab-panel(name="selectChat" style="padding:0px 0px")
        selectChat.drawcontent
      q-tab-panel(name="collection" style="padding:0px 0px")
        collection.drawcontent
      q-tab-panel(name="captureMedia" style="padding:0px 0px")
        captureMedia.drawcontent
      q-tab-panel(name="modifyGroupChat" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'GROUP_CHATDetails'")
          q-toolbar-title(align="center") {{ $t('GroupChat Details') }}
          q-btn.text-primary(flat round icon="check" @click="modifyGroupChat")
        q-form(ref="formModifyGroupChat" @submit="modifyGroupChat" class="q-pa-sm")
          q-input.c-field(v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)"
            :autofocus="ifIAmEffectiveGroupOwner($store.state.currentChat)"
            :label="$t('Group Name')" filled clearable v-model="groupChatData.name" lazy-rules :rules="[]")
          p
          q-input.c-field(v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)" :label="$t('Group Description')" filled clearable v-model="groupChatData.description" lazy-rules :rules="[]")
          p(v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)")
          q-input.c-field(:label="$t('Given Name')"
            :autofocus="!ifIAmEffectiveGroupOwner($store.state.currentChat)"
            filled clearable v-model="groupChatData.givenName" lazy-rules :rules="[]")
          p
          q-input.c-field(:label="$t('My Alias')" filled clearable v-model="groupChatData.myAlias" lazy-rules :rules="[]")
      q-tab-panel(name="searchChatHistory" style="padding:0px 0px")
        q-toolbar
          q-btn(v-if="$store.messageEntry === 'search'" flat round icon="keyboard_arrow_left" @click="resultBack()")
          q-input.c-field(:disable="$store.state.myselfPeerClient.localDataCryptoSwitch===true" debounce="100" filled dense v-model="searchText" :placeholder="placeholder2" input-class="iconfont" style="width: 86%" :prefix="searchPrefix" @keyup="searchKeyup" @input="searchInput")
            template(slot="append")
              q-icon(v-if="searchText" name="cancel" class="cursor-pointer" @click.stop="searchText = null;searching = false")
          q-btn.text-primary(flat round icon="close" @click="searchBack()")
        ly-tab.cursor-pointer(v-if="$store.messageEntry !== 'search' && !searchText" v-model="nonsysChatContentTypeIndex" :items="nonsysChatContentTypes" :options="chatContentTypeOptions" @change="changeChatContentType")
        ly-tab.cursor-pointer(v-if="searchText && searching" v-model="searchableChatContentTypeIndex" :items="searchableChatContentTypes" :options="chatContentTypeOptions" @change="changeChatContentType")
        q-toolbar(insert)
          q-input.c-field(dense readonly v-model="searchDate" :placeholder="$t('Date')" input-class="text-center" style="width: 33% !important")
            template(v-slot:append)
              q-icon(v-if="searchDate" name="cancel" class="cursor-pointer" @click.stop="cleanSearchDate")
              q-icon(name="event" color="primary" class="cursor-pointer")
                q-popup-proxy(ref="qDateProxy" transition-show="scale" transition-hide="scale")
                  q-date(v-model="searchDate" @input="searchDateInput" minimal mask="YYYY-MM-DD")
          q-input.c-field(v-if="$store.state.currentChat && $store.state.currentChat.subjectType === SubjectType.GROUP_CHAT" dense readonly v-model="searchSenderName" :placeholder="$t('Group Member')" input-class="text-center" style="width: 33% !important")
            template(v-slot:append)
              q-icon(v-if="searchSenderName" name="cancel" class="cursor-pointer" @click.stop="cleanSearchSender")
              q-icon(name="person" color="primary" class="cursor-pointer" @click="selectSearchSender")
        q-infinite-scroll.chat-history-scroll(v-if="$store.messageEntry !== 'search' && !searchText" @load="getChatHistory" debounce="500")
          template(v-for="(message, index) in chatMessageResultList")
            messageContent(v-if='message.messageType === P2pChatMessageType.CHAT_LINKMAN' v-bind:message = "message" entry = "historyMessage" v-bind:showContacts='showContacts')
        q-list(v-if="searching")
          q-item(v-for="(message, index) in messageResultList" :key="message.messageId" clickable v-ripple @click="messageResultSelected(message, index)")
            q-item-section(avatar)
              q-avatar
                img(:src="message.senderPeerId === message.ownerPeerId ? ($store.state.myselfPeerClient.avatar ? $store.state.myselfPeerClient.avatar : $store.defaultActiveAvatar) : ($store.state.linkmanMap[message.senderPeerId].avatar ? $store.state.linkmanMap[message.senderPeerId].avatar : $store.defaultActiveAvatar)")
            q-item-section
              q-item-label( lines="1") {{ message.senderPeerId === message.ownerPeerId?$store.state.myselfPeerClient.name:$store.state.linkmanMap[message.senderPeerId].name }}
              q-item-label(caption v-html="message.highlighting")
            q-item-section(side top) {{detailDateFormat(message.createDate)}}
      q-tab-panel(name="groupFile" style="padding:0px 0px")
        q-toolbar.header-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind='GROUP_CHATDetails'")
          q-toolbar-title(align="center" :style="ifIAmEffectiveGroupOwner($store.state.currentChat) ? '' : 'padding-right:54px'") {{ $t('Group File') + '(' + GroupFileFilteredList.length + ')' }}
          q-btn.text-primary(v-if="ifIAmEffectiveGroupOwner($store.state.currentChat) && !(ifMobileSize || $store.state.ifMobileStyle)" flat round icon="add_circle_outline" @click="$refs.groupFileUpload.pickFiles()")
          form#groupFileUploadForm(v-if="ifIAmEffectiveGroupOwner($store.state.currentChat) && (ifMobileSize || $store.state.ifMobileStyle)")
            label(for="groupFileUpload" class="notranslate material-icons q-icon text-primary" aria-hidden="true" style="font-size: 1.715em;") add_circle_outline
            input#groupFileUpload(type="file" class="visually-hidden" @change="uploadGroupFileMobile()")
        div.scroll.header-mar-top(id="scroll-target-default" :class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-editor' : 'scrollHeightMobileStyle-editor') : 'scrollHeightStyle'")
          q-toolbar(insert class="q-px-xs")
            q-input.c-field(debounce="100" filled dense v-model="groupFileFilter" :placeholder="placeholder" input-class="text-center iconfont")
              template(slot="append")
                q-icon(v-if="groupFileFilter" name="cancel" class="cursor-pointer" @click.stop="groupFileFilter = null")
          q-list
            div(v-for="(groupFile, index) in GroupFileFilteredList" :key="groupFile.blockId")
              q-item(:active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2'" class="text-c-grey-10")
                q-item-section(avatar)
                  q-icon.text-primary(:name="FileIconName(groupFile.name)")
                q-item-section
                  q-item-label(lines="1" clickable v-ripple @click="groupFileSelected(groupFile, index)" ) {{ groupFile.name }}
                q-item-section(side)
                  q-item-label(lines="1") {{ detailDateFormat(groupFile.createTimestamp) }}
                q-item-section(v-if="ifIAmEffectiveGroupOwner($store.state.currentChat)" side)
                  q-btn.text-primary(dense round flat icon="remove_circle_outline" @click="confirmRemoveGroupFile(groupFile)")
      // group chat ///////////////////////////////////////////////////////////////////////////////////
      q-tab-panel(name="selectGroupChatMember" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="selectGroupChatMemberBack")
          q-toolbar-title(align="center") {{ selectGroupChatMemberFlag === 'removeGroupChatMember' ? $t('Remove Group Member') : $t('Select Group Member') }}
          q-btn(flat round icon="check" :disable="selectedGroupChatMembers.length < 1 && !selectedGroupChatMemberPeerId" :label="(selectedGroupChatMembers.length > 0 ? '(' + selectedGroupChatMembers.length + ')' : '')" :class="selectedGroupChatMembers.length > 0 || selectedGroupChatMemberPeerId ? 'text-primary' : 'c-grey-0'" @click="doneSelectGroupChatMember")
        q-toolbar(insert)
          q-input.c-field(debounce="100" filled dense v-model="groupChatMemberfilter" :placeholder="placeholder" input-class="text-center iconfont")
            template(slot="append")
              //q-icon(v-if="!groupChatMemberfilter" name="search")
              //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="groupChatMemberfilter = null")
              q-icon(v-if="groupChatMemberfilter" name="cancel" class="cursor-pointer" @click.stop="groupChatMemberfilter = null")
        q-list(:class="selectedGroupChatMembers.length > 0 ? '' : 'hidden'")
          q-separator.c-separator
          q-item
            q-item-section(side v-for="(selectedGroupChatMember, index) in selectedGroupChatMembers" :key="selectedGroupChatMember.peerId")
              q-btn(dense :label="selectedGroupChatMember.givenName ? (selectedGroupChatMember.givenName.length > 3 ? selectedGroupChatMember.givenName.substr(0, 3) + '...' : selectedGroupChatMember.givenName) : (selectedGroupChatMember.name.length > 3 ? selectedGroupChatMember.name.substr(0, 3) + '...' : selectedGroupChatMember.name)" @click="unselectGroupChatMember(index)")
                q-avatar(size="32px")
                  img(:src="selectedGroupChatMember.avatar ? selectedGroupChatMember.avatar : $store.defaultActiveAvatar")
        div(class="bg-c-grey-0 text-c-grey-10 q-pl-md q-py-xs") {{$t('Group Member')}}
        q-list
          div(v-for="(groupChatMember, index) in GroupChatMemberFilteredList" :key="groupChatMember.peerId")
            // 实际选择的不是GroupChatMember，而是对应的linkman，所以属性为peerId、不是memberPeerId
            q-item(clickable v-ripple @click="selectGroupChatMember(groupChatMember)")
              q-item-section(side)
                q-checkbox(v-if="selectGroupChatMemberFlag === 'removeGroupChatMember' || selectGroupChatMemberFlag === 'selectedGroupCallMember'" dense v-model="groupChatMember.selected" color="primary" @input="selectGroupChatMember(groupChatMember, true)")
                q-radio(v-if="selectGroupChatMemberFlag === 'ownershipHandover' || selectGroupChatMemberFlag === 'searchMessage'" dense v-model="selectedGroupChatMemberPeerId" :val="groupChatMember.peerId" color="primary")
              q-item-section(avatar)
                q-avatar
                  img(:src="groupChatMember.avatar ? groupChatMember.avatar : $store.defaultActiveAvatar")
              q-item-section
                q-item-label {{ groupChatMember.memberAlias ? groupChatMember.memberAlias : (groupChatMember.givenName ? groupChatMember.givenName : groupChatMember.name) }}
                  q-icon(v-if="$store.displayActiveStatus" name="person" :color="groupChatMember.activeStatus === ActiveStatus.UP ? 'secondary' : 'grey-1'")
              q-item-section(avatar)
                q-icon(color="c-grey-10" :name="groupChatMember.locked ? 'lock' : ''")
            q-separator.c-separator(inset="item" v-if="index < GroupChatMemberFilteredList.length - 1")
            q-separator.c-separator(v-if="index === GroupChatMemberFilteredList.length - 1")
      q-tab-panel.bg-black#messageFullsizeContainer(:style="heightStyle" name="messageFullsize" class="q-pa-none" align="center")
        q-toolbar(v-if="videoRecordMessageSrc" style="z-index: 999")
          q-btn.text-primary(flat round icon="close" @click="fullsizeBack")
          q-space
          q-btn.text-primary(flat round icon="more_horiz" @click="videoCommand()")
        q-toolbar(v-if="imageMessageSrc" style="z-index: 999")
          q-btn.text-primary(flat round icon="close" @click="fullsizeBack")
          q-space
          q-btn.text-primary(flat round icon="more_horiz" @click="imageCommand()")
        img#messageFullsizeImg(v-if="imageMessageSrc" :src="imageMessageSrc" :style="fullscreenStyle")
        canvas#messageFullsizeCanvas(v-if="imageMessageSrc" class="hidden")
        video#messageFullsizeVideo(v-if="videoRecordMessageSrc" @canplay="canPlay" :src="videoRecordMessageSrc" :style="fullscreenStyle" controls webkit-playsinline playsinline x5-playsinline x-webkit-airplay="allow" autoplay)
    q-dialog(v-model="audioRecordMessageViewDialog")
      q-card
        q-card-section(class="row items-center")
          audio(:src="audioRecordMessageSrc" style='max-width:100%' controls="controls")
    q-dialog(v-model="audioTouchDialog" seamless)
        q-card.audio-touch-dialog-card()
          q-icon(name="mic" size='40px')
          br
          span(ref="mediaTimer" style="font-size:20px")
    q-dialog(v-model="focusGroupMemberDialog")
      q-card(flat square bordered)
        q-card-section
          q-toolbar(insert class="q-px-xs")
            q-input.c-field(debounce="100" filled dense v-model="selectFocusMemberFilter" :placeholder="placeholder" input-class="text-center iconfont")
              template(slot="append")
                q-icon(v-if="selectFocusMemberFilter" name="cancel" class="cursor-pointer" @click.stop="selectFocusMemberFilter = null")
          q-list
            div(v-for="(groupMember, index) in FocusGroupMemberFilteredList" :key="groupMember.peerId")
              // 实际选择的不是GroupChatMember，而是对应的linkman，所以属性为peerId、不是memberPeerId
              q-item(clickable v-ripple @click="selectedFocusGroupMember(groupMember)")
                q-item-section(avatar)
                  q-avatar
                    img(:src="groupMember.avatar ? groupMember.avatar : $store.defaultActiveAvatar")
                q-item-section
                  q-item-label {{ groupMember.memberAlias ? groupMember.memberAlias : (groupMember.givenName ? groupMember.givenName : groupMember.name) }}
    q-uploader(style="display:none" ref="messageUpload" multiple batch @added="files => uploadMessageFilePC(files)")
    q-uploader(style="display:none" ref="groupFileUpload" multiple batch @added="files => uploadGroupFilePC(files)")
    mergeMessageDialog
    noteMessageDialog
</template>
<script src="./message.vue.js" />
