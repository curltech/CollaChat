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
            q-item(v-if="searchResult === 'allResult' || searchResult === 'followChannelResult'" class="text-c-grey-10")
              q-item-section(side)
                q-item-label(caption) {{ $t('Followed Channel') }}
            div(v-for="(followChannel, followChannelIndex) in (followChannelResultList ? followChannelResultList : [])" :key="followChannelIndex")
              q-item(v-if="(searchResult === 'allResult' && followChannelIndex < 3) || searchResult === 'followChannelResult'" clickable v-ripple class="text-c-grey-10" @click="followChannelResultSelected(followChannel, followChannelIndex)")
                q-item-section(avatar)
                  q-avatar
                    img(:src="followChannel.avatar ? followChannel.avatar : $store.defaultActiveAvatar")
                q-item-section
                  q-item-label(v-html="followChannel.highlightingName ? followChannel.highlightingName : followChannel.name")
            q-item(v-if="searchResult === 'allResult' && followChannelResultList && followChannelResultList.length > 3" clickable v-ripple class="text-c-grey-10" @click="followChannelResult()")
              q-item-section(side)
                q-icon(name="search")
              q-item-section
                q-item-label(caption) {{ $t('More Channels') + '(' + followChannelResultList.length + ')' }}
              q-item-section(avatar)
                q-icon(name="keyboard_arrow_right")
            q-separator.c-separator(v-if="searchResult === 'allResult'" style="height:8px;margin-left:0px;margin-right:0px")
          q-list(v-if="searching===true")
            q-item(v-if="searchResult === 'allResult' || searchResult === 'followChannelArticleResult'" class="text-c-grey-10")
              q-item-section(side)
                q-item-label(caption) {{ $t('Followed Channel Article') }}
            div(v-for="(followChannelArticle, followChannelArticleIndex) in (followChannelArticleResultList ? followChannelArticleResultList : [])" :key="followChannelArticleIndex")
              q-item(v-if="(searchResult === 'allResult' && followChannelArticleIndex < 3) || searchResult === 'followChannelArticleResult'" clickable v-ripple class="text-c-grey-10" @click="followChannelArticleResultSelected(followChannelArticle, followChannelArticleIndex)")
                q-list
                  q-item(class="q-pa-none" style="min-height: 32px")
                    q-item-section
                      q-item-label(v-html="followChannelArticle.highlightingTitle ? followChannelArticle.highlightingTitle : followChannelArticle.title")
                  q-item(class="q-pa-none")
                    q-item-section(avatar)
                      q-avatar
                        img(:src="followChannelArticle.cover ? followChannelArticle.cover : $store.defaultActiveAvatar")
                    q-item-section
                      q-item-label(v-if="followChannelArticle.plainContent" caption lines="2" v-html="followChannelArticle.highlightingPlainContent ? followChannelArticle.highlightingPlainContent : followChannelArticle.plainContent")
                      q-item-label(caption class="q-pt-xs") {{ ($store.state.channelMap[followChannelArticle.channelId] ? $store.state.channelMap[followChannelArticle.channelId].name : '') + ' ' + ($store.state.channelMap[followChannelArticle.channelId] ? detailDateFormat($store.state.channelMap[followChannelArticle.channelId].updateDate) : '') }}
            q-item(v-if="searchResult === 'allResult' && followChannelArticleResultList && followChannelArticleResultList.length > 3" clickable v-ripple class="text-c-grey-10" @click="followChannelArticleResult()")
              q-item-section(side)
                q-icon(name="search")
              q-item-section
                q-item-label(caption) {{ $t('More Articles') + '(' + followChannelArticleResultList.length + ')' }}
              q-item-section(avatar)
                q-icon(name="keyboard_arrow_right")
</template>
<script src="./channel.vue.js" />
