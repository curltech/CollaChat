<template lang="pug">
.bg-c-grey-0(:style="heightStyle")
  q-tab-panels(
    v-model="subKind",
    animated,
    transition-prev="slide-right",
    transition-next="slide-left"
  )
    q-tab-panel(name="default", style="padding:0px 0px")
      q-toolbar
        q-btn(
          :class="ifMobileSize || $store.state.ifMobileStyle || $store.phoneContactsEntry === 'findContacts' ? '' : 'hidden'",
          flat,
          round,
          icon="keyboard_arrow_left",
          @click="back"
        )
        q-toolbar-title(
          align="center",
          :style="ifMobileSize || $store.state.ifMobileStyle || $store.phoneContactsEntry === 'findContacts' ? 'padding-left:42px' : ''"
        ) {{ $t('Phone Contacts') }}
        q-btn(
          :class="ifMobileSize || $store.state.ifMobileStyle || $store.phoneContactsEntry === 'findContacts' ? '' : 'hidden'",
          flat,
          round,
          :color="linkmanFilter === true ? 'primary' : 'c-grey-10'",
          icon="account_box",
          @click="linkmanFilter = !linkmanFilter"
        )
        q-btn(
          :class="ifMobileSize || $store.state.ifMobileStyle || $store.phoneContactsEntry === 'findContacts' ? '' : 'hidden'",
          flat,
          round,
          :color="peerFilter === true ? 'primary' : 'c-grey-10'",
          icon="person_pin",
          @click="peerFilter = !peerFilter"
        )
      q-toolbar.q-px-xs(insert)
        q-input.c-field(
          debounce="100",
          filled,
          dense,
          v-model="peerContactsFilter",
          :placeholder="placeholder",
          input-class="text-center iconfont"
        )
          template(slot="append")
            q-icon.cursor-pointer(
              v-if="peerContactsFilter",
              name="cancel",
              @click.stop="peerContactsFilter = null"
            )
      div(v-if="loading", align="center")
        q-spinner-ios(size="2em")
      q-list
        div(
          v-for="(peerContact, index) in peerContactsFilteredList",
          :key="index"
        )
          q-item(clickable, v-ripple)
            q-item-section(
              avatar,
              @click="showPeerContact(peerContact, index)"
            )
              q-avatar
                img(
                  :src="peerContact.peerId ? (peerContact.avatar ? peerContact.avatar : $store.defaultActiveAvatar) : $store.defaultDisabledAvatar"
                )
            q-item-section(@click="showPeerContact(peerContact, index)")
              q-item-label(lines="1") {{ peerContact.formattedName }}
              q-item-label(lines="1", v-if="peerContact.peerId") {{ peerContact.peerId ? (peerContact.givenName ? peerContact.givenName : peerContact.name) : '' }}
              q-item-label(lines="1") {{ peerContact.mobile }}
            q-item-section(v-if="peerContact.peerId", side)
              q-btn(round, dense, flat, color="primary", icon="videocam" @click="mediaRequest('video',peerContact)")
            q-item-section(v-if="peerContact.peerId", side)
              q-btn(round, dense, flat, color="primary", icon="call" @click="mediaRequest('audio',peerContact)")
          q-separator.c-separator(
            inset="item",
            v-if="index < peerContactsFilteredList.length - 1"
          )
          q-separator.c-separator(
            v-if="index === peerContactsFilteredList.length - 1"
          )
    q-tab-panel(name="phoneContactDetail", style="padding:0px 0px")
      q-toolbar
        q-btn(
          flat,
          round,
          dense,
          icon="keyboard_arrow_left",
          @click="subKind = 'default'"
        )
        q-toolbar-title(
          align="center",
        ) {{ currentPeerContact.formattedName }}
        q-btn(
          flat,
          round,
          dense,
          color="primary",
          icon="refresh",
          @click="refresh"
        )
      q-list
        q-item(clickable, v-ripple)
          q-item-section
            q-item-label {{ $t('Avatar') }}
          q-item-section(avatar)
            q-avatar(size="32px")
              img(
                :src="currentPeerContact.peerId ? (currentPeerContact.avatar ? currentPeerContact.avatar : $store.defaultActiveAvatar) : $store.defaultDisabledAvatar"
              )
        q-separator.c-separator(
          style="margin-left:16px;width:calc(100% - 16px)"
        )
        q-item(clickable, v-ripple)
          q-item-section
            q-item-label {{ $t('Mobile') }}
          q-item-section(side) {{ currentPeerContact.mobile }}
        //q-separator.c-separator(
            style="margin-left:16px;width:calc(100% - 16px)"
          )
        q-item(clickable, v-ripple, v-if="currentPeerContact.peerId")
          q-item-section(side)
            q-item-label {{ $t('Peer Id') }}
          q-item-section
            q-item-label(caption, lines="3", style="word-break:break-all") {{ currentPeerContact.peerId }}
          q-item-section(side)
            q-btn.text-primary(
              flat,
              dense,
              round,
              icon="content_copy",
              v-clipboard:copy="currentPeerContact.peerId",
              v-clipboard:success="onCopySuccess",
              v-clipboard:error="onCopyFailure"
            )
        q-separator.c-separator(v-if="currentPeerContact.peerId"
          style="margin-left:16px;width:calc(100% - 16px)"
        )
        q-item(clickable, v-ripple, v-if="currentPeerContact.peerId")
          q-item-section
            q-item-label {{ $t('UserName') }}
          q-item-section(side) {{ currentPeerContact.name }}
        //q-separator.c-separator(
            style="margin-left:16px;width:calc(100% - 16px)"
          )
        q-separator.c-separator(
          style="height:8px;margin-left:0px;margin-right:0px"
        )
        //q-item(clickable, v-ripple, v-if="currentPeerContact.peerId")
          q-item-section
            q-item-label {{ $t('isLinkman') }}
          q-item-section(side, v-if="!currentPeerContact.isLinkman === true")
            q-btn.text-primary(
              flat,
              dense,
              round,
              icon="group_add",
              @click="showAddContacts"
            )
          q-item-section(side, v-if="currentPeerContact.isLinkman === true")
            q-icon(color="primary", name="group")
        //q-separator.c-separator(
            style="margin-left:16px;width:calc(100% - 16px)"
          )
        q-item(clickable, v-ripple, v-if="currentPeerContact.isLinkman === true" @click="$store.gotoChat(currentPeerContact.peerId)")
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
        q-item(clickable, v-ripple, v-if="currentPeerContact.peerId && currentPeerContact.isLinkman !== true" @click="showAddContacts")
          q-item-section
          q-item-section(side, style="padding-left:0px")
            q-icon(name="person_add" color="primary")
          q-item-section.text-primary(side) {{ $t('Add Contacts') }}
          q-item-section
        //q-item(clickable, v-ripple, v-if="currentPeerContact.peerId")
          q-item-section
            q-item-label {{ $t('givenName') }}
          q-item-section(side) {{ currentPeerContact.givenName }}
        //q-separator.c-separator(
            style="margin-left:16px;width:calc(100% - 16px)"
          )
        //q-item(clickable, v-ripple, v-if="currentPeerContact.peerId")
          q-item-section
            q-item-label {{ $t('publicKey') }}
            q-item-label(caption, lines="3") {{ currentPeerContact.publicKey }}
        //q-separator.c-separator(
            style="margin-left:16px;width:calc(100% - 16px)"
          )
        //q-item(clickable, v-ripple, v-if="currentPeerContact.peerId")
          q-item-section
            q-item-label {{ $t('locked') }}
          q-item-section(side) {{ currentPeerContact.locked }}
        //q-separator.c-separator(
            style="margin-left:16px;width:calc(100% - 16px)"
          )
        //q-item(clickable, v-ripple, v-if="currentPeerContact.peerId")
          q-item-section
            q-item-label {{ $t('status') }}
          q-item-section(side) {{ currentPeerContact.status }}
        //q-separator.c-separator(
            style="margin-left:16px;width:calc(100% - 16px)"
          )
    q-tab-panel(name="contactsDetails", style="padding:0px 0px")
      contactsDetails.drawcontent
    q-tab-panel(name="findContacts", style="padding:0px 0px")
      findContacts.drawcontent
</template>
<script src="./phoneContactsList.vue.js" />
