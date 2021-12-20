<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changePrivacySubKind('default')")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('Locklist') + '(' + LockList.length + ')'}}
        q-toolbar(insert class="q-px-xs")
          q-input.c-field(autofocus debounce="100" filled dense v-model="filter" :placeholder="placeholder" input-class="text-center iconfont")
            template(slot="append")
              //q-icon(v-if="!filter" name="search")
              //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="filter = null")
              q-icon(v-if="filter" name="cancel" class="cursor-pointer" @click.stop="filter = null")
        q-list
          div(v-for="(linkman, index) in LockList" :key="linkman.peerId")
            q-item(clickable v-ripple @click="showContacts(linkman, index)")
              q-item-section(avatar bolder)
                q-avatar(size="64px")
                  img(:src="linkman.avatar ? linkman.avatar : $store.defaultActiveAvatar")
              q-item-section
                q-item-label {{ linkman.givenName ? linkman.givenName : linkman.name }}
                  q-icon(v-if="$store.displayActiveStatus" name="person" :color="linkman.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
              q-item-section(avatar)
                q-icon(color="c-grey-7" :name="linkman.locked ? 'lock' : ''")
              //q-item-section(side)
                q-btn.text-primary(dense round flat icon="remove_circle" @click="unlock(linkman)")
            q-separator.c-separator(inset="item" v-if="index < LockList.length - 1")
            q-separator.c-separator(v-if="index === LockList.length - 1")
      q-tab-panel(name="contactsDetails" style="padding:0px 0px")
        contactsDetails.drawcontent
</template>
<script src="./lockList.vue.js" />