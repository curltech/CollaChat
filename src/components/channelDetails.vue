<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" class="q-pa-none")
        q-toolbar
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round dense icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{ $store.state.currentChannel.name}}
          q-btn.btnIcon(flat round dense icon="more_horiz" @click="")
        div(v-for="(article, index) in ArticleFilteredList" :key="article.articleId" style="width: 80%; margin: auto")
          q-card(flat @click="articleSelected(article, index)")
            q-card-section.bg-c-grey-0(class="text-center" style="height: 50px") {{ detailDateFormat(article.updateDate) }}
            q-card-section(class="q-pa-none")
              q-img(:src="article.cover" style="height: 200px; width: 100%")
            q-card-section.bg-c-grey-3(class="q-py-md")
              q-item-label(class="text-h5") {{ article.title }}
              q-item-label(v-if="article.abstract" class="q-py-sm") {{ article.abstract }}
      q-tab-panel(:style="heightStyle" name="view" class="q-pa-none")
        q-toolbar.header-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind='default'")
          q-space
          q-btn.btnIcon(flat round icon="more_horiz" @click="viewCommand()")
        div.scroll.header-mar-top.bg-c-white(v-if="$store.state.currentArticle" class="q-pl-md" id="scroll-target-view" :class="ifMobileSize || $store.state.ifMobileStyle ? 'scrollHeightMobileStyle-editor' : 'scrollHeightStyle'")
          div(class="q-py-md text-h5") {{ $store.state.currentArticle.title }}
          div(class="q-pb-lg ")
            span {{ $store.state.currentArticle.author }}
            a(class="q-px-sm") {{ $store.state.currentChannel.name }}
            span {{ detailDateFormat($store.state.currentArticle.updateDate) }}
          iframe(v-if="$store.state.currentArticle.content && $store.state.currentArticle.content.substr(0,4)==='http'" id="iframeContent"
            :src="$store.state.currentArticle.content" frameborder="no" border="0" marginwidth="0" marginheight="0" allowtransparency="yes" scrolling="yes")
          div(v-if="$store.state.currentArticle.content && $store.state.currentArticle.content.substr(0,4)!=='http'" v-html="$store.state.currentArticle.content")
</template>
<script src="./channelDetails.vue.js" />