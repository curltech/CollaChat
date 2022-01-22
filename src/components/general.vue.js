import { colors } from 'quasar'

import { myself, myselfPeerService, peerClientService, peerProfileService } from 'libcolla'
import { openpgp } from 'libcolla'

import * as CollaConstant from '@/libs/base/colla-constant'
import { statusBarComponent } from '@/libs/base/colla-cordova'

import BackupMigration from '@/components/backupMigration'
import Storage from '@/components/storage'

export default {
  name: "General",
  components: {
    backupMigration: BackupMigration,
    storage: Storage
  },
  data() {
    return {
      subKind: 'default',
      languageSelected: true,
      lightDarkModeSelected: true,
      primaryColorSelected: true,
      secondaryColorSelected: true,
      downloadSwitchSelected: true,
      localDataCryptoSwitchSelected: true,
      autoLoginSwitchSelected: true,
      language: myself.myselfPeerClient && myself.myselfPeerClient.language ? myself.myselfPeerClient.language : this.$i18n.locale,
      lightDarkMode: myself.myselfPeerClient && myself.myselfPeerClient.lightDarkMode ? myself.myselfPeerClient.lightDarkMode : this.$q.dark.mode + '',
      primaryColor: myself.myselfPeerClient && myself.myselfPeerClient.primaryColor ? myself.myselfPeerClient.primaryColor : colors.getBrand('primary'),
      secondaryColor: myself.myselfPeerClient && myself.myselfPeerClient.secondaryColor ? myself.myselfPeerClient.secondaryColor : colors.getBrand('secondary'),
      languageOptions: CollaConstant.languageOptions,
      lightDarkModeOptions: CollaConstant.lightDarkModeOptionsISO[myself.myselfPeerClient && myself.myselfPeerClient.language ? myself.myselfPeerClient.language : this.$i18n.locale],
      downloadSwitch: myself.myselfPeerClient.downloadSwitch,
      localDataCryptoSwitch: myself.myselfPeerClient.localDataCryptoSwitch,
      autoLoginSwitch: myself.myselfPeerClient.autoLoginSwitch,
      restoreDialog: false
    }
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    }
  },
  methods: {
    showRestoreDialog: function () {
      this.restoreDialog = true
    },
    restore: async function () {
      if (this.languageSelected) {
        this.language = 'en-us'
        await this.changeLanguage()
      }
      if (this.lightDarkModeSelected) {
        this.lightDarkMode = 'auto'
        await this.changeLightDarkMode()
      }
      if (this.primaryColorSelected) {
        this.primaryColor = '#19B7C7' // '#26A69A'
        await this.changePrimaryColor()
      }
      if (this.secondaryColorSelected) {
        this.secondaryColor = '#117EED'
        await this.changeSecondaryColor()
      }
      if (this.downloadSwitchSelected) {
        this.downloadSwitch = false
        await this.changeDownloadSwitch(this.downloadSwitch)
      }
      if (this.localDataCryptoSwitchSelected) {
        this.localDataCryptoSwitch = false
        await this.changeLocalDataCryptoSwitch(this.localDataCryptoSwitch)
      }
      if (this.autoLoginSwitchSelected) {
        this.autoLoginSwitch = true
        await this.changeAutoLoginSwitch(this.autoLoginSwitch)
      }
      this.restoreDialog = false
    },
    changeLanguage: async function () {
      this.$q.loading.show()
      let myselfPeerClient = myself.myselfPeerClient
      let myselfPeer = myself.myselfPeer
      let backupMobile = null
      try {
        let currentDate = new Date()
        myselfPeerClient.language = this.language
        this.$store.state.myselfPeerClient = myselfPeerClient

        let peerProfile = myself.peerProfile
        peerProfile.language = this.language
        peerProfile.updateDate = currentDate
        peerProfile = await peerProfileService.update(peerProfile)
        myself.peerProfile = peerProfile

        this.$i18n.locale = this.language
        this.lightDarkModeOptions = CollaConstant.lightDarkModeOptionsISO[this.language]

        if (myselfPeerClient.visibilitySetting && myselfPeerClient.visibilitySetting.substring(1, 2) === 'N') {
          backupMobile = myselfPeerClient.mobile
          myselfPeerClient.mobile = ''
          myselfPeer.mobile = ''
        }
        let result = await peerClientService.putPeerClient(null, 'Up')
        console.log(result)
        if (result === 'OK') {
          this.$q.notify({
            message: this.$i18n.t("Change language successfully"),
            timeout: 3000,
            type: "info",
            color: "info"
          })
        } else {
          this.$q.notify({
            message: this.$i18n.t("Failed to change language"),
            timeout: 3000,
            type: "warning",
            color: "warning"
          })
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (backupMobile && myselfPeerClient.visibilitySetting && myselfPeerClient.visibilitySetting.substring(1, 2) === 'N') {
          myselfPeerClient.mobile = backupMobile
          myselfPeer.mobile = backupMobile
        }
        this.$q.loading.hide()
      }
    },
    changeLightDarkMode: async function () {
      let currentDate = new Date()
      let myselfPeerClient = myself.myselfPeerClient
      myselfPeerClient.lightDarkMode = this.lightDarkMode
      this.$store.state.myselfPeerClient = myselfPeerClient

      let peerProfile = myself.peerProfile
      peerProfile.lightDarkMode = this.lightDarkMode
      peerProfile.updateDate = currentDate
      peerProfile = await peerProfileService.update(peerProfile)
      myself.peerProfile = peerProfile

      if (this.lightDarkMode === 'true') {
        this.$q.dark.set(true)
      } else if (this.lightDarkMode === 'false') {
        this.$q.dark.set(false)
      } else if (this.lightDarkMode === 'auto') {
        this.$q.dark.set('auto')
      }
      if (this.$store.state.ifMobileStyle) {
        if (this.$q.dark.isActive) {
          statusBarComponent.style(false, '#1d1d1d')
        } else {
          statusBarComponent.style(true, '#ffffff')
        }
      }
    },
    changePrimaryColor: async function () {
      let currentDate = new Date()
      let myselfPeerClient = myself.myselfPeerClient
      myselfPeerClient.primaryColor = this.primaryColor
      this.$store.state.myselfPeerClient = myselfPeerClient

      let peerProfile = myself.peerProfile
      peerProfile.primaryColor = this.primaryColor
      peerProfile.updateDate = currentDate
      peerProfile = await peerProfileService.update(peerProfile)
      myself.peerProfile = peerProfile

      colors.setBrand('primary', this.primaryColor)
    },
    changeSecondaryColor: async function () {
      let currentDate = new Date()
      let myselfPeerClient = myself.myselfPeerClient
      myselfPeerClient.secondaryColor = this.secondaryColor
      this.$store.state.myselfPeerClient = myselfPeerClient

      let peerProfile = myself.peerProfile
      peerProfile.secondaryColor = this.secondaryColor
      peerProfile.updateDate = currentDate
      peerProfile = await peerProfileService.update(peerProfile)
      myself.peerProfile = peerProfile

      colors.setBrand('secondary', this.secondaryColor)
    },
    changeDownloadSwitch: async function (value) {
      let currentDate = new Date()
      let myselfPeerClient = myself.myselfPeerClient
      myselfPeerClient.downloadSwitch = value
      this.$store.state.myselfPeerClient = myselfPeerClient

      let peerProfile = myself.peerProfile
      peerProfile.downloadSwitch = value
      peerProfile.updateDate = currentDate
      peerProfile = await peerProfileService.update(peerProfile)
      myself.peerProfile = peerProfile
    },
    changeLocalDataCryptoSwitch: async function (value) {
      let currentDate = new Date()
      let myselfPeerClient = myself.myselfPeerClient
      myselfPeerClient.localDataCryptoSwitch = value
      this.$store.state.myselfPeerClient = myselfPeerClient

      let peerProfile = myself.peerProfile
      peerProfile.localDataCryptoSwitch = value
      peerProfile.updateDate = currentDate
      peerProfile = await peerProfileService.update(peerProfile)
      myself.peerProfile = peerProfile
    },
    changeAutoLoginSwitch: async function (value) {
      let currentDate = new Date()
      let myselfPeerClient = myself.myselfPeerClient
      myselfPeerClient.autoLoginSwitch = value
      this.$store.state.myselfPeerClient = myselfPeerClient

      let peerProfile = myself.peerProfile
      peerProfile.autoLoginSwitch = value
      peerProfile.updateDate = currentDate
      peerProfile = await peerProfileService.update(peerProfile)
      myself.peerProfile = peerProfile

      // update loginStatus and password for mobile device
      if (this.$store.ifMobile()) {
        myself.myselfPeer.updateDate = currentDate
        if (value === true) {
          myself.myselfPeer.loginStatus = 'Y'
          myself.myselfPeer.password = openpgp.encodeBase64(myself.password)
        } else {
          myself.myselfPeer.loginStatus = 'N'
          myself.myselfPeer.password = null
        }
        await myselfPeerService.update(myself.myselfPeer)
      }
    }
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeGeneralSubKind = function (subKind) {
      _that.subKind = subKind
    }
  },
  watch: {
    async language(val) {
      await this.changeLanguage()
    },
    async lightDarkMode(val) {
      await this.changeLightDarkMode()
    },
    async primaryColor(val) {
      await this.changePrimaryColor()
    },
    async secondaryColor(val) {
      await this.changeSecondaryColor()
    }
  }
}
