<template lang="pug">
  div.bg-c-grey-0(:style="heightStyle")
    q-toolbar
      q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeDeveloperOptionsSubKind('default')")
      q-toolbar-title(align="center") {{$t('Debug Info')}}
      q-btn.text-primary(flat round icon="delete" @click="clean")
    q-toolbar(insert)
      q-input.c-field(debounce="100" filled dense v-model="searchText" :placeholder="placeholder" input-class="text-center iconfont" style="width: 86%" @keyup="searchKeyup" @input="searchInput")
        template(slot="append")
          q-icon(v-if="searchText" name="cancel" class="cursor-pointer" @click.stop="searchText = null;searching = false")
    q-toolbar(insert)
      q-select.c-field(filled dense v-model="logLevel" emit-value map-options :options="logLevelOptions")
      q-input.c-field(dense readonly v-model="searchDate" :placeholder="$t('Date')" input-class="text-center" style="width: 100% !important")
        template(v-slot:append)
          q-icon(v-if="searchDate" name="cancel" class="cursor-pointer" @click.stop="cleanSearchDate")
          q-icon(name="event" color="primary" class="cursor-pointer")
            q-popup-proxy(ref="qDateProxy" transition-show="scale" transition-hide="scale")
              q-date(v-model="searchDate" @input="searchDateInput" minimal mask="YYYY-MM-DD")
    q-list(v-if="searching")
      div(
        v-for="(log, index) in logResultList",
        :key="index"
      )
        q-item(clickable v-ripple)
          q-item-section
            q-item-label(caption) {{ formate(log.createTimestamp) }}
          q-item-section
            q-item-label(caption) {{ log.level }}
          q-item-section
            q-item-label(caption v-html="log.highlightingCode ? log.highlightingCode : log.code")
          q-item-section
            q-item-label(caption v-html="log.highlightingDescription ? log.highlightingDescription : log.description")
        q-separator.c-separator(
          inset="item",
          v-if="index < logResultList.length - 1"
        )
        q-separator.c-separator(
          v-if="index === logResultList.length - 1"
        )
</template>
<script src="./debugInfo.vue.js" />
