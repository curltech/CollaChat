<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" class="q-pa-none")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeChannelDetailsSubKind('default')")
          q-toolbar-title(align="center") {{$store.newArticleEntry === 'editArticle'?$t('Edit Article'):$t('New Article')}}
          q-btn(flat round icon="check" @click="createArticle" :disable="!$store.state.articleData.title" :class="$store.state.articleData.title?'text-primary':'c-grey-0'")
        q-card(flat)
          q-card-section(align="center")
            q-item-label(class="q-field__label q-py-sm" :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{$t('Cover')}}
            P
            q-img(:src="$store.state.articleData.cover ? $store.state.articleData.cover : $store.defaultChannelArticleCover" style="height: 200px; width: 400px" class="cursor-pointer" @click="$refs.articleUpload.pickFiles()")
          q-card-section(class="q-pt-none")
            q-form(ref="formCreateArticle" @submit="createArticle" class="q-pa-sm")
              q-input.c-field(autofocus :label="$t('Title')" filled clearable v-model="$store.state.articleData.title" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input Title')]")
              p
              q-input.c-field(:label="$t('Subtitle')" filled clearable v-model="$store.state.articleData.abstract" lazy-rules :rules="[]")
              p
              q-input.c-field(autofocus :label="$t('Author')" filled clearable v-model="$store.state.articleData.author" lazy-rules :rules="[]")
              p
              q-item-label(class="text-center q-field__label q-py-sm" :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{$t('Body')}}
              P
              div.wangEditorToolbarMobileStyle(ref="editorToolbar")
              div.bg-c-grey-2(ref="editorContainer" :class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-wangEditor' : 'scrollHeightMobileStyle-wangEditor') : 'scrollHeightStyle'")
      q-tab-panel.bg-black#selectedContainer(:style="heightStyle" name="fullscreen" class="q-pa-none" align="center")
        q-toolbar(v-if="selected && selected.nodeName === 'VIDEO'" style="z-index: 999")
          q-btn.text-primary(flat round icon="close" @click="fullscreenBack")
          q-space
          q-btn.text-primary(flat round icon="more_horiz" @click="videoCommand()")
        q-toolbar(v-if="selected && selected.nodeName === 'IMG'" style="z-index: 999")
          q-btn.text-primary(flat round icon="close" @click="fullscreenBack")
          q-space
          q-btn.text-primary(flat round icon="more_horiz" @click="imageCommand()")
        img#selectedImg(v-if="selected && selected.nodeName === 'IMG'" :src="selected.src" :style="fullscreenStyle")
        canvas#selectedCanvas(v-if="selected && selected.nodeName === 'IMG'" class="hidden")
        video#selectedVideo(v-if="selected && selected.nodeName === 'VIDEO'" @canplay="canPlay" :src="selected.src" :style="fullscreenStyle" controls webkit-playsinline playsinline x5-playsinline x-webkit-airplay="allow" autoplay)
      q-tab-panel(name="selectChat" style="padding:0px 0px")
        selectChat.drawcontent
      q-tab-panel(name="captureMedia" style="padding:0px 0px")
        captureMedia.drawcontent
    q-uploader(style="display:none" ref="articleUpload" @added="files => articleUpload(files)" accept=".jpg, image/*")
</template>
<script src="./newArticle.vue.js" />