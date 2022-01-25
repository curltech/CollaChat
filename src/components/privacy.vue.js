import BlackList from '@/components/blackList'
import LockList from '@/components/lockList'
import { myself, myselfPeerService, peerClientService } from 'libcolla'

export default {
  name: 'Privacy',
  components: {
    blackList: BlackList,
    lockList: LockList
  },
  data() {
    return {
      subKind: 'default',
      lockListDialog: false,
      password: null,
      peerIdSwitch: !myself.myselfPeerClient.visibilitySetting || myself.myselfPeerClient.visibilitySetting.substring(0, 1) === 'Y',
      mobileNumberSwitch: !myself.myselfPeerClient.visibilitySetting || myself.myselfPeerClient.visibilitySetting.substring(1, 2) === 'Y',
      groupChatSwitch: !myself.myselfPeerClient.visibilitySetting || myself.myselfPeerClient.visibilitySetting.substring(2, 3) === 'Y',
      qrCodeSwitch: !myself.myselfPeerClient.visibilitySetting || myself.myselfPeerClient.visibilitySetting.substring(3, 4) === 'Y',
      contactCardSwitch: !myself.myselfPeerClient.visibilitySetting || myself.myselfPeerClient.visibilitySetting.substring(4, 5) === 'Y',
      nameSwitch: !myself.myselfPeerClient.visibilitySetting || myself.myselfPeerClient.visibilitySetting.substring(5, 6) === 'Y',
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
    showLockListDialog() {
      this.password = null
      this.lockListDialog = true
    },
    lockList() {
      let _that = this
      let store = _that.$store
      // 校验密码
      if (_that.password !== myself.password) {
        _that.$q.notify({
          message: _that.$i18n.t("Wrong password"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        return
      }
      _that.lockListDialog = false
      _that.subKind = 'lockList'
    },
    changeSwitch: async function (kind, value) {
      this.$q.loading.show()
      let myselfPeerClient = myself.myselfPeerClient
      let myselfPeer = myself.myselfPeer
      let backupMobile = null
      try {
        let currentDate = new Date()
        let visibilitySetting = myselfPeerClient.visibilitySetting ? myselfPeerClient.visibilitySetting : 'YYYYYY'
        if (kind === 'peerId') {
          visibilitySetting = (value ? 'Y' : 'N') + visibilitySetting.substring(1, 5)
        } else if (kind === 'mobileNumber') {
          visibilitySetting = visibilitySetting.substring(0, 1) + (value ? 'Y' : 'N') + visibilitySetting.substring(2, 5)
        } else if (kind === 'groupChat') {
          visibilitySetting = visibilitySetting.substring(0, 2) + (value ? 'Y' : 'N') + visibilitySetting.substring(3, 5)
        } else if (kind === 'qrCode') {
          visibilitySetting = visibilitySetting.substring(0, 3) + (value ? 'Y' : 'N') + visibilitySetting.substring(4, 5)
        } else if (kind === 'contactCard') {
          visibilitySetting = visibilitySetting.substring(0, 4) + (value ? 'Y' : 'N') + visibilitySetting.substring(5, 6)
        } else if (kind === 'name') {
          visibilitySetting = visibilitySetting.substring(0, 5) + (value ? 'Y' : 'N')
        }
        myselfPeerClient.visibilitySetting = visibilitySetting
        myselfPeerClient.lastUpdateTime = currentDate
        this.$store.state.myselfPeerClient = myselfPeerClient

        myselfPeer.visibilitySetting = visibilitySetting
        myselfPeer.updateDate = currentDate
        myselfPeer.lastUpdateTime = currentDate
        myselfPeer = await myselfPeerService.update(myselfPeer)
        myself.myselfPeer = myselfPeer

        if (kind === 'mobileNumber' && !value) {
          backupMobile = myselfPeerClient.mobile
          myselfPeerClient.mobile = ''
          myselfPeer.mobile = ''
        }
        let result = await peerClientService.putPeerClient(null, 'Up')
        console.log(result)
        if (result === 'OK') {
          this.$q.notify({
            message: this.$i18n.t("Change visibility setting successfully"),
            timeout: 3000,
            type: "info",
            color: "info"
          })
        } else {
          this.$q.notify({
            message: this.$i18n.t("Failed to change visibility setting"),
            timeout: 3000,
            type: "warning",
            color: "warning"
          })
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (backupMobile && kind === 'mobileNumber' && !value) {
          myselfPeerClient.mobile = backupMobile
          myselfPeer.mobile = backupMobile
        }
        this.$q.loading.hide()
      }
    },
    changePeerIdSwitch: async function (value) {
      await this.changeSwitch('peerId', value)
    },
    changeMobileNumberSwitch: async function (value) {
      await this.changeSwitch('mobileNumber', value)
    },
    changeGroupChatSwitch: async function (value) {
      await this.changeSwitch('groupChat', value)
    },
    changeQrCodeSwitch: async function (value) {
      await this.changeSwitch('qrCode', value)
    },
    changeContactCardSwitch: async function (value) {
      await this.changeSwitch('contactCard', value)
    },
    changeNameSwitch: async function (value) {
      await this.changeSwitch('name', value)
    }
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changePrivacySubKind = function (subKind) {
      _that.subKind = subKind
    }
  }
}
