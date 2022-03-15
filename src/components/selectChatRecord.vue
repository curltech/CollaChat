<template lang="pug">
  div.bg-c-grey-0(:style="heightStyle")
    q-toolbar
      q-btn(flat round icon="keyboard_arrow_left" @click="back")
      q-toolbar-title(align="center") {{ $store.selectChatRecordEntry === 'selectChat' ? $t('Select Chat') : $t('Select Chat Record') }}
      q-btn(flat round icon="check" :disable="!inclContactsInfoFlag && $store.state.includedChatRecords.length < 1" :label="($store.state.includedChatRecords.length > 0 ? '(' + $store.state.includedChatRecords.length + ')' : '')" :class="inclContactsInfoFlag || $store.state.includedChatRecords.length > 0 ? 'text-primary' : 'c-grey-0'" @click="doneSelectChatRecord")
    q-toolbar(insert)
      q-input.c-field(debounce="100" filled dense v-model="selectChatRecordfilter" :placeholder="placeholder" input-class="text-center iconfont")
        template(slot="append")
          //q-icon(v-if="!selectChatRecordfilter" name="search")
          //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="selectChatRecordfilter = null")
          q-icon(v-if="selectChatRecordfilter" name="cancel" class="cursor-pointer" @click.stop="selectChatRecordfilter = null")
    q-list(:class="$store.state.includedChatRecords.length > 0 ? '' : 'hidden'")
      //q-separator.c-separator
      q-item
        q-item-section(side v-for="(selectedChat, index) in $store.state.includedChatRecords" :key="selectedChat.subjectId")
          q-btn(flat dense :label="ChatName(selectedChat).length > 3 ? ChatName(selectedChat).substr(0, 3) + '...' : ChatName(selectedChat)" @click="unselectChatRecord(index)")
            q-avatar(v-if='selectedChat.subjectType === SubjectType.CHAT' size="32px")
              img(:src="$store.state.linkmanMap[selectedChat.subjectId].avatar ? $store.state.linkmanMap[selectedChat.subjectId].avatar : $store.defaultActiveAvatar")
            groupAvatar(v-if="selectedChat.subjectType === SubjectType.GROUP_CHAT" v-bind:group_members="$store.state.groupChatMap[selectedChat.subjectId].groupMembers" v-bind:avatar_width="32")
    q-list(v-if="$store.selectChatRecordEntry === 'selectChat'")
      //q-separator.c-separator
      q-item(clickable v-ripple @click="$store.gotoSelectContacts")
        q-item-section {{$t('Select From Contacts')}}
        q-item-section(avatar)
          q-icon(name="keyboard_arrow_right")
      //q-separator.c-separator
      q-item(clickable v-ripple @click="$store.gotoSelectGroupChat")
        q-item-section {{$t('Select From GroupChat')}}
        q-item-section(avatar)
          q-icon(name="keyboard_arrow_right")
      //q-separator.c-separator
    div(v-if="$store.selectChatRecordEntry && $store.selectChatRecordEntry.indexOf('backupMigration') === -1" class="bg-c-grey-0 text-c-grey-10 q-pl-md q-py-xs") {{ $t('Chat Record') }}
    q-list(v-if="$store.selectChatRecordEntry !== 'selectChat'")
      q-item(v-if="$store.selectChatRecordEntry && $store.selectChatRecordEntry.indexOf('backupMigration') === 0" dense)
        q-item-section(side)
          q-item-label(flat dense class="bg-c-grey-0 text-c-grey-10") {{ $t('Chat Record') }}
        q-space
        q-item-section(side)
          q-checkbox(dense v-model="inclContactsInfoFlag" color="primary" :label="$t('incl. Contacts Info')")
      q-item(dense)
        q-item-section(side)
          q-btn(flat dense color="primary" :label="selectAllFlag ? $t('Unselect All') : $t('Select All')" @click="selectAll" no-caps)
        q-space
        q-item-section(side)
          q-checkbox(dense v-model="textOnlyFlag" color="primary" :label="$t('Text Only')")
    q-list
      div(v-for="(chat, index) in SelectChatFilteredList" :key="chat.subjectId")
        q-item(clickable v-ripple @click="selectChatRecord(chat)")
          q-item-section(side)
            q-checkbox(dense v-model="chat.selected" color="primary" @input="selectChatRecord(chat, true)")
          q-item-section(avatar)
            q-avatar(v-if='chat.subjectType === SubjectType.CHAT')
              img(:src="$store.state.linkmanMap[chat.subjectId].avatar ? $store.state.linkmanMap[chat.subjectId].avatar : $store.defaultActiveAvatar")
            groupAvatar(v-if="chat.subjectType === SubjectType.GROUP_CHAT" v-bind:group_members="$store.state.groupChatMap[chat.subjectId].groupMembers" v-bind:avatar_width="40")
          q-item-section
            q-item-label {{ ChatName(chat) }}
              q-icon(v-if="$store.displayActiveStatus" name="person" :color="chat.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
        //q-separator.c-separator(inset="item" v-if="index < SelectChatFilteredList.length - 1")
        //q-separator.c-separator(v-if="index === SelectChatFilteredList.length - 1")
</template>
<script src="./selectChatRecord.vue.js" />
