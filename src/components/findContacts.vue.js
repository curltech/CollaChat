import jsQR from 'jsqr'
import jimp from 'jimp'

import { EntityState } from 'libcolla'
import { myself, peerClientService } from 'libcolla'
import { webrtcPeerPool } from 'libcolla'

import * as CollaConstant from '@/libs/base/colla-constant'
import pinyinUtil from '@/libs/base/colla-pinyin'
import { statusBarComponent } from '@/libs/base/colla-cordova'
import { systemAudioComponent, mediaComponent } from '@/libs/base/colla-media'
import { ChatContentType, P2pChatMessageType } from '@/libs/biz/colla-chat'
import { ContactDataType, RequestType, RequestStatus, LinkmanStatus, ActiveStatus, contactComponent } from '@/libs/biz/colla-contact'

import ContactsDetails from '@/components/contactsDetails'
//import PhoneContactsList from '@/components/phoneContactsList'

const PeerId = require('peer-id')

export default {
  name: "AddContacts",
  components: {
    contactsDetails: ContactsDetails,
    //phoneContactsList:PhoneContactsList
  },
  props: [],
  data() {
    return {
      ActiveStatus: ActiveStatus,
      qrCodeDialog: false,
      filterOptions: this.$store.state.linkmanTagNames,
      addFindLinkmanData: {
        message: null,
        givenName: null,
        tagNames: null
      },
      acceptFindLinkmanData: {
        givenName: null,
        tagNames: null
      }
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
    }
  },
  methods: {
    filterFn(val, update) {
      update(() => {
        if (val === '') {
          this.filterOptions = this.$store.state.linkmanTagNames
        }
        else {
          const needle = val.toLowerCase()
          this.filterOptions = this.$store.state.linkmanTagNames.filter(
            v => v.toLowerCase().indexOf(needle) > -1
          )
        }
      })
    },
    validate(val) {
      return val && val.length > 0 && CollaConstant.countryCodeISO['zh-hans'].indexOf(val) !== -1
    },
    search() {
      let _that = this
      let store = _that.$store
      if (!_that.validate(store.state.countryCode)) {
        store.state.countryCode = store.defaultCountryCode
      }
      let val = store.state.findLinkmanData.peerId
      if (val && val.length > 0) {
        store.findContactsEntry = ''
        store.findContacts(null, null)
      }
    },
    showQRCodeDialog: function () {
      let _that = this
      let store = _that.$store
      _that.qrCodeDialog = true
      let content = myself.myselfPeerClient.peerId
      let logoSrc = myself.myselfPeerClient.avatar ? myself.myselfPeerClient.avatar : store.defaultActiveAvatar
      _that.$nextTick(() => {
        mediaComponent.generateQRCode('qrCode', content, 256, logoSrc)
      })
    },
    showContactsDetails(linkman) {
      if (linkman) {
        this.$store.state.findLinkman = linkman
        this.$store.state.currentLinkman = linkman
        this.$store.state.findContactsSubKind = 'contactsDetails'
        this.$store.contactsDetailsEntry = 'findContacts-result'
      }
    },
    showAddContacts(linkman) {
      if (linkman) {
        this.$store.state.findLinkman = linkman
      }
      this.addFindLinkmanData.message = this.$i18n.t("I'm ") + myself.myselfPeerClient.name
      this.addFindLinkmanData.givenName = null
      this.addFindLinkmanData.tagNames = []
      if (this.$store.findContactsEntry === 'phoneContactsList') {
        this.$store.findContactsEntry = 'phoneContactsList-result' // 复杂页面导航处理
      }
      this.$store.state.findContactsSubKind = 'addContacts'
    },
    showAcceptContacts(linkman) {
      if (linkman) {
        this.$store.state.findLinkman = linkman
      }
      this.acceptFindLinkmanData.givenName = null
      this.acceptFindLinkmanData.tagNames = []
      this.$store.state.findContactsSubKind = 'acceptContacts'
    },
    async addLinkman() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      try {
        let findLinkman = store.state.findLinkman
        let linkmanData = _that.addFindLinkmanData

        await store.addLinkman(findLinkman, linkmanData)
      } catch (error) {
        console.error(error)
      } finally {
        _that.$q.loading.hide()
        store.state.findContactsSubKind = 'default'
      }
    },
    async acceptLinkman() {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      let linkmanRequest = store.state.findLinkman // 数据对象为linkmanRequest、不是linkman
      let peerId = linkmanRequest.senderPeerId
      let givenName = _that.acceptFindLinkmanData.givenName
      let currentTime = new Date()

      let linkman = store.state.linkmanMap[peerId]
      if (linkman) {
        if (linkman.status === LinkmanStatus.REQUESTED) {
          linkman.status = LinkmanStatus.EFFECTIVE
          store.state.linkmanMap[peerId] = linkman
          let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
          if (linkmanRecord) {
            linkmanRecord.status = LinkmanStatus.EFFECTIVE
            await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
          }
        }
      } else {
        // 新增linkman
        let newLinkman = {}
        newLinkman.ownerPeerId = myselfPeerClient.peerId
        newLinkman.peerId = peerId
        newLinkman.name = linkmanRequest.name
        newLinkman.pyName = pinyinUtil.getPinyin(linkmanRequest.name)
        newLinkman.givenName = givenName
        newLinkman.pyGivenName = pinyinUtil.getPinyin(givenName)
        newLinkman.mobile = linkmanRequest.mobile
        newLinkman.avatar = linkmanRequest.avatar
        newLinkman.publicKey = linkmanRequest.publicKey
        newLinkman.sourceType = "AcceptRequest"
        newLinkman.createDate = currentTime
        newLinkman.statusDate = currentTime
        newLinkman.status = LinkmanStatus.EFFECTIVE
        newLinkman.activeStatus = ActiveStatus.DOWN
        newLinkman.locked = false
        newLinkman.notAlert = false
        newLinkman.top = false
        newLinkman.recallTimeLimit = true
        newLinkman.recallAlert = true
        newLinkman.myselfRecallTimeLimit = true
        newLinkman.myselfRecallAlert = true
        if (linkmanRequest.blackedMe === true) {
          newLinkman.blackedMe = true
        }
        await contactComponent.insert(ContactDataType.LINKMAN, newLinkman, store.state.linkmans)
        newLinkman.groupChats = []
        store.state.linkmans.sort(function (a, b) {
          let aPy = a.pyGivenName ? a.pyGivenName : a.pyName
          let bPy = b.pyGivenName ? b.pyGivenName : b.pyName
          if (aPy < bPy) {
            return -1
          } else if (aPy == bPy) {
            return 0
          } else {
            return 1
          }
        })
        let tag = ''
        let linkmanTagLinkmans = []
        for (let findLinkmanDataTagName of _that.acceptFindLinkmanData.tagNames) {
          let id = store.state.linkmanTagNameMap[findLinkmanDataTagName]
          if (!id) {
            let linkmanTag = {}
            linkmanTag.ownerPeerId = myselfPeerClient.peerId
            linkmanTag.name = findLinkmanDataTagName
            linkmanTag.createDate = new Date()
            await contactComponent.insert(ContactDataType.LINKMAN_TAG, linkmanTag, null)
            id = linkmanTag._id
            store.state.linkmanTagNames.push(findLinkmanDataTagName)
            store.state.linkmanTagNameMap[findLinkmanDataTagName] = id
            store.state.linkmanTagIdMap[id] = findLinkmanDataTagName
          }
          let linkmanTagLinkman = {}
          linkmanTagLinkman.ownerPeerId = myselfPeerClient.peerId
          linkmanTagLinkman.tagId = id
          linkmanTagLinkman.linkmanPeerId = peerId
          linkmanTagLinkman.createDate = new Date()
          linkmanTagLinkman.state = EntityState.New
          linkmanTagLinkmans.push(linkmanTagLinkman)
          tag = (tag ? tag + ", " + findLinkmanDataTagName : findLinkmanDataTagName)
        }
        await contactComponent.save(ContactDataType.LINKMAN_TAGLINKMAN, linkmanTagLinkmans, null)
        newLinkman.tagNames = _that.acceptFindLinkmanData.tagNames
        newLinkman.tag = tag
        newLinkman.pyTag = pinyinUtil.getPinyin(tag)
        store.state.linkmanMap[peerId] = newLinkman
      }
      // 更新Received状态记录（可能有多条)，不包括群组请求
      let linkmanRequests = await contactComponent.loadLinkmanRequest(
        {
          ownerPeerId: myselfPeerClient.peerId,
          receiverPeerId: myselfPeerClient.peerId,
          senderPeerId: peerId,
          status: RequestStatus.RECEIVED,
          requestType: RequestType.ADD_LINKMAN
        }
      )
      if (linkmanRequests && linkmanRequests.length > 0) {
        for (let lr of linkmanRequests) {
          lr.status = RequestStatus.ACCEPTED
          lr.statusDate = currentTime
        }
        await contactComponent.update(ContactDataType.LINKMAN_REQUEST, linkmanRequests, null)
      }
      for (let lr of store.state.linkmanRequests) {
        if (lr.receiverPeerId === myselfPeerClient.peerId
          && lr.senderPeerId === peerId
          && lr.status === RequestStatus.RECEIVED
          && lr.requestType === RequestType.ADD_LINKMAN) {
          lr.status = RequestStatus.ACCEPTED
          lr.statusDate = currentTime
        }
      }

      let payload = {}
      payload._id = linkmanRequest._id
      payload.srcClientId = myselfPeerClient.clientId
      payload.srcPeerId = myselfPeerClient.peerId
      payload.acceptTime = currentTime
      let message = {
        messageType: P2pChatMessageType.ADD_LINKMAN_REPLY,
        content: payload
      }
      await store.p2pSend(message, peerId)
      //await webrtcPeerPool.create(peerId)
      _that.$q.notify({
        message: _that.$i18n.t("Accept contacts request and add contacts successfully"),
        timeout: 3000,
        type: "info",
        color: "info",
      })

      // 打招呼
      let chat = await store.getChat(peerId)
      let chatMessage = {
        messageType: P2pChatMessageType.CHAT_SYS,
        contentType: ChatContentType.EVENT,
        content: _that.$i18n.t("You") + _that.$i18n.t(" have accepted ") + (givenName ? givenName : linkmanRequest.name) + _that.$i18n.t(", you can chat now")
      }
      await store.addCHATSYSMessage(chat, chatMessage)

      store.state.findContactsSubKind = 'result'
    },
    defaultBack() {
      let _that = this
      let store = _that.$store
      if (store.findContactsEntry === 'message') {
        store.changeKind('message')
      } else {
        store.toggleDrawer(false)
      }
    },
    resultBack() {
      let _that = this
      let store = _that.$store
      if (store.findContactsEntry === 'GROUP_CHATDetails') {
        store.changeMessageSubKind('GROUP_CHATDetails')
      } else if (store.findContactsEntry === 'message') {
        store.changeKind('message')
      } else if (store.findContactsEntry === 'receivedList') {
        store.changeReceivedListSubKind('default')
      } else if (store.findContactsEntry === 'phoneContactsList') {
        store.changePhoneContactsListSubKind('default')
      } else if (store.findContactsEntry === 'chat') {
        store.toggleDrawer(false)
      } else {
        store.state.findContactsSubKind = 'default'
      }
    },
    addContactsBack() {
      let _that = this
      let store = _that.$store
      if (store.findContactsEntry === 'phoneContactsList') {
        store.changePhoneContactsListSubKind('default')
      } else if (store.findContactsEntry === 'phoneContactsList-result') { // 复杂页面导航处理
        store.findContactsEntry = 'phoneContactsList'
        store.state.findContactsSubKind = 'result'
      } else {
        store.state.findContactsSubKind = 'result'
      }
    },
    enterScan() {
      let _that = this
      let store = _that.$store
      if (store.ifMobile()) {
        store.scanEntry = 'findContacts'
        store.scanSwitch(true)
        store.toggleDrawer(false)
        //statusBarComponent.style(false, '#33000000') // toggleDrawer(false)会触发，不重复调用
        document.querySelector("body").classList.remove('bgc')
      } else {
        _that.$refs.upload.pickFiles()
      }
    },
    upload: function (files) {
      let _that = this
      let store = _that.$store
      let file = files[0]
      let reader = new FileReader()
      reader.onload = function (e) {
        let base64 = e.target.result
        console.log('base64:' + base64)
        jimp.read(base64).then(async (res) => {
          const { data, width, height } = res.bitmap
          try {
            const resolve = await jsQR(data, width, height, { inversionAttempts: 'dontInvert' })
            if (resolve && resolve.data) {
              console.log(resolve.data)
              systemAudioComponent.scanAudioPlay()
              let peerId = resolve.data
              if (store.state.myselfPeerClient.peerId === peerId) {
                _that.$q.notify({
                  message: _that.$i18n.t('This is yourself'),
                  timeout: 3000,
                  type: "info",
                  color: "info",
                })
              } else {
                let linkman = store.state.linkmanMap[peerId]
                if (linkman && linkman.status !== LinkmanStatus.REQUESTED) {
                  store.state.currentLinkman = linkman
                  store.contactsDetailsEntry = 'findContacts'
                  store.changeKind('contactsDetails')
                } else {
                  linkman = await peerClientService.findPeerClient(null, peerId, null, null)
                  if (!linkman) {
                    _that.$q.notify({
                      message: _that.$i18n.t('The contact does not exist'),
                      timeout: 3000,
                      type: "info",
                      color: "info",
                    })
                  } else if (linkman.visibilitySetting && linkman.visibilitySetting.substring(3, 4) === 'N') {
                    _that.$q.notify({
                      message: _that.$i18n.t('The contact is invisible'),
                      timeout: 3000,
                      type: "info",
                      color: "info",
                    })
                  } else {
                    store.state.findLinkman = null
                    store.state.findLinkmanData = {
                      peerId: null,
                      message: null,
                      givenName: null,
                      tag: null
                    }
                    store.findContactsEntry = ''
                    await store.findContacts('qrCode', peerId)
                  }
                }
              }
            }
          } catch (err) {
            console.error(err)
            _that.$q.notify({
              message: _that.$i18n.t('Failed to read the qr code'),
              timeout: 3000,
              type: "warning",
              color: "warning",
            })
          }
        })
      }
      reader.readAsDataURL(file)
      _that.$refs.upload.reset()
    }
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  created() {
    let _that = this
    let store = _that.$store
  },
  watch: {
  }
}
