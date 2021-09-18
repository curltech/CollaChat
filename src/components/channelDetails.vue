<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel.bg-c-grey-message(:style="heightStyle" name="default" class="q-pa-none")
        q-toolbar.bg-c-grey-0
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round dense icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{$t('Channel')}}
          q-btn.btnIcon(flat round dense icon="more_horiz" @click="channelCommand()")
        q-list.bg-c-grey-0(flat)
          q-item
            q-item-section(avatar)
              q-avatar(size="64px")
                img(:src="$store.state.currentChannel.avatar ? $store.state.currentChannel.avatar : $store.defaultActiveAvatar")
            q-item-section
              q-item-label(class="text-h6") {{$store.state.currentChannel.name}}
            q-item-section(side)
              q-btn.bg-c-grey-message(style="width: 80px;" @click="follow()" :label="$store.state.currentChannel.markDate ? $t('Unfollow') : $t('Follow')" no-caps)
          q-item
            q-item-section
              q-item-label {{$store.state.currentChannel.description}}
        div(v-for="(article, index) in ArticleFilteredList" :key="article.articleId" style="width: 80%; margin: auto")
          q-card(flat @click="articleSelected(article, index)")
            q-card-section.bg-c-grey-message(class="text-center" style="height: 50px") {{ detailDateFormat(article.updateDate) }}
            q-card-section(class="q-pa-none")
              q-img(:src="article.cover" style="height: 200px; width: 100%")
            q-card-section(class="q-py-md")
              q-item-label(class="text-h6") {{ article.title }}
              q-item-label(v-if="article.abstract" class="q-py-sm") {{ article.abstract }}
      q-tab-panel(:style="heightStyle" name="view" class="q-pa-none")
        q-toolbar.header-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind='default'")
          q-space
          q-btn.btnIcon(flat round icon="more_horiz" @click="viewCommand()")
        div.scroll.header-mar-top.bg-c-white(v-if="$store.state.currentArticle" class="q-pl-md" id="scroll-target-view" :class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-editor' : 'scrollHeightMobileStyle-editor') : 'scrollHeightStyle'")
          div(class="q-py-md text-h6") {{ $store.state.currentArticle.title }}
          div(class="q-pb-lg ")
            span {{ $store.state.currentArticle.author }}
            a(class="q-px-sm") {{ $store.state.currentChannel.name }}
            span {{ detailDateFormat($store.state.currentArticle.updateDate) }}
          iframe(v-if="$store.state.currentArticle.content && $store.state.currentArticle.content.substr(0,4)==='http'" id="iframeContent"
            :src="$store.state.currentArticle.content" frameborder="no" border="0" marginwidth="0" marginheight="0" allowtransparency="yes" scrolling="yes")
          div(v-if="$store.state.currentArticle.content && $store.state.currentArticle.content.substr(0,4)!=='http'" v-html="$store.state.currentArticle.content")
      q-tab-panel(:style="heightStyle" name="newArticle" class="q-pa-none")
        newArticle.drawcontent
      q-tab-panel(:style="heightStyle" name="editChannel" class="q-pa-none")
        q-toolbar
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round dense icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{$t('New Channel')}}
          q-btn.btnIcon(flat round dense icon="check" @click="editChannel")
        q-card(flat)
          q-card-section(align="center" class="q-py-xl")
            q-avatar(size="64px")
              img(:src="channelData.avatar")
          q-card-section(class="q-pt-none")
            q-form(ref="formCreateChannel" @submit="editChannel" class="q-pa-sm")
              q-input.c-field(autofocus :label="$t('Channel Name')" filled clearable v-model="channelData.name" lazy-rules :rules="[]")
              p
              q-input.c-field(:label="$t('Channel Description')" filled clearable v-model="channelData.description" lazy-rules :rules="[]")
        q-uploader(style="display:none" ref="upload" @added="files => upload(files)" accept=".jpg, image/*")
</template>
<script src="./channelDetails.vue.js" />