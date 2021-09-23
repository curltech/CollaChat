<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" class="q-pa-none")
        q-toolbar
          q-btn(flat round dense icon="keyboard_arrow_left" @click="$store.changeChannelDetailsSubKind('default')")
          q-toolbar-title(align="center") {{$t('New Article')}}
          q-btn.btnIcon(flat round dense icon="check" @click="createArticle")
        q-card(flat)
          q-card-section(align="center")
            q-item-label(class="q-field__label q-py-sm" :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{$t('Article Cover')}}
            P
            q-img(:src="$store.state.articleData.cover ? $store.state.articleData.cover : $store.defaultChannelArticleCover" style="height: 200px; width: 400px" class="cursor-pointer" @click="$refs.articleUpload.pickFiles()")
          q-card-section(class="q-pt-none")
            q-form(ref="formCreateArticle" @submit="createArticle" class="q-pa-sm")
              q-input.c-field(autofocus :label="$t('Article Author')" filled clearable v-model="$store.state.articleData.author" lazy-rules :rules="[]")
              p
              q-input.c-field(autofocus :label="$t('Article Title')" filled clearable v-model="$store.state.articleData.title" lazy-rules :rules="[]")
              p
              q-input.c-field(:label="$t('Article Subtitle')" filled clearable v-model="$store.state.articleData.abstract" lazy-rules :rules="[]")
              p
              q-item-label(class="text-center q-field__label q-py-sm" :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{$t('Article Body')}}
              P
              div.wangEditorToolbarMobileStyle(ref="editorToolbar")
              div.bg-c-grey-2(ref="editorContainer" :class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-wangEditor' : 'scrollHeightMobileStyle-wangEditor') : 'scrollHeightStyle'")
      q-tab-panel.bg-black#selectedContainer(:style="heightStyle" name="fullscreen" class="q-pa-none" align="center")
        q-toolbar(v-if="selected && selected.nodeName === 'VIDEO'" style="z-index: 999")
          q-btn.btnIcon(flat round icon="close" @click="fullscreenBack")
          q-space
          q-btn.btnIcon(flat round icon="more_horiz" @click="videoCommand()")
        q-toolbar(v-if="selected && selected.nodeName === 'IMG' && !$store.ifMobile()" style="z-index: 999")
          q-btn.btnIcon(flat round icon="close" @click="fullscreenBack")
          q-space
          q-btn.btnIcon(flat round icon="more_horiz" @click="imageCommand()")
        img#selectedImg(v-if="selected && selected.nodeName === 'IMG'" :src="selected.src")
        canvas#selectedCanvas(v-if="selected && selected.nodeName === 'IMG'" class="hidden")
        video#selectedVideo(v-if="selected && selected.nodeName === 'VIDEO'" :src="selected.src" controls webkit-playsinline playsinline x5-playsinline x-webkit-airplay="allow" autoplay)
      q-tab-panel(name="captureMedia" style="padding:0px 0px")
        captureMedia.drawcontent
    q-uploader(style="display:none" ref="articleUpload" @added="files => articleUpload(files)" accept=".jpg, image/*")
</template>
<script src="./newArticle.vue.js" />