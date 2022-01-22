import { myself, myselfPeerService, config } from 'libcolla'
import { StringUtil } from 'libcolla'
import { openpgp } from 'libcolla'
import SelectChat from '@/components/selectChat'
import VanillaQR from '@/libs/base/colla-vanillaQR'
import { mediaComponent } from '@/libs/base/colla-media'

export default {
  name: "AccountSecurity",
  components: {
    selectChat: SelectChat
  },
  data() {
    return {
      subKind: 'default',
      changePasswordData: {
        oldPassword: null,
        newPassword: null,
        newRepeatPassword: null
      },
      resetKeyDialog: false,
      exportIDDialog: false,
      destroyIDDialog: false,
      password: null
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
    showChangePassword: function () {
      this.changePasswordData = {
        oldPassword: null,
        newPassword: null,
        newRepeatPassword: null
      }
      this.subKind = 'changePassword'
    },
    changePassword: async function () {
      let _that = this
      let store = _that.$store
      // 校验密码
      if (_that.changePasswordData.oldPassword !== myself.password) {
        _that.$q.notify({
          message: _that.$i18n.t("Wrong password"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
      } else if (_that.changePasswordData.newPassword !== _that.changePasswordData.newRepeatPassword) {
        _that.$q.notify({
          message: _that.$i18n.t("Inconsistent passwords"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
      } else {
        this.$q.loading.show()
        try {
          await myselfPeerService.changePassword(_that.changePasswordData.oldPassword, _that.changePasswordData.newPassword)
          store.state.myselfPeerClient = myself.myselfPeerClient
          // update password for mobile device
          if (this.$store.ifMobile()) {
            if (myself.myselfPeer.loginStatus === 'Y') {
              myself.myselfPeer.updateDate = new Date()
              myself.myselfPeer.password = openpgp.encodeBase64(myself.password)
              await myselfPeerService.update(myself.myselfPeer)
            }
          }          
        } catch (e) {
          console.error(e)
          if (e.message === 'WrongPassword') {
            _that.$q.notify({
              message: _that.$i18n.t("Wrong password"),
              timeout: 3000,
              type: "warning",
              color: "warning"
            })
          }
        } finally {
          this.$q.loading.hide()
          this.subKind = 'default'
        }
      }
    },
    showResetKeyDialog: function () {
      this.password = null
      this.resetKeyDialog = true
    },
    resetKey: async function () {
      let _that = this
      let store = this.$store
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
      _that.resetKeyDialog = false
      _that.$q.loading.show()
      try {
        await myselfPeerService.resetKey()
        store.state.myselfPeerClient = myself.myselfPeerClient
        // 重新connect
        let result = await store.connect(config.appParams.connectPeerId[0])
        if (result) {
          _that.$q.notify({
            message: _that.$i18n.t("Reset key successfully"),
            timeout: 3000,
            type: "info",
            color: "info",
          })
        } else {
          _that.$q.notify({
            message: _that.$i18n.t("Failed to reset key"),
            timeout: 3000,
            type: "warning",
            color: "warning"
          })
        }
      } catch (error) {
        console.error(error)
      } finally {
        _that.$q.loading.hide()
      }
    },
    showExportIDDialog: function () {
      this.password = null
      this.exportIDDialog = true
    },
    exportID: async function () {
      let _that = this
      let store = _that.$store
      if (_that.password !== myself.password) {
        _that.$q.notify({
          message: _that.$i18n.t("Wrong password"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        return
      }
      _that.exportIDDialog = false
      let json = myselfPeerService.exportID()
      json = StringUtil.encodeURI(json)
      _that.enterQRCode(json)
    },
    enterQRCode(json) {
      let _that = this
      let store = _that.$store
      _that.subKind = 'qrCode'
      let qr = new VanillaQR({
        url: json,
        size: 400,
        colorLight: "#ffffff",
        colorDark: "#000000",
        //output to table or canvas
        //toTable: false,
        //Ecc correction level 1-4
        ecclevel: 2,
        //Use a border or not
        noBorder: true,
        //Border size to output at
        //borderSize: 4
      })
      let imageElement = qr.toImage("png")
      if(imageElement) {
        _that.$nextTick(() => {
          document.getElementById('qrCode').appendChild(imageElement)
        })
      }
    },
    operateQRCode: function () {
      let _that = this
      let store = _that.$store
      if (store.ifMobile()) {
        _that.$q.bottomSheet({
          actions: [
            {
              label: _that.$i18n.t('Forward'),
              icon: 'forward',
              color: 'primary',
              id: 'forward'
            },
            {},
            {
              label: _that.$i18n.t('Save Picture'),
              icon: 'save',
              color: 'primary',
              id: 'save'
            },
            {},
            {
              label: _that.$i18n.t('Cancel'),
              icon: 'cancel',
              color: 'primary',
              id: 'cancel'
            }
          ]
        }).onOk(async action => {
          // console.log('Action chosen:', action.id)
          if (action.id === 'forward') {
            store.state.currentQrCode = await mediaComponent.html2canvasById('qrCodeCard', 'base64')
            store.selectChatEntry = 'accountSecurityQrCode'
            _that.subKind = 'selectChat'
          } else if (action.id === 'save') {
            let canvas = await mediaComponent.html2canvasById('qrCodeCard', null)
            window.canvas2ImagePlugin.saveImageDataToLibrary(
              function (msg) {
                console.log(msg)
                _that.$q.notify({
                  message: _that.$i18n.t("Save successfully"),
                  timeout: 3000,
                  type: "info",
                  color: "info",
                })
              },
              function (err) {
                console.log(err)
                _that.$q.notify({
                  message: _that.$i18n.t("Save failed"),
                  timeout: 3000,
                  type: "warning",
                  color: "warning",
                })
              },
              canvas,
              "jpeg" // format is optional, defaults to 'png'
            )
          }
        }).onCancel(() => {
          // console.log('Dismissed')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      } else {
        _that.$q.bottomSheet({
          actions: [
            {
              label: _that.$i18n.t('Forward'),
              icon: 'forward',
              color: 'primary',
              id: 'forward'
            },
            {},
            {
              label: _that.$i18n.t('Save Picture'),
              icon: 'save',
              color: 'primary',
              id: 'save'
            },
            {},
            {
              label: _that.$i18n.t('Cancel'),
              icon: 'cancel',
              color: 'primary',
              id: 'cancel'
            }
          ]
        }).onOk(async action => {
          // console.log('Action chosen:', action.id)
          if (action.id === 'forward') {
            store.state.currentQrCode = await mediaComponent.html2canvasById('qrCodeCard', 'base64')
            store.selectChatEntry = 'accountSecurityQrCode'
            _that.subKind = 'selectChat'
          } else if (action.id === 'save') {
            mediaComponent.exportDiv('qrCodeCard', _that.$i18n.t('myCollaQRCode') + '-' + _that.$i18n.t('ID'))
          }
        }).onCancel(() => {
          // console.log('Dismissed')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    },
    showDestroyIDDialog: function () {
      this.password = null
      this.destroyIDDialog = true
    },
    destroyID: async function () {
      let _that = this
      let store = _that.$store
      if (_that.password !== myself.password) {
        _that.$q.notify({
          message: _that.$i18n.t("Wrong password"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        return
      }
      _that.destroyIDDialog = false
      await myselfPeerService.destroyID()
      await store.logout()
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
    store.changeAccountSecuritySubKind = function (subKind) {
      _that.subKind = subKind
      if(subKind === 'qrCode'){
        _that.exportID()
      }
    }
  },
}
