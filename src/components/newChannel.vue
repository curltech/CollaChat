<template lang="pug">
  div.bg-c-grey-0
    q-toolbar
      q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round dense icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
      q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{$t('New Channel')}}
      q-btn.btnIcon(flat round dense icon="check" @click="createChannel")
    q-card(flat)
      q-card-section(align="center")
        q-item-label(class="q-field__label q-py-sm" :style="$q.dark.isActive ? 'color: rgba(255,255,255,0.7)' : ''") {{$t('Channel Avatar')}}
        P
        q-avatar(size="64px" class="cursor-pointer" @click="$refs.channelUpload.pickFiles()")
          img(:src="channelData.avatar")
      q-card-section(class="q-pt-none")
        q-form(ref="formCreateChannel" @submit="createChannel" class="q-pa-sm")
          q-input.c-field(autofocus :label="$t('Channel Name')" filled clearable v-model="channelData.name" lazy-rules :rules="[]")
          p
          q-input.c-field(:label="$t('Channel Description')" filled clearable v-model="channelData.description" lazy-rules :rules="[]")
    q-uploader(style="display:none" ref="channelUpload" @added="files => channelUpload(files)" accept=".jpg, image/*")
</template>
<script src="./newChannel.vue.js" />