<template lang="pug">
  div(:class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1 heightMobileStyle-me' : 'bg-c-grey-1 heightStyle-me'")
    q-tab-panels.bg-c-grey-1(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(name="default" class="q-pa-none")
        q-toolbar.header-toolbar(:class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'")
          q-btn.btnIcon(flat round dense :icon="$store.state.lockContactsSwitch ? 'visibility_off' : 'visibility'" @click="")
          q-toolbar-title(align="center") {{$t('Channel')}}
          q-btn.btnIcon(flat round dense icon="add_circle_outline" @click="newChannel")
        div.scroll.header-mar-top(:class="ifMobileSize || $store.state.ifMobileStyle ? 'scrollHeightMobileStyle' : 'scrollHeightStyle'")
          q-toolbar(insert :class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'" class="q-px-xs")
            q-input.c-field(debounce="100" filled dense v-model="searchText" :placeholder="placeholder" input-class="text-center iconfont" @focus="searchFocus")
              template(slot="append")
                //q-icon(v-if="!channelfilter" name="search")
                //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="channelfilter = null")
                //q-icon(v-if="channelfilter" name="cancel" class="cursor-pointer" color="primary" @click.stop="channelfilter = null")
                q-icon(v-if="searchText" name="cancel" class="cursor-pointer" @click.stop="searchText = null")
        q-list
          div(v-for="(channel, index) in ChannelFilteredList" :key="channel.channelId")
            q-item(clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2'" class="text-c-grey-10" :active="($store.getKind() === 'channelDetails' && channel === $store.state.currentChannel) || channel.top === true" @click="channelSelected(channel, index)")
              q-item-section(avatar)
                q-avatar(size="32px")
                  img(:src="channel.avatar ? channel.avatar : $store.defaultActiveAvatar")
                  q-badge(color="red" floating)
              q-item-section
                q-item-label {{ channel.name }}
                q-item-label last article's title
              q-item-section(side)
                q-item-label {{ detailDateFormat(channel.updateDate) }}
      q-tab-panel(name="search" class="q-pa-none")
        q-toolbar.header-toolbar
          q-btn(v-if="searchResult !== 'allResult'" flat round icon="keyboard_arrow_left" @click="resultBack()")
          q-input.c-field(debounce="100" filled dense v-model="searchText" :placeholder="placeholder" input-class="iconfont" style="width: 86%" autofocus @keyup="searchKeyup" @input="searchInput")
            template(slot="append")
              q-icon(v-if="searchText" name="cancel" class="cursor-pointer" @click.stop="searchText = null;searching = false")
          q-btn.btnIcon(flat round icon="close" @click="searchBack()")
        div.scroll.header-mar-top(:class="ifMobileSize || $store.state.ifMobileStyle ? 'scrollHeightMobileStyle-editor' : 'scrollHeightStyle'")
          q-list(v-if="searching===true")
            q-item(v-if="searchResult === 'allResult' || searchResult === 'channelResult'" class="text-c-grey-10")
              q-item-section(side)
                q-item-label(caption) {{ $t('Followed Channel') }}
            div(v-for="(channel, channelIndex) in (channelResultList ? channelResultList : [])" :key="channelIndex")
              q-item(v-if="(searchResult === 'allResult' && channelIndex < 3) || searchResult === 'channelResult'" clickable v-ripple class="text-c-grey-10" @click="channelResultSelected(channel, channelIndex)")
                q-item-section(avatar)
                    q-avatar
                      img(:src="channel.avatar ? channel.avatar : $store.defaultActiveAvatar")
                q-item-section
                  q-item-label(v-html="channel.highlightingName ? channel.highlightingName : channel.name")
                  q-item-label(v-if="channel.highlighting" caption v-html="channel.highlighting")
            q-item(v-if="searchResult === 'allResult' && channelResultList && channelResultList.length > 3" clickable v-ripple class="text-c-grey-10" @click="channelResult()")
              q-item-section(side)
                q-icon(name="search")
              q-item-section
                q-item-label(caption) {{ $t('More Channels') + '(' + channelResultList.length + ')' }}
              q-item-section(avatar)
                q-icon(name="keyboard_arrow_right")
            q-separator.c-separator(v-if="searchResult === 'allResult'" style="height:8px;margin-left:0px;margin-right:0px")
          q-list(v-if="searching===true")
            q-item(v-if="searchResult === 'allResult' || searchResult === 'followChannelArticleResult'" class="text-c-grey-10")
              q-item-section(side)
                q-item-label(caption) {{ $t('Followed Channel Article') }}
            div(v-for="(followChannelArticle, followChannelArticleIndex) in (followChannelArticleResultList ? followChannelArticleResultList : [])" :key="followChannelArticleIndex")
              q-item(v-if="(searchResult === 'allResult' && followChannelArticleIndex < 3) || searchResult === 'followChannelArticleResult'" clickable v-ripple class="text-c-grey-10" @click="followChannelArticleResultSelected(followChannelArticle, followChannelArticleIndex)")
                q-item-section(avatar)
                  groupAvatar(v-bind:group_members="groupChat.groupMembers" v-bind:avatar_width="40")
                q-item-section
                  q-item-label(v-html="groupChat.highlightingGivenName ? groupChat.highlightingGivenName : (groupChat.givenName ? groupChat.givenName : (groupChat.highlightingName ? groupChat.highlightingName : groupChat.name))")
                    q-icon(class="q-pl-sm" name="person" :color="groupChat && groupChat.activeStatus === ActiveStatus.UP ? 'secondary' : 'c-grey'")
                  q-item-label(v-if="groupChat.highlighting" caption v-html="groupChat.highlighting")
            q-item(v-if="searchResult === 'allResult' && groupChatResultList && groupChatResultList.length > 3" clickable v-ripple class="text-c-grey-10" @click="groupChatResult()")
              q-item-section(side)
                q-icon(name="search")
              q-item-section
                q-item-label(caption) {{ $t('More Articles') + '(' + followChannelArticleResultList.length + ')' }}
              q-item-section(avatar)
                q-icon(name="keyboard_arrow_right")
</template>
<script src="./channel.vue.js" />
