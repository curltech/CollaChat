<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" class="q-pa-none")
        q-toolbar
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round dense icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{$t('New Article')}}
          q-btn.btnIcon(flat round dense icon="check" @click="createArticle")
        q-card(flat)
          q-card-section(align="center" class="q-py-xl")
            q-img(src="login-bg-wd-9.jpg" style="height: 200px; width: 400px")
          q-card-section(class="q-pt-none")
            q-form(ref="formCreateArticle" @submit="createArticle" class="q-pa-sm")
              q-input.c-field(autofocus :label="$t('Article Author')" filled clearable v-model="articleData.author" lazy-rules :rules="[]")
              p
              q-input.c-field(autofocus :label="$t('Article Title')" filled clearable v-model="articleData.title" lazy-rules :rules="[]")
              p
              q-input.c-field(:label="$t('Article Abstract')" filled clearable v-model="articleData.abstract" lazy-rules :rules="[]")
              p
              div.wangEditorToolbarMobileStyle(ref="editorToolbar")
              div.bg-c-white(ref="editorContainer" :class="ifMobileSize || $store.state.ifMobileStyle ? 'scrollHeightMobileStyle-wangEditor' : 'scrollHeightStyle'")
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
    q-uploader(style="display:none" ref="upload" @added="files => upload(files)" accept=".jpg, image/*")
</template>
<script src="./newArticle.vue.js" />