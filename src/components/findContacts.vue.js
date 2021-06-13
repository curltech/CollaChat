import jsQR from 'jsqr'
import jimp from 'jimp'

import { EntityState } from 'libcolla'
import { chatAction, myself } from 'libcolla'
import { webrtcPeerPool } from 'libcolla'
import { ChatMessageType } from 'libcolla'

import pinyinUtil from '@/libs/base/colla-pinyin'
import { statusBarComponent } from '@/libs/base/colla-cordova'
import { systemAudioComponent, mediaComponent } from '@/libs/base/colla-media'
import { ChatContentType, P2pChatMessageType } from '@/libs/biz/colla-chat'
import { ContactDataType, RequestType, RequestStatus, LinkmanStatus, ActiveStatus, contactComponent } from '@/libs/biz/colla-contact'

import ContactsDetails from '@/components/contactsDetails'
//import PhoneContactsList from '@/components/phoneContactsList'

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
      filterOptions: this.$store.state.linkmanTagNames
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
    showAddContacts() {
      this.$store.state.findLinkmanData.message = this.$i18n.t("I'm ") + myself.myselfPeerClient.name
      this.$store.state.findLinkmanData.givenName = null
      this.$store.state.findLinkmanData.tagNames = []
      if (this.$store.findContactsEntry === 'phoneContactsList') {
        this.$store.findContactsEntry = 'phoneContactsList-result' // 复杂页面导航处理
      }
      this.$store.state.findContactsSubKind = 'addContacts'
    },
    async addLinkman() {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      let findLinkman = store.findLinkman
      let peerId = findLinkman.peerId
      let message = store.state.findLinkmanData.message
      let givenName = store.state.findLinkmanData.givenName
      let currentTime = new Date()
      let linkman = store.state.linkmanMap[peerId]

      // 新增linkman
      if (!linkman) {
        let newLinkman = {}
        newLinkman.ownerPeerId = myselfPeerClient.peerId
        newLinkman.peerId = peerId
        newLinkman.name = findLinkman.name
        newLinkman.pyName = pinyinUtil.getPinyin(findLinkman.name)
        newLinkman.givenName = givenName
        newLinkman.pyGivenName = pinyinUtil.getPinyin(givenName)
        newLinkman.mobile = findLinkman.mobile
        newLinkman.avatar = findLinkman.avatar
        newLinkman.publicKey = findLinkman.publicKey
        newLinkman.sourceType = "Search&Add"
        newLinkman.createDate = currentTime
        newLinkman.statusDate = currentTime
        newLinkman.status = LinkmanStatus.EFFECTIVE
        newLinkman.activeStatus = ActiveStatus.DOWN
        newLinkman.locked = false
        newLinkman.notAlert = false
        newLinkman.top = false
        await contactComponent.insert(ContactDataType.LINKMAN, newLinkman, store.state.linkmans)
        newLinkman.groupChats = []
        store.state.linkmans.sort(function (a, b) {
          let aPy = a.pyGivenName ? a.pyGivenName : a.pyName
          let bPy = b.pyGivenName ? b.pyGivenName : b.pyName
          if (aPy < bPy) {
            return -1;
          } else if (aPy == bPy) {
            return 0;
          } else {
            return 1;
          }
        })
        let tag = ''
        let linkmanTagLinkmans = []
        for (let findLinkmanDataTagName of store.state.findLinkmanData.tagNames) {
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
        newLinkman.tagNames = store.state.findLinkmanData.tagNames
        newLinkman.tag = tag
        newLinkman.pyTag = pinyinUtil.getPinyin(tag)
        store.state.linkmanMap[peerId] = newLinkman
      }
      // 之前的我的请求，状态置为Expired（Sent状态记录只应有1条），不包括群组请求
      let linkmanRequests = await contactComponent.loadLinkmanRequest(
        {
          ownerPeerId: myselfPeerClient.peerId,
          senderPeerId: myselfPeerClient.peerId,
          receiverPeerId: peerId,
          status: RequestStatus.SENT,
          requestType: RequestType.ADD_LINKMAN_INDIVIDUAL
        }
      )
      if (linkmanRequests && linkmanRequests.length > 0) {
        for (let linkmanRequest of linkmanRequests) {
          linkmanRequest.status = RequestStatus.EXPIRED
          linkmanRequest.statusDate = currentTime
        }
        await contactComponent.update(ContactDataType.LINKMAN_REQUEST, linkmanRequests, null)
      }
      for (let linkmanRequest of store.state.linkmanRequests) {
        if (linkmanRequest.senderPeerId === myselfPeerClient.peerId
          && linkmanRequest.receiverPeerId === peerId
          && linkmanRequest.status === RequestStatus.SENT
          && linkmanRequest.requestType === RequestType.ADD_LINKMAN_INDIVIDUAL) {
          linkmanRequest.status = RequestStatus.EXPIRED
          linkmanRequest.statusDate = currentTime
        }
      }

      // 新增Sent请求
      let linkmanRequest = {}
      linkmanRequest.requestType = RequestType.ADD_LINKMAN_INDIVIDUAL
      linkmanRequest.ownerPeerId = myselfPeerClient.peerId
      linkmanRequest.senderPeerId = myselfPeerClient.peerId
      linkmanRequest.receiverPeerId = peerId
      linkmanRequest.name = findLinkman.name
      linkmanRequest.mobile = findLinkman.mobile
      linkmanRequest.avatar = findLinkman.avatar
      linkmanRequest.publicKey = findLinkman.publicKey
      linkmanRequest.message = message
      linkmanRequest.createDate = currentTime
      linkmanRequest.status = RequestStatus.SENT
      await contactComponent.insert(ContactDataType.LINKMAN_REQUEST, linkmanRequest, null)
      store.state.linkmanRequests.unshift(linkmanRequest)

      // 发送Sent请求
      /*let targetPeerClient = new PeerClient()
      targetPeerClient.peerId = peerId
      targetPeerClient.connectPeerId = findLinkman.connectPeerId
      targetPeerClient.connectAddress = findLinkman.connectAddress
      targetPeerClient.connectPublicKey = findLinkman.connectPublicKey
      let srcPeerClient = new PeerClient()
      srcPeerClient.peerId = myselfPeerClient.peerId
      srcPeerClient.connectPeerId = myselfPeerClient.connectPeerId
      srcPeerClient.connectAddress = myselfPeerClient.connectAddress
      srcPeerClient.connectPublicKey = myselfPeerClient.connectPublicKey
      srcPeerClient.name = myselfPeerClient.name
      srcPeerClient.mobile = myselfPeerClient.mobile
      srcPeerClient.avatar = myselfPeerClient.avatar
      srcPeerClient.publicKey = myselfPeerClient.publicKey
      let payload = {}
      payload._id = linkmanRequest._id // 标识重复消息
      payload.message = message
      payload.createDate = currentTime
      await store.socketSend({
        messageType: ChatMessageType.ADD_LINKMAN_INDIVIDUAL,
        targetPeerClient: targetPeerClient,
        srcPeerClient: srcPeerClient,
        payload: payload
      })*/
      let payload = {}
      payload.type = ChatMessageType.ADD_LINKMAN_INDIVIDUAL
      payload.srcClientId = myselfPeerClient.clientId
      payload.srcPeerId = myselfPeerClient.peerId
      payload.srcName = myselfPeerClient.name
      payload.srcMobile = myselfPeerClient.mobile
      payload.srcAvatar = myselfPeerClient.avatar
      payload._id = linkmanRequest._id // 标识重复消息
      payload.message = message
      payload.createDate = currentTime
      await chatAction.chat(null, payload, peerId)
      _that.$q.notify({
        message: _that.$i18n.t("Send contacts request and add contacts successfully"),
        timeout: 3000,
        type: "info",
        color: "info",
      })

      store.state.findContactsSubKind = 'default'
    },
    showFindAcceptContacts() {
      this.$store.state.findLinkmanData.givenName = null
      this.$store.state.findLinkmanData.tagNames = []
      this.$store.state.findContactsSubKind = 'acceptContacts'
    },
    async acceptLinkman() {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      let linkmanRequest = store.findLinkman // 数据对象为linkmanRequest、不是linkman
      let peerId = linkmanRequest.senderPeerId
      let givenName = store.state.findLinkmanData.givenName
      let currentTime = new Date()

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
      await contactComponent.insert(ContactDataType.LINKMAN, newLinkman, store.state.linkmans)
      newLinkman.groupChats = []
      store.state.linkmans.sort(function (a, b) {
        let aPy = a.pyGivenName ? a.pyGivenName : a.pyName
        let bPy = b.pyGivenName ? b.pyGivenName : b.pyName
        if (aPy < bPy) {
          return -1;
        } else if (aPy == bPy) {
          return 0;
        } else {
          return 1;
        }
      });
      let tag = ''
      let linkmanTagLinkmans = []
      for (let findLinkmanDataTagName of store.state.findLinkmanData.tagNames) {
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
      newLinkman.tagNames = store.state.findLinkmanData.tagNames
      newLinkman.tag = tag
      newLinkman.pyTag = pinyinUtil.getPinyin(tag)
      store.state.linkmanMap[peerId] = newLinkman
      // 更新Received状态记录（可能有多条)，不包括群组请求
      let linkmanRequests = await contactComponent.loadLinkmanRequest(
        {
          ownerPeerId: myselfPeerClient.peerId,
          receiverPeerId: myselfPeerClient.peerId,
          senderPeerId: peerId,
          status: RequestStatus.RECEIVED,
          requestType: RequestType.ADD_LINKMAN_INDIVIDUAL
        }
      )
      if (linkmanRequests && linkmanRequests.length > 0) {
        for (let linkmanRequest of linkmanRequests) {
          linkmanRequest.status = RequestStatus.ACCEPTED
          linkmanRequest.statusDate = currentTime
        }
        await contactComponent.update(ContactDataType.LINKMAN_REQUEST, linkmanRequests, null)
      }
      for (let linkmanRequest of store.state.linkmanRequests) {
        if (linkmanRequest.receiverPeerId === myselfPeerClient.peerId
          && linkmanRequest.senderPeerId === peerId
          && linkmanRequest.status === RequestStatus.RECEIVED
          && linkmanRequest.requestType === RequestType.ADD_LINKMAN_INDIVIDUAL) {
          linkmanRequest.status = RequestStatus.ACCEPTED
          linkmanRequest.statusDate = currentTime
        }
      }

      // 发送Accept收条（可以省略）
      /*let targetPeerClient = new PeerClient()
      targetPeerClient.peerId = peerId
      let srcPeerClient = new PeerClient()
      srcPeerClient.peerId = myselfPeerClient.peerId
      srcPeerClient.name = myselfPeerClient.name
      srcPeerClient.mobile = myselfPeerClient.mobile
      srcPeerClient.avatar = myselfPeerClient.avatar
      srcPeerClient.publicKey = myselfPeerClient.publicKey
      let payload = {}
      payload.acceptTime = currentTime
      await store.socketSend({
        messageType: ChatMessageType.ADD_LINKMAN_INDIVIDUAL_RECEIPT,
        targetPeerClient: targetPeerClient,
        srcPeerClient: srcPeerClient,
        payload: payload
      })*/
      let payload = {}
      payload.type = ChatMessageType.ADD_LINKMAN_INDIVIDUAL_RECEIPT
      payload.srcClientId = myselfPeerClient.clientId
      payload.srcPeerId = myselfPeerClient.peerId
      payload.acceptTime = currentTime
      await chatAction.chat(null, payload, peerId)
      webrtcPeerPool.create(peerId)
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
        content: _that.$i18n.t("You") + _that.$i18n.t(" have accepted ") + (newLinkman.givenName ? newLinkman.givenName : newLinkman.name) + _that.$i18n.t(", you can chat now")
      }
      await store.addCHATSYSMessage(chat, chatMessage)

      store.state.findContactsSubKind = 'result'
    },
    defaultBack() {
      let _that = this
      let store = _that.$store
      /*if (store.findContactsEntry === 'accountInformation') {
        store.changeKind('accountInformation', 'me')
      } else {
        store.toggleDrawer(false)
      }*/
      store.toggleDrawer(false)
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
              store.findLinkman = null
              store.state.findLinkmanData = {
                peerId: null,
                message: null,
                givenName: null,
                tag: null
              }
              await store.findContacts('qrCode', resolve.data)
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
