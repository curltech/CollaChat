<template lang="pug">
.bg-c-grey-0(:style="heightStyle")
  q-tab-panels(
    v-model="subKind",
    animated,
    transition-prev="slide-right",
    transition-next="slide-left"
  )
    q-tab-panel(name="default", style="padding:0px 0px")
      q-list
        q-item(dense class="q-px-sm")
          q-item-section(side)
            q-btn.text-c-black(
              :class="ifMobileSize || $store.state.ifMobileStyle || $store.contactsDetailsEntry !== 'contacts' ? '' : 'hidden'",
              flat,
              round,
              icon="keyboard_arrow_left",
              @click="back"
            )
          q-space
          q-item-section(v-if="$store.state.currentLinkman && $store.state.currentLinkman.peerId !== $store.state.myselfPeerClient.peerId" side)
            q-btn.text-primary(
              flat,
              round,
              dense,
              icon="more_horiz",
              @click="subKind = 'contactsSubDetails'"
            )
        q-item
          q-item-section(avatar, bolder)
            q-btn(dense, flat, round, @click="showFullscreen")
              q-avatar(size="64px")
                img(
                  :src="$store.state.currentLinkman ? ($store.state.currentLinkman.avatar ? $store.state.currentLinkman.avatar : $store.defaultActiveAvatar) : null"
                )
          q-item-section
            q-item-label.text-h6 {{ $store.state.currentLinkman ? ($store.state.currentLinkman.givenName ? $store.state.currentLinkman.givenName : $store.state.currentLinkman.name) : '' }}
              q-icon(v-if="$store.displayActiveStatus",
                name="person",
                :color="$store.state.currentLinkman && $store.state.currentLinkman.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'"
              )
            q-item-label(caption, lines="1") {{ $t('UserName: ') + ($store.state.currentLinkman ? $store.state.currentLinkman.name : '') }}
            q-item-label(caption, lines="3", style="word-break:break-all") {{ $t('PeerId: ') + ($store.state.currentLinkman ? $store.state.currentLinkman.peerId : '') }}
            q-item-label(caption, lines="1") {{ $t('CreateDate: ') + ($store.state.currentLinkman ? date.formatDate($store.state.currentLinkman.createDate, 'YYYY-MM-DD HH:mm:ss') : '') }}
            q-item-label(v-if="$store.state.currentLinkman && $store.state.currentLinkman.peerId !== $store.state.myselfPeerClient.peerId" caption, lines="1") {{ $t('LastConnectTime: ') + ($store.state.currentLinkman && $store.state.currentLinkman.lastConnectTime ? date.formatDate($store.state.currentLinkman.lastConnectTime, 'YYYY-MM-DD HH:mm:ss') : '') }}
            q-item-label(v-if="$store.state.currentLinkman && $store.state.currentLinkman.peerId !== $store.state.myselfPeerClient.peerId" caption, lines="1") {{ $t('SourceType: ') + ($store.state.currentLinkman ? $t($store.state.currentLinkman.sourceType) : '') }}
        q-separator.c-separator(
          style="margin-left:16px;width:calc(100% - 16px)"
        )
        q-item(v-if="$store.ifMobile()" v-ripple, clickable, @click="confirmCallMobile")
          q-item-section(side)
            q-item-label.text-c-grey-10 {{ $t('Mobile') }}
          q-item-section
            q-item-label.text-primary {{ $store.state.currentLinkman && $store.state.currentLinkman.mobile && /^[0-9]+$/.test($store.state.currentLinkman.mobile.substring(1)) ? $store.state.currentLinkman.mobile : '' }}
        q-item(v-if="!$store.ifMobile()" v-ripple)
          q-item-section(side)
            q-item-label.text-c-grey-10 {{ $t('Mobile') }}
          q-item-section
            q-item-label {{ $store.state.currentLinkman && $store.state.currentLinkman.mobile && /^[0-9]+$/.test($store.state.currentLinkman.mobile.substring(1)) ? $store.state.currentLinkman.mobile : '' }}
        q-separator.c-separator(v-if="$store.state.currentLinkman && $store.state.currentLinkman.peerId !== $store.state.myselfPeerClient.peerId"
          style="margin-left:16px;width:calc(100% - 16px)"
        )
        q-item(v-if="$store.state.currentLinkman && $store.state.currentLinkman.peerId !== $store.state.myselfPeerClient.peerId" clickable, v-ripple, @click="showModifyContacts('givenName')")
          q-item-section
            q-item-label {{ $t('Given Name') }}
          q-item-section(side) {{ $store.state.currentLinkman && $store.state.currentLinkman.givenName ? $store.state.currentLinkman.givenName : '' }}
          q-item-section(avatar)
            q-icon(name="keyboard_arrow_right")
        q-separator.c-separator(v-if="$store.state.currentLinkman && $store.state.currentLinkman.peerId !== $store.state.myselfPeerClient.peerId"
          style="margin-left:16px;width:calc(100% - 16px)"
        )
        q-item(v-if="$store.state.currentLinkman && $store.state.currentLinkman.peerId !== $store.state.myselfPeerClient.peerId" clickable, v-ripple, @click="showModifyContacts('tags')")
          q-item-section
            q-item-label {{ $t('Tags') }}
          q-item-section(side) {{ $store.state.currentLinkman && $store.state.currentLinkman.tag ? $store.state.currentLinkman.tag : '' }}
          q-item-section(avatar)
            q-icon(name="keyboard_arrow_right")
        q-separator.c-separator(v-if="$store.state.currentLinkman && $store.state.currentLinkman.peerId !== $store.state.myselfPeerClient.peerId"
          style="height:8px;margin-left:0px;margin-right:0px"
        )
        q-item(v-if="$store.state.currentLinkman && $store.state.currentLinkman.peerId !== $store.state.myselfPeerClient.peerId" clickable, v-ripple, @click="subKind = 'jointGroupChat'")
          q-item-section
            q-item-label {{ $t('Joint GroupChats') }}
          q-item-section(side) {{ $store.state.currentLinkman && $store.state.currentLinkman.groupChats ? $store.state.currentLinkman.groupChats.length : '0' }}
          q-item-section(avatar)
            q-icon(name="keyboard_arrow_right")
        q-separator.c-separator(
          style="height:8px;margin-left:0px;margin-right:0px"
        )
        q-item(
          v-if="$store.state.currentLinkman && $store.state.currentLinkman.droppedMe === true",
          clickable,
          v-ripple,
          @click="showSendInvitation"
        )
          q-item-section
          q-item-section(side, style="padding-left:0px")
            q-icon(name="send", color="primary")
          q-item-section.text-primary(side) {{ $t('Send Invitation') }}
          q-item-section
        //q-separator.c-separator
        q-item(
          v-if="$store.state.currentLinkman && !$store.state.currentLinkman.droppedMe",
          clickable, v-ripple, @click="$store.gotoChat($store.state.currentLinkman.peerId)")
          q-item-section
          q-item-section(side, style="padding-left:0px")
            q-icon(
              name="chat",
              :color="!$store.displayActiveStatus || ($store.state.currentLinkman && $store.state.currentLinkman.activeStatus === ActiveStatus.UP) ? 'primary' : 'c-grey'"
            )
          q-item-section(
            side,
            :class="!$store.displayActiveStatus || ($store.state.currentLinkman && $store.state.currentLinkman.activeStatus === ActiveStatus.UP) ? 'text-primary' : ''"
          ) {{ $t('Goto Chat') }}
          q-item-section
    q-tab-panel#avatarContainer(
      :style="heightStyle",
      name="fullscreen",
      style="padding:0px 0px",
      align="center"
    )
      q-toolbar(style="z-index: 999")
        q-btn.text-primary(flat round icon="close" @click="fullscreenBack")
        q-space
        q-btn.text-primary(flat round icon="more_horiz" @click="operateAvatar")
      img#avatarImg(
        :src="$store.state.currentLinkman ? ($store.state.currentLinkman.avatar ? $store.state.currentLinkman.avatar : $store.defaultActiveAvatar) : null"
      )
      canvas#avatar.hidden
    q-tab-panel(name="contactsSubDetails", style="padding:0px 0px")
      q-toolbar
        q-btn(
          flat,
          round,
          icon="keyboard_arrow_left",
          @click="subKind = 'default'"
        )
        q-toolbar-title(align="center", style="padding-right:54px") {{ $store.state.currentLinkman ? ($store.state.currentLinkman.givenName ? $store.state.currentLinkman.givenName : $store.state.currentLinkman.name) + ' - ' + $t('Contacts Setting') : '' }}
      q-list
        q-item
          q-item-section
            q-item-label {{ $t('Join Blacklist') }}
          q-item-section(side)
            q-toggle(
              v-model="$store.state.currentLinkman && $store.state.currentLinkman.status",
              false-value="EFFECTIVE",
              true-value="BLACKED",
              @input="confirmBlackList"
            )
        q-separator.c-separator(
          style="margin-left:16px;width:calc(100% - 16px)"
        )
        q-item
          q-item-section
            q-item-label {{ $t('Lock Contacts') }}
          q-item-section(side)
            q-toggle(
              v-model="$store.state.currentLinkman && $store.state.currentLinkman.locked",
              @input="updateContactsLock"
            )
        q-separator.c-separator(
          style="height:8px;margin-left:0px;margin-right:0px"
        )
        q-item
          q-item-section.text-red(align="center")
            q-btn(
              :label="$t('Remove Contacts')",
              no-caps,
              unelevated,
              color="primary",
              @click="confirmRemoveContacts"
            )
    q-tab-panel(
      :style="heightStyle",
      name="jointGroupChat",
      style="padding:0px 0px"
    )
      q-toolbar
        q-btn(
          flat,
          round,
          icon="keyboard_arrow_left",
          @click="subKind = 'default'"
        )
        q-toolbar-title(align="center", style="padding-right:54px") {{ $store.state.currentLinkman ? ($store.state.currentLinkman.givenName ? $store.state.currentLinkman.givenName : $store.state.currentLinkman.name) + ' - ' + $t('Joint GroupChats') + '(' + ($store.state.currentLinkman.groupChats ? $store.state.currentLinkman.groupChats.length : '0') + ')' : '' }}
      q-list
        div(
          v-for="(groupChat, index) in $store.state.currentLinkman && $store.state.currentLinkman.groupChats ? $store.state.currentLinkman.groupChats : []",
          :key="groupChat.groupId"
        )
          q-item
            q-item-section(avatar)
              groupAvatar(
                v-bind:group_members="groupChat.groupMembers",
                v-bind:avatar_width="66"
              )
            q-item-section
              q-item-label {{ groupChat.givenName ? groupChat.givenName : (groupChat.name ? groupChat.name : '') }}
                q-icon(v-if="$store.displayActiveStatus" class="q-pl-sm" name="person" :color="groupChat && groupChat.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
              q-item-label(caption, lines="1") {{ $t('Name: ') + (groupChat.name ? groupChat.name : '') }}
              q-item-label(caption, lines="5") {{ $t('Description: ') + (groupChat.description ? groupChat.description : '') }}
              //q-item-label(caption, lines="5") {{ $t('Tag: ') + (groupChat.tag ? groupChat.tag : '') }}
              q-item-label(caption, lines="1") {{ $t('HeadCount: ') + (groupChat.groupMembers ? groupChat.groupMembers.length : '') }}
              q-item-label(caption, lines="1") {{ $t('CreateDate: ') + date.formatDate(groupChat.createDate, 'YYYY-MM-DD HH:mm:ss') }}
            q-item-section(side)
              q-btn(
                dense,
                round,
                flat,
                icon="chat",
                :color="!$store.displayActiveStatus || (groupChat && groupChat.activeStatus === ActiveStatus.UP) ? 'primary' : 'c-grey'",
                @click="$store.gotoChat(groupChat.groupId)"
              )
          q-separator.c-separator(inset="item")
          q-separator.c-separator(
            inset="item",
            v-if="$store.state.currentLinkman.groupChats && index < $store.state.currentLinkman.groupChats.length - 1"
          )
          q-separator.c-separator(
            v-if="$store.state.currentLinkman.groupChats && index === $store.state.currentLinkman.groupChats.length - 1"
          )
    q-tab-panel(name="modifyContacts", style="padding:0px 0px")
      q-toolbar
        q-btn(
          flat,
          round,
          dense,
          icon="keyboard_arrow_left",
          color="c-grey-10",
          @click="subKind = 'default'"
        )
        q-toolbar-title(align="center") {{ $t('Edit GivenName&Tags') }}
        q-btn(
          flat,
          round,
          dense,
          icon="check",
          color="primary",
          @click="modifyLinkman"
        )
      q-form(ref="formModifyContacts", @submit="modifyLinkman", class="q-pa-sm")
        q-input.c-field(
          :autofocus="itemName === 'givenName'",
          :label="$t('Given Name')",
          filled,
          clearable,
          v-model="linkmanData.givenName",
          lazy-rules,
          :rules="[]"
        )
        p
        q-select.c-field(
          :autofocus="itemName === 'tags'",
          filled,
          :label="$t('Tags') + $t(' (please input Return after input new tags)')",
          clearable,
          v-model="linkmanData.tagNames",
          use-input,
          use-chips,
          multiple,
          input-debounce="0",
          new-value-mode="add-unique",
          :options="filterOptions",
          @filter="filterFn",
          lazy-rules,
          :rules="[]"
        )
    q-tab-panel(name="sendInvitation", style="padding:0px 0px")
      q-toolbar
        q-btn(
          flat,
          round,
          dense,
          icon="keyboard_arrow_left",
          @click="subKind = 'default'"
        )
        q-toolbar-title(align="center") {{ $t('Send Invitation') }}
        q-btn(
          flat,
          round,
          dense,
          icon="check",
          color="primary",
          @click="addLinkman"
        )
      q-form(ref="formFindSendInvitation", @submit="addLinkman", class="q-pa-sm")
        q-input.c-field(
          autofocus,
          :label="$t('Invite Message')",
          filled,
          clearable,
          v-model="linkmanData.message",
          lazy-rules,
          :rules="[]"
        )
</template>
<script src="./contactsDetails.vue.js" />