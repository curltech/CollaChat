import { date } from 'quasar'
import { store } from 'quasar/wrappers'
import AlloyCrop from 'alloycrop-curltech'

import { myself, myselfPeerService, peerClientService } from 'libcolla'
import { BlobUtil, MobileNumberUtil } from 'libcolla'
import { EntityStatus } from 'libcolla'

import * as CollaConstant from '@/libs/base/colla-constant'
import pinyinUtil from '@/libs/base/colla-pinyin'
import { ContactDataType, contactComponent } from '@/libs/biz/colla-contact'
import { mediaComponent, cameraComponent, alloyFingerComponent } from '@/libs/base/colla-media'
import SelectChat from '@/components/selectChat'

export default {
  name: "AccountInformation",
  components: {
    selectChat: SelectChat,
  },
  data() {
    return {
      date: date,
      subKind: 'default',
      avatarSrc: null,
      avatarBase64: null,
      name: myself.myselfPeerClient.name,
      countryOptions: null,
      options: null,
      code_: null,
      mobile_: null,
      countryRegion_: null,
      showCrop: true
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    },
    GetAddressLabel() {
      let _that = this
      let store = _that.$store
      return function (address) {
        let label = ''
        for (let connectAddressOption of store.connectAddressOptionsISO[myself.myselfPeerClient.language]) {
          if (connectAddressOption.value === address) {
            label = connectAddressOption.label
            break
          }
        }
        if (!label) {
          label = _that.$i18n.t("Custom Node") + ' (' + address + ')'
        }
        return label
      }
    }
  },
  methods: {
    enterName() {
      this.name = this.$store.state.myselfPeerClient.name
      this.subKind = 'name'
    },
    enterMobile() {
      this.countryOptions = CollaConstant.countryOptionsISO[myself.myselfPeerClient.language]
      this.options = this.countryOptions
      this.code_ = '86'
      this.mobile_ = ''
      if (myself.myselfPeerClient.mobile) {
        try {
          let mobileObject = MobileNumberUtil.parse(myself.myselfPeerClient.mobile)
          this.code_ = mobileObject.getCountryCode() + ''
          this.mobile_ = mobileObject.getNationalNumber() + ''
        } catch (e) {
          console.log(e)
        }
      }
      this.countryRegion_ = this.options[CollaConstant.countryCodeISO[myself.myselfPeerClient.language].indexOf(this.code_)]
      this.subKind = 'mobile'
    },
    filterFnAutoselect(val, update, abort) {
      // call abort() at any time if you can't retrieve data somehow
      setTimeout(() => {
        update(
          () => {
            if (val === '') {
              this.options = this.countryOptions
            } else {
              const needle = val.toLowerCase()
              this.options = this.countryOptions.filter(v => v.toLowerCase().indexOf(needle) > -1)
            }
          },
          // next function is available in Quasar v1.7.4+;
          // "ref" is the Vue reference to the QSelect
          ref => {
            if (val !== '' && ref.options.length > 0 && ref.optionIndex === -1) {
              ref.moveOptionSelection(1, true) // focus the first selectable option and do not update the input-value
              ref.toggleOption(ref.options[ref.optionIndex], true) // toggle the focused option
            }
          }
        )
      }, 300)
    },
    abortFilterFn() {
      // console.log('delayed filter aborted')
    },
    upload: function (files) {
      let _that = this
      let file = files[0]
      let reader = new FileReader()
      reader.onload = _that.onChangeAvatar
      reader.readAsDataURL(file)
      _that.subKind = 'showPhoto'
      _that.$refs.upload.reset()
    },
    onChangeAvatar: function (e) {
      this.processAvatar2(e.target.result)
    },
    processAvatar2(avatarBase64) {
      let _that = this
      let newImage = new Image()
      newImage.src = avatarBase64
      newImage.setAttribute('crossOrigin', 'Anonymous') // url为外域时需要
      newImage.onload = function () {
        let imgWidth = this.width
        let imgHeight = this.height
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        // 缩小图片尺寸：短边300px
        console.log('imgWidth: ' + imgWidth + ', imgHeight: ' + imgHeight)
        let w = 300
        if (imgWidth > imgHeight) {
          canvas.width = w
          canvas.height = w * imgHeight / imgWidth
        } else {
          canvas.height = w
          canvas.width = w * imgWidth / imgHeight
        }
        console.log('canvasWidth: ' + canvas.width + ', canvasHeight: ' + canvas.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(newImage, 0, 0, canvas.width, canvas.height)
        // 压缩图片大小：长度10k以下
        console.log('avatarBase64.length: ' + avatarBase64.length)
        let quality = 1.0
        let arr = avatarBase64.split(',')
        let mime = arr[0].match(/:(.*?);/)[1]
        mime = (mime === 'image/png' ? 'image/jpeg' : mime)
        while (avatarBase64.length / 1024 > 10) {
          let length = avatarBase64.length
          quality -= 0.01
          avatarBase64 = canvas.toDataURL(mime, quality)
          if (avatarBase64.length === length) {
            console.log('no change')
            break
          }
        }
        console.log('compressed avatarBase64.length: ' + avatarBase64.length)
        console.log('quality: ' + quality)
        console.log('avatarBase64: ' + avatarBase64)
        _that.avatarBase64 = avatarBase64
        let photoImg = document.querySelector('#photoImg')
        photoImg.src = avatarBase64
        let marginTop = (_that.$q.screen.height - canvas.height) / 2 - 50
        photoImg.style.cssText += 'margin-top: ' + (marginTop < 0 ? 0 : marginTop) + 'px'
      }
    },
    processAvatar(avatarBase64) {
      let _that = this
      _that.$nextTick(() => {
        _that.showCrop = true
        let mAlloyCrop = new AlloyCrop({
          image_src: avatarBase64,
          className: 'donotPreventDefault', // class of croppingBox
          circle: true, // optional parameters , the default value is false
          width: 300, // crop width
          height: 300, // crop height
          output: 1, // output resolution --> 400*200
          ok: function (base64, canvas) {
            mAlloyCrop.destroy()
            let crop_result = document.querySelector("#crop_result")
            crop_result.appendChild(canvas)
            crop_result.querySelector("canvas").style.borderRadius = "50%"
            // 压缩图片大小：长度10k以下
            console.log('avatarBase64.length: ' + avatarBase64.length)
            let quality = 1.0
            let arr = base64.split(',')
            let mime = arr[0].match(/:(.*?);/)[1]
            mime = (mime === 'image/png' ? 'image/jpeg' : mime)
            while (base64.length / 1024 > 10) {
              let length = base64.length
              console.log('compressed base64.length: ' + length)
              quality -= 0.01
              base64 = canvas.toDataURL(mime, quality)
              if (base64.length === length) {
                console.log('no change')
                break
              }
            }
            console.log('quality: ' + quality)
            console.log('base64: ' + base64)
            _that.avatarBase64 = base64
          },
          cancel: function () {
            mAlloyCrop.destroy()
            _that.showCrop = false
          },
          ok_text: _that.$i18n.t('Ok'), // optional parameters , the default value is ok
          cancel_text: _that.$i18n.t('Cancel') // optional parameters , the default value is cancel
        })
      })
    },
    changeAvatar: async function () {
      if (this.avatarBase64) {
        this.$q.loading.show()
        let myselfPeerClient = myself.myselfPeerClient
        let myselfPeer = myself.myselfPeer
        let backupMobile = null
        try {
          let currentDate = new Date()
          myselfPeerClient.avatar = this.avatarBase64
          console.log('myselfPeerClient.avatar length: ' + this.avatarBase64.length)
          myselfPeerClient.lastUpdateTime = currentDate
          this.$store.state.myselfPeerClient = myselfPeerClient

          myselfPeer.avatar = this.avatarBase64
          myselfPeer.updateDate = currentDate
          myselfPeer.lastUpdateTime = currentDate
          myselfPeer = await myselfPeerService.update(myselfPeer)
          myself.myselfPeer = myselfPeer

          // 更新对应linkman
          let linkmanPeerId = myselfPeerClient.peerId
          let linkman = this.$store.state.linkmanMap[linkmanPeerId]
          linkman.avatar = this.avatarBase64
          let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
          linkmanRecord.avatar = this.avatarBase64
          await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
          this.$store.state.linkmanMap[linkmanPeerId] = linkman

          if (myselfPeerClient.visibilitySetting && myselfPeerClient.visibilitySetting.substring(1, 2) === 'N') {
            backupMobile = myselfPeerClient.mobile
            myselfPeerClient.mobile = ''
            myselfPeer.mobile = ''
          }
          let result = await peerClientService.putPeerClient(null, 'Up')
          console.log(result)
          if (result === 'OK') {
            this.$q.notify({
              message: this.$i18n.t("Change avatar successfully"),
              timeout: 3000,
              type: "info",
              color: "info"
            })
          } else {
            this.$q.notify({
              message: this.$i18n.t("Failed to change avatar"),
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
          this.subKind = 'default'
        }
      }
    },
    changeName: async function () {
      let myselfPeerClient = myself.myselfPeerClient
      let myselfPeer = myself.myselfPeer
      let backupMobile = null
      if (this.name !== myselfPeer.name) {
        let condition = { status: EntityStatus[EntityStatus.Effective] }
        condition.name = this.name
        let result = await myselfPeerService.findOne(condition, null, null)
        if (result) {
          this.$q.notify({
            message: this.$i18n.t("Same name account exists"),
            timeout: 3000,
            type: "warning",
            color: "warning",
          })  
        } else {
          try {
            this.$q.loading.show()
            let currentDate = new Date()
            myselfPeerClient.name = this.name
            myselfPeerClient.lastUpdateTime = currentDate
            this.$store.state.myselfPeerClient = myselfPeerClient

            myselfPeer.name = this.name
            myselfPeer.updateDate = currentDate
            myselfPeer.lastUpdateTime = currentDate
            myselfPeer = await myselfPeerService.update(myselfPeer)
            myself.myselfPeer = myselfPeer

            // 更新对应linkman
            let linkmanPeerId = myselfPeerClient.peerId
            let linkman = this.$store.state.linkmanMap[linkmanPeerId]
            linkman.name = this.name
            linkman.pyName = pinyinUtil.getPinyin(this.name)
            let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
            linkmanRecord.name = linkman.name
            linkmanRecord.pyName = linkman.pyName
            await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
            this.$store.state.linkmanMap[linkmanPeerId] = linkman

            if (myselfPeerClient.visibilitySetting && myselfPeerClient.visibilitySetting.substring(1, 2) === 'N') {
              backupMobile = myselfPeerClient.mobile
              myselfPeerClient.mobile = ''
              myselfPeer.mobile = ''
            }
            let result = await peerClientService.putPeerClient(null, 'Up')
            console.log(result)
            if (result === 'OK') {
              this.$q.notify({
                message: this.$i18n.t("Change name successfully"),
                timeout: 3000,
                type: "info",
                color: "info"
              })
            } else {
              this.$q.notify({
                message: this.$i18n.t("Failed to change name"),
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
            this.subKind = 'default'
          }
        }
      } else {
        this.subKind = 'default'
      }
    },
    changeMobile: async function () {
      let isPhoneNumberValid = false
      try {
        isPhoneNumberValid = MobileNumberUtil.isPhoneNumberValid(this.mobile_, MobileNumberUtil.getRegionCodeForCountryCode(this.code_))
      } catch (e) {
        console.log(e)
      }
      if (isPhoneNumberValid) {
        let myselfPeerClient = myself.myselfPeerClient
        let myselfPeer = myself.myselfPeer
        let backupMobile = null
        let mobile = MobileNumberUtil.formatE164(this.mobile_, MobileNumberUtil.getRegionCodeForCountryCode(this.code_))
        if (mobile !== myselfPeer.mobile) {
          this.$q.loading.show()
          try {
            let currentDate = new Date()
            myselfPeerClient.mobile = mobile
            myselfPeerClient.lastUpdateTime = currentDate
            this.$store.state.myselfPeerClient = myselfPeerClient

            myselfPeer.mobile = mobile
            myselfPeer.updateDate = currentDate
            myselfPeer.lastUpdateTime = currentDate
            myselfPeer = await myselfPeerService.update(myselfPeer)
            myself.myselfPeer = myselfPeer

            store.defaultCountryCode = this.code_
            store.state.countryCode = this.code_

            // 更新对应linkman
            let linkmanPeerId = myselfPeerClient.peerId
            let linkman = this.$store.state.linkmanMap[linkmanPeerId]
            linkman.mobile = mobile
            let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
            linkmanRecord.mobile = mobile
            await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
            this.$store.state.linkmanMap[linkmanPeerId] = linkman

            if (myselfPeerClient.visibilitySetting && myselfPeerClient.visibilitySetting.substring(1, 2) === 'N') {
              backupMobile = myselfPeerClient.mobile
              myselfPeerClient.mobile = ''
              myselfPeer.mobile = ''
            }
            let result = await peerClientService.putPeerClient(null, 'Up')
            console.log(result)
            if (result === 'OK') {
              this.$q.notify({
                message: this.$i18n.t("Change mobile successfully"),
                timeout: 3000,
                type: "info",
                color: "info"
              })
            } else {
              this.$q.notify({
                message: this.$i18n.t("Failed to change mobile"),
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
        }
        this.subKind = 'default'
      } else {
        this.$q.notify({
          message: this.$i18n.t("Invalid mobile number"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
      }
    },
    showAvatar() {
      let _that = this
      let store = _that.$store
      _that.subKind = 'avatar'
      _that.$nextTick(() => {
        let img = new Image()
        img.src = store.state.myselfPeerClient.avatar ? store.state.myselfPeerClient.avatar : store.defaultActiveAvatar
        img.onload = () => {
          console.log('img.width: ' + img.width + ', img.height: ' + img.height)
          let avatarContainer = document.getElementById('avatarContainer')
          let canvas = document.getElementById('avatar')
          let ctx = canvas.getContext('2d')
          canvas.width = _that.ifMobileSize || store.state.ifMobileStyle ? _that.$q.screen.width : (img.width > avatarContainer.clientWidth ? avatarContainer.clientWidth : img.width)
          canvas.height = canvas.width * img.height / img.width
          console.log('canvasWidth: ' + canvas.width + ', canvasHeight: ' + canvas.height)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          let avatarImg = document.querySelector('#avatarImg')
          avatarImg.src = canvas.toDataURL('image/png', 1.0)
          let marginTop = (_that.$q.screen.height - canvas.height) / 2 - 50
          avatarImg.style.cssText += 'margin-top: ' + (marginTop < 0 ? 0 : marginTop) + 'px'
          if (store.ifMobile()) {
            alloyFingerComponent.initImage('#avatarImg')
            alloyFingerComponent.initLongSingleTap('#avatarContainer', _that.operateAvatar)
          }
        }
      })
    },
    showPhotoBack() {
      let _that = this
      let store = _that.$store
      _that.subKind = 'avatar'
      _that.showAvatar()
    },
    operateAvatar: function () {
      let _that = this
      let store = _that.$store
      if (store.ifMobile()) {
        _that.$q.bottomSheet({
          actions: [
            {
              label: _that.$i18n.t('Take Photo'),
              icon: 'photo_camera',
              color: 'primary',
              id: 'takePhoto'
            },
            {},
            {
              label: _that.$i18n.t('Choose Photo'),
              icon: 'photo',
              color: 'primary',
              id: 'choosePhoto'
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
          if (action.id === 'takePhoto') {
            let params = null //{ targetHeight: 256, targetWidth: 256 }
            cameraComponent.getPicture(Camera.PictureSourceType.CAMERA, params).then(function (imageUri) {
              _that.avatarSrc = "data:image/jpeg;base64," + imageUri
              console.log('avatarSrc.length: ' + _that.avatarSrc.length)
              _that.subKind = 'showPhoto'
              _that.processAvatar(_that.avatarSrc)
            }).catch(function (err) {
              console.error(err)
            })
          } else if (action.id === 'choosePhoto') {
            let params = null //{ targetHeight: 256, targetWidth: 256 }
            cameraComponent.getPicture(Camera.PictureSourceType.SAVEDPHOTOALBUM, params).then(function (imageUri) {
              _that.avatarSrc = "data:image/jpeg;base64," + imageUri
              console.log('avatarSrc.length: ' + _that.avatarSrc.length)
              _that.subKind = 'showPhoto'
              _that.processAvatar(_that.avatarSrc)
            }).catch(function (err) {
              console.error(err)
            })
          } else if (action.id === 'save') {
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
              document.getElementById('avatar'),
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
              label: _that.$i18n.t('Choose Photo'),
              icon: 'photo',
              color: 'primary',
              id: 'choosePhoto'
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
        }).onOk(action => {
          // console.log('Action chosen:', action.id)
          if (action.id === 'choosePhoto') {
            _that.$refs.upload.pickFiles()
          } else if (action.id === 'save') {
            let avatarBase64 = myself.myselfPeerClient.avatar ? myself.myselfPeerClient.avatar : store.defaultActiveAvatar
            let arr = avatarBase64.split(',')
            let mime = arr[0].match(/:(.*?);/)[1]
            let extension = mime.split('/')[1]
            let a = document.createElement('a')
            a.href = BlobUtil.blobToUrl(BlobUtil.base64ToBlob(avatarBase64))
            a.download = _that.$i18n.t('myCollaAvatar') + '.' + extension
            a.click()
          }
        }).onCancel(() => {
          // console.log('Dismissed')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    },
    enterQRCode() {
      let _that = this
      let store = _that.$store
      _that.subKind = 'qrCode'
      let content = myself.myselfPeerClient.peerId
      let logoSrc = myself.myselfPeerClient.avatar ? myself.myselfPeerClient.avatar : store.defaultActiveAvatar
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
            store.selectChatEntry = 'accountInformationQrCode'
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
            store.selectChatEntry = 'accountInformationQrCode'
            _that.subKind = 'selectChat'
          } else if (action.id === 'save') {
            mediaComponent.exportDiv('qrCodeCard', _that.$i18n.t('myCollaQRCode') + '-' + _that.$i18n.t('PeerId'))
          }
        }).onCancel(() => {
          // console.log('Dismissed')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    },
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
    }
  },
  created() {
    let _that = this
    let store = _that.$store
    store.accountInformationEnterQRCode = _that.enterQRCode
  },
  watch: {
    countryRegion_(val) {
      if (val) {
        this.code_ = val.substring(val.indexOf('+', 0) + 1, val.indexOf(')', 0))
      }
    }
  }
}
