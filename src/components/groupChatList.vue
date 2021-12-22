<template lang="pug">
  div.bg-c-grey-0
    q-toolbar
      q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
      q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? 'padding-right:54px' : ''") {{$t('Group Chat')}}
    q-tabs(dense v-model="tab" align="justify" indicator-color="primary" active-color="primary")
      q-tab(name="ownerGroupChatList" :label="$t('I Am Group Owner') + '(' + OwnerGroupChatList.length + ')'" no-caps :ripple="false")
      q-tab(name="memberGroupChatList" :label="$t('I Am Group Member') + '(' + MemberGroupChatList.length + ')'" no-caps :ripple="false")
    q-separator.c-separator
    q-tab-panels(v-model="tab" animated transition-prev="jump-up" transition-next="jump-up")
      q-tab-panel(name="ownerGroupChatList" style="padding:0px 0px")
        q-list
          div(v-for="(groupChat, index) in OwnerGroupChatList" :key="groupChat.groupId")
            q-item(clickable v-ripple @click="$store.gotoChat(groupChat.groupId)")
              q-item-section(avatar)
                groupAvatar(v-bind:group_members="groupChat.groupMembers" v-bind:avatar_width="66")
              q-item-section
                  q-item-label {{ ChatName(groupChat) }}
                    q-icon(v-if="$store.displayActiveStatus" class="q-pl-sm" name="person" :color="groupChat && groupChat.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
                  //q-item-label(caption, lines="1") {{ $t('Name: ') + (groupChat.name ? groupChat.name : '') }}
                  q-item-label(caption lines="5") {{ $t('Description: ') + (groupChat.description ? groupChat.description : '') }}
                  //q-item-label(caption lines="5") {{ $t('Tag: ') + (groupChat.tag ? groupChat.tag : '') }}
                  q-item-label(caption lines="1") {{ $t('HeadCount: ') + (groupChat.groupMembers ? groupChat.groupMembers.length : '') }}
                  q-item-label(caption lines="1") {{ $t('CreateDate: ') + date.formatDate(groupChat.createDate, 'YYYY-MM-DD HH:mm:ss') }}
              //q-item-section(side)
              //  q-btn.text-primary(dense round flat icon="more" @click="groupChatDetails(groupChat)")
              q-item-section(side)
                q-btn(dense round flat icon="chat" :color="!$store.displayActiveStatus || (groupChat && groupChat.activeStatus === ActiveStatus.UP) ? 'primary' : 'c-grey'")
            q-separator.c-separator(inset="item" v-if="index < $store.state.groupChats.length - 1")
            q-separator.c-separator(v-if="index === $store.state.groupChats.length - 1")
      q-tab-panel(name="memberGroupChatList" style="padding:0px 0px")
        q-list
          div(v-for="(groupChat, index) in MemberGroupChatList" :key="groupChat.groupId")
            q-item(clickable v-ripple @click="$store.gotoChat(groupChat.groupId)")
              q-item-section(avatar)
                groupAvatar(v-bind:group_members="groupChat.groupMembers" v-bind:avatar_width="66")
              q-item-section
                  q-item-label {{ ChatName(groupChat) }}
                    q-icon(v-if="$store.displayActiveStatus" class="q-pl-sm" name="person" :color="groupChat && groupChat.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
                  //q-item-label(caption, lines="1") {{ $t('Name: ') + (groupChat.name ? groupChat.name : '') }}
                  q-item-label(caption lines="5") {{ $t('Description: ') + (groupChat.description ? groupChat.description : '') }}
                  //q-item-label(caption lines="5") {{ $t('Tag: ') + (groupChat.tag ? groupChat.tag : '') }}
                  q-item-label(caption lines="1") {{ $t('HeadCount: ') + (groupChat.groupMembers ? groupChat.groupMembers.length : '') }}
                  q-item-label(caption lines="1") {{ $t('CreateDate: ') + date.formatDate(groupChat.createDate, 'YYYY-MM-DD HH:mm:ss') }}
              //q-item-section(side)
              //  q-btn.text-primary(dense round flat icon="more" @click="groupChatDetails(groupChat)")
              q-item-section(side)
                q-btn(dense round flat icon="chat" :color="!$store.displayActiveStatus || (groupChat && groupChat.activeStatus === ActiveStatus.UP) ? 'primary' : 'c-grey'")
            q-separator.c-separator(inset="item" v-if="index < $store.state.groupChats.length - 1")
            q-separator.c-separator(v-if="index === $store.state.groupChats.length - 1")
</template>
<script src="./groupChatList.vue.js" />