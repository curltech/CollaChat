<template lang="pug">
  div.bg-c-grey-0(:style="heightStyle")
    q-toolbar
      q-btn(flat round icon="keyboard_arrow_left" @click="back")
      q-toolbar-title(align="center") {{$t('Select GroupChat')}}
      q-btn(flat icon="check" :disable="SelectedGroupChatList.length < 1" :label="(SelectedGroupChatList.length > 0 ? '(' + SelectedGroupChatList.length + ')' : '')" :class="SelectedGroupChatList.length > 0 ? 'text-primary' : 'c-grey-0'" @click="doneSelectGroupChat")
    q-toolbar(insert)
      q-input.c-field(debounce="100" filled dense v-model="selectGroupChatFilter" :placeholder="placeholder" input-class="text-center iconfont")
        template(slot="append")
          //q-icon(v-if="!selectContactsfilter" name="search")
          //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="selectContactsfilter = null")
          q-icon(v-if="selectGroupChatFilter" name="cancel" class="cursor-pointer" @click.stop="selectGroupChatFilter = null")
    q-list(:class="SelectedGroupChatList.length > 0 ? '' : 'hidden'")
      q-separator.c-separator
      q-item
        q-item-section(side v-for="(selectedGroupChat, index) in SelectedGroupChatList" :key="selectedGroupChat.groupId")
          q-btn(flat dense :label="$store.getChatName(SubjectType.GROUP_CHAT,selectedGroupChat.groupId).length > 3 ? $store.getChatName(SubjectType.GROUP_CHAT,selectedGroupChat.groupId).substr(0, 3) + '...' : $store.getChatName(SubjectType.GROUP_CHAT,selectedGroupChat.groupId)" @click="unselectGroupChat(index)")
            groupAvatar(v-bind:group_members="selectedGroupChat.groupMembers" v-bind:avatar_width="40")
    div(class="bg-c-grey-0 text-c-grey-10 q-pl-md q-py-xs") {{$t('GroupChats')}}
    q-list
      div(v-for="(groupChat, index) in SelectGroupChatFilteredList" v-if="!groupChat.existing" :key="groupChat.groupId")
        q-item(clickable v-ripple @click="selectGroupChat(groupChat)")
          q-item-section(side)
            q-checkbox(dense v-model="selectGroupChat.selected" color="primary" @input="selectGroupChat(groupChat, true)")
          q-item-section(avatar)
            groupAvatar(v-bind:group_members="groupChat.groupMembers" v-bind:avatar_width="40")
          q-item-section
            q-item-label {{$store.getChatName(SubjectType.GROUP_CHAT,groupChat.groupId)}}
              q-icon(v-if="$store.displayActiveStatus" name="person" :color="groupChat.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
          q-item-section(avatar)
            q-icon(color="primary" :name="groupChat.locked ? 'lock' : ''")
        q-separator.c-separator(inset="item" v-if="index < SelectGroupChatFilteredList.length - 1")
        q-separator.c-separator(v-if="index === SelectGroupChatFilteredList.length - 1")
</template>
<script src="./selectGroupChat.vue.js" />
