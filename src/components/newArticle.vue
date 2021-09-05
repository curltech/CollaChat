<template lang="pug">
  div.bg-c-grey-0
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
          q-input.c-field(:label="$t('Article Content')" filled clearable v-model="articleData.content" lazy-rules :rules="[]")
    q-uploader(style="display:none" ref="upload" @added="files => upload(files)" accept=".jpg, image/*")
</template>
<script src="./newArticle.vue.js" />