<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? 'padding-right:54px' : ''") {{$t('Settings')}}
        q-list
          q-item(clickable v-ripple @click="subKind = 'accountSecurity'")
            //q-item-section(avatar)
              q-icon(name="security")
            q-item-section {{$t('Account Security')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item(clickable v-ripple @click="subKind = 'privacy'")
            //q-item-section(avatar)
              q-icon(name="assignment_late")
            q-item-section {{$t('Privacy')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="subKind = 'general'")
            //q-item-section(avatar)
              q-icon(name="tune")
            q-item-section {{$t('General')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="subKind = 'advanceSetting'")
            //q-item-section(avatar)
              q-icon(name="build")
            q-item-section {{$t('Advance Setting')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item(clickable v-ripple @click="subKind = 'faq'")
            //q-item-section(avatar)
              q-icon(name="help")
            q-item-section {{$t('FAQ')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="subKind = 'about'")
            //q-item-section(avatar)
              q-icon(name="info")
            q-item-section {{$t('About')}}
            q-item-section(avatar)
              q-badge(v-if="$store.macos !== true && $store.latestVersion !== $store.currentVersion" color="red" floating rounded) New
              q-icon(name="keyboard_arrow_right")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item
            q-item-section(align="center")
              q-btn.bg-primary.text-grey-1(unelevated no-caps :label="$t('Logout')" @click="confirmLogout")
      q-tab-panel(name="accountSecurity" style="padding:0px 0px")
        accountSecurity.drawcontent
      q-tab-panel(name="privacy" style="padding:0px 0px")
        privacy.drawcontent
      q-tab-panel(name="general" style="padding:0px 0px")
        general.drawcontent
      q-tab-panel(name="advanceSetting" style="padding:0px 0px")
        advanceSetting.drawcontent
      q-tab-panel(name="faq" style="padding:0px 0px")
        faq.drawcontent
      q-tab-panel(name="about" style="padding:0px 0px")
        about.drawcontent
</template>
<script src="./setting.vue.js" />