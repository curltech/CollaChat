<template lang="pug">
  div.bg-c-grey-0
    q-toolbar
      q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round dense icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
      q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{ $store.state.currentChannel.name}}
      q-btn.btnIcon(flat round dense icon="more_horiz" @click="")
    div(v-for="(article, index) in $store.state.articleList" :key="article.articleId" style="width: 80%; margin: auto")
      q-card.bg-c-grey-2(flat class="q-py-sm")
        q-card-section
          q-img(:src="article.cover" style="height: 200px; width: 100%")
        q-card-section(class="text-h5") {{ article.title }}
        q-card-section {{ article.abstract }}
      q-card.bg-c-grey-0(style="height: 25px")
</template>
<script src="./channelDetails.vue.js" />