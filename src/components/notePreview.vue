<template lang="pug">
  q-item
    q-item-section(v-if="entry !== 'message' && $store.collectionEntry === 'message'" side)
      q-checkbox(dense v-model="item.selected" color="primary" @input="selectItem(item)")
    q-item-section(v-if="ifMobileSize || $store.state.ifMobileStyle")
      q-card(flat class="q-pa-md")
        q-card-section(class="q-pa-none")
          q-item(class="q-pa-none" style="min-height: 18px")
            q-item-section(v-if="item.thumbnail" avatar class="q-pa-none")
              q-img(:src="item.thumbnail")
                q-icon(v-if="item.thumbType==='image' || item.thumbType==='image&video'" size="16px" name="photo_size_select_actual" color="white" style="margin-top: 4px; float: right; margin-right: 4px;")
                q-icon(v-if="item.thumbType==='video' || item.thumbType==='image&video'" size="32px" name="play_circle_outline" color="white" style="top: 50%; left: 50%; margin-top: -16px; margin-left: -16px;")
                div(v-if="(item.contentIVAmount + item.attachIVAmount) > 1" class="note-caption-small" style="backgroundColor: transparent; padding: 0; right: 0; bottom: 0") {{ '(' + (item.contentIVAmount + item.attachIVAmount) + ')' }}
            q-item-section(:class="item.thumbnail ? 'q-px-sm' : ''" style="justify-content: flex-start")
              q-item-label(v-if="item.contentTitle" lines="1" class="q-pa-none note-title") {{ CollaUtil.htmlDecode(item.contentTitle) }}
              q-item-label(v-if="(item.contentAAmount + item.attachAAmount) > 0" caption lines="1" class="q-pa-none text-c-grey-10 note-caption" style="word-wrap: break-word;word-break: break-all") {{ '[' + $t('Audio') + '] ' + (item.firstAudioDuration !== '00:00' ? item.firstAudioDuration : '') + ((item.contentAAmount + item.attachAAmount) > 1 ? '... (' + (item.contentAAmount + item.attachAAmount) + ')' : '') }}
              q-item-label(v-if="item.attachOAmount > 0" caption lines="1" class="q-pa-none text-c-grey-10 note-caption" style="word-wrap: break-word;word-break: break-all") {{ '[' + $t('File') + '] ' + item.firstFileInfo + (item.attachOAmount > 1 ? '... (' + item.attachOAmount + ')' : '') }}
              q-item-label(v-if="item.contentBody" caption :lines="3 - ((item.contentAAmount + item.attachAAmount) > 0 ? 1 : 0) - (item.attachOAmount > 0 ? 1 : 0)" class="q-pa-none text-c-grey-10 note-caption" style="word-wrap: break-word;word-break: break-all") {{ CollaUtil.htmlDecode(item.contentBody) }}
              q-item-label(v-if="!item.thumbnail && !item.contentTitle && !item.contentBody && entry !== 'message' && !item.contentIVAmount && !item.contentAAmount && !item.contentOAmount && !item.attachIVAmount && !item.attachAAmount && !item.attachOAmount" class="q-pa-none note-title") {{ $t('[Blank]') }}
        q-card-section(class="q-px-none q-pt-sm q-pb-none")
          q-item(class="q-pa-none" style="min-height: 18px")
            q-item-section(v-if="entry === 'collection' && SyncFailed(item.blockId)" side style="padding-right:0px")
              q-icon(name="sync" color="primary" size="16px")
            q-item-section
              q-item-label(caption class="text-c-grey-10 note-caption-small") {{ Outline(item) + ' | ' + UpdateDate(item) }}
    q-item-section(v-if="!(ifMobileSize || $store.state.ifMobileStyle) && item.thumbnail" avatar class="q-pa-none")
      q-img(:src="item.thumbnail")
        q-icon(v-if="item.thumbType==='image' || item.thumbType==='image&video'" size="16px" name="photo_size_select_actual" color="white" style="margin-top: 4px; float: right; margin-right: 4px;")
        q-icon(v-if="item.thumbType==='video' || item.thumbType==='image&video'" size="32px" name="play_circle_outline" color="white" style="top: 50%; left: 50%; margin-top: -16px; margin-left: -16px;")
        div(v-if="(item.contentIVAmount + item.attachIVAmount) > 1" class="note-caption-small" style="backgroundColor: transparent; padding: 0; right: 0; bottom: 0") {{ '(' + (item.contentIVAmount + item.attachIVAmount) + ')' }}
    q-item-section(v-if="!(ifMobileSize || $store.state.ifMobileStyle)" :class="item.thumbnail ? 'q-px-sm' : ''" style="justify-content: flex-start")
      q-item-label(v-if="item.contentTitle" lines="1" class="q-pa-none note-title") {{ CollaUtil.htmlDecode(item.contentTitle) }}
      q-item-label(v-if="(item.contentAAmount + item.attachAAmount) > 0" caption lines="1" class="q-pa-none text-c-grey-10 note-caption" style="word-wrap: break-word;word-break: break-all") {{ '[' + $t('Audio') + '] ' + (item.firstAudioDuration !== '00:00' ? item.firstAudioDuration : '') + ((item.contentAAmount + item.attachAAmount) > 1 ? '... (' + (item.contentAAmount + item.attachAAmount) + ')' : '') }}
      q-item-label(v-if="item.attachOAmount > 0" caption lines="1" class="q-pa-none text-c-grey-10 note-caption" style="word-wrap: break-word;word-break: break-all") {{ '[' + $t('File') + '] ' + item.firstFileInfo + (item.attachOAmount > 1 ? '... (' + item.attachOAmount + ')' : '') }}
      q-item-label(v-if="item.contentBody" caption :lines="3 - ((item.contentAAmount + item.attachAAmount) > 0 ? 1 : 0) - (item.attachOAmount > 0 ? 1 : 0)" class="q-pa-none text-c-grey-10 note-caption" style="word-wrap: break-word;word-break: break-all") {{ CollaUtil.htmlDecode(item.contentBody) }}
      q-item-label(v-if="!item.thumbnail && !item.contentTitle && !item.contentBody && entry !== 'message' && !item.contentIVAmount && !item.contentAAmount && !item.contentOAmount && !item.attachIVAmount && !item.attachAAmount && !item.attachOAmount" class="q-pa-none note-title") {{ $t('[Blank]') }}
    q-item-section(v-if="!(ifMobileSize || $store.state.ifMobileStyle) && entry ==='collection' && SyncFailed(item.blockId)" side style="padding-right:0px")
      q-icon(name="sync" color="primary" size="16px")
    q-item-section(v-if="!(ifMobileSize || $store.state.ifMobileStyle)" :side = "entry ==='collection'" style="min-width:50px")
      q-item-label(caption class="text-c-grey-10 note-caption-small") {{ UpdateDate(item) }}
      q-item-label(caption class="text-c-grey-10 note-caption-small") {{ Outline(item) }}
</template>
<script src="./notePreview.vue.js"/>
