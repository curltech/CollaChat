<template lang="pug">
  div.bg-c-grey-0
    q-toolbar
      q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeGeneralSubKind('default')")
      q-toolbar-title(align="center" style="padding-right:54px") {{$t('Storage')}}
    div(:style="heightStyle" align="center")
      q-list(style="width: 90%")
        q-item(class="q-pa-none")
          q-range(
            readonly
            :style="trackStyle"
            class="custom-colored-range")
        q-item(class="q-pa-none")
          q-item-section(avatar class="q-pa-none" style="min-width: 32px !important")
            q-icon(name="stop" color="primary" size="32px")
          q-item-section(side class="q-pa-none") {{$t('Colla Data')}}
          q-item-section(v-if="$store.ios === true || $store.android === true" class="q-pa-none")
          q-item-section(v-if="$store.ios === true || $store.android === true" avatar class="q-pa-none" style="min-width: 32px !important")
            q-icon(name="stop" color="orange" size="32px")
          q-item-section(v-if="$store.ios === true || $store.android === true" side class="q-pa-none") {{$t('Others')}}
          q-item-section(class="q-pa-none")
          q-item-section(avatar class="q-pa-none" style="min-width: 32px !important")
            q-icon(name="stop" color="grey" size="32px")
          q-item-section(side class="q-pa-none") {{$t('Free Space')}}
        q-item(class="q-pa-none")
        q-item(class="q-pa-none")
          q-item-section(side)
            q-item-label(class="text-c-black") {{$t('Colla Data')}}
        q-item(class="q-pa-none")
          q-item-section(side)
            q-item-label(class="q-py-md text-h4 text-bold text-c-black") {{colla}}
        q-item(class="q-pa-none")
          q-item-section(side align="left")
            q-item-label(v-if="$store.ios === true || $store.android === true") {{$t('Occupies') + ' ' + zones[0].max + '% ' + $t('of device storage, remains') + ' ' + free + ' ' + $t('free space.')}}
            q-item-label(v-if="!($store.ios === true || $store.android === true)") {{$t('Remains') + ' ' + free + ' ' + $t('free space.')}}
</template>
<script src="./storage.vue.js" />