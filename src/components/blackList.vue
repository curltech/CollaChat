<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changePrivacySubKind('default')")
          q-toolbar-title(align="center") {{$t('Blacklist') + '(' + BlackList.length + ')'}}
          q-btn.text-primary(flat round :icon="$store.state.lockContactsSwitch ? 'visibility_off' : 'visibility'" @click="showLockContactsSwitchDialog")
        q-toolbar(insert class="q-px-xs")
          q-input.c-field(autofocus debounce="100" filled dense v-model="filter" :placeholder="placeholder" input-class="text-center iconfont")
            template(slot="append")
              //q-icon(v-if="!filter" name="search")
              //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="filter = null")
              q-icon(v-if="filter" name="cancel" class="cursor-pointer" @click.stop="filter = null")
        q-list
          div(v-for="(linkman, index) in BlackList" :key="linkman.peerId")
            q-item(clickable v-ripple @click="showContacts(linkman, index)")
              q-item-section(avatar bolder)
                q-avatar(size="64px")
                  img(:src="linkman.avatar ? linkman.avatar : $store.defaultActiveAvatar")
              q-item-section
                q-item-label {{ linkman.givenName ? linkman.givenName : linkman.name }}
                  q-icon(v-if="$store.displayActiveStatus" name="person" :color="linkman.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
              //q-item-section
                q-item-label(caption lines="1") {{ $t('JoinTime: ') + date.formatDate(linkman.statusDate, 'YYYY-MM-DD HH:mm:ss') }}
              //q-item-section(side)
                q-btn.text-primary(dense round flat icon="remove_circle" @click="unblack(linkman)")
              q-item-section(avatar)
                q-icon(color="c-grey-10" :name="linkman.locked ? 'lock' : ''")
            q-separator.c-separator(inset="item" v-if="index < BlackList.length - 1")
            q-separator.c-separator(v-if="index === BlackList.length - 1")
      q-tab-panel(name="contactsDetails" style="padding:0px 0px")
        contactsDetails.drawcontent
    q-dialog(v-model="lockContactsSwitchDialog" persistent)
      q-card(style="width: 250px")
        q-bar(class="bg-primary text-c-grey-0")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section
          q-form(ref="formUnlockContacts" @submit="updateLockContactsSwitch")
            q-input.c-field(:label="$t('Please input Password')" autofocus filled clearable v-model="password" type="password" lazy-rules :rules="[]")
        q-card-actions(align="right")
          q-btn(color="primary" round unelevated icon="check" v-close-popup @click="updateLockContactsSwitch")
</template>
<script src="./blackList.vue.js" />