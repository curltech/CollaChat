<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeSettingSubKind('default')")
          q-toolbar-title(align="center") {{$t('General')}}
          q-btn.text-primary(flat round icon="settings_backup_restore" @click="showRestoreDialog")
        q-list
          q-item(dense)
            q-item-section
              q-item-label {{$t('Language')}}
            q-item-section
              q-select.c-field(style="width: 120px" filled dense v-model="language" emit-value map-options :options="languageOptions")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(dense)
            q-item-section
              q-item-label {{$t('Light Dark Mode')}}
            q-item-section
              q-select.c-field(style="width: 120px" filled dense v-model="lightDarkMode" emit-value map-options :options="lightDarkModeOptions")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(dense)
            q-item-section
              q-item-label {{$t('Primary Color')}}
            q-item-section
              q-input.c-field(style="width: 120px" class="my-input" bg-color="primary" hide-bottom-space=true dense filled v-model="primaryColor" :rules="['anyColor']")
                template(v-slot:append)
                  q-icon(name="colorize" class="cursor-pointer")
                    q-popup-proxy(transition-show="scale" transition-hide="scale")
                      q-color(v-model="primaryColor")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(dense)
            q-item-section
              q-item-label {{$t('Secondary Color')}}
            q-item-section
              q-input.c-field(style="width: 120px" class="my-input" bg-color="secondary" hide-bottom-space=true dense filled v-model="secondaryColor" :rules="['anyColor']")
                template(v-slot:append)
                  q-icon(name="colorize" class="cursor-pointer")
                    q-popup-proxy(transition-show="scale" transition-hide="scale")
                      q-color(v-model="secondaryColor")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(dense)
            q-item-section
              q-item-label {{$t('Auto Download File')}}
            q-item-section(side)
              q-toggle(v-model="downloadSwitch" @input="changeDownloadSwitch")
          //q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          //q-item(dense)
            q-item-section
              q-item-label {{$t('Local Data Crypto')}}
            q-item-section(side)
              q-toggle(v-model="localDataCryptoSwitch" @input="changeLocalDataCryptoSwitch")
          q-separator.c-separator(v-if="$store.ifMobile()" style="margin-left:16px;width:calc(100% - 16px)")
          q-item(v-if="$store.ifMobile()" dense)
            q-item-section
              q-item-label {{$t('Auto Login')}}
            q-item-section(side)
              q-toggle(v-model="autoLoginSwitch" @input="changeAutoLoginSwitch")
          q-separator.c-separator(style="height:8px;margin-left:0px;margin-right:0px")
          q-item(clickable v-ripple @click="subKind= 'backupMigration'")
            q-item-section
              q-item-label {{$t('Chat Records Backup and Migration')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right" color="c-grey-5")
          q-separator.c-separator(style="margin-left:16px;width:calc(100% - 16px)")
          q-item(clickable v-ripple @click="subKind= 'storage'")
            q-item-section
              q-item-label {{$t('Storage')}}
            q-item-section(avatar)
              q-icon(name="keyboard_arrow_right" color="c-grey-5")
      q-tab-panel.bg-c-grey-0(name="backupMigration" style="padding:0px 0px")
        backupMigration.drawcontent
      q-tab-panel.bg-c-grey-0(name="storage" style="padding:0px 0px")
        storage.drawcontent
    q-dialog(v-model="restoreDialog" persistent)
      q-card(style="width: 100%")
        q-bar(class="bg-primary text-c-grey-0")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section(align="center") {{$t('Restore initial settings?')}}
        q-card-section
          q-item
            q-item-section
              q-item-label {{$t('Language')}}
            q-item-section(side)
              q-checkbox(dense v-model="languageSelected" color="primary")
          q-item
            q-item-section
              q-item-label {{$t('Light Dark Mode')}}
            q-item-section(side)
              q-checkbox(dense v-model="lightDarkModeSelected" color="primary")
          q-item
            q-item-section
              q-item-label {{$t('Primary Color')}}
            q-item-section(side)
              q-checkbox(dense v-model="primaryColorSelected" color="primary")
          q-item
            q-item-section
              q-item-label {{$t('Secondary Color')}}
            q-item-section(side)
              q-checkbox(dense v-model="secondaryColorSelected" color="primary")
          q-item
            q-item-section
              q-item-label {{$t('Auto Download File')}}
            q-item-section(side)
              q-checkbox(dense v-model="downloadSwitchSelected" color="primary")
          //q-item
            q-item-section
              q-item-label {{$t('Local Data Crypto')}}
            q-item-section(side)
              q-checkbox(dense v-model="localDataCryptoSwitchSelected" color="primary")
          q-item(v-if="$store.ifMobile()")
            q-item-section
              q-item-label {{$t('Auto Login')}}
            q-item-section(side)
              q-checkbox(dense v-model="autoLoginSwitchSelected" color="primary")
        q-card-actions(align="right")
          q-btn(color="primary" round icon="check" unelevated  @click="restore")
</template>
<script src="./general.vue.js" />