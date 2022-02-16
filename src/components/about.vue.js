import { mediaComponent } from '@/libs/base/colla-media'
import { statusBarComponent } from '@/libs/base/colla-cordova'
import Tos from '@/components/tos'

import SelectChat from '@/components/selectChat'

export default {
  name: 'About',
  components: {
    tos: Tos,
    selectChat: SelectChat
  },
  data() {
    return {
      subKind: 'default',
      collaPeerId: '12D3KooWQXZkJo3pfbcPWZJ2Sy2gUetKFpjTDsHEz3RZPAKoua2n',
      github: 'https://github.com/curltech',
      website: 'https://curltech.io/#/collachat'
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
    onCopySuccess: function (e) {
      this.$q.notify({
        message: this.$i18n.t("Copy successfully"),
        timeout: 3000,
        type: "info",
        color: "info",
      })
    },
    onCopyFailure: function (e) {
      this.$q.notify({
        message: this.$i18n.t("Copy failed"),
        timeout: 3000,
        type: "warning",
        color: "warning",
      })
    },
    enterQRCode() {
      let _that = this
      let store = _that.$store
      _that.subKind = 'qrCode'
      let content = _that.collaPeerId
      let logoSrc = store.defaultActiveAvatar
      _that.$nextTick(() => {
        mediaComponent.generateQRCode('qrCode', content, 256, logoSrc)
      })
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
            store.selectChatEntry = 'aboutQrCode'
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
            store.selectChatEntry = 'aboutQrCode'
            _that.subKind = 'selectChat'
          } else if (action.id === 'save') {
            mediaComponent.exportDiv('qrCodeCard', _that.$i18n.t('collaQRCode'))
          }
        }).onCancel(() => {
          // console.log('Dismissed')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    }
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeAboutSubKind = function (subKind) {
      _that.subKind = subKind
    }
    store.aboutEnterQRCode = _that.enterQRCode
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  watch: {
    /*subKind(val) {
      let _that = this
      let store = _that.$store
      if (store.state.ifMobileStyle) {
        if (val === 'default') {
          statusBarComponent.style(true, '#ffffff')
        } else {
          statusBarComponent.style(true, '#eee')
        }
      }
    }*/
  }
}
