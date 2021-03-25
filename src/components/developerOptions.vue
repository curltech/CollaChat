<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round dense icon="keyboard_arrow_left" @click="$store.changeAdvanceSettingSubKind('default')")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('Developer Options')}}
        q-list
          q-item(clickable v-ripple @click="subKind = 'systemInfo'")
            q-item-section
              q-item-label {{$t('System Info')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-item(clickable v-ripple @click="subKind = 'debugInfo'")
            q-item-section
              q-item-label {{$t('Debug Info')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
      q-tab-panel(:style="heightStyle" name="systemInfo" style="padding:0px 0px")
        systemInfo.drawcontent
      q-tab-panel(:style="heightStyle" name="debugInfo" style="padding:0px 0px")
        debugInfo.drawcontent
</template>
<script src="./developerOptions.vue.js" />