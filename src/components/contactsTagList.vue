<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{$t('Tags') + '(' + linkmanTags.length + ')'}}
          q-btn.text-primary(flat round icon="add_circle_outline" @click="showAddContactsTag")
        q-list
          div(v-for="(linkmanTag, index) in linkmanTags" :key="linkmanTag._id")
            q-item(clickable v-ripple @click="showModifyContactsTag(linkmanTag)")
              q-item-section
                q-item-label {{ linkmanTag.name + '(' + linkmanTag.linkmanTagLinkmans.length + ')' }}
                q-item-label(caption lines="1") {{ linkmanTag.linkmansName }}
              //q-item-section(avatar)
              //  q-icon(name="keyboard_arrow_right" color="c-grey-5")
              q-item-section(side)
                q-btn.text-primary(dense round flat icon="remove_circle_outline" @click="confirmRemoveLinkmanTag(linkmanTag)")
            q-separator.c-separator(v-if="index < linkmanTags.length - 1" style="margin-left:16px;width:calc(100% - 16px)")
            q-separator.c-separator(v-if="index === linkmanTags.length - 1")
      q-tab-panel(:style="heightStyle" name="editContactsTag" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          q-toolbar-title(align="center") {{ $t('Edit Tags') }}
          q-btn(flat round icon="check" :disable="!$store.state.linkmanTagData.name" :class="$store.state.linkmanTagData.name ? 'text-primary' : 'c-grey-0'" @click="saveLinkmanTag")
        q-form(ref="formEditContactsTag" class="q-pa-sm")
          q-input.c-field(autofocus filled :label="$t('Name')" clearable v-model="$store.state.linkmanTagData.name" lazy-rules :rules="[ val => val && val.length > 0 || $t('Please input Name')]")
        p
        q-list(dense)
          q-item(style="padding-left:12px" clickable v-ripple @click="addLinkmanTagLinkman")
            q-item-section(class="text-c-grey-10") {{$t('Contacts') + '(' + $store.state.linkmanTagData.linkmans.length + ')'}}
            q-item-section(side)
              q-btn.text-primary(dense round flat icon="add_circle_outline")
          div(v-for="(linkman, index) in $store.state.linkmanTagData.linkmans" :key="linkman.peerId")
            q-item.bg-c-grey-0(style="padding-left:12px" clickable v-ripple)
              q-item-section(avatar @click="showContacts(linkman, index)")
                q-avatar
                  img(:src="linkman.avatar ? linkman.avatar : $store.defaultActiveAvatar")
              q-item-section(@click="showContacts(linkman, index)")
                q-item-label {{ linkman.givenName ? linkman.givenName : linkman.name }}
                  q-icon(v-if="$store.displayActiveStatus" name="person" :color="linkman.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
              q-item-section(side)
                q-btn.text-primary(dense round flat icon="remove_circle_outline" @click="removeLinkmanTagLinkman(linkman)")
            q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)" v-if="index < $store.state.linkmans.length - 1")
            q-separator.c-separator(v-if="index === $store.state.linkmans.length - 1")
      q-tab-panel(name="selectContacts" style="padding:0px 0px")
        selectContacts.drawcontent
      q-tab-panel(name="contactsDetails" style="padding:0px 0px")
        contactsDetails.drawcontent
</template>
<script src="./contactsTagList.vue.js" />