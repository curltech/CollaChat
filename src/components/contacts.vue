<template lang="pug">
  div(:class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'bg-c-grey-1 heightMobileSize-me' : 'bg-c-grey-1 heightMobileStyle-me') : 'bg-c-grey-1 heightStyle-me'")
    q-tab-panels.bg-c-grey-1(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(name="default" class="q-pa-none")
        q-toolbar.header-toolbar(:class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'")
          q-btn.text-primary(flat round :icon="$store.state.lockContactsSwitch ? 'visibility_off' : 'visibility'" @click="showLockContactsSwitchDialog")
          q-toolbar-title(align="center" class="text-c-grey-10") {{$t('Contacts')}}
          q-btn.text-primary(flat round icon="person_add" @click="findContacts")
        div.scroll.header-mar-top(:class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize' : 'scrollHeightMobileStyle') : 'scrollHeightStyle'")
          q-toolbar(insert :class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'" class="q-px-xs")
            q-input.c-field(debounce="100" filled dense v-model="contactsfilter" :placeholder="placeholder" input-class="text-center iconfont")
              template(slot="append")
                //q-icon(v-if="!contactsfilter" name="search")
                //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="contactsfilter = null")
                q-icon(v-if="contactsfilter" name="cancel" class="cursor-pointer" @click.stop="contactsfilter = null")
          q-list
            q-item(clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2'" class="text-c-grey-10" :active="$store.getKind() === 'receivedList'" @click="$store.state.currentLinkman = null;$store.changeKind('receivedList', 'contacts');$store.toggleDrawer(true)")
              q-item-section(avatar)
                q-icon(name="person_pin" color="primary")
              q-item-section {{$t('Contacts Requests')}}
              q-item-section(side)
                q-badge(v-if="ReceivedList.length > 0" color="red") {{ReceivedList.length}}
              q-item-section(avatar)
                q-icon(v-if="ifMobileSize || $store.state.ifMobileStyle" name="keyboard_arrow_right")
            //q-separator.c-separator(inset="item")
            q-item(clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2'" class="text-c-grey-10" :active="$store.getKind() === 'groupChatList'" @click="$store.state.currentLinkman = null;$store.changeKind('groupChatList', 'contacts');$store.toggleDrawer(true)")
              q-item-section(avatar)
                q-icon(name="people" color="primary")
              q-item-section {{$t('Group Chat')}}
              //q-item-section(side) {{$store.state.groupChats.length}}
              q-item-section(avatar)
                q-icon(v-if="ifMobileSize || $store.state.ifMobileStyle" name="keyboard_arrow_right")
            //q-separator.c-separator(inset="item")
            q-item(v-if="ifMobileSize || $store.state.ifMobileStyle" clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2'" class="text-c-grey-10" :active="$store.getKind() === 'phoneContactsList'" @click="$store.state.currentLinkman = null;$store.phoneContactsEntry = 'contacts';$store.changeKind('phoneContactsList', 'contacts');$store.toggleDrawer(true)")
              q-item-section(avatar)
                q-icon(name="contacts" color="primary")
              q-item-section {{$t('Phone Contacts')}}
              q-item-section(avatar)
                q-icon(name="keyboard_arrow_right")
            //q-separator.c-separator(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" inset="item")
            q-item(clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2'" class="text-c-grey-10" :active="$store.getKind() === 'contactsTagList'" @click="$store.state.currentLinkman = null;$store.changeKind('contactsTagList', 'contacts');$store.toggleDrawer(true)")
              q-item-section(avatar)
                q-icon(name="label" color="primary")
              q-item-section {{$t('Tags')}}
              q-item-section(avatar)
                q-icon(v-if="ifMobileSize || $store.state.ifMobileStyle" name="keyboard_arrow_right")
            q-item(class="text-c-grey-10")
              q-item-section(side)
                q-item-label(caption) {{$t('Contacts') + '(' + LinkmanFilteredList.length + ')'}}
            //div(class="q-pl-md q-py-xs") {{$t('Contacts') + '(' + LinkmanFilteredList.length + ')'}}
            div(v-for="(linkman, index) in LinkmanFilteredList" :key="linkman.peerId")
              q-item(clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2'" class="text-c-grey-10" :active="$store.getKind() === 'contactsDetails' && linkman === $store.state.currentLinkman" @click="contactsSelected(linkman, index)")
                q-item-section(avatar)
                    q-avatar
                      img(:src="linkman.avatar ? linkman.avatar : $store.defaultActiveAvatar")
                q-item-section
                  q-item-label {{ linkman.givenName ? linkman.givenName : linkman.name }}
                    q-icon(v-if="$store.displayActiveStatus" class="q-pl-sm" name="person" :color="linkman.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
                q-item-section(avatar)
                  q-icon(color="primary" :name="linkman.locked ? 'lock' : ''")
              //q-separator.c-separator(inset="item" v-if="index < LinkmanFilteredList.length - 1")
              //q-separator.c-separator(v-if="index === LinkmanFilteredList.length - 1")
    q-dialog(v-model="lockContactsSwitchDialog" persistent)
      q-card(style="width: 250px;")
        q-bar(class="bg-primary text-c-grey-1")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section
          q-form(ref="formUnlockContacts" @submit="updateLockContactsSwitch")
            q-input.c-field(:label="$t('Please input Password')" autofocus dense filled clearable v-model="password" type="password" lazy-rules :rules="[]")
        q-card-actions(align="right")
          q-btn(color="primary" round dense icon="check" unelevated v-close-popup @click="updateLockContactsSwitch")
</template>
<script src="./contacts.vue.js" />
