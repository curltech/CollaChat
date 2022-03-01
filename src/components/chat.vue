<template lang="pug">
  div(:class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'bg-c-grey-1 heightMobileSize-me' : 'bg-c-grey-1 heightMobileStyle-me') : 'bg-c-grey-1 heightStyle-me'")
    q-tab-panels.bg-c-grey-1(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(name="default" class="q-pa-none")
        q-toolbar.header-toolbar(:class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'")
          q-btn.text-primary(flat round :icon="$store.state.lockContactsSwitch ? 'visibility_off' : 'visibility'" @click="showLockContactsSwitchDialog")
          q-toolbar-title(align="center" class="text-c-grey-10") {{ $store.state.networkStatus === 'CONNECTING' ? $t('Chat') + '(' + $t('CONNECTING') + ')' : ($store.state.networkStatus === 'CONNECTED' ? $t('Chat') : $t('Chat') + '(' + $t('DISCONNECTED') + ')') }}
          q-btn.text-primary(flat round icon="add_circle_outline")
            q-menu(auto-close)
              q-list
                q-item(clickable v-ripple @click="showSelectGroupChatLinkman" v-close-popup)
                  q-item-section(avatar style="padding-right:0px;min-width: 40px !important")
                    q-icon(name="chat" color="primary")
                  q-item-section {{$t('Add GroupChat')}}
                //q-separator.c-separator
                //q-item(clickable v-ripple @click="showSelectConference" v-close-popup)
                  q-item-section(avatar style="padding-right:0px;min-width: 40px !important")
                    q-icon(name="videocam" color="primary")
                  q-item-section {{$t('Conference')}}
                //q-separator.c-separator
                q-item(clickable v-ripple @click="findContacts" v-close-popup)
                  q-item-section(avatar style="padding-right:0px;min-width: 40px !important")
                    q-icon(name="person_add" color="primary")
                  q-item-section {{$t('Add Contacts')}}
                //q-separator.c-separator(v-if="ifMobileSize || $store.state.ifMobileStyle")
                q-item(clickable v-ripple @click="enterScan" v-close-popup)
                  q-item-section(avatar style="padding-right:0px;min-width: 40px !important")
                    q-icon(name="fullscreen" color="primary")
                  q-item-section {{$t('Scan')}}
        div.scroll.header-mar-top(:class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize' : 'scrollHeightMobileStyle') : 'scrollHeightStyle'")
          q-toolbar(insert :class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'" class="q-px-xs")
            q-input.c-field(debounce="100" filled dense v-model="searchText" :placeholder="placeholder" input-class="text-center iconfont" @focus="searchFocus")
              template(slot="append")
                //q-icon(v-if="!chatFilter" name="search")
                //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="chatFilter = null")
                //q-icon(v-if="chatFilter" name="cancel" class="cursor-pointer" color="primary" @click.stop="chatFilter = null")
                q-icon(v-if="searchText" name="cancel" class="cursor-pointer" @click.stop="searchText = null")
          q-list
            div(v-if="$store.state.networkStatus === 'DISCONNECTED'")
              q-item(dense class="bg-warning text-center")
                q-item-section
                  q-item-label(caption lines="1") {{$t('no internet connection, please check network settings')}}
            div(v-for="(chat, index) in ChatFilteredList" :key="chat.subjectId")
              q-item.q-item-1(clickable v-ripple @click="chatSelected(chat, index)" :active="($store.state.currentChat && chat.subjectId == $store.state.currentChat.subjectId) || chat.top === true" :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2'" class="text-c-grey-10")
                q-item-section(avatar)
                  q-avatar(v-if='chat.subjectType === SubjectType.CHAT')
                    img(:src="$store.state.linkmanMap[chat.subjectId].avatar ? $store.state.linkmanMap[chat.subjectId].avatar : $store.defaultActiveAvatar")
                    q-badge(v-if="IfAlertUnReadCount(chat)" color="red" floating) {{ chat.unReadCount }}
                  groupAvatar(v-if="chat.subjectType === SubjectType.GROUP_CHAT" v-bind:group_members="$store.state.groupChatMap[chat.subjectId].groupMembers" v-bind:avatar_width="40" v-bind:unReadCount="GroupChatUnReadCount(chat)" v-bind:bgClass="($store.state.currentChat && chat.subjectId == $store.state.currentChat.subjectId) || chat.top === true ? (ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2') : ''")
                q-item-section
                  q-item-label.q-item-label-1(lines="1") {{ ChatName(chat) }}
                  q-item-label(caption lines="1")
                    span(v-if="chat.subjectType === SubjectType.GROUP_CHAT && chat.focusedMessage && !chat.tempText" style="color:red") 有人@你&nbsp;
                    span(v-if="chat.tempText && chat !== $store.state.currentChat"  style="color:red") {{`[${$t('Draft')}] `}}
                    span {{ chat.tempText && chat !== $store.state.currentChat ? chat.tempText : ChatContent(chat) }}
                q-item-section(side style="padding-left:0px")
                  q-item-label(caption lines="1") {{ ChatUpdateTime(chat.updateTime) }}
                  q-icon(v-if="$store.displayActiveStatus" size="16px" name="person" :color="activeStatus(chat) ? 'secondary' : 'c-grey'" style="padding-top:8px")
                    q-icon(v-if="alertStatus(chat)" size="16px" name="notifications_off")
                  q-icon(v-if="!$store.displayActiveStatus && alertStatus(chat)" size="16px" name="notifications_off" style="padding-top:8px")
                //q-menu(touch-position context-menu)
                  q-list(dense)
                    q-item(clickable  @click="deleteChat(chat, index)" v-close-popup)
                      q-item-section {{$t('Delete')}}
              //q-separator.c-separator(inset="item" v-if="index < ChatFilteredList.length - 1")
              //q-separator.c-separator(v-if="index === ChatFilteredList.length - 1")
      q-tab-panel(name="search" class="q-pa-none")
        q-toolbar.header-toolbar
          q-btn(v-if="searchResult !== 'allResult'" flat round icon="keyboard_arrow_left" @click="resultBack()")
          q-input.c-field(:disable="$store.state.myselfPeerClient.localDataCryptoSwitch===true" debounce="100" filled dense v-model="searchText" :placeholder="placeholder2" input-class="iconfont" style="width: 86%" autofocus @keyup="searchKeyup" @input="searchInput")
            template(slot="append")
              q-icon(v-if="searchText" name="cancel" class="cursor-pointer" @click.stop="searchText = null;searching = false")
          q-btn.text-primary(flat round icon="close" @click="searchBack()")
        div.scroll.header-mar-top(:class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-editor' : 'scrollHeightMobileStyle-editor') : 'scrollHeightStyle'")
          q-list(v-if="searching===true")
            q-item(v-if="searchResult === 'allResult' || searchResult === 'linkmanResult'" class="text-c-grey-10")
              q-item-section(side)
                q-item-label(caption) {{ $t('Contacts') }}
            div(v-for="(linkman, linkmanIndex) in (linkmanResultList ? linkmanResultList : [])" :key="linkmanIndex")
              q-item(v-if="(searchResult === 'allResult' && linkmanIndex < 3) || searchResult === 'linkmanResult'" clickable v-ripple class="text-c-grey-10" @click="linkmanResultSelected(linkman, linkmanIndex)")
                q-item-section(avatar)
                    q-avatar
                      img(:src="linkman.avatar ? linkman.avatar : $store.defaultActiveAvatar")
                q-item-section
                  q-item-label(v-html="linkman.highlightingGivenName ? linkman.highlightingGivenName : (linkman.givenName ? linkman.givenName : (linkman.highlightingName ? linkman.highlightingName : linkman.name))")
                    q-icon(v-if="$store.displayActiveStatus" class="q-pl-sm" name="person" :color="linkman.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
                  q-item-label(v-if="linkman.highlighting" caption v-html="linkman.highlighting")
                q-item-section(avatar)
                  q-icon(color="primary" :name="linkman.locked ? 'lock' : ''")
            q-item(v-if="searchResult === 'allResult' && linkmanResultList && linkmanResultList.length > 3" clickable v-ripple class="text-c-grey-10" @click="linkmanResult()")
              q-item-section(side)
                q-icon(name="search")
              q-item-section
                q-item-label(caption) {{ $t('More Contacts') + '(' + linkmanResultList.length + ')' }}
              q-item-section(avatar)
                q-icon(name="keyboard_arrow_right")
            q-separator.c-separator(v-if="searchResult === 'allResult'" style="height:8px;margin-left:0px;margin-right:0px")
          q-list(v-if="searching===true")
            q-item(v-if="searchResult === 'allResult' || searchResult === 'groupChatResult'" class="text-c-grey-10")
              q-item-section(side)
                q-item-label(caption) {{ $t('Group Chat') }}
            div(v-for="(groupChat, groupChatIndex) in (groupChatResultList ? groupChatResultList : [])" :key="groupChatIndex")
              q-item(v-if="(searchResult === 'allResult' && groupChatIndex < 3) || searchResult === 'groupChatResult'" clickable v-ripple class="text-c-grey-10" @click="groupResultSelected(groupChat, groupChatIndex)")
                q-item-section(avatar)
                  groupAvatar(v-bind:group_members="groupChat.groupMembers" v-bind:avatar_width="40")
                q-item-section
                  q-item-label(v-html="groupChat.highlightingGivenName ? groupChat.highlightingGivenName : (groupChat.givenName ? groupChat.givenName : (groupChat.highlightingName ? groupChat.highlightingName : groupChat.name))")
                    q-icon(v-if="$store.displayActiveStatus" class="q-pl-sm" name="person" :color="groupChat && groupChat.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
                  q-item-label(v-if="groupChat.highlighting" caption v-html="groupChat.highlighting")
            q-item(v-if="searchResult === 'allResult' && groupChatResultList && groupChatResultList.length > 3" clickable v-ripple class="text-c-grey-10" @click="groupChatResult()")
              q-item-section(side)
                q-icon(name="search")
              q-item-section
                q-item-label(caption) {{ $t('More GroupChats') + '(' + groupChatResultList.length + ')' }}
              q-item-section(avatar)
                q-icon(name="keyboard_arrow_right")
            q-separator.c-separator(v-if="searchResult === 'allResult'" style="height:8px;margin-left:0px;margin-right:0px")
          q-list(v-if="searching===true")
            q-item(v-if="searchResult === 'allResult' || searchResult === 'chatResult'" class="text-c-grey-10")
              q-item-section(side)
                q-item-label(caption) {{ $t('Chat Records') }}
            div(v-for="(chat, chatIndex) in (chatResultList ? chatResultList : [])" :key="chatIndex")
              q-item(v-if="(searchResult === 'allResult' && chatIndex < 3) || searchResult === 'chatResult'" clickable v-ripple class="text-c-grey-10" @click="chatResultSelected(chat, chatIndex)")
                q-item-section(avatar)
                  q-avatar(v-if='chat.subjectType === SubjectType.CHAT')
                    img(:src="$store.state.linkmanMap[chat.subjectId].avatar ? $store.state.linkmanMap[chat.subjectId].avatar : $store.defaultActiveAvatar")
                    q-badge(v-if="IfAlertUnReadCount(chat)" color="red" floating) {{ chat.unReadCount }}
                  groupAvatar(v-if="chat.subjectType === SubjectType.GROUP_CHAT" v-bind:group_members="$store.state.groupChatMap[chat.subjectId].groupMembers" v-bind:avatar_width="40" v-bind:unReadCount="GroupChatUnReadCount(chat)")
                q-item-section
                  q-item-label(lines="1") {{ ChatName(chat) }}
                  q-item-label(caption lines="1") {{ chat.messageResultList.length + ' ' + $t(' relevant chat records') }}
                q-item-section(side style="padding-left:0px")
                  q-item-label(caption lines="1") {{ ChatUpdateTime(chat.updateTime) }}
                  q-icon(v-if="$store.displayActiveStatus" size="16px" name="person" :color="activeStatus(chat) ? 'secondary' : 'c-grey'" style="padding-top:8px")
                    q-icon(v-if="alertStatus(chat)" size="16px" name="notifications_off")
                  q-icon(v-if="!$store.displayActiveStatus && alertStatus(chat)" size="16px" name="notifications_off" style="padding-top:8px")
            q-item(v-if="searchResult === 'allResult' && chatResultList && chatResultList.length > 3" clickable v-ripple class="text-c-grey-10" @click="chatResult()")
              q-item-section(side)
                q-icon(name="search")
              q-item-section
                q-item-label(caption) {{ $t('More Chat Records') + '(' + chatResultList.length + ')' }}
              q-item-section(avatar)
                q-icon(name="keyboard_arrow_right")
    q-dialog(v-model="lockContactsSwitchDialog" persistent)
      q-card(style="width: 250px")
        q-bar(class="bg-primary text-c-grey-1")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section
          q-form(ref="formUnlockContacts" @submit="updateLockContactsSwitch")
            q-input.c-field(:label="$t('Please input Password')" autofocus filled hide-bottom-space clearable v-model="password" type="password" lazy-rules :rules="[]")
        q-card-actions(align="right")
          q-btn.text-primary(round dense unelevated icon="check" v-close-popup @click="updateLockContactsSwitch")
    q-uploader(style="display:none" ref="upload" @added="files => upload(files)" accept=".jpg, image/*")
 </template>
<script src="./chat.vue.js" />
