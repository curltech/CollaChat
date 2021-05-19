import { date, Dialog } from 'quasar'
import jsQR from 'jsqr'
import jimp from 'jimp'

import { CollaUtil, UUID } from 'libcolla'
import { webrtcPeerPool } from 'libcolla'
import { signalProtocol } from 'libcolla'
import { PeerEndpoint, peerEndpointService } from 'libcolla'
import { libp2pClientPool, config, peerClientService, p2pPeer, myself, myselfPeerService, ChatMessageType, chatAction, p2pChatAction, logService } from 'libcolla'

import pinyinUtil from '@/libs/base/colla-pinyin'
import * as CollaConstant from '@/libs/base/colla-constant'
import { statusBarComponent, deviceComponent, localNotificationComponent } from '@/libs/base/colla-cordova'
import { cameraComponent, systemAudioComponent, mediaComponent } from '@/libs/base/colla-media'
import { CollectionType } from '@/libs/biz/colla-collection'
import { ChatDataType, ChatContentType, P2pChatMessageType, SubjectType, chatComponent, chatBlockComponent} from '@/libs/biz/colla-chat'
import { ContactDataType, RequestType, RequestStatus, LinkmanStatus, ActiveStatus, contactComponent, MemberType } from '@/libs/biz/colla-contact'
import Chat from '@/components/chat'
import Contacts from '@/components/contacts'
import ReceivedList from '@/components/receivedList'
import GroupChatList from '@/components/groupChatList'
import PhoneContactsList from '@/components/phoneContactsList'
import ContactsTagList from '@/components/contactsTagList'
import ContactsDetails from '@/components/contactsDetails'
import Me from '@/components/me'
import AccountInformation from '@/components/accountInformation'
import Wallet from '@/components/wallet'
import Setting from '@/components/setting'
import Message from '@/components/message'
import SelectContacts from '@/components/selectContacts'
import SelectConference from '@/components/selectConference'
import FindContacts from '@/components/findContacts'
import Channel from '@/components/channel'
import Collection from '@/components/collection'
import VideoChat from '@/components/videoChat'

let QRScanner = window.QRScanner

export default {
  name: 'Index',
  components: {
    chat: Chat,
    contacts: Contacts,
    channel: Channel,
    me: Me,
    message: Message,
    findContacts: FindContacts,
    receivedList: ReceivedList,
    groupChatList: GroupChatList,
    phoneContactsList: PhoneContactsList,
    contactsTagList: ContactsTagList,
    selectContacts: SelectContacts,
    selectConference: SelectConference,
    contactsDetails: ContactsDetails,
    accountInformation: AccountInformation,
    collection: Collection,
    wallet: Wallet,
    setting: Setting,
    videoChat: VideoChat
  },
  data() {
    return {
      tab: null,
      drawer: false,
      kind: null,
      chatKind: null,
      contactsKind: null,
      channelKind: null,
      meKind: null,
      light: false,
      chatLoadingDone: false,
      noSwipeClose: false,
      connectArray: [],
      pendingSetupSocket: false,
      logoutFlag: false,
      heartbeatTimer: null
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    width() {
      return this.$store.state.ifMobileStyle ? this.$q.screen.width : this.$q.screen.width - 420
    },
    menuHeight() {
      return {
        height: `${(this.$q.screen.height - 80)}px`
      }
    },
    avatar() {
      return myself.myselfPeerClient.avatar ? myself.myselfPeerClient.avatar : this.$store.defaultActiveAvatar
    },
    ChatUnReadCount() {
      let _that = this
      let store = _that.$store
      let chatUnReadCount = 0
      let chats = store.state.chats
      if (chats && chats.length > 0) {
        for (let chat of chats) {
          let notAlert = false
          if (chat.subjectType === SubjectType.CHAT) {
            notAlert = store.state.linkmanMap[chat.subjectId] && store.state.linkmanMap[chat.subjectId].notAlert
          } else if (chat.subjectType === SubjectType.GROUP_CHAT) {
            notAlert = store.state.groupChatMap[chat.subjectId] && store.state.groupChatMap[chat.subjectId].notAlert
          }
          if (!notAlert && chat.unReadCount) {
            chatUnReadCount = chatUnReadCount + chat.unReadCount
          }
        }
      }
      return chatUnReadCount
    },
    ReceivedList() { // 待我接受的联系人的请求
      let _that = this
      let store = _that.$store
      let ReceivedArray = []
      let myselfPeerClient = myself.myselfPeerClient
      let linkmanRequests = store.state.linkmanRequests
      if (linkmanRequests && linkmanRequests.length > 0) {
        for (let linkmanRequest of linkmanRequests) {
          if (linkmanRequest.receiverPeerId === myselfPeerClient.peerId && linkmanRequest.status === RequestStatus.RECEIVED) {
            ReceivedArray.push(linkmanRequest)
          }
        }
      }
      return ReceivedArray
    }
  },
  methods: {
    moveFab(ev) {
      if (ev) {
        this.draggingFab = ev.isFirst !== true && ev.isFinal !== true
        this.fabPos = [
          this.fabPos[0] + ev.delta.x,
          this.fabPos[1] - ev.delta.y
        ]
      }
    },
    async preSetupSocket() {
      let _that = this
      let store = _that.$store
      if (!_that.logoutFlag) {
        store.peers = null
        if (store.state.linkmans && store.state.linkmans.length > 0) {
          webrtcPeerPool.clear()
          signalProtocol.clear()
        }
        let onlineStatus = deviceComponent.getOnlineStatus()
        console.log('getOnlineStatus:' + onlineStatus)
        if (onlineStatus) {
          console.log('re-setupSocket')
          await _that.setupSocket()
        } else {
          await _that.setNetworkStatus(false)
        }
      }
    },
    /**
     * 1）登录时不选择或者输入定位器，且当前账号localdb-myselfPeerEndPoints集合为空的（首次登录），从官方定位器列表集合中选择ping延时最小的连接，根据connect返回的closest节点集合【初始化】当前账号localdb-myselfPeerEndPoints集合（连接节点priority=1）；
     * 2）登录时不选择或者输入定位器，且当前账号localdb-myselfPeerEndPoints集合不为空的，从该集合中选择ping延时最小的连接，根据connect返回的closest节点集合【更新】当前账号localdb-myselfPeerEndPoints集合（连接节点原priority-X不为1的，更新为1，原priority-1的节点priorty更新为X）；
     * 3）登录时选择或者输入定位器（在当前账号localdb-myselfPeerEndPoints集合中），根据connect返回的closest节点集合【更新】当前账号localdb-myselfPeerEndPoints集合（连接节点原priority-X不为1的，更新为1，原priority-1的节点priorty更新为X）；
     * 4）登录时选择或者输入新的定位器（不在当前账号localdb-myselfPeerEndPoints集合中），根据connect返回的closest节点集合【重置】当前账号localdb-myselfPeerEndPoints集合（连接节点priority=1）。
     */
    async setupSocket() {
      let _that = this
      let store = _that.$store
      try {
        store.state.networkStatus = 'CONNECTING'
        let myselfPeerClient = myself.myselfPeerClient
        let clientPeerId = myselfPeerClient.peerId
        // 设置定位器
        store.resetConnectAddress = false // 重置MPEP标识
        if (store.connectAddress) {
          let condition = {}
          condition['ownerPeerId'] = clientPeerId
          condition['address'] = store.connectAddress
          let result = await peerEndpointService.find(condition, null, null, null, null)
          if (!result || result.length === 0) {
            store.resetConnectAddress = true
            let pep = new PeerEndpoint()
            pep.address = store.connectAddress
            result = [pep]
          } else {
            let priority = result[0].priority
            if (priority !== 1) {
              condition = {}
              condition['ownerPeerId'] = clientPeerId
              condition['priority'] = { $in: [1, priority] }
              let ret = await peerEndpointService.find(condition, null, null, null, null)
              if (ret && ret.length > 0) {
                for (let myPeerEndPoint of ret) {
                  if (myPeerEndPoint.priority === 1) {
                    myPeerEndPoint.priority = priority
                  } else if (myPeerEndPoint.priority === priority) {
                    myPeerEndPoint.priority = 1
                  }
                }
                await peerEndpointService.update(ret)
              }
              result[0].priority = 1
            }
          }
          _that.connectArray.splice(0, _that.connectArray.length, ...[result[0]])
        } else {
          let condition = {}
          condition['ownerPeerId'] = clientPeerId
          condition['priority'] = { $gt: null }
          let result = await peerEndpointService.find(condition, [{ priority: 'asc' }], null, null, null)
          if (result && result.length > 0) {
            if (result[0].priority !== 1) {
              throw new Error('myPEPs[0].priority does not equal to 1!')
            }
            _that.connectArray.splice(0, _that.connectArray.length, ...result)
          } else {
            _that.connectArray.splice(0, _that.connectArray.length)
            for (let i = 1; i < CollaConstant.connectAddressOptionsISO[myself.myselfPeerClient.language].length; i++) {
              let item = {}
              item.address = CollaConstant.connectAddressOptionsISO[myself.myselfPeerClient.language][i].value
              _that.connectArray.push(item)
            }
          }
        }
        await p2pPeer.start([_that.connectArray[0].address], { WebSockets: { debug: false, timeoutInterval: 5000, binaryType: 'arraybuffer' }})
        console.info('p2pPeer:' + clientPeerId + ' is started! enjoy it')
        // 选择连接速度最快的定位器
        /*for (let j = 0; j < _that.connectArray.length; j++) {
          console.log(j + '-ping:' + _that.connectArray[j].address)
          let latency = await p2pPeer.ping(_that.connectArray[j].address, 6000)
          console.log(j + '-latency:' + latency)
          _that.connectArray[j].connectTime = latency
        }
        CollaUtil.sortByKey(_that.connectArray, 'connectTime', 'asc')
        console.log(_that.connectArray)
        await _that.buildSocket(_that.connectArray[0].address)*/
        let ps = []
        for (let i = 0; i < _that.connectArray.length; i++) {
          //let promise = p2pPeer.ping(_that.connectArray[i].address, 6000)
          let promise = p2pPeer.host.ping(_that.connectArray[i].address)
          ps.push(promise)
        }
        let responses = await Promise.all(ps)
        if (responses && responses.length > 0) {
          for (let i = 0; i < responses.length; ++i) {
            console.log(i + '-pingLatency:' + _that.connectArray[i].address + ',' + responses[i])
            _that.connectArray[i].connectTime = responses[i]
          }
          CollaUtil.sortByKey(_that.connectArray, 'connectTime', 'asc')
          console.log(_that.connectArray)
          await _that.buildSocket()
        }
      } catch (e) {
        await logService.log(e, 'setupSocketError', 'error')
      }
    },
    async buildSocket() {
      let _that = this
      let store = _that.$store
      let connectAddress = _that.connectArray[0].address
      /*let connectTime = _that.connectArray[0].connectTime
      let heartbeatTimerInterval = 55
      if (connectTime === 999999999) {
        heartbeatTimerInterval = 5
      }
      console.log(heartbeatTimerInterval)*/
      let myselfPeerClient = myself.myselfPeerClient
      let clientPeerId = myselfPeerClient.peerId
      config.appParams.connectPeerId = [connectAddress]
      await p2pPeer.start(null, { WebSockets: { debug: false, timeoutInterval: 5000, binaryType: 'arraybuffer' }})
      console.info('p2pPeer:' + clientPeerId + ' is started! enjoy it')
      libp2pClientPool.closeAll()

      let webSocket = p2pPeer.host.transportManager._transports.get('WebSockets')
      webSocket.onopen = function (evt) {
        console.log('WebSocket Connected!')
        console.log(webSocket.ws)
        _that._heartbeatTimer = setInterval(async function () {
          let payload = {}
          payload.type = 'Heartbeat'
          payload.srcClientId = myself.myselfPeerClient.clientId
          payload.srcPeerId = myself.myselfPeerClient.peerId
          payload.createTimestamp = new Date().getTime()
          let connectAddressArr = connectAddress.split('/')
          let targetPeerId = connectAddressArr[connectAddressArr.length - 1]
          await chatAction.chat(null, payload, targetPeerId)
        }, 55 * 1000)
      }
      webSocket.onmessage = function (evt) {
        //console.log('WebSocket Message!')
        //console.log(webSocket.ws)
      }
      webSocket.onerror = async function (evt) {
        console.error('WebSocket Error!')
        console.log(webSocket.ws)
        if (_that._heartbeatTimer) {
          clearInterval(_that._heartbeatTimer)
          delete _that._heartbeatTimer
        }
        await _that.preSetupSocket()
      }
      webSocket.onclose = async function (evt) {
        console.log('WebSocket Closed!')
        console.log(webSocket.ws)
        if (_that._heartbeatTimer) {
          clearInterval(_that._heartbeatTimer)
          delete _that._heartbeatTimer
        }
        await _that.preSetupSocket()
      }
      /*if (_that.heartbeatTimer) {
        clearInterval(_that.heartbeatTimer)
        delete _that.heartbeatTimer
      }
      _that.heartbeatTimer = setInterval(async function () {
        let latency = await p2pPeer.ping(connectAddress, 6000)
        //console.log('heartbeatTimer-pingLatency:' + connectAddress + ',' + latency)
        if (latency === 999999999) {
          store.peers = null
          if (!_that.logoutFlag) {
            if (_that.heartbeatTimer) {
              clearInterval(_that.heartbeatTimer)
              delete _that.heartbeatTimer
            }
            if (store.state.networkStatus === 'DISCONNECTED') {
              _that.pendingSetupSocket = true
            } else {
              console.log('re-setupSocket')
              await _that.setupSocket()
            }
          }
        } else {
          if (!store.peers) {
            await _that.connect(connectAddress)
          }
        }
      }, heartbeatTimerInterval * 1000)*/
      await _that.connect(connectAddress)
    },
    async connect(connectAddress) {
      let _that = this
      let store = _that.$store
        // 建立primaryEndPoint连接
        let peers = await peerClientService.connect()
        console.log(peers)
        if (peers === 'mobileOccupied') {
          // 校验手机号失败
          /*_that.$q.notify({
            message: _that.$i18n.t("Account already exists with same mobile number"),
            timeout: 3000,
            type: "warning",
            color: "warning",
          })*/
          Dialog.create({
            title: _that.$i18n.t('Alert'),
            message: _that.$i18n.t('Account already exists with same mobile number'),
            cancel: false,
            ok: {"label":_that.$i18n.t('Ok'),"color":"primary","unelevated":true,"no-caps":true},
            persistent: true
          }).onOk(() => {
          }).onCancel(() => {
          })
          return
        } else if (peers && peers.length === 2 && peers[0] && peers[0].length > 0 && peers[1] && peers[1].length > 0) {
          // 标志primaryEndPoint连接成功
          store.peers = peers[0]
          store.peerClients = peers[1]
          console.log('primaryEndPoint connect success')
          store.state.networkStatus = 'CONNECTED'
          // 更新本地身份信息
          let currentDate = new Date()
          let myselfPeerClient = myself.myselfPeerClient
          myselfPeerClient.connectPeerId = connectAddress
          let myselfPeer = myself.myselfPeer
          myselfPeer.connectPeerId = connectAddress
          let linkmanPeerId = myselfPeerClient.peerId
          let linkman = store.state.linkmanMap[linkmanPeerId]
          let linkmanRecord = null
          let i = 0
          for (let peer of store.peerClients) {
            if (peer.clientId === myselfPeerClient.clientId && peer.peerId === myselfPeerClient.peerId) {
              myselfPeerClient.lastAccessTime = peer.lastAccessTime
              if (Date.parse(peer.lastUpdateTime) > Date.parse(myselfPeerClient.lastUpdateTime)) {
                //myselfPeerClient.mobile = peer.mobile
                //myselfPeerClient.publicKey = peer.publicKey
                //myselfPeerClient.privateKey = peer.privateKey
                myselfPeerClient.visibilitySetting = peer.visibilitySetting

                //myselfPeer.mobile = peer.mobile
                //myselfPeer.publicKey = peer.publicKey
                //myselfPeer.privateKey = peer.privateKey
                myselfPeer.visibilitySetting = peer.visibilitySetting

                // 更新对应linkman
                if (myselfPeerClient.avatar !== peer.avatar || myselfPeerClient.name !== peer.name) {
                  myselfPeerClient.avatar = peer.avatar
                  myselfPeerClient.name = peer.name

                  myselfPeer.avatar = peer.avatar
                  myselfPeer.name = peer.name
                  
                  linkman.avatar = peer.avatar
                  linkman.name = peer.name
                  linkman.pyName = pinyinUtil.getPinyin(peer.name)

                  linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
                  linkmanRecord.avatar = linkman.avatar
                  linkmanRecord.name = linkman.name
                  linkmanRecord.pyName = linkman.pyName
                }
              }
              store.peerClients.splice(i, 1)
              break
            } else {
              i++
            }
          }
          store.state.myselfPeerClient = myselfPeerClient
          myselfPeer.updateDate = currentDate
          myselfPeer = await myselfPeerService.update(myselfPeer)
          myself.myselfPeer = myselfPeer
          if (linkmanRecord) {
            store.state.linkmanMap[linkmanPeerId] = linkman
            await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
          }    
          // 判断更新primaryEndPoint的公钥
          let clientPeerId = myselfPeerClient.peerId
          let condition = {}
          condition['ownerPeerId'] = clientPeerId
          condition['priority'] = { $gt: null }
          let ret = await peerEndpointService.find(condition, [{ priority: 'asc' }], null, null, null)
          let myPEPs = ret ? ret : []
          // 重置MPEP
          if (ret && ret.length > 0 && store.resetConnectAddress) {
            await peerEndpointService.delete(ret)
            myPEPs = []
          }
          let maxPriority = myPEPs.length
          let increment = 1
          let processedPriority1 = false
          for (let peer of store.peers) {
            let ifExists = false
            for (let myPEP of myPEPs) {
              if (peer.discoveryAddress === myPEP.address) {
                ifExists = true
                if (peer.discoveryAddress === myselfPeerClient.connectPeerId) {
                  /*if (myPEP.priority !== 1) {
                    throw new Error('myPEP.priority does not equal to 1!')
                  }*/
                  myPEP.lastConnectTime = new Date()
                }
                myPEP.peerId = peer.peerId
                myPEP.publicKey = peer.publicKey
                myPEP.creditScore = peer.creditScore
                await peerEndpointService.update(myPEP)
              }
            }
            if (!ifExists) {
              let newPeer = new PeerEndpoint()
              newPeer.ownerPeerId = clientPeerId
              newPeer.peerId = peer.peerId
              newPeer.publicKey = peer.publicKey
              newPeer.address = peer.discoveryAddress
              newPeer.creditScore = peer.creditScore
              if (peer.discoveryAddress === myselfPeerClient.connectPeerId) {
                if (maxPriority !== 0) {
                  throw new Error('maxPriority does not equal to 0!')
                }
                newPeer.priority = 1
                newPeer.lastConnectTime = new Date()
                processedPriority1 = true
              } else {
                if (maxPriority === 0 && !processedPriority1) {
                  newPeer.priority = maxPriority + increment + 1
                } else {
                  newPeer.priority = maxPriority + increment
                }
              }
              await peerEndpointService.insert(newPeer)
              increment++
            }
          }
          condition = {}
          condition['ownerPeerId'] = clientPeerId
          condition['priority'] = { $gt: null }
          ret = await peerEndpointService.find(condition, [{ priority: 'asc' }], null, null, null)
          let result = ret ? ret : []
          console.log(result)
          await _that.webrtcInit()
          await store.upgradeVersion('about')
          return peers[0]
        } else {
          console.log("primaryEndPoint connect failure")
          return null
        }
      /*}*/
      //return null
    },
    async webrtcInit() {
      //webrtc connect
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      webrtcPeerPool.clientId = myselfPeerClient.clientId
      store.webrtcPeerPool = webrtcPeerPool
      let _connectAddress = myselfPeerClient.connectPeerId.match(/\/dns4\/(\S*)\/tcp/)[1]
      let iceServer = [
          {
            urls: `stun:${ _connectAddress }:3478`
          },
          {
            urls: `turn:${ _connectAddress }:3478`,
            username: myselfPeerClient.peerId,
            credential: myselfPeerClient.peerPublicKey
          }
      ]
      config.appParams.iceServer = [iceServer]
      for (let linkman of store.state.linkmans) {
        if(linkman.peerId !== myselfPeerClient.peerId){
          let option = {}
          if(store.state.currentCallChat && store.state.currentCallChat.streamMap && store.state.currentCallChat.streamMap[linkman.peerId] && store.state.currentCallChat.streamMap[linkman.peerId].pending){
              option.stream = store.state.currentCallChat.streamMap[myselfPeerClient.peerId].stream
              option.stream.getAudioTracks()[0].enable = true
              store.state.currentCallChat.streamMap[linkman.peerId].pending = false
              console.log('index.vue -add stream')
          }
          webrtcPeerPool.create(linkman.peerId, option)
        }
      }
    },
    async sendUnsentMessage(linkmanPeerId) {
      let _that = this
      let store = _that.$store
      //linkman
      let unSentIndividualMessages = await chatComponent.loadMessage({
        ownerPeerId: myself.myselfPeerClient.peerId,
        senderPeerId : myself.myselfPeerClient.peerId,
        subjectId: linkmanPeerId,
        subjectType: SubjectType.CHAT,
        actualReceiveTime: { $eq: null }
      })
      if (unSentIndividualMessages && unSentIndividualMessages.length > 0) {
        for (let unSentIndividualMessage of unSentIndividualMessages) {
          await store.p2pSend(unSentIndividualMessage,linkmanPeerId)
        }
      }
      //group
      let unSentReceives = await chatComponent.loadReceive({
        ownerPeerId: myself.myselfPeerClient.peerId,
        receiverPeerId: linkmanPeerId,
        receiveTime: { $eq: null }
      })
      if (unSentReceives && unSentReceives.length > 0) {
        for (let unSentReceive of unSentReceives) {
          if (unSentReceive.subjectType === SubjectType.LINKMAN_REQUEST) {
            let linkmanRequest = await contactComponent.get(ContactDataType.LINKMAN_REQUEST, unSentReceive.messageId)
            if (linkmanRequest.data) {
              try {
                linkmanRequest.data = JSON.parse(linkmanRequest.data)
              } catch (e) {
                console.log('JSON parse error, string:' + linkmanRequest.data + '; error:' + e)
              }
            }
            let message = {
              messageType: unSentReceive.messageType,
              content: linkmanRequest
            }
            await store.p2pSend(message,linkmanPeerId)
          } else {
            let unSentGroupMessages = await chatComponent.loadMessage({
              ownerPeerId: myself.myselfPeerClient.peerId,
              messageId: unSentReceive.messageId
            })
            if (unSentGroupMessages && unSentGroupMessages.length > 0) {
              for (let unSentGroupMessage of unSentGroupMessages) {
                await store.p2pSend(unSentGroupMessage,linkmanPeerId)
              }
            }
          }
        }
      }
    },
    async insertReceivedMessage(message) {
      let _that = this
      let store = _that.$store
      if (message.messageType == P2pChatMessageType.CHAT_LINKMAN || message.messageType == P2pChatMessageType.CALL_REQUEST) {
        await _that.insertReceivedChatMessage(message)
      }
    },
    async insertReceivedChatMessage(message) {
      let _that = this
      let store = _that.$store
      let currentDate = new Date().getTime()
      let _message = {
        messageType: P2pChatMessageType.CHAT_RECEIVE_CALLBACK,
        preSubjectType: message.subjectType,
        preSubjectId: message.subjectId,
        senderPeerId: myself.myselfPeerClient.peerId,
        messageId: message.messageId,
        receiveTime: currentDate
      }
      await store.p2pSend( _message ,message.senderPeerId)
      let receivedMessages = await chatComponent.loadMessage({
        ownerPeerId: myself.myselfPeerClient.peerId,
        messageId: message.messageId
      })
      if (receivedMessages && receivedMessages.length > 0) {
        return
      }
      if (message.subjectType === SubjectType.CHAT) {
        let ownerPeerId = message.ownerPeerId
        message.ownerPeerId = message.subjectId
        message.subjectId = ownerPeerId
      } else {
        message.ownerPeerId = myself.myselfPeerClient.peerId
      }
      message.receiveTime = currentDate
      message.actualReceiveTime = currentDate
      let subjectId = message.subjectId
      if (message.contentType == ChatContentType.FILE || message.contentType == ChatContentType.IMAGE || message.contentType == ChatContentType.VIDEO || message.contentType == ChatContentType.NOTE) {
        message.percent = null
        message.loading = false
      } else if (message.contentType == ChatContentType.CHAT) {
        await store.receiveMergeMessage(message)
      }
      let currentChat = await store.getChat(subjectId)
      currentChat.content = store.getChatContent(message.contentType, message.content)
      currentChat.updateTime = currentDate
      let content = message.content
      if (message.subjectType === SubjectType.GROUP_CHAT && message.contentType == ChatContentType.TEXT && content.indexOf('@') > -1) {
        let groupChat = store.state.groupChatMap[subjectId]
        let name = groupChat.myAlias?groupChat.myAlias:myself.myselfPeerClient.name
        if(content.indexOf(`@${name} `) > -1){
          currentChat.focusedMessage = message
        }
      }
      await chatComponent.update(ChatDataType.CHAT, currentChat)
      localNotificationComponent.sendNotification(
        store.getChatName(currentChat.subjectType, currentChat.subjectId),
        currentChat.content,
        {type:'chat',subjectId:currentChat.subjectId}
      )
      let messages = currentChat.messages
      // Read/UnRead
      if (store.state.chatMap[subjectId] == store.state.currentChat) {
        message.readTime = new Date()
        if (message.destroyTime) {
          let callbackMessage = {
            messageId: message.messageId,
            subjectId: message.senderPeerId,
            senderPeerId: myself.myselfPeerClient.peerId,
            messageType: P2pChatMessageType.CHAT_READ_CALLBACK,
            preSubjectType: message.subjectType,
            readTime: message.readTime
          }
          await store.p2pSend(callbackMessage,message.senderPeerId)
          message.countDown = message.destroyTime / 1000
          let countDownInterval = setInterval(async function () {
            if (!message.countDown) {
              clearInterval(countDownInterval)
              let currentChatMessages = store.state.chatMap[subjectId].messages
              for (let i = currentChatMessages.length - 1; i >= 0; i--) {
                if (message == currentChatMessages[i]) {
                  await chatComponent.remove(ChatDataType.MESSAGE, message, messages)
                }
              }
              return
            }
            message.countDown--
            console.log(message.countDown)
          }, 1000)
        }
      } else {
        store.state.chatMap[subjectId].unReadCount = store.state.chatMap[subjectId].unReadCount != undefined ? store.state.chatMap[subjectId].unReadCount + 1 : 0
      }
      await store.handleChatTime(message, currentChat)
      _that.$nextTick(() => {
        let alert
        if (message.subjectType === SubjectType.CHAT) {
          alert = store.state.linkmanMap[subjectId].notAlert
        } else if (message.subjectType === SubjectType.GROUP_CHAT) {
          alert = store.state.groupChatMap[subjectId].notAlert
        }
        if (alert) {
          systemAudioComponent.alertPlay()
        }
        let container = document.getElementById('talk')
        if (container) {
          setTimeout(function () {
            container.scrollTop = container.scrollHeight
          }, 100)
        }
      })
      await chatComponent.insert(ChatDataType.MESSAGE, message, messages)
      // AutoDownload
      if (message.subjectType == SubjectType.CHAT && store.state.linkmanMap[message.subjectId].downloadSwitch && (message.contentType === ChatContentType.FILE || message.contentType === ChatContentType.IMAGE)) {
        await store.getMessageFile(message)
      }
    },
    getChatContent(contentType, content) {
      let _that = this
      let result
      switch (contentType) {
        case ChatContentType.TEXT:
          if (content) {
            content = content.replace(/<\/?.+?>/g, '')
          }
          result = content
          break
        case ChatContentType.FILE:
          result = `[${_that.$i18n.t("file")}]`
          break
        case ChatContentType.IMAGE:
          result = `[${_that.$i18n.t("image")}]`
          break
        case ChatContentType.AUDIO_INVITATION:
          result = `[${_that.$i18n.t("audioInvitation")}]`
          break
        case ChatContentType.VIDEO_INVITATION:
          result = `[${_that.$i18n.t("videoInvitation")}]`
          break
        case ChatContentType.AUDIO:
          result = `[${_that.$i18n.t("audio")}]`
          break
        case ChatContentType.VIDEO:
          result = `[${_that.$i18n.t("video")}]`
          break
        case ChatContentType.CARD:
          result = `[${_that.$i18n.t("card")}]`
          break
        case ChatContentType.NOTE:
          result = `[${_that.$i18n.t("note")}]`
          break
        default:
          result = content
      }
      return result
    },
    async getChat(subjectId) {
      let _that = this
      let store = _that.$store
      let chat
      if (store.state.chatMap[subjectId]) {
        chat = store.state.chatMap[subjectId]
      }
      else {
        let chatDBItems = await chatComponent.loadChat({
          ownerPeerId: myself.myselfPeerClient.peerId,
          subjectId: subjectId
        })
        if (chatDBItems && chatDBItems.length > 0) {
          chat = chatDBItems[0]
        } else {
          chat = {
            ownerPeerId: myself.myselfPeerClient.peerId,
            subjectId: subjectId,
            updateTime: new Date()
          }
          await chatComponent.insert(ChatDataType.CHAT, chat, null)
        }
        chat.unReadCount = 0
        chat.destroyTime = 0
        chat.mediaProperty = null
        chat.content = ""
        chat.noMoreMessageTag = false
        chat.subjectType = store.state.linkmanMap[subjectId] ? SubjectType.CHAT : SubjectType.GROUP_CHAT
        chat.messages = []
        store.state.chats.unshift(chat)
        store.state.chatMap[subjectId] = chat
      }
      return chat
    },
    setCurrentChat(subjectId) {
      let _that = this
      let store = _that.$store
      let targetChat = store.state.chatMap[subjectId]
      if (targetChat) {
        store.state.currentChat = targetChat
      }
    },
    async sendChatMessage(chat, message) { // message必填属性：messageType, contentType, content/thumbnail
      let _that = this
      let store = _that.$store
      let myselfPeerId = myself.myselfPeerClient.peerId
      // chat属性
      let subjectType = chat.subjectType
      let subjectId = chat.subjectId
      // 设置message其他属性
      message.ownerPeerId = myselfPeerId
      message.subjectType = subjectType
      message.subjectId = subjectId
      message.destroyTime = chat.destroyTime
      message.messageId = message.messageId ? message.messageId : UUID.string(null, null)
      message.senderPeerId = myselfPeerId
      message.createDate = new Date().getTime()
      message.countDown = 0
      message.receiveTime = message.createDate
      if(subjectId !== myselfPeerId && (message.messageType !== P2pChatMessageType.CALL_REQUEST)){
        message.actualReceiveTime = null
      }else{
        message.actualReceiveTime = message.createDate
      }
      if (subjectType === SubjectType.CHAT && subjectId !== myselfPeerId) {
        await store.p2pSend(message,subjectId)
      } else if (subjectType === SubjectType.GROUP_CHAT) {
        let groupMembers
        if (message.contentType === ChatContentType.VIDEO_INVITATION || message.contentType === ChatContentType.AUDIO_INVITATION || message.messageType === P2pChatMessageType.CALL_CLOSE) {
          groupMembers = message.content
        } else {
          groupMembers = store.state.groupChatMap[subjectId].groupMembers
        }
        for (let groupMember of groupMembers) {
          let linkman = store.state.linkmanMap[groupMember.memberPeerId ? groupMember.memberPeerId : groupMember]
          if (linkman && linkman.peerId !== linkman.ownerPeerId) { // 自己和非联系人除外
            await store.p2pSend(message,groupMember.memberPeerId ? groupMember.memberPeerId : groupMember)
            let receive = {
              ownerPeerId: message.ownerPeerId,
              subjectType: message.subjectType,
              subjectId: message.subjectId,
              messageType: message.messageType,
              messageId: message.messageId,
              createDate: message.createDate,
              receiverPeerId: groupMember.memberPeerId ? groupMember.memberPeerId : groupMember,
              receiveTime: null
            }
            if(message.messageType !== P2pChatMessageType.CALL_CLOSE){
              await chatComponent.insert(ChatDataType.RECEIVE, receive, null)
            }
          }
        }
      }
      if (message.messageType === P2pChatMessageType.CALL_CLOSE || message.contentType === ChatContentType.CALL_JOIN_REQUEST || (message.subjectType === SubjectType.CHAT && message.messageType === P2pChatMessageType.CALL_REQUEST)) {
        return
      }
      await store.handleChatTime(message, chat)
      await chatComponent.insert(ChatDataType.MESSAGE, message, chat.messages)
      if (message.messageType === P2pChatMessageType.CHAT_LINKMAN) {
        chat.content = store.getChatContent(message.contentType, message.content)
      }
      chat.updateTime = message.createDate
      await chatComponent.update(ChatDataType.CHAT, chat)
      _that.$nextTick(() => {
        let container = _that.$el.querySelector('#talk')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },
    async handleChatTime(current, chat) {
      let _that = this
      let store = _that.$store
      if (current.messageType === P2pChatMessageType.CALL_CLOSE) {
        return
      }
      let messages = chat.messages
      let currentTime = current.receiveTime
      let preTime = new Date()
      preTime.setTime(currentTime - 1000 * 500)
      let isNeedInsert = true
      if (messages && messages.length > 0) {
        for (let i = messages.length; i--; i > -1) {
          let _message = messages[i]
          if (_message.messageType === P2pChatMessageType.CHAT_SYS && _message.contentType === ChatContentType.TIME) {
            let _time = _message.content
            if (_time > preTime) {
              isNeedInsert = false
            }
          }
        }
      }
      if (isNeedInsert) {
        let message = {
          messageType: P2pChatMessageType.CHAT_SYS,
          contentType: ChatContentType.TIME,
          content: currentTime,
          receiveTime: currentTime
        }
        await store.addCHATSYSMessage(chat, message)
      }
    },
    async addCHATSYSMessage(chat, message) { // message必填属性：messageType, contentType, content
      let _that = this
      let store = _that.$store
      let myselfPeerId = myself.myselfPeerClient.peerId
      // chat属性
      let subjectType = chat.subjectType
      let subjectId = chat.subjectId
      // 设置message其他属性
      let currentDate = new Date().getTime()
      message.ownerPeerId = myselfPeerId
      message.subjectType = subjectType
      message.subjectId = subjectId
      message.messageId = message.messageId ? message.messageId : UUID.string(null, null)
      message.senderPeerId = myselfPeerId
      message.createDate = currentDate
      message.countDown = 0
      message.receiveTime = message.receiveTime ? message.receiveTime : currentDate
      await chatComponent.insert(ChatDataType.MESSAGE, message, chat.messages)
      chat.updateTime = currentDate
      await chatComponent.update(ChatDataType.CHAT, chat)
      _that.$nextTick(() => {
        let container = _that.$el.querySelector('#talk')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },
    async collectionForwardToChat(item,chat) {
      let _that = this
      let store = _that.$store
      if (item.collectionType === CollectionType.FILE || item.collectionType === CollectionType.VIDEO || item.collectionType === CollectionType.AUDIO || item.collectionType === CollectionType.IMAGE) {
        let fileData = item.content
        let name = item.contentTitle
        let type = item.collectionType
        await store.saveFileAndSendMessage(chat, fileData, type, name)
      } else {
        let message = {}
        message.title = item.contentTitle
        if (item.collectionType === ChatContentType.CHAT) {
          let mergeMessages = JSON.parse(item.plainContent)
          let firstMessage = mergeMessages[0]
          message.mergeMessageId = firstMessage.mergeMessageId
          message.content = store.getChatContent(firstMessage.contentType, firstMessage.content)
          message.mergeMessages = mergeMessages
        } else if (item.collectionType === ChatContentType.NOTE) {
          message.title = item.title
          message.thumbnail = item.thumbnail
          message.thumbType = item.thumbType
          message.attachIVAmount = item.attachIVAmount
          message.contentIVAmount = item.contentIVAmount
          message.contentTitle = item.contentTitle
          message.contentAAmount = item.contentAAmount
          message.attachAAmount = item.attachAAmount
          message.attachOAmount = item.attachOAmount
          message.firstAudioDuration = item.firstAudioDuration
          message.firstFileInfo = item.firstFileInfo
          message.contentBody = item.contentBody
          //message.content = item.content
          message.srcEntityType = item.srcEntityType
          message.srcEntityId = item.srcEntityId
          message.srcEntityName = item.srcEntityName
          message.messageId = UUID.string(null, null)
          message.messageType = P2pChatMessageType.CHAT_LINKMAN
          await store.saveFileInMessage(chat, message, item.content, item.collectionType, item.title, message.messageId)
        } else {
          message.content = item.content
        }
        message.messageType = P2pChatMessageType.CHAT_LINKMAN
        message.contentType = item.collectionType
        console.log(message)
        await store.sendChatMessage(chat, message)
        _that.setCurrentChat(chat.subjectId)
      }
      if(_that.tab !== 'chat'){
        store.changeTab('chat')
      }
      store.changeKind('message')
    },
    async saveFileInMessage(chat, message, fileData, type, name, originalMessageId) {
      let _that = this
      let store = _that.$store
      let peerId = chat.subjectId
      let _peers = []
      if(chat.subjectType === SubjectType.CHAT){
        _peers.push(store.state.linkmanMap[peerId])
      }else if(chat.subjectType === SubjectType.GROUP_CHAT){
        let groupMembers = store.state.groupChatMap[peerId].groupMembers
        for (let groupMember of groupMembers) {
          let linkman = store.state.linkmanMap[groupMember.memberPeerId]
          if(linkman && groupMember.memberPeerId !== myself.myselfPeerClient.peerId){
            _peers.push(linkman)
          }
        }
      }
      chatComponent.localFileDataMap[message.messageId] = fileData
      let current = {
        _id: message.messageId,
        blockId: UUID.string(null, null),
        attachs: [{
          content: fileData,
          messageId: message.messageId,
          ownerPeerId: myself.myselfPeerClient.peerId,
          originalMessageId: originalMessageId
        }],
        tag: "",
        updateDate: new Date().getTime()
      }
      this.$q.loading.show()
      let saveResult = await chatBlockComponent.save(current,_peers)
      this.$q.loading.hide()
      if (!saveResult) {
        _that.$q.notify({
          message: _that.$i18n.t("Save failed"),
          timeout: 3000,
          type: "warning",
          color: "info",
        })
        return
      }
      message.blockId = current.blockId
      message.connectPeerId = myself.myselfPeerClient.connectPeerId
      if (type === ChatContentType.IMAGE) {
        message.thumbnail = await mediaComponent.compressImage(fileData)
      } else if (type === ChatContentType.VIDEO) {
        message.thumbnail = await mediaComponent.createVideoThumbnailByBase64(fileData)
      }
      if (name) {
        message.content = name
      }
      message.contentType = type
    },
    async saveFileAndSendMessage(chat,fileData, type, name) {
      let _that = this
      let store = _that.$store
      let message = {}
      message.messageId = UUID.string(null, null)
      message.messageType = P2pChatMessageType.CHAT_LINKMAN
      await store.saveFileInMessage(chat, message, fileData, type, name, message.messageId)
      await store.sendChatMessage(chat, message)
    },
    async saveAndSendMessage(message, groupChatLinkman) {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      // 保存发送接收记录
      let receiveMessage = {}
      receiveMessage.ownerPeerId = myselfPeerClient.peerId
      receiveMessage.subjectType = message.subjectType
      receiveMessage.messageType = message.messageType
      receiveMessage.messageId = message.content._id
      receiveMessage.createDate = message.content.createDate
      receiveMessage.receiverPeerId = groupChatLinkman.peerId
      await chatComponent.insert(ChatDataType.RECEIVE, receiveMessage, null)
      // 给active的联系人发送消息
      if (groupChatLinkman.activeStatus === ActiveStatus.UP) {
        let rtcMessage = {
          messageType: message.messageType,
          content: message.content
        }
        await store.p2pSend( rtcMessage, groupChatLinkman.peerId)
      }
    },
    async findContacts(findType, peerId) {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      if (!peerId && store.state.findLinkmanData.peerId) {
        peerId = store.state.findLinkmanData.peerId
      }
      if (peerId) {
        if (myselfPeerClient.peerId === peerId && findType !== 'card') {
          store.state.findLinkmanResult = 1
          store.state.findLinkmanTip = _that.$i18n.t("Can't add yourself into contacts list")
          /*_that.$q.dialog({
            message: store.state.findLinkmanTip,
            persistent: true
          })*/
        } else {
          let linkman = store.state.linkmanMap[peerId]
          if (linkman) {
            store.state.findLinkmanResult = 2
            //store.state.findLinkmanTip = _that.$i18n.t('The contact is already in your contacts list')
            store.state.findLinkmanTip = ''
            store.findLinkman = linkman
            store.state.currentLinkman = linkman
            store.state.findContactsSubKind = 'contactsDetails'
            if (findType === 'card') {
              store.contactsDetailsEntry = 'message'
              store.changeKind('findContacts')
            } else {
              store.contactsDetailsEntry = 'findContacts'
            }
            /*if (store.state.ifMobileStyle) {
              statusBarComponent.style(true, '#ffffff')
            }*/
          } else {
            let receivedRequest = false
            for (let linkmanRequest of store.state.linkmanRequests) {
              if (linkmanRequest.receiverPeerId === myselfPeerClient.peerId
                && linkmanRequest.senderPeerId === peerId
                && linkmanRequest.status === RequestStatus.RECEIVED) {
                receivedRequest = true
                store.state.findLinkmanResult = 3
                store.state.findLinkmanTip = ''
                store.findLinkman = linkmanRequest
                store.findLinkman.peerId = linkmanRequest.senderPeerId
              }
            }
            if (!receivedRequest) {
              store.findLinkman = await peerClientService.findPeerClient(null, peerId, null)
              if (findType === 'qrCode' && store.findLinkman && store.findLinkman.visibilitySetting && store.findLinkman.visibilitySetting.substring(3, 4) === 'N') {
                store.state.findLinkmanResult = 1
                store.state.findLinkmanTip = _that.$i18n.t('The contact is invisible')
                store.findLinkman = null
                store.state.findLinkmanData = {
                  peerId: _that.$i18n.t('Invisible Peer Id'), // set Peer Id scenario 1
                  message: null,
                  givenName: null,
                  tag: null
                }
              } else if (store.findLinkman && !(store.findLinkman.visibilitySetting && store.findLinkman.visibilitySetting.substring(0, 1) === 'N')) {
                store.state.findLinkmanResult = 4
                store.state.findLinkmanTip = ''
              } else {
                store.state.findLinkmanResult = 1
                store.state.findLinkmanTip = _that.$i18n.t('The contact does not exist')
                store.findLinkman = null
              }
            }
            if (store.state.findLinkmanResult === 3 || store.state.findLinkmanResult === 4) {
              store.state.findContactsSubKind = 'result'
              if (findType === 'card') {
                store.findContactsEntry = 'message'
                store.changeKind('findContacts')
              }
            }
          }
        }
        // set Peer Id scenario 2
        if (!store.state.findLinkmanData.peerId) {
          store.state.findLinkmanData.peerId = peerId
        }
      }
    },
    toggleLight() {
      try {
        if (!this.light) {
          QRScanner.enableLight((err, status) => {
            err && console.log("[Scan.enableLight.error] " + JSON.stringify(err))
            console.log("[Scan.enableLight.status] " + JSON.stringify(status))
          })
        } else {
          QRScanner.disableLight((err, status) => {
            err && console.log("[Scan.disableLight.error] " + JSON.stringify(err))
            console.log("[Scan.disableLight.status] " + JSON.stringify(status))
          })
        }
      } catch (e) {
        console.log("[Scan.toggleLight.error] " + JSON.stringify(e))
        return
      }
      this.light = !this.light
    },
    scanBack() {
      let _that = this
      let store = _that.$store
      store.scanSwitch(false)
      if (store.scanEntry === 'chat') {
        //statusBarComponent.style(true, '#eee')
        if (_that.$q.dark.isActive) {
          statusBarComponent.style(false, '#212121')
        } else {
          statusBarComponent.style(true, '#fafafa')
        }
      } else {
        store.toggleDrawer(true)
      }
      if (store.state.ifMobileStyle) {
        document.querySelector("body").classList.add('bgc')
      }
    },
    scanPhoto() {
      let _that = this
      let store = _that.$store
      let params = null //{ targetHeight: 256, targetWidth: 256 }
      cameraComponent.getPicture(Camera.PictureSourceType.SAVEDPHOTOALBUM, params).then(function (imageUri) {
        let base64 = 'data:image/jpeg;base64,' + imageUri
        console.log('base64:' + imageUri)
        jimp.read(base64).then(async (res) => {
          const { data, width, height } = res.bitmap
          try {
            const resolve = await jsQR(data, width, height, { inversionAttempts: 'dontInvert' })
            if (resolve && resolve.data) {
              console.log(resolve.data)
              systemAudioComponent.scanAudioPlay()
              store.scanSwitch(false)
              store.findLinkman = null
              store.state.findLinkmanData = {
                peerId: null,
                message: null,
                givenName: null,
                tag: null
              }
              store.state.findContactsSubKind = 'default'
              if (store.scanEntry !== 'findContacts') {
                store.findContactsEntry = store.scanEntry
                store.changeKind('findContacts')
              }
              store.toggleDrawer(true)
              if (store.state.ifMobileStyle) {
                document.querySelector("body").classList.add('bgc')
              }
              await _that.findContacts('qrCode', resolve.data)
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
      })
    },
    scanSwitch(ifScan) {
      let _that = this
      let store = _that.$store
      if (ifScan) {
        try {
          QRScanner.prepare(status => {
            console.log("[Scan.prepare.status] " + JSON.stringify(status))
            /*if (!status || !status.authorized || status.denied) {
              alert('Access Failed', 'Camera access is not authorized or denied, please grant access in Settings.', () => {
                QRScanner.openSettings()
              })
              return
            }*/
          })
          QRScanner.show(status => {
            console.log("[Scan.show.status] " + JSON.stringify(status))
          })
          QRScanner.scan(async (err, contents) => {
            if (err) {
              alert("[Scan.scan.error] " + JSON.stringify(e))
            } else {
              //alert("[Scan.scan.contents] " + contents)
              systemAudioComponent.scanAudioPlay()
              store.scanSwitch(false)
              store.findLinkman = null
              store.state.findLinkmanData = {
                peerId: null,
                message: null,
                givenName: null,
                tag: null
              }
              store.state.findContactsSubKind = 'default'
              if (store.scanEntry !== 'findContacts') {
                store.findContactsEntry = store.scanEntry
                store.changeKind('findContacts')
              }
              store.toggleDrawer(true)
              if (store.state.ifMobileStyle) {
                document.querySelector("body").classList.add('bgc')
              }
              await _that.findContacts('qrCode', contents)
            }
          })
        } catch (e) {
          console.log("[Scan.scanOn.error] " + JSON.stringify(e))
        }
      } else {
        try {
          QRScanner.hide(status => {
            console.log("[Scan.hide.status] " + JSON.stringify(status))
          })
          QRScanner.destroy(function (status) {
            console.log("[Scan.destroy.status] " + JSON.stringify(status))
          })
        } catch (e) {
          console.log("[Scan.scanOff.error] " + JSON.stringify(e))
        }
      }
      store.state.ifScan = ifScan
    },
    changeMiniVideoDialog() {
      let _that = this
      let store = _that.$store
      document.getElementById('videoDialog').style.display = 'block'
      store.state.miniVideoDialog = false
    },
    async logout(data) {
      let _that = this
      let store = _that.$store
      _that.logoutFlag = true
      store.peers = null
      if (store.state.linkmans && store.state.linkmans.length > 0) {
        webrtcPeerPool.clear()
        signalProtocol.clear()
      }
      await p2pPeer.stop()
      libp2pClientPool.closeAll()
      /*if (_that.heartbeatTimer) {
        clearInterval(_that.heartbeatTimer)
        delete _that.heartbeatTimer
      }*/
      // 跳转页面
      _that.$router.push('/')
      if (store.state.ifMobileStyle) {
        statusBarComponent.style(false, '#33000000')
        document.querySelector("body").classList.remove('bgc')
      }
      if (data) {
        Dialog.create({
          title: this.$i18n.t('Alert'),
          message: this.$i18n.t('Your instance ') + data.srcClientId + this.$i18n.t(' login on device ') + data.srcClientType + this.$i18n.t(' at ') + date.formatDate(data.createDate, 'YYYY-MM-DD_HH:mm:ss') + this.$i18n.t('.'),
          cancel: false,
          ok: {"label":this.$i18n.t('Ok'),"color":"primary","unelevated":true,"no-caps":true},
          persistent: true
        }).onOk(() => {
        }).onCancel(() => {
        })
      }
    },
    async gotoChat(subjectId) {
      let _that = this
      let store = _that.$store
      await store.getChat(subjectId)
      store.setCurrentChat(subjectId)
      store.changeKind('message', 'chat')
      if (store.changeMessageSubKind) {
        store.changeMessageSubKind('default')
      }
      /*if (store.state.ifMobileStyle) {
        statusBarComponent.style(true, '#eee')
      }*/
    },
    async setNetworkStatus(ifOnline) {
      let _that = this
      let store = _that.$store
      if (ifOnline) {
        if (_that.pendingSetupSocket === true) {
          _that.pendingSetupSocket = false
          console.log('re-setupSocket')
          await _that.setupSocket()
        }
      } else {
        _that.pendingSetupSocket = true
        store.state.networkStatus = 'DISCONNECTED'
      }
    },
    async chatReceiver(data) {
      let _that = this
      let store = _that.$store
      let type = data.type
      if (!type) {
        console.error('NullChatType')
      }
      let srcClientId = data.srcClientId
      if (!srcClientId) {
        console.error('NullSrcClientId')
      }
      let srcPeerId = data.srcPeerId
      if (!srcPeerId) {
        console.error('NullSrcPeerId')
      }
      console.info('receive chat type: ' + type + ' from srcClientId: ' + srcClientId + ', srcPeerId: ' + srcPeerId)
      let myselfPeerClient = myself.myselfPeerClient
      let clientPeerId = myselfPeerClient.peerId
      let linkman = store.state.linkmanMap[srcPeerId]
      let currentTime = new Date()
      if (type === ChatMessageType.ADD_LINKMAN_INDIVIDUAL) {
        // 重复消息不处理、但仍发送Receive收条
        let duplicated = false
        let srcName = data.srcName
        let srcMobile = data.srcMobile
        let srcAvatar = data.srcAvatar
        let _id = data.id
        for (let linkmanRequest of store.state.linkmanRequests) {
          if (linkmanRequest._id === _id) {
            duplicated = true
            break
          }
        }
        if (!duplicated) {
          // 新增linkmanRequest
          let linkmanRequest = {}
          linkmanRequest.requestType = RequestType.ADD_LINKMAN_INDIVIDUAL
          linkmanRequest.ownerPeerId = clientPeerId
          linkmanRequest.senderPeerId = srcPeerId
          linkmanRequest.receiverPeerId = clientPeerId
          linkmanRequest.name = srcName
          linkmanRequest.mobile = srcMobile
          linkmanRequest.avatar = srcAvatar
          //linkmanRequest.publicKey = srcPeerClient.publicKey
          linkmanRequest._id = _id // 标识重复消息
          linkmanRequest.message = data.message
          linkmanRequest.createDate = data.createDate
          if (linkman) { // 如果请求方已是联系人，直接接受
            linkmanRequest.status = RequestStatus.ACCEPTED
            linkmanRequest.statusDate = currentTime
          } else {
            linkmanRequest.status = RequestStatus.RECEIVED
            linkmanRequest.receiveTime = currentTime
          }
          await contactComponent.insert(ContactDataType.LINKMAN_REQUEST, linkmanRequest, null)
          store.state.linkmanRequests.unshift(linkmanRequest)
          if (linkman) { // 之前的我的请求，状态置为Expired（Received状态记录可能有多条，Sent状态记录只应有1条），不包括群组请求
            let linkmanRequests = await contactComponent.loadLinkmanRequest(
              {
                ownerPeerId: clientPeerId,
                senderPeerId: clientPeerId,
                receiverPeerId: srcPeerId,
                status: { $in: [RequestStatus.SENT, RequestStatus.RECEIVED] },
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
              if (linkmanRequest.senderPeerId === clientPeerId
                && linkmanRequest.receiverPeerId === srcPeerId
                && (linkmanRequest.status === RequestStatus.SENT || linkmanRequest.status === RequestStatus.RECEIVED)
                && linkmanRequest.requestType === RequestType.ADD_LINKMAN_INDIVIDUAL) {
                linkmanRequest.status = RequestStatus.EXPIRED
                linkmanRequest.statusDate = currentTime
              }
            }
          }
        }
        let newPayload = {}
        newPayload.type = ChatMessageType.ADD_LINKMAN_INDIVIDUAL_RECEIPT
        newPayload.srcClientId = myselfPeerClient.clientId
        newPayload.srcPeerId = clientPeerId
        if (linkman) {
          newPayload.receiveTime = currentTime
          newPayload.acceptTime = currentTime
        } else {
          newPayload.receiveTime = currentTime
        }
        await chatAction.chat(null, newPayload, srcPeerId)
        // 打招呼
        if (linkman) {
          let chat = await store.getChat(srcPeerId)
          let chatMessage = {
            messageType: P2pChatMessageType.CHAT_SYS,
            contentType: ChatContentType.EVENT,
            content: _that.$i18n.t("You") + _that.$i18n.t(" have accepted ") + (linkman.givenName ? linkman.givenName : linkman.name) + _that.$i18n.t(", you can chat now")
          }
          await store.addCHATSYSMessage(chat, chatMessage)
        }
        _that.$q.notify({
          message: _that.$i18n.t("Receive contacts request from ") + srcName + (linkman ? _that.$i18n.t(", auto accept it as the requestor is already in your contacts list") : ""),
          timeout: 3000,
          type: "info",
          color: "info",
        })
      } else if (type === ChatMessageType.ADD_LINKMAN_INDIVIDUAL_RECEIPT) {
        let acceptTime = data.acceptTime
        let receiveTime = data.receiveTime
        if (acceptTime && !receiveTime) {
          // 更新Received状态记录（可能有多条)，不包括群组请求
          let linkmanRequests = await contactComponent.loadLinkmanRequest(
            {
              ownerPeerId: clientPeerId,
              senderPeerId: clientPeerId,
              receiverPeerId: srcPeerId,
              status: RequestStatus.RECEIVED,
              requestType: RequestType.ADD_LINKMAN_INDIVIDUAL
            }
          )
          if (linkmanRequests && linkmanRequests.length > 0) {
            for (let linkmanRequest of linkmanRequests) {
              linkmanRequest.status = RequestStatus.ACCEPTED
              linkmanRequest.statusDate = acceptTime
            }
            await contactComponent.update(ContactDataType.LINKMAN_REQUEST, linkmanRequests, null)
          }
          for (let linkmanRequest of store.state.linkmanRequests) {
            if (linkmanRequest.senderPeerId === clientPeerId
              && linkmanRequest.receiverPeerId === srcPeerId
              && linkmanRequest.status === RequestStatus.RECEIVED
              && linkmanRequest.requestType === RequestType.ADD_LINKMAN_INDIVIDUAL) {
              linkmanRequest.status = RequestStatus.ACCEPTED
              linkmanRequest.statusDate = acceptTime
            }
          }
        } else if (!acceptTime && receiveTime) {
          // 更新Sent状态记录（只应有1条)，不包括群组请求
          let linkmanRequests = await contactComponent.loadLinkmanRequest(
            {
              ownerPeerId: clientPeerId,
              senderPeerId: clientPeerId,
              receiverPeerId: srcPeerId,
              status: RequestStatus.SENT,
              requestType: RequestType.ADD_LINKMAN_INDIVIDUAL
            }
          )
          if (linkmanRequests && linkmanRequests.length > 0) {
            for (let linkmanRequest of linkmanRequests) {
              linkmanRequest.status = RequestStatus.RECEIVED
              linkmanRequest.receiveTime = receiveTime
            }
            await contactComponent.update(ContactDataType.LINKMAN_REQUEST, linkmanRequests, null)
          }
          for (let linkmanRequest of store.state.linkmanRequests) {
            if (linkmanRequest.senderPeerId === clientPeerId
              && linkmanRequest.receiverPeerId === srcPeerId
              && linkmanRequest.status === RequestStatus.SENT
              && linkmanRequest.requestType === RequestType.ADD_LINKMAN_INDIVIDUAL) {
              linkmanRequest.status = RequestStatus.RECEIVED
              linkmanRequest.receiveTime = receiveTime
            }
          }
        } else if (acceptTime && receiveTime) {
          // 要先更新Received状态记录（可能有多条），再更新Sent状态记录（只应有1条），不包括群组请求
          let linkmanRequests = await contactComponent.loadLinkmanRequest(
            {
              ownerPeerId: clientPeerId,
              senderPeerId: clientPeerId,
              receiverPeerId: srcPeerId,
              status: RequestStatus.RECEIVED,
              requestType: RequestType.ADD_LINKMAN_INDIVIDUAL
            }
          )
          if (linkmanRequests && linkmanRequests.length > 0) {
            for (let linkmanRequest of linkmanRequests) {
              linkmanRequest.status = RequestStatus.ACCEPTED
              linkmanRequest.statusDate = acceptTime
            }
            await contactComponent.update(ContactDataType.LINKMAN_REQUEST, linkmanRequests, null)
          }
          for (let linkmanRequest of store.state.linkmanRequests) {
            if (linkmanRequest.senderPeerId === clientPeerId
              && linkmanRequest.receiverPeerId === srcPeerId
              && linkmanRequest.status === RequestStatus.RECEIVED
              && linkmanRequest.requestType === RequestType.ADD_LINKMAN_INDIVIDUAL) {
              linkmanRequest.status = RequestStatus.ACCEPTED
              linkmanRequest.statusDate = acceptTime
            }
          }
          linkmanRequests = await contactComponent.loadLinkmanRequest(
            {
              ownerPeerId: clientPeerId,
              senderPeerId: clientPeerId,
              receiverPeerId: srcPeerId,
              status: RequestStatus.SENT,
              requestType: RequestType.ADD_LINKMAN_INDIVIDUAL
            }
          )
          if (linkmanRequests && linkmanRequests.length > 0) {
            for (let linkmanRequest of linkmanRequests) {
              linkmanRequest.status = RequestStatus.ACCEPTED
              linkmanRequest.receiveTime = receiveTime
              linkmanRequest.statusDate = acceptTime
            }
            await contactComponent.update(ContactDataType.LINKMAN_REQUEST, linkmanRequests, null)
          }
          for (let linkmanRequest of store.state.linkmanRequests) {
            if (linkmanRequest.senderPeerId === clientPeerId
              && linkmanRequest.receiverPeerId === srcPeerId
              && linkmanRequest.status === RequestStatus.SENT
              && linkmanRequest.requestType === RequestType.ADD_LINKMAN_INDIVIDUAL) {
              linkmanRequest.status = RequestStatus.ACCEPTED
              linkmanRequest.receiveTime = receiveTime
              linkmanRequest.statusDate = acceptTime
            }
          }
        }
        if (linkman && acceptTime) {
          let chat = store.state.chatMap[linkman.peerId]
          if (!chat) { // 尚未创建对应聊天时才需要执行
            let chat = await store.getChat(srcPeerId)
            let chatMessage = {
              messageType: P2pChatMessageType.CHAT_SYS,
              contentType: ChatContentType.EVENT,
              content: (linkman.givenName ? linkman.givenName : linkman.name) + _that.$i18n.t(" has accepted ") + _that.$i18n.t("you") + _that.$i18n.t(", you can chat now")
            }
            await store.addCHATSYSMessage(chat, chatMessage)
          }
        }
      } else if (type === ChatMessageType.LOGOUT) {
        await store.logout(data)
      }
    },
    async p2pChatReceiver(peerId, message) {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
        console.log('p2pChatReceiver')
        console.log(message)
        message = JSON.parse(message)
      if(!message.messageType){
        let signalSession = await _that.getSignalSession(peerId)
        if(!signalSession){
          console.log('signalSession dont exist')
          return
        }
        let messageString = await signalSession.decrypt(message,'string')
        if(!messageString){
          console.log("signal deceypt failed")
          return
        }
        message = JSON.parse(messageString)
      }
      let messageType = message.messageType
      let content = message.content
      if(messageType === P2pChatMessageType.CHAT_RECEIVE_CALLBACK) {
        if(message.preSubjectType === SubjectType.CHAT) {


          let currentMes
          let chatMessages = store.state.chatMap[message.senderPeerId].messages
          if (chatMessages && chatMessages.length > 0) {
              for (let i = chatMessages.length; i--; i > -1) {
                  let _currentMes = chatMessages[i]
                  if (_currentMes.messageId === message.messageId) {
                      currentMes = _currentMes
                  }
              }
          }
          if(!currentMes){
              let messages = await chatComponent.loadMessage(
                  {
                      ownerPeerId: myselfPeerClient.peerId,
                      messageId: message.messageId,
                  })
            if(messages && messages.length > 0) {
              currentMes = messages[0]
            }
          }
          currentMes.actualReceiveTime = message.receiveTime
          await chatComponent.update(ChatDataType.MESSAGE, currentMes, null)

        } else {
          let receives = await chatComponent.loadReceive(
            {
              ownerPeerId: myselfPeerClient.peerId,
              messageId: message.messageId,
              receiverPeerId: message.senderPeerId
            })
          if (receives && receives.length > 0) {
            receives[0].receiveTime = message.receiveTime
            await chatComponent.update(ChatDataType.RECEIVE, receives[0], null)
          }
        }
        //update chat.messages
        let chat = store.state.chatMap[message.preSubjectId]
        for (let _message of chat.messages) {
          if (_message.messageId === message.messageId) {
            _message.actualReceiveTime = message.receiveTime
          }
        }

      }
      else if (messageType === P2pChatMessageType.SYNC_LINKMAN_INFO && content) {
        // 更新联系人信息
        let linkmanPeerId = content.peerId
        let linkman = store.state.linkmanMap[linkmanPeerId]
        if (linkman) {
          linkman.name = content.name
          linkman.mobile = content.mobile
          linkman.avatar = content.avatar
          linkman.publicKey = content.publicKey
          let signalSession = await _that.getSignalSession(linkmanPeerId)
          if(signalSession){
              await signalSession.close()
          }
          if(linkman.signalPublicKey !== content.signalPublicKey){
            linkman.signalPublicKey = content.signalPublicKey
            console.log('receive signalPublicKey' + linkman.name + linkman.signalPublicKey)
          }
          signalProtocol.signalPublicKeys.set(linkmanPeerId,linkman.signalPublicKey)
          linkman.downloadSwitch = content.downloadSwitch
          //linkman.localDataCryptoSwitch = content.localDataCryptoSwitch
          //linkman.fullTextSearchSwitch = content.fullTextSearchSwitch
          linkman.udpSwitch = content.udpSwitch
          store.state.linkmanMap[linkmanPeerId] = linkman
          setTimeout(async function () {
            let linkmen = await contactComponent.loadLinkman({
              ownerPeerId: myselfPeerClient.peerId,
              peerId: linkmanPeerId
            })
            if (linkmen && linkmen.length > 0) {
              for (let linkman of linkmen) {
                linkman.name = content.name
                linkman.mobile = content.mobile
                linkman.avatar = content.avatar
                linkman.publicKey = content.publicKey
                linkman.downloadSwitch = content.downloadSwitch
                //linkman.localDataCryptoSwitch = content.localDataCryptoSwitch
                //linkman.fullTextSearchSwitch = content.fullTextSearchSwitch
                linkman.udpSwitch = content.udpSwitch
              }
              await contactComponent.update(ContactDataType.LINKMAN, linkmen, null)
            }
            await _that.sendUnsentMessage(peerId)
          }, 200)
        }
      }
      else if (messageType === P2pChatMessageType.ADD_GROUPCHAT && content) {
        // 重复消息不处理、但仍发送Receive收条
        let _id = content._id
        let currentTime = new Date()
        let duplicated = false
        for (let groupChat of store.state.groupChats) {
          if (groupChat._id === _id) {
            duplicated = true
            break
          }
        }
        if (!duplicated) {
          // 新增群组
          let groupChat = {}
          groupChat._id = _id // 标识重复消息
          groupChat.ownerPeerId = myselfPeerClient.peerId
          groupChat.groupId = content.groupId
          groupChat.groupCategory = 'Chat'
          groupChat.groupType = 'Private'
          groupChat.name = content.groupName
          groupChat.pyName = pinyinUtil.getPinyin(content.groupName)
          groupChat.description = content.groupDescription
          groupChat.pyDescription = pinyinUtil.getPinyin(content.groupDescription)
          groupChat.createDate = content.groupCreateDate
          groupChat.status = LinkmanStatus.EFFECTIVE
          groupChat.locked = false
          groupChat.notAlert = false
          groupChat.top = false

          await contactComponent.insert(ContactDataType.GROUP, groupChat, null)

          // 新增群组成员（已包括自己）
          let groupMembers = []
          let groupOwnerPeerId
          let inviterName
          let groupMemberNames
          let includeNonContacts = false
          for (let gm of content.data) {
            let groupMember = {}
            groupMember.ownerPeerId = myselfPeerClient.peerId
            groupMember.groupId = content.groupId
            groupMember.memberPeerId = gm.memberPeerId
            groupMember.memberType = gm.memberType
            groupMember.createDate = gm.createDate
            groupMember.status = gm.status
            await contactComponent.insert(ContactDataType.GROUP_MEMBER, groupMember, groupMembers)
            if (gm.memberType === MemberType.OWNER) {
              groupOwnerPeerId = gm.memberPeerId
            }
            let linkman = store.state.linkmanMap[gm.memberPeerId]
            if (linkman && gm.memberPeerId !== myselfPeerClient.peerId) {
              linkman.groupChats.unshift(groupChat)
              if (linkman.activeStatus === ActiveStatus.UP && groupChat.activeStatus !== ActiveStatus.UP) {
                groupChat.activeStatus = ActiveStatus.UP
              }
              if (gm.memberPeerId === content.senderPeerId) {
                inviterName = (linkman.givenName ? linkman.givenName : linkman.name)
              } else {
                groupMemberNames = (groupMemberNames ? groupMemberNames + _that.$i18n.t(", ") : '') + (linkman.givenName ? linkman.givenName : linkman.name)
              }
            }
            if (!linkman && gm.memberPeerId !== myselfPeerClient.peerId) {
              includeNonContacts = true
            }
          }

          groupChat.groupOwnerPeerId = groupOwnerPeerId
          groupChat.groupMembers = groupMembers
          store.state.groupChats.unshift(groupChat)
          store.state.groupChatMap[groupChat.groupId] = groupChat

          let chat = await store.getChat(groupChat.groupId)
          let chatMessage = {
            messageType: P2pChatMessageType.CHAT_SYS,
            contentType: ChatContentType.EVENT,
            content: inviterName + _that.$i18n.t(" has invited ") + _that.$i18n.t("you") + (groupMemberNames ? _that.$i18n.t(" and ") + groupMemberNames : '') + (includeNonContacts ? _that.$i18n.t(" and ") + _that.$i18n.t("other NonContacts") : '') + _that.$i18n.t(" to join group chat")
          }
          await store.addCHATSYSMessage(chat, chatMessage)
        }
        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.ADD_GROUPCHAT_RECEIPT,
          content: linkmanRequest
        }
        await store.p2pSend(message, content.senderPeerId)
      }
      else if (messageType === P2pChatMessageType.MODIFY_GROUPCHAT && content) {
        let _id = content._id
        let currentTime = new Date()
        let groupChat = store.state.groupChatMap[content.groupId]
        let nameChanged = false
        let descriptionChanged = false
        let aliasChanged = false
        if (groupChat) {
          // 修改群组
          if (groupChat.name !== content.groupName) {
            nameChanged = true
            groupChat.name = content.groupName
            groupChat.pyName = pinyinUtil.getPinyin(content.groupName)
          }
          if (groupChat.description !== content.groupDescription) {
            descriptionChanged = true
            groupChat.description = content.groupDescription
            groupChat.pyDescription = pinyinUtil.getPinyin(content.groupDescription)
          }
          if (nameChanged || descriptionChanged) {
            let groupChatRecord = await contactComponent.get(ContactDataType.GROUP, groupChat._id)
            if (groupChatRecord) {
              groupChatRecord.name = groupChat.name
              groupChatRecord.pyName = groupChat.pyName
              groupChatRecord.description = groupChat.description
              groupChatRecord.pyDescription = groupChat.pyDescription
              await contactComponent.update(ContactDataType.GROUP, groupChatRecord)
            }
          }

          // 修改发送人在本群的昵称
          let senderGroupMember
          let groupMembers = groupChat.groupMembers
          for (let groupMember of groupMembers) {
            if (groupMember.memberPeerId === content.senderPeerId) {
              if (groupMember.memberAlias !== content.myAlias) {
                aliasChanged = true
                groupMember.memberAlias = content.myAlias
              }
              senderGroupMember = groupMember
            }
          }
          if (aliasChanged) {
            let groupMemberRecord = await contactComponent.get(ContactDataType.GROUP_MEMBER, senderGroupMember._id)
            if (groupMemberRecord) {
              groupMemberRecord.memberAlias = content.myAlias
              await contactComponent.update(ContactDataType.GROUP_MEMBER, groupMemberRecord)
            }
          }
          groupChat.groupMembers = groupMembers
          store.state.groupChatMap[content.groupId] = groupChat
        }

        let modifierName
        let senderLinkman = store.state.linkmanMap[content.senderPeerId]
        if (senderLinkman) {
          modifierName = senderLinkman.givenName ? senderLinkman.givenName : senderLinkman.name
        }
        if (modifierName && (nameChanged || descriptionChanged)) {
          let chat = await store.getChat(groupChat.groupId)
          let chatMessage = {
            messageType: P2pChatMessageType.CHAT_SYS,
            contentType: ChatContentType.EVENT,
            content: modifierName + _that.$i18n.t(" has modified ") + (nameChanged ? (descriptionChanged ? _that.$i18n.t("Group Name to be : ") + groupChat.name + _that.$i18n.t(",") + _that.$i18n.t(" modified ") + _that.$i18n.t("Group Description to be : ") + groupChat.description : _that.$i18n.t("Group Name to be : ") + groupChat.name) : _that.$i18n.t("Group Description to be : ") + groupChat.description)
          }
          await store.addCHATSYSMessage(chat, chatMessage)
        }

        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.MODIFY_GROUPCHAT_RECEIPT,
          content: linkmanRequest
        }
        await store.p2pSend(message, content.senderPeerId)
      }
      else if (messageType === P2pChatMessageType.ADD_GROUPCHAT_MEMBER && content) {
        // 重复消息不处理、但仍发送Receive收条
        let _id = content._id
        let currentTime = new Date()
        let duplicated = false
        for (let groupChat of store.state.groupChats) {
          if (groupChat._id === _id) {
            duplicated = true
            break
          }
        }
        if (!duplicated) {
          let groupChat = store.state.groupChatMap[content.groupId]
          let newCreated = false
          // 新增群组（对于新增群组成员群组还不存在）
          if (!groupChat) {
            newCreated = true
            groupChat = {}
            groupChat._id = _id // 标识重复消息
            groupChat.ownerPeerId = myselfPeerClient.peerId
            groupChat.groupId = content.groupId
            groupChat.groupCategory = 'Chat'
            groupChat.groupType = 'Private'
            groupChat.name = content.groupName
            groupChat.pyName = pinyinUtil.getPinyin(content.groupName)
            groupChat.description = content.groupDescription
            groupChat.pyDescription = pinyinUtil.getPinyin(content.groupDescription)
            groupChat.createDate = content.groupCreateDate
            groupChat.status = LinkmanStatus.EFFECTIVE
            groupChat.locked = false
            groupChat.notAlert = false
            groupChat.top = false
            await contactComponent.insert(ContactDataType.LINKMAN, groupChat, null)
          }

          // 新增群组成员（对于新增群组成员为全量，否则为增量）
          let gms = groupChat.groupMembers
          let groupOwnerPeerId
          if (!gms) {
            gms = []
          }
          let inviterName
          let addedGroupMemberNames
          let includeNonContacts = false
          for (let gm of content.data) {
            let linkman = store.state.linkmanMap[gm.memberPeerId]
            if ((!newCreated && gm.dirtyFlag === 'NEW') || newCreated) {
              let groupMember = {}
              groupMember.ownerPeerId = myselfPeerClient.peerId
              groupMember.groupId = content.groupId
              groupMember.memberPeerId = gm.memberPeerId
              groupMember.memberType = gm.memberType
              groupMember.createDate = gm.createDate
              groupMember.status = gm.status
              await contactComponent.insert(ContactDataType.GROUP_MEMBER, groupMember, gms)
              if (linkman && gm.memberPeerId !== content.senderPeerId && gm.memberPeerId !== myselfPeerClient.peerId) {
                addedGroupMemberNames = (addedGroupMemberNames ? addedGroupMemberNames + _that.$i18n.t(", ") : '') + (linkman.givenName ? linkman.givenName : linkman.name)
              }
              if (!linkman && gm.memberPeerId !== myselfPeerClient.peerId) {
                includeNonContacts = true
              }
              if (linkman && gm.memberPeerId !== myselfPeerClient.peerId) {
                linkman.groupChats.unshift(groupChat)
                if (linkman.activeStatus === ActiveStatus.UP && groupChat.activeStatus !== ActiveStatus.UP) {
                  groupChat.activeStatus = ActiveStatus.UP
                }
              }
            }
            if (gm.memberType === MemberType.OWNER) {
              groupOwnerPeerId = gm.memberPeerId
            }
            if (gm.memberPeerId === content.senderPeerId && linkman) {
              inviterName = (linkman.givenName ? linkman.givenName : linkman.name)
            }
          }

          if (groupOwnerPeerId) {
            groupChat.groupOwnerPeerId = groupOwnerPeerId
          }
          groupChat.groupMembers = gms
          if (newCreated) {
            store.state.groupChats.unshift(groupChat)
          }
          store.state.groupChatMap[content.groupId] = groupChat

          let chat = await store.getChat(groupChat.groupId)
          let chatMessage = {
            messageType: P2pChatMessageType.CHAT_SYS,
            contentType: ChatContentType.EVENT,
            content: newCreated ?
              inviterName + _that.$i18n.t(" has invited ") + _that.$i18n.t("you") + _that.$i18n.t(" to join group chat") + _that.$i18n.t(", other group members : ") + (addedGroupMemberNames ? addedGroupMemberNames : '') + (includeNonContacts ? (addedGroupMemberNames ? _that.$i18n.t(" and ") : '') + _that.$i18n.t("other NonContacts") : '')
              :
              inviterName + _that.$i18n.t(" has invited ") + (addedGroupMemberNames ? addedGroupMemberNames : '') + (includeNonContacts ? (addedGroupMemberNames ? _that.$i18n.t(" and ") : '') + _that.$i18n.t("other NonContacts") : '') + _that.$i18n.t(" to join group chat")
          }
          await store.addCHATSYSMessage(chat, chatMessage)
        }
        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.ADD_GROUPCHAT_RECEIPT,
          content: linkmanRequest
        }
        await store.p2pSend(message, content.senderPeerId)
      }
      else if (messageType === P2pChatMessageType.REMOVE_GROUPCHAT_MEMBER && content) {
        let _id = content._id
        let currentTime = new Date()
        let groupChat = store.state.groupChatMap[content.groupId]
        let gms = groupChat.groupMembers
        let removeGroupChat = false
        for (let gm of content.data) {
          if (gm.memberPeerId === myselfPeerClient.peerId) {
            removeGroupChat = true
          }
        }
        if (removeGroupChat) {
          // 删除聊天记录
          let messages = await chatComponent.loadMessage({
            ownerPeerId: myselfPeerClient.peerId,
            subjectId: groupChat.groupId
          })
          if (messages && messages.length > 0) {
            await chatComponent.remove(ChatDataType.MESSAGE, messages)
          }
          let chat = store.state.chatMap[groupChat.groupId]
          chat = await chatComponent.get(ChatDataType.CHAT, chat._id)
          if (chat) {
            await chatComponent.remove(ChatDataType.CHAT, chat, store.state.chats)
          }
          delete store.state.chatMap[groupChat.groupId]

          // 删除群组成员
          let removeGroupMembers = await contactComponent.loadGroupMember({
            ownerPeerId: myselfPeerClient.peerId,
            groupId: groupChat.groupId
          })
          if (removeGroupMembers && removeGroupMembers.length > 0) {
            await contactComponent.remove(ContactDataType.GROUP_MEMBER, removeGroupMembers)
          }

          // 删除群组
          let groupChatRecord = await contactComponent.get(ContactDataType.GROUP, groupChat._id)
          await contactComponent.remove(ContactDataType.GROUP, groupChatRecord, store.state.groupChats)
          delete store.state.groupChatMap[groupChat.groupId]
          if (store.state.currentChat && store.state.currentChat.subjectId === groupChat.groupId) {
            store.state.currentChat = null
            _that.subKind = "default"
            if (store.state.ifMobileStyle) {
              store.toggleDrawer(false)
            }
          }
        } else {
          // 删除群组成员
          let fromGroupOwner = false
          for (let groupChatMember of gms) {
            if (groupChatMember.memberType === MemberType.OWNER && groupChatMember.memberPeerId === content.senderPeerId) {
              fromGroupOwner = true
              break
            }
          }
          let inviterName
          let removedGroupMemberNames
          let includeNonContacts = false
          for (let groupChatMember of gms) {
            if (groupChatMember.memberPeerId === content.senderPeerId) {
              let linkman = store.state.linkmanMap[groupChatMember.memberPeerId]
              if (linkman) {
                inviterName = (linkman.givenName ? linkman.givenName : linkman.name)
              }
              break
            }
          }
          for (let gm of content.data) {
            let linkman = store.state.linkmanMap[gm.memberPeerId]
            if (fromGroupOwner) {
              if (linkman) {
                removedGroupMemberNames = (removedGroupMemberNames ? removedGroupMemberNames + _that.$i18n.t(", ") : '') + (linkman.givenName ? linkman.givenName : linkman.name)
              } else if (gm.memberPeerId !== myselfPeerClient.peerId) {
                includeNonContacts = true
              }
            }
            let groupMembers = await contactComponent.loadGroupMember(
              {
                ownerPeerId: myselfPeerClient.peerId,
                groupId: gm.groupId,
                memberPeerId: gm.memberPeerId
              }
            )
            if (groupMembers && groupMembers.length > 0) {
              await contactComponent.remove(ContactDataType.GROUP_MEMBER, groupMembers, gms)
            }
            if (linkman && gm.memberPeerId !== myselfPeerClient.peerId) {
              let _index = 0
              for (let gc of linkman.groupChats) {
                if (gc.groupId === groupChat.groupId) {
                  linkman.groupChats.splice(_index, 1)
                  break
                }
                _index++
              }
            }
          }
          // 更新groupChat activeStatus
          if (groupChat.activeStatus === ActiveStatus.UP) {
            let hasActiveGroupMember = false
            for (let groupChatMember of gms) {
              let linkman = store.state.linkmanMap[groupChatMember.memberPeerId]
              if (linkman && linkman.activeStatus === ActiveStatus.UP) {
                hasActiveGroupMember = true
                break
              }
            }
            if (!hasActiveGroupMember) {
              groupChat.activeStatus = ActiveStatus.DOWN
            }
          }
          groupChat.groupMembers = gms
          store.state.groupChatMap[content.groupId] = groupChat

          let chat = await store.getChat(groupChat.groupId)
          let chatMessage = {
            messageType: P2pChatMessageType.CHAT_SYS,
            contentType: ChatContentType.EVENT,
            content: fromGroupOwner ?
            inviterName + _that.$i18n.t(" has removed ") + removedGroupMemberNames + (includeNonContacts ? _that.$i18n.t(" and ") + _that.$i18n.t("other NonContacts") : '') + _that.$i18n.t(" from group chat")
            :
            inviterName + _that.$i18n.t(" has left the group chat")
          }
          await store.addCHATSYSMessage(chat, chatMessage)
        }

        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.REMOVE_GROUPCHAT_MEMBER_RECEIPT,
          content: linkmanRequest
        }
        await store.p2pSend(message, content.senderPeerId)
      }
      else if (messageType === P2pChatMessageType.MODIFY_GROUPCHAT_OWNER && content) {
        let _id = content._id
        let currentTime = new Date()
        // 修改群组成员群主身份
        let oldOwnerMemberPeerId = content.data[0].memberPeerId
        let newOwnerMemberPeerId = content.data[1].memberPeerId
        let oldOwner, newOwner
        let groupChat = store.state.groupChatMap[content.groupId]
        let groupMembers = groupChat.groupMembers
        for (let groupMember of groupMembers) {
          if (groupMember.memberPeerId === oldOwnerMemberPeerId) {
            groupMember.memberType = MemberType.MEMBER
            oldOwner = groupMember
          } else if (groupMember.memberPeerId === newOwnerMemberPeerId) {
            groupMember.memberType = MemberType.OWNER
            newOwner = groupMember
          }
        }
        if (oldOwner) {
          let groupMemberRecord = await contactComponent.get(ContactDataType.GROUP_MEMBER, oldOwner._id)
          if (groupMemberRecord) {
            groupMemberRecord.memberType = MemberType.MEMBER
            await contactComponent.update(ContactDataType.GROUP_MEMBER, groupMemberRecord, null)
          }
        }
        if (newOwner) {
          let groupMemberRecord = await contactComponent.get(ContactDataType.GROUP_MEMBER, newOwner._id)
          if (groupMemberRecord) {
            groupMemberRecord.memberType = MemberType.OWNER
            await contactComponent.update(ContactDataType.GROUP_MEMBER, groupMemberRecord, null)
          }
        }

        groupChat.groupOwnerPeerId = newOwnerMemberPeerId
        groupChat.groupMembers = groupMembers
        store.state.groupChatMap[content.groupId] = groupChat

        let newOwnerName
        let newOwnerLinkman = store.state.linkmanMap[newOwner.memberPeerId]
        if (newOwnerLinkman) {
          newOwnerName = newOwnerLinkman.givenName ? newOwnerLinkman.givenName : newOwnerLinkman.name
        } else if (newOwner.memberPeerId !== myselfPeerClient.peerId) {
          newOwnerName = _that.$i18n.t("other NonContacts")
        }
        let chat = await store.getChat(groupChat.groupId)
        let chatMessage = {
          messageType: P2pChatMessageType.CHAT_SYS,
          contentType: ChatContentType.EVENT,
          content: newOwner.memberPeerId === myselfPeerClient.peerId ? _that.$i18n.t("You") + _that.$i18n.t(" have become the new Group Owner") : newOwnerName + _that.$i18n.t(" has become the new Group Owner")
        }
        await store.addCHATSYSMessage(chat, chatMessage)

        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.MODIFY_GROUPCHAT_OWNER_RECEIPT,
          content: linkmanRequest
        }
        await store.p2pSend(message, content.senderPeerId)
      }
      else if ((messageType === P2pChatMessageType.ADD_GROUPCHAT_RECEIPT
        || messageType === P2pChatMessageType.MODIFY_GROUPCHAT_RECEIPT
        || messageType === P2pChatMessageType.ADD_GROUPCHAT_MEMBER_RECEIPT
        || messageType === P2pChatMessageType.REMOVE_GROUPCHAT_MEMBER_RECEIPT
        || messageType === P2pChatMessageType.MODIFY_GROUPCHAT_OWNER_RECEIPT) && content) {
        let _id = content._id
        let receiveTime = content.receiveTime
        let receives = await chatComponent.loadReceive({
          ownerPeerId: myselfPeerClient.peerId,
          messageId: _id,
          receiverPeerId: myselfPeerClient.peerId,
          receiveTime: { $eq: null }
        }, null, null, null)
        if (receives && receives.length > 0) {
          for (let receive of receives) {
            receive.receiveTime = receiveTime
          }
          await chatComponent.update(ChatDataType.RECEIVE, receives, null)
        }
      }
      else if (messageType === P2pChatMessageType.CHAT_READ_CALLBACK) {
        await store.handleReadCallback(message)
      }
      else if (messageType === P2pChatMessageType.CALL_REQUEST) {
        await _that.receiveCallRequest(message)
      }
      else if (messageType === P2pChatMessageType.CALL_CLOSE) {
        await _that.receiveCallClose(message)
      }
      else if(messageType === P2pChatMessageType.CHAT_LINKMAN){
        await store.insertReceivedMessage(message)
      }
    },
    async webrtcConnect(evt){
      let _that = this
      let myselfPeerClient = myself.myselfPeerClient
      let peerId = evt.source.targetPeerId
      let linkman = store.state.linkmanMap[peerId]
      if(!linkman)return
      if (linkman.activeStatus === ActiveStatus.UP) {
        return
      }
      let currentTime = new Date()
      if (linkman) {
        // 更新关联groupChat activeStatus
        for (let groupChat of linkman.groupChats) {
          if (groupChat.activeStatus !== ActiveStatus.UP) {
            groupChat.activeStatus = ActiveStatus.UP
          }
        }
        // 更新linkman activeStatus
        linkman.activeStatus = ActiveStatus.UP
        // 更新lastConnectTime
        linkman.lastConnectTime = currentTime
        let linkmen = await contactComponent.loadLinkman({
          ownerPeerId: myselfPeerClient.peerId,
          peerId: peerId
        })
        if (linkmen && linkmen.length > 0) {
          for (let linkman of linkmen) {
            linkman.lastConnectTime = currentTime
          }
          await contactComponent.update(ContactDataType.LINKMAN, linkmen, null)
        }
        console.log('activeStatus => Up, peerId:' + peerId)
        // 要先更新Received状态记录（可能有多条），再更新Sent状态记录（只应有1条），不包括群组请求
        let linkmanRequests = await contactComponent.loadLinkmanRequest(
          {
            ownerPeerId: myselfPeerClient.peerId,
            senderPeerId: myselfPeerClient.peerId,
            receiverPeerId: peerId,
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
          if (linkmanRequest.senderPeerId === myselfPeerClient.peerId
            && linkmanRequest.receiverPeerId === peerId
            && linkmanRequest.status === RequestStatus.RECEIVED
            && linkmanRequest.requestType === RequestType.ADD_LINKMAN_INDIVIDUAL) {
            linkmanRequest.status = RequestStatus.ACCEPTED
            linkmanRequest.statusDate = currentTime
          }
        }

        linkmanRequests = await contactComponent.loadLinkmanRequest(
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
            linkmanRequest.status = RequestStatus.ACCEPTED
            linkmanRequest.receiveTime = currentTime
            linkmanRequest.statusDate = currentTime
          }
          await contactComponent.update(ContactDataType.LINKMAN_REQUEST, linkmanRequests, null)
        }
        for (let linkmanRequest of store.state.linkmanRequests) {
          if (linkmanRequest.senderPeerId === myselfPeerClient.peerId
            && linkmanRequest.receiverPeerId === peerId
            && linkmanRequest.status === RequestStatus.SENT
            && linkmanRequest.requestType === RequestType.ADD_LINKMAN_INDIVIDUAL) {
            linkmanRequest.status = RequestStatus.ACCEPTED
            linkmanRequest.receiveTime = currentTime
            linkmanRequest.statusDate = currentTime
          }
        }
        // 更新Received状态记录（可能有多条)，不包括群组请求
        linkmanRequests = await contactComponent.loadLinkmanRequest(
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
        let myselfBasicInfo = {}
        myselfBasicInfo.peerId = myselfPeerClient.peerId
        myselfBasicInfo.name = myselfPeerClient.name
        myselfBasicInfo.mobile = myselfPeerClient.mobile
        myselfBasicInfo.avatar = myselfPeerClient.avatar
        myselfBasicInfo.publicKey = myselfPeerClient.publicKey
        myselfBasicInfo.signalPublicKey = myselfPeerClient.signalPublicKey
        myselfBasicInfo.udpSwitch = myselfPeerClient.udpSwitch
        let message = {
          messageType: P2pChatMessageType.SYNC_LINKMAN_INFO,
          content: myselfBasicInfo
        }
        await store.p2pSend(message,peerId)
      }
    },
    async webrtcClose(evt){
      let _that = this
      let peerId = evt.source.targetPeerId
      let myselfPeerClient = myself.myselfPeerClient
      let linkman = store.state.linkmanMap[peerId]
      if (!linkman || linkman.activeStatus === ActiveStatus.DOWN) return
      let currentTime = new Date()
      if (linkman) {
        // 更新关联groupChat activeStatus
        for (let groupChat of linkman.groupChats) {
          if (groupChat.activeStatus === ActiveStatus.UP) {
            let hasAnotherActiveGroupMember = false
            for (let groupChatMember of groupChat.groupMembers) {
              if (peerId !== groupChatMember.memberPeerId) {
                let anotherLinkman = store.state.linkmanMap[groupChatMember.memberPeerId]
                if (anotherLinkman && anotherLinkman.activeStatus === ActiveStatus.UP) {
                  hasAnotherActiveGroupMember = true
                  break
                }
              }
            }
            if (!hasAnotherActiveGroupMember) {
              groupChat.activeStatus = ActiveStatus.DOWN
            }
          }
        }
        // 更新linkman activeStatus
        linkman.activeStatus = ActiveStatus.DOWN
        let signalSession = await _that.getSignalSession(peerId)
        if(signalSession){
          await signalSession.close()
        }
        // 更新lastConnectTime
        linkman.lastConnectTime = currentTime
        let linkmen = await contactComponent.loadLinkman({
          ownerPeerId: myselfPeerClient.peerId,
          peerId: peerId
        })
        if (linkmen && linkmen.length > 0) {
          for (let linkman of linkmen) {
            linkman.lastConnectTime = currentTime
          }
          await contactComponent.update(ContactDataType.LINKMAN, linkmen, null)
        }
        console.log('activeStatus => Down, peerId:' + peerId)
        if (_that.pendingCall && store.state.currentCallChat && store.state.currentCallChat.streamMap && store.state.currentCallChat.streamMap[peerId]) {
          _that.pendingCall(peerId)
        }
      }
    },
    async p2pSend(message,peerId){
      let _that = this
      if(typeof message === "object" && message.messageType !== P2pChatMessageType.SYNC_LINKMAN_INFO){
        let signalSession = await _that.getSignalSession(peerId)
        if(!signalSession){
          console.log('signalSession dont exist')
          return
        }
        message = await signalSession.encrypt(JSON.stringify(message))

      }else if(message.messageType === P2pChatMessageType.SYNC_LINKMAN_INFO){
        
      }
      message = JSON.stringify(message)
      await p2pChatAction.chat(null,message,peerId)
    },
    async getSignalSession(peerId){
      let linkman = store.state.linkmanMap[peerId]
      if(!signalProtocol.signalPublicKeys.get(peerId)){
        if(!linkman.signalPublicKey){
          return null
        }
        signalProtocol.signalPublicKeys.set(peerId,linkman.signalPublicKey)
      }
      let signalSession = await signalProtocol.get(peerId,linkman.connectPeerId,linkman.connectSessionId)
      return signalSession
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
    window.store = store
    console.log('screen.availWidth:' + screen.availWidth + ',screen.availHeight:' + screen.availHeight + ',window.devicePixelRatio:' + window.devicePixelRatio)
    store.screenHeight = _that.$q.screen.height
    store.ifMobile = function () {
      return window.device && (window.device.platform === 'Android' || window.device.platform === 'iOS')
    }
    if (window.device) {
        document.addEventListener('deviceready', async function () {
          if(window.device.platform === 'Android'){
                  document.addEventListener('backbutton', function (e) {
                    navigator.app.clearHistory()
                    if(!(_that.$refs[`mainDrawer`] && _that.$refs[`mainDrawer`].value)){
                      navigator.Backbutton.goHome(function() {
                        console.log('goHome success')
                      }, function() {
                        console.log('goHome fail')
                      })
                    }
                  },false)
          }
        })
        cordova.plugins.backgroundMode.enable()
        cordova.plugins.backgroundMode.on('activate', function() {
          cordova.plugins.backgroundMode.disableWebViewOptimizations()
          cordova.plugins.backgroundMode.disableBatteryOptimizations()
        })
        console.log('getNetworkState:' + deviceComponent.getNetworkState())
        if ((_that.$q.screen.width < 481 || _that.$q.screen.height < 481) && (window.device.platform === 'Android' || window.device.platform === 'iOS')) {
          deviceComponent.lockScreen('portrait')
        }
        store.state.ifMobileStyle = (_that.$q.screen.width < 481 || _that.$q.screen.height < 481) || ((window.device.platform === 'Android' || window.device.platform === 'iOS') && screen.orientation.type.substring(0, 8) === 'portrait')
        deviceComponent.registScreenChange(function () {
          store.state.ifMobileStyle = (_that.$q.screen.width < 481 || _that.$q.screen.height < 481) || ((window.device.platform === 'Android' || window.device.platform === 'iOS') && screen.orientation.type.substring(0, 8) === 'portrait')
        })
        if (store.state.ifMobileStyle) {
          document.querySelector("body").classList.add('bgc')
          if (_that.drawer) {
            /*if (_that.kind === 'contactsDetails') {
              statusBarComponent.style(true, '#ffffff')
            } else {
              statusBarComponent.style(true, '#eee')
            }*/
            if (_that.$q.dark.isActive) {
              statusBarComponent.style(false, '#1d1d1d')
            } else {
              statusBarComponent.style(true, '#ffffff')
            }
          } else {
            /*if (_that.tab === 'me') {
              statusBarComponent.style(true, '#ffffff')
            } else {*/
              if (store.state.ifScan) {
                statusBarComponent.style(false, '#33000000')
              } else {
                //statusBarComponent.style(true, '#eee')
                if (_that.$q.dark.isActive) {
                  statusBarComponent.style(false, '#212121')
                } else {
                  statusBarComponent.style(true, '#fafafa')
                }
              }
            /*}*/
          }
        } else {
          document.querySelector("body").classList.remove('bgc')
          statusBarComponent.style(false, '#33000000')
        }
        //statusBarComponent.show(false) // 放开此处设置（目前属于重复设置，其实不需要），会导致Android登录后状态栏字体颜色设置不生效
        // 针对iPad状态栏styleDefault无效的补丁
        if (deviceComponent.getDeviceProperty('model') && deviceComponent.getDeviceProperty('model').substring(0, 4) === 'iPad') {
          statusBarComponent.style(false, '#33000000')
        }
        /*if (window.device.platform === 'iOS') {
          document.body.addEventListener('touchmove', function (e) {
            e.preventDefault() // 阻止默认的处理方式（iOS有下拉滑动的效果）
          }, { passive: false }) // passive参数用于兼容iOS和Android
        }*/
        console.log('device.model:' + deviceComponent.getDeviceProperty('model'))
        console.log('device.platform:' + deviceComponent.getDeviceProperty('platform'))
        console.log('device.uuid:' + deviceComponent.getDeviceProperty('uuid'))
        console.log('device.version:' + deviceComponent.getDeviceProperty('version'))
        console.log('device.manufacturer:' + deviceComponent.getDeviceProperty('manufacturer'))
        console.log('device.serial:' + deviceComponent.getDeviceProperty('serial'))
        console.log('window.device.platform:' + window.device.platform)
        console.log('currentScreen:' + deviceComponent.currentScreen())
      if (localNotificationComponent && JSON.stringify(localNotificationComponent) !== '{}') {
        let granted = await localNotificationComponent.requestPermission()
        if (granted) {
          localNotificationComponent.initialize(function (arg,event) {
            let data = arg.data
            let type = data.type
            if(type === 'chat'){
              _that.gotoChat(data.subjectId)
            }else if(type === 'call'){
              _that.gotoChat(data.subjectId)
            }else if(type === 'linkmanRequest'){
              store.changeKind('receivedList', 'contacts')
              store.toggleDrawer(true)
            }
          })
        }
      }
    }
    store.collectionWorkerEnabler = false // collection中是否使用service worker
    if (store.ios === true || store.safari === true) {
      store.collectionWorkerEnabler = false
    }
    store.useNativeAndroid = false // 是否使用Android原生拍照、拍摄、相册等功能
    let clientPeerId = myself.myselfPeerClient.peerId
    let linkmanTags = await contactComponent.loadLinkmanTag({
      ownerPeerId: clientPeerId,
      createDate: { $gt: null }
    }, [{ createDate: 'asc' }])
    if (linkmanTags && linkmanTags.length > 0) {
      for (let linkmanTag of linkmanTags) {
        store.state.linkmanTagNames.push(linkmanTag.name)
        store.state.linkmanTagNameMap[linkmanTag.name] = linkmanTag._id
        store.state.linkmanTagIdMap[linkmanTag._id] = linkmanTag.name
      }
    }
    let linkmanDBItems = await contactComponent.loadLinkman({
      ownerPeerId: clientPeerId
    })
    if (linkmanDBItems && linkmanDBItems.length > 0) {
      linkmanDBItems.sort(function (a, b) {
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
      store.state.linkmans = linkmanDBItems
      for (let linkmanDBItem of linkmanDBItems) {
        store.state.linkmanMap[linkmanDBItem.peerId] = linkmanDBItem
        linkmanDBItem.groupChats = [] // 初始化属性
        let tagNames = []
        let tag = ''
        let linkmanTagLinkmans = await contactComponent.loadLinkmanTagLinkman({
          ownerPeerId: clientPeerId,
          linkmanPeerId: linkmanDBItem.peerId,
          createDate: { $gt: null }
        }, [{ createDate: 'asc' }])
        if (linkmanTagLinkmans && linkmanTagLinkmans.length > 0) {
          for (let linkmanTagLinkman of linkmanTagLinkmans) {
            let name = store.state.linkmanTagIdMap[linkmanTagLinkman.tagId]
            tagNames.push(name)
            tag = (tag ? tag + ", " + name : name)
          }
        }
        linkmanDBItem.tagNames = tagNames
        linkmanDBItem.tag = tag
        linkmanDBItem.pyTag = pinyinUtil.getPinyin(tag)
      }
    }
    let linkmanRequestDBItems = await contactComponent.loadLinkmanRequest({
      ownerPeerId: clientPeerId,
      requestType: RequestType.ADD_LINKMAN_INDIVIDUAL,
      createDate: { $gt: null }
    }, [{ createDate: 'desc' }])
    if (linkmanRequestDBItems && linkmanRequestDBItems.length > 0) {
      store.state.linkmanRequests = linkmanRequestDBItems
      for (let linkmanRequest of store.state.linkmanRequests) { // 数据库JSON格式转换为内存对象格式
        if (linkmanRequest.data) {
          try {
            linkmanRequest.data = JSON.parse(linkmanRequest.data)
          } catch (e) {
            console.log('JSON parse error, string:' + linkmanRequest.data + '; error:' + e)
          }
        }
      }
    }
    let groupDBItems = await contactComponent.loadGroup({
      ownerPeerId: clientPeerId,
      createDate: { $gt: null }
    }, [{ createDate: 'asc' }])
    if (groupDBItems && groupDBItems.length > 0) {
      store.state.groupChats = groupDBItems
      for (let groupDBItem of groupDBItems) {
        let groupMemberDBItems = await contactComponent.loadGroupMember(
          {
            ownerPeerId: clientPeerId,
            groupId: groupDBItem.groupId,
            createDate: { $gt: null }
          }, [{ createDate: 'asc' }]
        )
        if (groupMemberDBItems && groupMemberDBItems.length > 0) {
          for (let groupMemberDBItem of groupMemberDBItems) {
            if (groupMemberDBItem.memberType === MemberType.OWNER) {
              groupDBItem.groupOwnerPeerId = groupMemberDBItem.memberPeerId
            }
            let linkman = store.state.linkmanMap[groupMemberDBItem.memberPeerId]
            if (linkman) {
              linkman.groupChats.push(groupDBItem)
            }
          }
          groupDBItem.groupMembers = groupMemberDBItems
        }
        store.state.groupChatMap[groupDBItem.groupId] = groupDBItem
      }
    }

    store.changeTab = function (tab) {
      _that.tab = tab
      if (tab === 'chat') {
        if (!_that.chatKind) {
          _that.chatKind = 'message'
        }
        _that.kind = _that.chatKind
        if (store.messageEntry === 'search') {
          store.messageEntry = null
        }
      } else if (tab === 'contacts') {
        if (!_that.contactsKind) {
          _that.contactsKind = 'receivedList'
        }
        _that.kind = _that.contactsKind
      } else if (tab === 'channel') {
        if (!_that.channelKind) {
          _that.channelKind = 'channel'
        }
        _that.kind = _that.channelKind
      } else if (tab === 'me') {
        if (!_that.meKind) {
          _that.meKind = 'accountInformation'
        }
        _that.kind = _that.meKind
      }
    }
    store.getKind = function () {
      return _that.kind
    }
    store.changeKind = function (kind, tab) {
      if (!(_that.ifMobileSize || store.state.ifMobileStyle) && tab) {
        _that.tab = tab
      }
      if (kind === 'message') { // stopPropagation
        _that.noSwipeClose = true
      } else {
        _that.noSwipeClose = false
      }
      _that.kind = kind
      if (tab === 'chat') {
        _that.chatKind = kind
      } else if (tab === 'contacts') {
        _that.contactsKind = kind
      } else if (tab === 'channel') {
        _that.channelKind = kind
      } else if (tab === 'me') {
        _that.meKind = kind
      }
      _that.drawer = true
    }
    store.getDrawer = function () {
      return _that.drawer
    }
    store.toggleDrawer = function (drawer) {
      _that.drawer = drawer
    }
    store.chatLoadingDone = function () {
      _that.chatLoadingDone = true
    }
    store.scanSwitch = _that.scanSwitch
    store.getChat = _that.getChat
    store.updateChat = _that.updateChat
    store.insertReceivedMessage = _that.insertReceivedMessage
    store.setCurrentChat = _that.setCurrentChat
    store.sendChatMessage = _that.sendChatMessage
    store.sendUnsentMessage = _that.sendUnsentMessage
    store.addCHATSYSMessage = _that.addCHATSYSMessage
    store.saveAndSendMessage = _that.saveAndSendMessage
    store.handleChatTime = _that.handleChatTime
    store.collectionForwardToChat = _that.collectionForwardToChat
    store.saveFileInMessage = _that.saveFileInMessage
    store.saveFileAndSendMessage = _that.saveFileAndSendMessage
    store.findContacts = _that.findContacts
    store.logout = _that.logout
    store.gotoChat = _that.gotoChat
    store.connect = _that.connect
    store.getChatContent = _that.getChatContent
    store.p2pSend = _that.p2pSend
    _that.tab = 'chat'
    _that.kind = 'message'
    _that.chatKind = 'message'
    _that.contactsKind = 'receivedList'
    _that.channelKind = 'channel'
    _that.meKind = 'accountInformation'
    if (!(_that.ifMobileSize || store.state.ifMobileStyle)) {
      _that.drawer = true
    }

    chatAction.registReceiver('chat', _that.chatReceiver)
    p2pChatAction.registReceiver('p2pChat', _that.p2pChatReceiver)
    webrtcPeerPool.peerId = myself.myselfPeerClient.peerId
    webrtcPeerPool.peerPublicKey = myself.myselfPeerClient.peerPublicKey
    webrtcPeerPool.registEvent('connect', _that.webrtcConnect)
    webrtcPeerPool.registEvent('close', _that.webrtcClose)
    webrtcPeerPool.registEvent('stream', async function(evt) {
      _that.receiveRemoteStream(evt.stream, evt.source.targetPeerId)
    })

    // online status monitoring
    deviceComponent.registOnline(async function () {
      console.log('online')
      await _that.setNetworkStatus(true)
    })
    deviceComponent.registOffline(async function () {
      console.log('offline')
      await _that.setNetworkStatus(false)
    })
    await _that.preSetupSocket()
  },
  watch: {
    /*tab(val) {
      let _that = this
      let store = _that.$store
      if (store.state.ifMobileStyle) {
        if (val === 'me') {
          statusBarComponent.style(true, '#ffffff')
        } else {
          statusBarComponent.style(true, '#eee')
        }
      }
    },*/
    drawer(val) {
      let _that = this
      let store = _that.$store
      if (store.state.ifMobileStyle) {
        if (val) {
          /*if (_that.kind === 'contactsDetails' || (_that.kind === 'findContacts' && store.state.findContactsSubKind === 'contactsDetails')) { // 后者对应扫码findContacts('qrCode')进入contactsDetails的场景、toggleDrawer(true)-watch晚执行
            statusBarComponent.style(true, '#ffffff')
          } else {
            statusBarComponent.style(true, '#eee')
          }*/
          if (_that.$q.dark.isActive) {
            statusBarComponent.style(false, '#1d1d1d')
          } else {
            statusBarComponent.style(true, '#ffffff')
          }
        } else {
          if (store.state.ifScan) {
            statusBarComponent.style(false, '#33000000')
          } else {
            /*if (_that.tab === 'me') {
              statusBarComponent.style(true, '#ffffff')
            } else {
              statusBarComponent.style(true, '#eee')
            }*/
            if (_that.$q.dark.isActive) {
              statusBarComponent.style(false, '#212121')
            } else {
              statusBarComponent.style(true, '#fafafa')
            }
          }
        }
      }
    }
  }
}