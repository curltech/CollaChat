<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeAdvanceSettingSubKind('default')")
          q-toolbar-title(align="center" style="padding-right:54px") {{$t('Developer Options')}}
        q-list
          q-item(clickable v-ripple @click="subKind = 'systemInfo'")
            q-item-section
              q-item-label {{$t('System Info')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item(dense)
            q-item-section
              q-item-label {{$t('Debug Level')}}
            q-item-section
              q-select.c-field(style="width: 120px" filled dense v-model="logLevel" emit-value map-options :options="logLevelOptions")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="subKind = 'debugInfo'")
            q-item-section
              q-item-label {{$t('Debug Info')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
      q-tab-panel(name="systemInfo" style="padding:0px 0px")
        systemInfo.drawcontent
      q-tab-panel(name="debugInfo" style="padding:0px 0px")
        debugInfo.drawcontent
</template>
<script src="./developerOptions.vue.js" />