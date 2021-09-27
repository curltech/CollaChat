<template lang="pug">
  q-layout(:style="heightStyle")
    q-page-container
      q-page
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeAboutSubKind('default')")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('Terms Of Service')}}
        div
          vue-markdown(class="result-html full-height full-width" :watches="['show','html','breaks','linkify','emoji','typographer','toc']"
            :source="source" :show="show" :html="html" :breaks="breaks" :linkify="linkify"
            :emoji="emoji" :typographer="typographer" :toc="toc" v-on:rendered="allRight"
            v-on:toc-rendered="tocAllRight" toc-id="toc")
        q-page-scroller(expand position="top" :scroll-offset="150" :offset="[0, 0]")
          div(class="col cursor-pointer q-pa-sm bg-primary text-c-white text-center") {{$t('Scroll back up...')}}
</template>
<style lang="text/css" src="./../css/vue-markdown.css" />
<script src="./tos.vue.js" />