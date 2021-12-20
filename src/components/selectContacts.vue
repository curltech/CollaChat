<template lang="pug">
  div.bg-c-grey-0(:style="heightStyle")
    q-toolbar
      q-btn(flat round icon="keyboard_arrow_left" @click="back")
      q-toolbar-title(align="center") {{$t('Select Contacts')}}
      q-btn(flat icon="check" :disable="SelectedLinkmanList.length < 1" :label="(SelectedLinkmanList.length > 0 ? '(' + SelectedLinkmanList.length + ')' : '')" :class="SelectedLinkmanList.length > 0 ? 'text-primary' : 'c-grey-0'" @click="doneSelectGroupChatLinkman")
    q-toolbar(insert)
      q-input.c-field(debounce="100" filled dense v-model="selectContactsfilter" :placeholder="placeholder" input-class="text-center iconfont")
        template(slot="append")
          //q-icon(v-if="!selectContactsfilter" name="search")
          //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="selectContactsfilter = null")
          q-icon(v-if="selectContactsfilter" name="cancel" class="cursor-pointer" @click.stop="selectContactsfilter = null")
    q-list(:class="SelectedLinkmanList.length > 0 ? '' : 'hidden'")
      //q-separator.c-separator
      q-item
        q-item-section(side v-for="(selectedLinkman, index) in SelectedLinkmanList" :key="selectedLinkman.peerId")
          q-btn(flat dense :label="selectedLinkman.givenName ? (selectedLinkman.givenName.length > 3 ? selectedLinkman.givenName.substr(0, 3) + '...' : selectedLinkman.givenName) : (selectedLinkman.name.length > 3 ? selectedLinkman.name.substr(0, 3) + '...' : selectedLinkman.name)" @click="unselectGroupChatLinkman(index)")
            q-avatar(size="32px")
              img(:src="selectedLinkman.avatar ? selectedLinkman.avatar : $store.defaultActiveAvatar")
    div(class="bg-c-grey-0 text-c-grey-10 q-pl-md q-py-xs") {{$t('Contacts')}}
    q-list
      div(v-for="(selectLinkman, index) in SelectLinkmanFilteredList" v-if="!selectLinkman.existing" :key="selectLinkman.peerId")
        q-item(clickable v-ripple @click="selectGroupChatLinkman(selectLinkman)")
          q-item-section(side)
            q-checkbox(dense v-model="selectLinkman.selected" color="primary" @input="selectGroupChatLinkman(selectLinkman, true)")
          q-item-section(avatar)
            q-avatar
              img(:src="selectLinkman.avatar ? selectLinkman.avatar : $store.defaultActiveAvatar")
          q-item-section
            q-item-label {{ selectLinkman.givenName ? selectLinkman.givenName : selectLinkman.name }}
              q-icon(v-if="$store.displayActiveStatus" name="person" :color="selectLinkman.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
          q-item-section(avatar)
            q-icon(color="primary" :name="selectLinkman.locked ? 'lock' : ''")
        //q-separator.c-separator(inset="item" v-if="index < SelectLinkmanFilteredList.length - 1")
        //q-separator.c-separator(v-if="index === SelectLinkmanFilteredList.length - 1")
</template>
<script src="./selectContacts.vue.js" />