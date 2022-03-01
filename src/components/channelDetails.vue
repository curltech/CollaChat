<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel.bg-c-grey-message(:style="heightStyle" name="default" class="q-pa-none")
        q-toolbar.bg-c-grey-0
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle || $store.channelDetailsChannelEntry === 'article' ? '' : 'hidden'" flat round icon="keyboard_arrow_left" @click="channelBack()")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{$t('Channel')}}
          q-btn.text-primary(flat round icon="more_horiz" @click="channelCommand()")
        q-list.bg-c-grey-0
          q-item
            q-item-section(avatar)
              q-avatar(size="64px")
                img(:src="$store.state.currentChannel && $store.state.currentChannel.avatar ? $store.state.currentChannel.avatar : $store.defaultActiveAvatar")
            q-item-section
              q-item-label(class="text-h6") {{ $store.state.currentChannel ? $store.state.currentChannel.name : '' }}
                q-icon(:name="$store.state.currentChannel && $store.state.currentChannel.top ? 'star' : ''" color="primary")
            q-item-section(v-if="$store.state.currentChannel && $store.state.currentChannel.creator !== $store.state.myselfPeerClient.peerId" side)
              q-btn.text-primary.bg-c-grey-message(flat @click="follow()" :label="$store.state.currentChannel && $store.state.currentChannel.markDate ? $t('Unfollow') : $t('Follow')" no-caps)
          q-item
            q-item-section
              q-item-label(caption) {{ $store.state.currentChannel ? $store.state.currentChannel.description : '' }}
        div(v-for="(article, index) in $store.state.articles" :key="article.articleId" style="width: 80%; margin: auto")
          q-card(flat @click="articleSelected(article, index)")
            q-card-section.bg-c-grey-message(class="text-center" style="height: 50px")
              q-item-label(caption :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{ detailDateFormat(article.updateDate) }}
            q-card-section(class="q-pa-none")
              q-img(:src="article.cover ? article.cover : $store.defaultChannelArticleCover" style="height: 200px; width: 100%")
            q-card-section(class="q-py-md")
              q-item-label(class="note-title") {{ article.title }}
              q-item-label(v-if="article.abstract" class="q-py-sm note-caption" :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{ article.abstract }}
      q-tab-panel(:style="heightStyle" name="view" class="q-pa-none")
        q-toolbar.header-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="articleBack()")
          q-space
          q-btn.text-primary(flat round icon="more_horiz" @click="viewCommand()")
        div.scroll.header-mar-top.bg-c-white(v-if="$store.state.currentArticle" class="q-pl-md" id="scroll-target-view" :class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-editor' : 'scrollHeightMobileStyle-editor') : 'scrollHeightStyle'")
          div(class="q-py-md text-h6") {{ $store.state.currentArticle.title }}
          div(class="q-pb-lg")
            span(class="q-item__label--caption text-caption" :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{ $store.state.currentArticle.author }}
            span(class="q-px-sm text-primary cursor-pointer" @click="channelNameClick") {{ $store.state.channelMap[$store.state.currentArticle.channelId].name }}
            span(class="q-item__label--caption text-caption" :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{ detailDateFormat($store.state.currentArticle.updateDate) }}
          iframe(v-if="$store.state.currentArticle.content && $store.state.currentArticle.content.substr(0,4)==='http'" id="iframeContent"
            :src="$store.state.currentArticle.content" frameborder="no" border="0" marginwidth="0" marginheight="0" allowtransparency="yes" scrolling="yes")
          div(v-if="$store.state.currentArticle.content && $store.state.currentArticle.content.substr(0,4)!=='http'" v-html="$store.state.currentArticle.content")
      q-tab-panel(:style="heightStyle" name="newArticle" class="q-pa-none")
        newArticle.drawcontent
      q-tab-panel(:style="heightStyle" name="editChannel" class="q-pa-none")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind='default'")
          q-toolbar-title(align="center") {{$t('Edit Channel')}}
          q-btn(flat round icon="check" @click="editChannel" :disable="!channelData.name" :class="channelData.name?'text-primary':'c-grey-0'")
        q-card(flat)
          q-card-section(align="center")
            q-item-label(class="q-field__label q-py-sm" :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{$t('Channel Avatar')}}
            P
            q-avatar(size="64px" class="cursor-pointer" @click="$refs.channelUpload.pickFiles()")
              img(:src="channelData.avatar ? channelData.avatar : $store.defaultChannelAvatar")
          q-card-section(class="q-pt-none")
            q-form(ref="formCreateChannel" @submit="editChannel" class="q-pa-sm")
              q-input.c-field(autofocus :label="$t('Name')" filled clearable v-model="channelData.name" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input Name')]")
              p
              q-input.c-field(:label="$t('Description')" filled clearable v-model="channelData.description" lazy-rules :rules="[]")
      q-tab-panel(name="selectChat" style="padding:0px 0px")
        selectChat.drawcontent
    q-uploader(style="display:none" ref="channelUpload" @added="files => channelUpload(files)" accept=".jpg, image/*")
</template>
<script src="./channelDetails.vue.js" />