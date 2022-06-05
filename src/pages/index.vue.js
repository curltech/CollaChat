import { date, Dialog } from 'quasar'
import jsQR from 'jsqr'
import jimp from 'jimp'
import axios from 'axios'
import https from 'https'

import { CollaUtil, StringUtil, UUID } from 'libcolla'
import { webrtcPeerPool } from 'libcolla'
import { signalProtocol } from 'libcolla'
import { PeerEndpoint, peerEndpointService } from 'libcolla'
import { libp2pClientPool, config, peerClientService, p2pPeer, myself, myselfPeerService, ChatMessageType, pingAction, chatAction, p2pChatAction, consensusAction, logService } from 'libcolla'
import { BlockType, MsgType, PayloadType, dataBlockService, DataBlockService, queryValueAction, connectAction } from 'libcolla'
import { EntityState } from 'libcolla'
import { SecurityPayload } from 'libcolla'
import { MobileNumberUtil } from 'libcolla'

import { permissionHelper } from '@/libs/base/colla-mobile'
import pinyinUtil from '@/libs/base/colla-pinyin'
import * as CollaConstant from '@/libs/base/colla-constant'
import { statusBarComponent, deviceComponent, inAppBrowserComponent } from '@/libs/base/colla-cordova'
//import { localNotificationComponent } from '@/libs/base/colla-cordova'
import { cameraComponent, systemAudioComponent, mediaComponent } from '@/libs/base/colla-media'
import { fileComponent } from '@/libs/base/colla-cordova'
import { CollectionType, collectionComponent } from '@/libs/biz/colla-collection'
import { ChatDataType, ChatContentType, ChatMessageStatus, P2pChatMessageType, SubjectType, chatComponent, chatBlockComponent } from '@/libs/biz/colla-chat'
import { ContactDataType, RequestType, RequestStatus, LinkmanStatus, GroupStatus, ActiveStatus, contactComponent, MemberType } from '@/libs/biz/colla-contact'
import { channelComponent, ChannelDataType, ChannelType, EntityType } from '@/libs/biz/colla-channel'
import { collectionUtil, blockLogComponent } from '@/libs/biz/colla-collection-util'

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
import ChannelDetails from '@/components/channelDetails'
import NewChannel from '@/components/newChannel'
import NewArticle from '@/components/newArticle'

const PeerId = require('peer-id')
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
    videoChat: VideoChat,
    channelDetails: ChannelDetails,
    newChannel: NewChannel,
    newArticle: NewArticle
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
      heartbeatTimer: null,
      initMigrateDialog: false,
      migrateDialog: false,
      migrateQRContent: null,
      initBackupDialog: false,
      initBackupUrl: null,
      initBackupFilename: null,
      backupDialog: false,
      backupUrl: null,
      backupFilename: null,
      initRestoreDialog: false,
      restoreDialog: false,
      restoreFilename: null,
      logoutData: null,
      _heartbeatTimer: null,
      _cloudSyncTimer: null,
      fabPos: [18, 18],
      draggingFab: false
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    width() {
      return this.ifMobileSize || this.$store.state.ifMobileStyle ? this.$q.screen.width : this.$q.screen.width - 420
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
          this.fabPos[0] - ev.delta.x,
          this.fabPos[1] + ev.delta.y
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
      let now10 = new Date().getTime()
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
            for (let i = 1; i < store.connectAddressOptionsISO[myself.myselfPeerClient.language].length; i++) {
              let item = {}
              item.address = store.connectAddressOptionsISO[myself.myselfPeerClient.language][i].value
              _that.connectArray.push(item)
            }
          }
        }
        /*await p2pPeer.start([_that.connectArray[0].address], { WebSockets: { debug: false, timeoutInterval: 5000, binaryType: 'arraybuffer' } })
        console.info('p2pPeer:' + clientPeerId + ' is started! enjoy it')
        let now11 = new Date().getTime()
        console.log('------------------------------------------------------------index setupSocket 1:' + (now11 - now10))*/
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
        /*let ps = []
        for (let i = 0; i < _that.connectArray.length; i++) {
          //let promise = p2pPeer.ping(_that.connectArray[i].address, 6000)
          let promise = p2pPeer.host.ping(_that.connectArray[i].address, 1000)
          ps.push(promise)
        }
        let responses = await Promise.allSettled(ps)
        if (responses && responses.length > 0) {
          for (let i = 0; i < responses.length; ++i) {
            console.log(i + '-pingLatency:' + _that.connectArray[i].address + ',' + responses[i].status + ':' + (responses[i].status === 'fulfilled' ? responses[i].value : responses[i].reason))
            _that.connectArray[i].connectTime = (responses[i].status === 'fulfilled' ? responses[i].value : 999999999)
          }
          CollaUtil.sortByKey(_that.connectArray, 'connectTime', 'desc')
          console.log(_that.connectArray)
          let now12 = new Date().getTime()
          console.log('------------------------------------------------------------index setupSocket 2:' + (now12 - now11))*/
          // test STUN/TURN
          let connectArrayBackup = CollaUtil.clone(_that.connectArray)
          for (let i = _that.connectArray.length - 1; i >= 0; i--) {
            let connectAddress = _that.connectArray[i].address.match(/\/dns4\/(\S*)\/tcp/)[1]
            let start = new Date()
            console.log(i + ' STUNTURN test start: ' + connectAddress + ', ' + start)
            let stunTurn = await new Promise((resolve, reject) => {
              let stun = false
              let turn = false
              setTimeout(async () => {
                if (!stun) {
                  await logService.log('STUN test failed: ' + connectAddress, 'STUNTURN test', 'error')
                }
                if (!turn) {
                  await logService.log('TURN test failed: ' + connectAddress, 'STUNTURN test', 'error')
                }
                if (!(stun && turn)) {
                  console.log('timeout: ' + (new Date().getTime() - start.getTime()))
                  connectArrayBackup[i].stunturnTime = (connectArrayBackup[i].stunTime ? 1000 + connectArrayBackup[i].stunTime : 999999999)
                  resolve(stun) // TODO: TURN test may fail but actually works
                }
              }, 1000)
              let iceServer = [
                {
                  urls: `stun:${connectAddress}:3478`
                },
                {
                  urls: `turn:${connectAddress}:3478`,
                  username: myselfPeerClient.peerId,
                  credential: myselfPeerClient.peerPublicKey
                }
              ]
              let pc = new RTCPeerConnection({
                iceServers: iceServer
              })
              pc.onicecandidate = (e) => {
                if (!e.candidate) return
                // Display candidate string e.g
                // candidate:842163049 1 udp 1677729535 XXX.XXX.XX.XXXX 58481 typ srflx raddr 0.0.0.0 rport 0 generation 0 ufrag sXP5 network-cost 999
                console.log('onicecandidate-candidate.type:' + e.candidate.type)
                console.log('onicecandidate-candidate.candidate:' + e.candidate.candidate)
                // If a srflx candidate was found, notify that the STUN server works!
                let interval = new Date().getTime() - start.getTime()
                if (e.candidate.type === 'srflx') {
                  console.log('The STUN server is reachable!' + interval)
                  console.log('Your Public IP Address is: ' + e.candidate.address)
                  stun = true
                  if (stun && turn) {
                    connectArrayBackup[i].stunturnTime = interval
                    resolve(true)
                  } else {
                    connectArrayBackup[i].stunTime = interval
                  }
                }
                // If a relay candidate was found, notify that the TURN server works!
                if (e.candidate.type === 'relay') {
                  console.log('The TURN server is reachable!' + (new Date().getTime() - start.getTime()))
                  turn = true
                  if (stun && turn) {
                    connectArrayBackup[i].stunturnTime = interval
                    resolve(true)
                  } else {
                    connectArrayBackup[i].turnTime = interval
                  }
                }
              }
              // Log errors:
              // Remember that in most of the cases, even if its working, you will find a STUN host lookup received error
              // Chrome tried to look up the IPv6 DNS record for server and got an error in that process. However, it may still be accessible through the IPv4 address
              pc.onicecandidateerror = (e) => {
                console.error('onicecandidateerror:' + e)
              }
              pc.createDataChannel('test')
              pc.createOffer().then(offer => {
                console.log('offer:' + offer)
                pc.setLocalDescription(offer)
              })
            })
            //if (!stunTurn) {
            if (connectArrayBackup[i].stunturnTime > 500) {
              _that.connectArray.splice(i, 1)
            } else {
              break
            }
          }
          if (_that.connectArray.length === 0) {
            console.warn('STUN/TURN test all failed, restore connectArray')
            _that.connectArray = connectArrayBackup
            CollaUtil.sortByKey(_that.connectArray, 'stunturnTime', 'desc')
          }
          console.log(_that.connectArray)
          let now13 = new Date().getTime()
          //console.log('------------------------------------------------------------index setupSocket 3:' + (now13 - now12))
          console.log('------------------------------------------------------------index setupSocket 3:' + (now13 - now10))
          await _that.buildSocket()
        /*}*/
      } catch (e) {
        await logService.log(e, 'setupSocketError', 'error')
      }
    },
    async buildSocket() {
      let _that = this
      let store = _that.$store
      let now130 = new Date().getTime()
      if (_that.connectArray.length === 0) {
        return
      }
      let connectAddress = _that.connectArray[_that.connectArray.length - 1].address
      /*let connectTime = _that.connectArray[_that.connectArray.length - 1].connectTime
      let heartbeatTimerInterval = 55
      if (connectTime === 999999999) {
        heartbeatTimerInterval = 5
      }
      console.log(heartbeatTimerInterval)*/
      let myselfPeerClient = myself.myselfPeerClient
      let clientPeerId = myselfPeerClient.peerId
      config.appParams.connectPeerId = [connectAddress]
      await p2pPeer.start(null, { WebSockets: { debug: false, timeoutInterval: 5000, binaryType: 'arraybuffer' } })
      console.info('p2pPeer:' + clientPeerId + ' is started! enjoy it')
      libp2pClientPool.closeAll()

      let webSocket = p2pPeer.host.transportManager._transports.get('WebSockets')
      webSocket.onopen = function (evt) {
        let now131a = new Date().getTime()
        console.log('------------------------------------------------------------index buildSocket:' + (now131a - now130))
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
          await pingAction.ping(null, payload, targetPeerId)
        }, 55 * 1000)
        _that._cloudSyncTimer = setInterval(async function () {
          await store.cloudSyncChannel(true)
        }, 600 * 1000)
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
        if (_that._cloudSyncTimer) {
          clearInterval(_that._cloudSyncTimer)
          delete _that._cloudSyncTimer
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
        if (_that._cloudSyncTimer) {
          clearInterval(_that._cloudSyncTimer)
          delete _that._cloudSyncTimer
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
      let now1310 = new Date().getTime()
      let myselfPeerClient = myself.myselfPeerClient
      let myselfPeer = myself.myselfPeer
      myselfPeerClient.connectPeerId = connectAddress
      // 建立primaryEndPoint连接
      let backupMobile = null
      if (myselfPeerClient.visibilitySetting && myselfPeerClient.visibilitySetting.substring(1, 2) === 'N') {
        backupMobile = myselfPeerClient.mobile
        myselfPeerClient.mobile = ''
        myselfPeer.mobile = ''
      }
      let peers = null
      try {
        peers = await peerClientService.connect()
      } finally {
        if (backupMobile && myselfPeerClient.visibilitySetting && myselfPeerClient.visibilitySetting.substring(1, 2) === 'N') {
          myselfPeerClient.mobile = backupMobile
          myselfPeer.mobile = backupMobile
        }
      }
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
          ok: { "label": _that.$i18n.t('Ok'), "color": "primary", "unelevated": true, "no-caps": true },
          persistent: true
        }).onOk(() => {
        }).onCancel(() => {
        })
        return null
      //} else if (peers && peers.length === 2 && peers[0] && peers[0].length > 0 && peers[1] && peers[1].length > 0) {
      } else if (peers === MsgType[MsgType.OK]) {
        // 标志primaryEndPoint连接成功
        console.log('primaryEndPoint connect success')
        store.state.networkStatus = 'CONNECTED'
        let now1311 = new Date().getTime()
        console.log('------------------------------------------------------------index connect:' + (now1311 - now1310))
        /*store.peers = peers[0]
        store.peerClients = peers[1]
        // 更新本地身份信息
        let currentDate = new Date()
        myselfPeerClient.connectPeerId = connectAddress
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

              //myselfPeer.mobile = peer.mobile
              //myselfPeer.publicKey = peer.publicKey
              //myselfPeer.privateKey = peer.privateKey

              // 更新对应linkman
              if (myselfPeerClient.visibilitySetting !== peer.visibilitySetting
                || myselfPeerClient.avatar !== peer.avatar
                || myselfPeerClient.name !== peer.name) {
                myselfPeerClient.visibilitySetting = peer.visibilitySetting
                myselfPeerClient.avatar = peer.avatar
                myselfPeerClient.name = peer.name
                myselfPeerClient.lastUpdateTime = peer.lastUpdateTime

                myselfPeer.visibilitySetting = peer.visibilitySetting
                myselfPeer.avatar = peer.avatar
                myselfPeer.name = peer.name
                myselfPeer.lastUpdateTime = peer.lastUpdateTime

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
                //if (myPEP.priority !== 1) {
                //  throw new Error('myPEP.priority does not equal to 1!')
                //}
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
        console.log(result)*/
        await _that.webrtcInit()
        await store.upgradeVersion('about')
        await _that.cloudSyncP2pChat()
        let now1312 = new Date().getTime()
        console.log('------------------------------------------------------------index post-connect:' + (now1312 - now1311))
        //return peers[0]
        return peers
      } else {
        console.log("primaryEndPoint connect failure")
        return null
      }
    },
    async connectReceiver(data) {
      let _that = this
      let store = _that.$store
      let start = new Date().getTime()
      if (data && data.MessageType === MsgType[MsgType.CONNECT]) {
        let peers = data.Payload
        if (peers && peers.length === 2 && peers[0] && peers[0].length > 0 && peers[1] && peers[1].length > 0) {
          store.peers = peers[0]
          store.peerClients = peers[1]
          // 更新本地身份信息
          let myselfPeerClient = myself.myselfPeerClient
          let myselfPeer = myself.myselfPeer
          let currentDate = new Date()
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
  
                //myselfPeer.mobile = peer.mobile
                //myselfPeer.publicKey = peer.publicKey
                //myselfPeer.privateKey = peer.privateKey
  
                // 更新对应linkman
                if (myselfPeerClient.visibilitySetting !== peer.visibilitySetting
                  || myselfPeerClient.avatar !== peer.avatar
                  || myselfPeerClient.name !== peer.name) {
                  myselfPeerClient.visibilitySetting = peer.visibilitySetting
                  myselfPeerClient.avatar = peer.avatar
                  myselfPeerClient.name = peer.name
                  myselfPeerClient.lastUpdateTime = peer.lastUpdateTime
  
                  myselfPeer.visibilitySetting = peer.visibilitySetting
                  myselfPeer.avatar = peer.avatar
                  myselfPeer.name = peer.name
                  myselfPeer.lastUpdateTime = peer.lastUpdateTime
  
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
                  //if (myPEP.priority !== 1) {
                  //  throw new Error('myPEP.priority does not equal to 1!')
                  //}
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
        }
      }
      let end = new Date().getTime()
      console.log('------------------------------------------------------------connectReceiver:' + (end - start))
    },
    ifOnlySocketConnected(peerId) {
      let webrtcPeers = webrtcPeerPool.getConnected(peerId)
      let webSocket = p2pPeer.host.transportManager._transports.get('WebSockets')
      if (webSocket.ws && webSocket.ws.readyState === 1 && (!webrtcPeers || webrtcPeers.length === 0)) {
        return true
      } else {
        return false
      }
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
          urls: `stun:${_connectAddress}:3478`
        },
        {
          urls: `turn:${_connectAddress}:3478`,
          username: myselfPeerClient.peerId,
          credential: myselfPeerClient.peerPublicKey
        }
      ]
      config.appParams.iceServer = [iceServer]
      for (let linkman of store.state.linkmans) {
        if (linkman.peerId !== myselfPeerClient.peerId && linkman.status !== LinkmanStatus.REQUESTED) {
          let option = {}
          option.config = {
            "iceServers": iceServer
          }
          if (store.state.currentCallChat && store.state.currentCallChat.streamMap && store.state.currentCallChat.streamMap[linkman.peerId] && store.state.currentCallChat.streamMap[linkman.peerId].pending) {
            option.stream = store.state.currentCallChat.streamMap[myselfPeerClient.peerId].stream
            option.stream.getAudioTracks()[0].enable = true
            store.state.currentCallChat.streamMap[linkman.peerId].pending = false
            console.log('index.vue -add stream')
            await webrtcPeerPool.create(linkman.peerId, option)
            linkman.lastWebrtcRequestTime = new Date().getTime()
          }

        }
      }
    },
    async sendUnsentMessage(linkmanPeerId) {
      let _that = this
      let store = _that.$store
      // 单聊消息
      let unSentIndividualMessages = await chatComponent.loadMessage({
        ownerPeerId: myself.myselfPeerClient.peerId,
        senderPeerId: myself.myselfPeerClient.peerId,
        subjectId: linkmanPeerId,
        subjectType: SubjectType.CHAT,
        actualReceiveTime: { $eq: null }
      })
      if (unSentIndividualMessages && unSentIndividualMessages.length > 0) {
        for (let unSentIndividualMessage of unSentIndividualMessages) {
          await store.p2pSend(unSentIndividualMessage, linkmanPeerId)
        }
      }
      // 群聊消息和系统消息
      let unSentReceives = await chatComponent.loadReceive({
        ownerPeerId: myself.myselfPeerClient.peerId,
        receiverPeerId: linkmanPeerId,
        receiveTime: { $eq: null }
      })
      if (unSentReceives && unSentReceives.length > 0) {
        for (let unSentReceive of unSentReceives) {
          if (unSentReceive.subjectType === SubjectType.LINKMAN_REQUEST) {
            // 删除联系人系统消息重发前检查：如果联系人存在，则不重发
            if (unSentReceive.messageType === P2pChatMessageType.DROP_LINKMAN && store.state.linkmanMap[unSentReceive.receiverPeerId]) {
              unSentReceive.receiveTime = new Date().getTime()
              await chatComponent.update(ChatDataType.RECEIVE, unSentReceive, null)
            } else {
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
              await store.p2pSend(message, linkmanPeerId)
            }
          } else {
            let unSentGroupMessages = await chatComponent.loadMessage({
              ownerPeerId: myself.myselfPeerClient.peerId,
              messageId: unSentReceive.messageId
            })
            if (unSentGroupMessages && unSentGroupMessages.length > 0) {
              for (let unSentGroupMessage of unSentGroupMessages) {
                await store.p2pSend(unSentGroupMessage, linkmanPeerId)
              }
            }
          }
        }
      }
    },
    async insertReceivedMessage(message) {
      let _that = this
      let store = _that.$store
      if ((message.subjectType === SubjectType.CHAT && (!store.state.linkmanMap[message.senderPeerId] || store.state.linkmanMap[message.senderPeerId].status === LinkmanStatus.REQUESTED)) || (message.subjectType === SubjectType.GROUP_CHAT && (!store.state.groupChatMap[message.subjectId] || store.state.groupChatMap[message.subjectId].status === GroupStatus.DISBANDED))) {
        console.log('ignore messsage, subjectType:' + message.subjectType + ', senderPeerId:' + message.senderPeerId + ', subjectId:' + message.subjectId)
        return
      }
      if (message.messageType == P2pChatMessageType.CHAT_LINKMAN || message.messageType == P2pChatMessageType.CALL_REQUEST) {
        await _that.insertReceivedChatMessage(message)
      }
    },
    async sendChatReceipt(message) {
      let _that = this
      let store = _that.$store
      let currentDate = new Date().getTime()
      let _message = {
        messageType: P2pChatMessageType.CHAT_RECEIVE_RECEIPT,
        preSubjectType: message.subjectType,
        preSubjectId: message.subjectId,
        subjectType: message.subjectType,
        subjectId: message.senderPeerId,//不管群聊还是单聊，都为linkman的peerId
        ownerPeerId: myself.myselfPeerClient.peerId,
        senderPeerId: myself.myselfPeerClient.peerId,
        preMessageId: message.messageId,
        receiveTime: currentDate,
        actualReceiveTime: currentDate
      }
      await _that.sendOrSaveReceipt(_message)
    },
    async insertReceivedChatMessage(message) {
      let _that = this
      let store = _that.$store
      let currentDate = new Date().getTime()
      if (!message.actualReceiveTime) {
        await _that.sendChatReceipt(message)
      }
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
      } else if (message.subjectType === SubjectType.GROUP_CHAT) {
        if (!store.state.groupChatMap[message.subjectId]) {
          return
        }
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
      if (message.destroyTime) {
        currentChat.hiddenContent = true
      } else {
        currentChat.hiddenContent = false
      }
      currentChat.updateTime = currentDate
      let content = message.content
      if (message.subjectType === SubjectType.GROUP_CHAT && message.contentType == ChatContentType.TEXT && content.indexOf('@') > -1) {
        let groupChat = store.state.groupChatMap[subjectId]
        let name = groupChat.myAlias ? groupChat.myAlias : myself.myselfPeerClient.name
        if (content.indexOf(`@${name} `) > -1) {
          currentChat.focusedMessage = message
        }
      }
      let db_chat = await chatComponent.get(ChatDataType.CHAT, currentChat._id)
      db_chat.content = currentChat.content
      db_chat.updateTime = currentChat.updateTime
      db_chat.hiddenContent = currentChat.hiddenContent
      await chatComponent.update(ChatDataType.CHAT, db_chat)
      /*localNotificationComponent.sendNotification(
        store.getChatName(currentChat.subjectType, currentChat.subjectId),
        currentChat.content,
        {type:'chat',subjectId:currentChat.subjectId}
      )*/
      let messages = currentChat.messages
      // Read/UnRead
      if (store.state.chatMap[subjectId] == store.state.currentChat && store.getKind() === 'message' && _that.drawer) {
        message.readTime = new Date()
        if (message.destroyTime) {
          message.opened = false
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
      if (message._id) {
        delete message._id
      }
      if (message._rev) {
        delete message._rev
      }
      await chatComponent.insert(ChatDataType.MESSAGE, message, messages)
      // AutoDownload
      if (message.subjectType === SubjectType.CHAT && myself.myselfPeerClient.downloadSwitch && (message.contentType === ChatContentType.FILE || message.contentType === ChatContentType.IMAGE)) {
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
        case ChatContentType.VOICE:
          result = `[${_that.$i18n.t("voice")}]`
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
        case ChatContentType.CHANNEL:
          result = `[${_that.$i18n.t("channel")}]`
          break
        case ChatContentType.ARTICLE:
          result = `[${_that.$i18n.t("article")}]`
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
        if (!chat.content) {
          chat.content = ""
        }
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
      message.messageId = message.messageId ? message.messageId : UUID.string(null, null)
      message.senderPeerId = myselfPeerId
      message.createDate = new Date().getTime()
      message.status = ChatMessageStatus.NORMAL
      message.countDown = 0
      message.receiveTime = message.createDate
      if (subjectId !== myselfPeerId && (message.messageType !== P2pChatMessageType.CALL_REQUEST) && (message.messageType !== P2pChatMessageType.CALL_CLOSE)) {
        message.actualReceiveTime = null
      } else {
        message.actualReceiveTime = message.createDate
      }
      if (message.messageType === P2pChatMessageType.CHAT_LINKMAN) {
        await store.handleChatTime(message, chat)
      }
      if (subjectType === SubjectType.CHAT && subjectId !== myselfPeerId) {
        message.destroyTime = chat.destroyTime
      } 
      await chatComponent.insert(ChatDataType.MESSAGE, message, chat.messages)
      if (subjectType === SubjectType.CHAT && subjectId !== myselfPeerId) {
        store.p2pSend(message, subjectId)
      } else if (subjectType === SubjectType.GROUP_CHAT) {
        let groupMembers
        if (message.contentType === ChatContentType.VIDEO_INVITATION || message.contentType === ChatContentType.AUDIO_INVITATION || message.messageType === P2pChatMessageType.CALL_CLOSE) {
          groupMembers = message.content
        } else {
          groupMembers = store.state.groupChatMap[subjectId].groupMembers
        }
        for (let groupMember of groupMembers) {
          let linkman = store.state.linkmanMap[groupMember.memberPeerId ? groupMember.memberPeerId : groupMember]
          if (!linkman || linkman.peerId !== linkman.ownerPeerId) { // 自己除外
            let receive = {
              ownerPeerId: message.ownerPeerId,
              subjectType: message.subjectType,
              subjectId: message.subjectId,
              messageType: message.messageType,
              messageId: message.messageId,
              createDate: message.createDate,
              receiverPeerId: groupMember.memberPeerId ? groupMember.memberPeerId : groupMember,
              receiveTime: null
              //receiveTime: _that.ifOnlySocketConnected(subjectId) ? message.createDate : null
            }
            if ((message.messageType !== P2pChatMessageType.CALL_REQUEST) && (message.messageType !== P2pChatMessageType.CALL_CLOSE)) {
              receive.receiveTime = null
            } else {
              receive.receiveTime = message.createDate
            }
            if (message.messageType !== P2pChatMessageType.CALL_CLOSE) {
              await chatComponent.insert(ChatDataType.RECEIVE, receive, null)
            }
            store.p2pSend(message, groupMember.memberPeerId ? groupMember.memberPeerId : groupMember)
          }
        }
      }
      if (message.messageType === P2pChatMessageType.CALL_CLOSE || message.contentType === ChatContentType.CALL_JOIN_REQUEST || (message.subjectType === SubjectType.CHAT && message.messageType === P2pChatMessageType.CALL_REQUEST) || message.messageType === P2pChatMessageType.RECALL) {
        return
      }
      if (message.messageType === P2pChatMessageType.CHAT_LINKMAN) {
        //await store.handleChatTime(message, chat)
        chat.content = store.getChatContent(message.contentType, message.content)
        chat.updateTime = message.createDate
        let db_chat = await chatComponent.get(ChatDataType.CHAT, chat._id)
        db_chat.content = chat.content
        db_chat.updateTime = chat.updateTime
        await chatComponent.update(ChatDataType.CHAT, db_chat)
        _that.$nextTick(() => {
          let container = _that.$el.querySelector('#talk')
          if (container) {
            container.scrollTop = container.scrollHeight + 50
          }
        })
      }
    },
    async handleChatTime(current, chat) {
      let _that = this
      let store = _that.$store
      if (current.messageType === P2pChatMessageType.CALL_CLOSE) {
        return
      }
      let messages = chat.messages
      let currentTime = current.receiveTime - 1 //排序在对应message前
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
      if (message._id) {
        let msg = await chatComponent.get(ChatDataType.MESSAGE, message._id)
        if (msg) {
          return
        }
      }
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
      let db_chat = await chatComponent.get(ChatDataType.CHAT, chat._id)
      db_chat.updateTime = chat.updateTime
      await chatComponent.update(ChatDataType.CHAT, db_chat)
      _that.$nextTick(() => {
        let container = _that.$el.querySelector('#talk')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },
    async collectionForwardToChat(item, chat) {
      let _that = this
      let store = _that.$store
      if (store.preCheck()) {
        _that.$q.loading.show()
        try {
          // put content into attach
          if (!item.content) {
            let attachs = await collectionComponent.loadAttach(item, null, null)
            if (attachs && attachs.length > 0) {
              item.attachs = attachs
              item.content = attachs[0].content
            }
            if (!item.content) {
              item.content = ''
            }
          }
          if (item.collectionType === CollectionType.FILE || item.collectionType === CollectionType.VIDEO || item.collectionType === CollectionType.AUDIO || item.collectionType === CollectionType.IMAGE) {
            let _content = item.content
            let name
            if (item.collectionType !== CollectionType.FILE) {
              let pat = /\bsrc\b\s*=\s*[\'\"]?([^\'\"]*)[\'\"]?/i
              let res = _content.match(pat)
              if (res && res.length > 1) {
                _content = res[1]
              }
            } else {
              let firstFileInfo = item.firstFileInfo
              name = firstFileInfo.slice(firstFileInfo.indexOf(' ') + 1, firstFileInfo.length)
            }
            let fileData = _content
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
              message.content = item.plainContent
            }
            message.messageType = P2pChatMessageType.CHAT_LINKMAN
            message.contentType = item.collectionType
            console.log(message)
            await store.sendChatMessage(chat, message)
            _that.setCurrentChat(chat.subjectId)
          }
        } catch (error) {
          console.error(error)
        } finally {
          _that.$q.loading.hide()
        }
      }
      if (_that.tab !== 'chat') {
        store.changeTab('chat')
      }
      store.changeKind('message')
    },
    async getArticleList() {
      let _that = this
      let store = _that.$store
      let currentChannel = store.state.currentChannel
      if (currentChannel) {
        // 查询local
        let articleList = []
        let ret = await channelComponent.loadArticle({
          ownerPeerId: myself.myselfPeerClient.peerId,
          channelId: currentChannel.channelId,
          updateDate: { $gt: null }
        }, [{ updateDate: 'desc' }])
        if (ret && ret.length > 0) {
          articleList = ret
        }
        store.state.articles = articleList
      }
    },
    async channelForwardToChat(item, chat) {
      let _that = this
      let store = _that.$store
      let message = {
        content: item,
        contentType: ChatContentType.CHANNEL,
        messageType: P2pChatMessageType.CHAT_LINKMAN
      }
      await store.sendChatMessage(chat, message)
      _that.setCurrentChat(chat.subjectId)
      if (_that.tab !== 'chat') {
        store.changeTab('chat')
      }
      store.changeKind('message')
    },
    async imgForwardToChat(item, chat) {
      let _that = this
      let store = _that.$store
      await store.saveFileAndSendMessage(chat, item, ChatContentType.IMAGE, null)
      _that.setCurrentChat(chat.subjectId)
      if (_that.tab !== 'chat') {
        store.changeTab('chat')
      }
      store.changeKind('message')
    },
    async articleForwardToChat(item, chat) {
      let _that = this
      let store = _that.$store
      let message = {
        content: item,
        contentType: ChatContentType.ARTICLE,
        messageType: P2pChatMessageType.CHAT_LINKMAN
      }
      await store.sendChatMessage(chat, message)
      _that.setCurrentChat(chat.subjectId)
      if (_that.tab !== 'chat') {
        store.changeTab('chat')
      }
      store.changeKind('message')
    },
    async saveFileInMessage(chat, message, fileData, type, name, originalMessageId) {
      let _that = this
      let store = _that.$store
      let _peers = []
      if (message.messageType === P2pChatMessageType.CHAT_LINKMAN) {
        if (chat.subjectType === SubjectType.CHAT) {
          _peers.push(store.state.linkmanMap[chat.subjectId])
        } else if (chat.subjectType === SubjectType.GROUP_CHAT) {
          let groupMembers = store.state.groupChatMap[chat.subjectId].groupMembers
          for (let groupMember of groupMembers) {
            //let linkman = store.state.linkmanMap[groupMember.memberPeerId]
            //if (linkman && groupMember.memberPeerId !== myself.myselfPeerClient.peerId) {
            let memberPeerId = groupMember.memberPeerId
            if (memberPeerId !== myself.myselfPeerClient.peerId) {
              let memberPeerClient = await peerClientService.getCachedPeerClient(memberPeerId)
              if (memberPeerClient) {
                _peers.push({
                  peerId: memberPeerId,
                  publicKey: memberPeerClient.publicKey
                })
              }
            }
          }
        }
      }
      let attachBlockId = UUID.string(null, null)
      chatComponent.localFileDataMap[attachBlockId] = fileData
      let current = {
        businessNumber: (message.messageType === P2pChatMessageType.GROUP_FILE ? chat.subjectId : message.messageId),
        messageType: message.messageType,
        subjectId: chat.subjectId,
        blockId: attachBlockId,
        attachs: [{
          content: fileData,
          contentType: type,
          messageId: message.messageId,
          attachBlockId: attachBlockId,
          ownerPeerId: myself.myselfPeerClient.peerId,
          senderPeerId: myself.myselfPeerClient.peerId,
          originalMessageId: originalMessageId
        }],
        tag: name,
        name: name,
        updateDate: new Date().getTime()
      }
      this.$q.loading.show()
      let saveResult = await chatBlockComponent.save(current, _peers)
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
      message.attachBlockId = current.blockId
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
    async saveFileAndSendMessage(chat, fileData, type, name) {
      let _that = this
      let store = _that.$store
      let message = {}
      message.messageId = UUID.string(null, null)
      message.messageType = P2pChatMessageType.CHAT_LINKMAN
      message.fileSize = StringUtil.getSize(fileData)
      await store.saveFileInMessage(chat, message, fileData, type, name, message.messageId)
      if (message.attachBlockId) {
        await store.sendChatMessage(chat, message)
      }
    },
    async saveAndSendMessage(message, peerId) {
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
      receiveMessage.receiverPeerId = peerId
      receiveMessage.receiveTime = null
      //receiveMessage.receiveTime = message.content.createDate
      await chatComponent.insert(ChatDataType.RECEIVE, receiveMessage, null)
      // 给active的联系人发送消息
      let rtcMessage = {
        messageType: message.messageType,
        content: message.content
      }
      console.log('saveAndSendMessage')
      console.log(rtcMessage)
      await store.p2pSend(rtcMessage, peerId)
    },
    async findContacts(findType, peerId) {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      if (!peerId && store.state.findLinkmanData.peerId) {
        peerId = store.state.findLinkmanData.peerId
      }
      if (peerId) {
        if (myselfPeerClient.peerId === peerId) {
          store.state.findLinkmanResult = 1
          store.state.findLinkmanTip = _that.$i18n.t("This is yourself")
        } else {
          let isPeerIdValid = false
          try {
            isPeerIdValid = PeerId.isPeerId(PeerId.createFromB58String(peerId))
          } catch (e) {
            console.log(e)
          }
          if (isPeerIdValid) {
            if (store.state.findLinkmans) {
              store.state.findLinkmans.splice(0)
            }
            let linkman = store.state.linkmanMap[peerId]
            if (linkman && linkman.status !== LinkmanStatus.REQUESTED) {
              store.state.findLinkmanResult = 2
              store.state.findLinkmanTip = ''
              store.state.findLinkman = linkman
              store.state.currentLinkman = linkman
              store.state.findContactsSubKind = 'contactsDetails'
              store.contactsDetailsEntry = 'findContacts'
            } else {
              let receivedRequest = false
              for (let linkmanRequest of store.state.linkmanRequests) {
                if (linkmanRequest.receiverPeerId === myselfPeerClient.peerId
                  && linkmanRequest.senderPeerId === peerId
                  && linkmanRequest.status === RequestStatus.RECEIVED) {
                  receivedRequest = true
                  store.state.findLinkmanResult = 3
                  store.state.findLinkmanTip = ''
                  store.state.findLinkman = linkmanRequest
                  store.state.findLinkman.peerId = linkmanRequest.senderPeerId
                }
              }
              if (!receivedRequest) {
                store.state.findLinkman = await peerClientService.findPeerClient(null, peerId, null, null)
                if (store.state.findLinkman && !(store.state.findLinkman.visibilitySetting && store.state.findLinkman.visibilitySetting.substring(0, 1) === 'N')) {
                  store.state.findLinkmanResult = 4
                  store.state.findLinkmanTip = ''
                } else {
                  store.state.findLinkmanResult = 1
                  store.state.findLinkmanTip = _that.$i18n.t('The contact does not exist')
                  store.state.findLinkman = null
                }
              }
              if (store.state.findLinkmanResult === 3 || store.state.findLinkmanResult === 4) {
                store.state.findContactsSubKind = 'result'
              }
            }
          } else {
            store.state.findLinkman = null
            if (store.state.findLinkmans) {
              store.state.findLinkmans.splice(0)
            } else {
              store.state.findLinkmans = []
            }
            let mobile = null
            let countryCode = store.state.countryCode
            if (countryCode) {
              let isPhoneNumberValid = false
              try {
                isPhoneNumberValid = MobileNumberUtil.isPhoneNumberValid(peerId, MobileNumberUtil.getRegionCodeForCountryCode(countryCode))
              } catch (e) {
                console.log(e)
              }
              if (isPhoneNumberValid) {
                mobile = MobileNumberUtil.formatE164(peerId, MobileNumberUtil.getRegionCodeForCountryCode(countryCode))
                console.log('formatE164:' + mobile)
              }
            }
            let peerClients = await peerClientService.getPeerClient(null, null, mobile, peerId)
            if (peerClients && peerClients.length > 0) {
              let pcMap = {}
              for (let peerClient of peerClients) {
                let pId = peerClient.peerId
                let pcArray = null
                if (!pcMap[pId]) {
                  pcArray = []
                  pcMap[pId] = pcArray
                } else {
                  pcArray = pcMap[pId]
                }
                pcArray.push(peerClient)
              }
              for (let key in pcMap) {
                let pcArray = pcMap[key]
                let best = await peerClientService.getBestPeerClient(pcArray, null)
                store.state.findLinkmans.push(best)
              }
            }
            if (store.state.findLinkmans.length > 0) {
              for (let i = store.state.findLinkmans.length - 1; i >= 0; i--) {
                let thePeerId = store.state.findLinkmans[i].peerId
                let linkman = store.state.linkmanMap[thePeerId]
                if (linkman && linkman.status !== LinkmanStatus.REQUESTED) {
                  //store.state.findLinkmanResult = 2
                  linkman.findLinkmanResult = 2
                  //store.state.findLinkmanTip = ''
                  //store.state.findLinkman = linkman
                  store.state.findLinkmans.splice(i, 1, linkman)
                  //store.state.currentLinkman = linkman
                  //store.state.findContactsSubKind = 'contactsDetails'
                  //store.contactsDetailsEntry = 'findContacts'
                } else {
                  let receivedRequest = false
                  for (let linkmanRequest of store.state.linkmanRequests) {
                    if (linkmanRequest.receiverPeerId === myselfPeerClient.peerId
                      && linkmanRequest.senderPeerId === thePeerId
                      && linkmanRequest.status === RequestStatus.RECEIVED) {
                      receivedRequest = true
                      //store.state.findLinkmanResult = 3
                      //store.state.findLinkmanTip = ''
                      linkmanRequest.findLinkmanResult = 3
                      linkmanRequest.peerId = linkmanRequest.senderPeerId
                      store.state.findLinkmans.splice(i, 1, linkmanRequest)
                    }
                  }
                  if (!receivedRequest) {
                    if (!(store.state.findLinkmans[i].visibilitySetting
                      && store.state.findLinkmans[i].visibilitySetting.substring(5, 6) === 'N'
                      && store.state.findLinkmans[i].name === peerId)) {
                      //store.state.findLinkmanResult = 4
                      //store.state.findLinkmanTip = ''
                      store.state.findLinkmans[i].findLinkmanResult = 4
                    } else {
                      //store.state.findLinkmanResult = 1
                      //store.state.findLinkmanTip = _that.$i18n.t('The contact does not exist')
                      store.state.findLinkmans.splice(i, 1)
                    }
                  }
                }
              }
            }
            if (store.state.findLinkmans.length === 0) {
              store.state.findLinkmanResult = 1
              store.state.findLinkmanTip = _that.$i18n.t('The contact does not exist')
            } else {
              store.state.findLinkmanResult = 0
              store.state.findLinkmanTip = ''
              store.state.findContactsSubKind = 'result'
            }
          }
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
              store.toggleDrawer(true)
              if (store.state.ifMobileStyle) {
                document.querySelector("body").classList.add('bgc')
              }
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
                  store.contactsDetailsEntry = store.scanEntry // chat, findContacts
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
                    if (store.scanEntry === 'findContacts') {
                      store.findContactsEntry = ''
                    } else { // chat
                      store.findContactsEntry = store.scanEntry
                      store.changeKind('findContacts')
                    }
                    await _that.findContacts('qrCode', peerId)
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
              console.log('scan contents:' + contents)
              systemAudioComponent.scanAudioPlay()
              if (contents) {
                if (contents.indexOf('Migration::') > -1) {
                  _that.migrateQRContent = contents
                  store.scanSwitch(false)
                  if (store.state.ifMobileStyle) {
                    document.querySelector("body").classList.add('bgc')
                  }
                  _that.migrateDialog = true
                } else {
                  store.scanSwitch(false)
                  store.toggleDrawer(true)
                  if (store.state.ifMobileStyle) {
                    document.querySelector("body").classList.add('bgc')
                  }
                  let peerId = contents
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
                      store.contactsDetailsEntry = store.scanEntry // chat, findContacts
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
                        if (store.scanEntry === 'findContacts') {
                          store.findContactsEntry = ''
                        } else { // chat
                          store.findContactsEntry = store.scanEntry
                          store.changeKind('findContacts')
                        }
                        await _that.findContacts('qrCode', peerId)
                      }
                    }
                  }
                }
              }
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
      if (_that.initBackupDialog || _that.initRestoreDialog) {
        return
      }
      // save logout time
      myself.myselfPeer.updateDate = new Date()
      // remove loginStatus and password
      if (myself.myselfPeer.loginStatus === 'Y') {
        myself.myselfPeer.loginStatus = 'N'
        myself.myselfPeer.password = null
      }
      await myselfPeerService.update(myself.myselfPeer)
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
      if (data) {
        _that.logoutData = data
      }
      if (!_that.initMigrateDialog) {
        _that.gotoLogin()
      }
    },
    gotoLogin() {
      let _that = this
      // 跳转页面
      _that.$router.push('/')
      if (store.state.ifMobileStyle) {
        statusBarComponent.style(false, '#33000000')
        document.querySelector("body").classList.remove('bgc')
      }
      if (_that.logoutData) {
        Dialog.create({
          title: _that.$i18n.t('Alert'),
          message: _that.$i18n.t('Your another Colla account instance logined') + _that.$i18n.t(' (') + _that.$i18n.t('Id: ') + _that.logoutData.srcClientId + _that.$i18n.t(', ') + _that.$i18n.t('Device: ') + _that.logoutData.srcClientType + _that.$i18n.t(', ') + _that.$i18n.t('Time: ') + date.formatDate(_that.logoutData.createDate, 'YYYY-MM-DD HH:mm:ss') + _that.$i18n.t(') '),
          cancel: false,
          ok: { "label": _that.$i18n.t('Ok'), "color": "primary", "unelevated": true, "no-caps": true },
          persistent: true
        }).onOk(() => {
        }).onCancel(() => {
        })
        _that.logoutData = null
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
      if (store.state.ifMobileStyle) {
        if (_that.$q.dark.isActive) {
          statusBarComponent.style(false, '#2d2d2d')
        } else {
          statusBarComponent.style(true, '#eeeeee') // grey-3
        }
      }
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
      let myselfPeerClient = myself.myselfPeerClient
      let type = data.type
      if (!type) {
        console.error('NullChatType')
      }
      let srcClientId = data.srcClientId
      if (!srcClientId) {
        console.error('NullSrcClientId')
      } else {
        if (srcClientId === myselfPeerClient.clientId) {
          console.error('SrcClientIdIsMyself')
          return
        }
      }
      let srcPeerId = data.srcPeerId
      if (!srcPeerId) {
        console.error('NullSrcPeerId')
      }
      console.info('receive chat type: ' + type + ' from srcClientId: ' + srcClientId + ', srcPeerId: ' + srcPeerId)
      if (type === ChatMessageType.LOGOUT) {
        if (data/* && data.srcClientDevice === myselfPeerClient.clientDevice*/) {
          await store.logout(data)
        }
      } else if (type === ChatMessageType.MIGRATE) { // unreachable
        console.log('MIGRATE')
        _that.initMigrateDialog = false
        if (data.operation === 'Accept') {
          _that.$q.notify({
            message: _that.$i18n.t("Migrate successfully"),
            timeout: 3000,
            type: "info",
            color: "info",
          })
        }
      } else if (type === ChatMessageType.BACKUP) {
        console.log('BACKUP, url:' + data.url + ', filename:' + data.filename)
        if (data.url && data.filename) {
          _that.backupUrl = data.url
          _that.backupFilename = data.filename
          _that.backupDialog = true
        } else {
          if (data.operation) {
            await _that.closeInitBackup()
            if (data.operation === 'Accept') {
              _that.$q.notify({
                message: _that.$i18n.t("Backup successfully"),
                timeout: 3000,
                type: "info",
                color: "info",
              })
            }
          }
        }
      } else if (type === ChatMessageType.RESTORE) {
        console.log('RESTORE, url:' + data.url + ', filename:' + data.filename)
        if (data.url && !data.filename) {
          try {
            let _client = axios.create()
            if (_client && store.restoreFile) {
              let formdata = new FormData()
              formdata.append('file', store.restoreFile)
              //formdata.append('name', store.restoreFile.name)
              let result = await _client.post(data.url, formdata, {
                headers: { "Content-Type": "multipart/form-data" }
              })
              console.log('post result:' + JSON.stringify(result))
              let newPayload = {}
              newPayload.type = ChatMessageType.RESTORE
              newPayload.srcClientId = myselfPeerClient.clientId
              newPayload.srcPeerId = myselfPeerClient.peerId
              newPayload.filename = store.restoreFile.name
              await chatAction.chat(null, newPayload, myselfPeerClient.peerId)
            }
          } catch (e) {
            await logService.log(e, 'restorePostError', 'error')
            Dialog.create({
              title: _that.$i18n.t('Alert'),
              message: _that.$i18n.t('This function uses self-signed ssl certificate, when you first time use it, a Not secure error page will be prompted, please click Advanced button and Proceed to ... link.'),
              cancel: false,
              ok: { "label": _that.$i18n.t('Ok'), "color": "primary", "unelevated": true, "no-caps": true },
              persistent: true
            }).onOk(() => {
              let url = data.url + '?language=' + _that.$i18n.locale
              if (store.ios === true) {
                let inAppBrowser = inAppBrowserComponent.open(url, '_system', 'location=no')
              } else if (store.android === true) {
                let inAppBrowser = inAppBrowserComponent.open(url, '_system', 'location=no')
              } else if (store.safari === true) {
                window.open(url, '_blank')
              } else {
                window.open(url, '_blank')
              }
            }).onCancel(() => {
            })
          }
        } else if (!data.url && data.filename) {
          _that.restoreFilename = data.filename
          _that.restoreDialog = true
        } else if (!data.url && !data.filename) {
          if (!data.operation) {
            _that.startServer('restore', null)
          } else {
            await _that.closeInitRestore()
            if (data.operation === 'Accept') {
              _that.$q.notify({
                message: _that.$i18n.t("Restore successfully"),
                timeout: 3000,
                type: "info",
                color: "info",
              })
            }
          }
        }
      }
    },
    async p2pChatReceiver(peerId, message) {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      message = JSON.parse(message)
      if (!message.messageType) {
        let signalSession = await _that.getSignalSession(peerId)
        if (!signalSession) {
          await logService.log({}, 'signalSessionDoesNotExistError', 'error')
          return
        }
        let messageString
        try {
          messageString = await signalSession.decrypt(message, 'string')
        } catch (e) {
          console.log(message)
          console.log(e)
        }
        if (!messageString) {
          console.log("signal decrypt failed")
          return
        }
        message = JSON.parse(messageString)
      }
      let messageType = message.messageType
      let content = message.content
      if (messageType === P2pChatMessageType.CHAT_RECEIVE_RECEIPT) {
        console.log('receive CHAT_RECEIVE_RECEIPT')
        console.log(message)
        if (message.preSubjectType === SubjectType.CHAT) {
          let currentMes
          let chatMessages = store.state.chatMap[message.senderPeerId].messages
          if (chatMessages && chatMessages.length > 0) {
            for (let i = chatMessages.length; i--; i > -1) {
              let _currentMes = chatMessages[i]
              if (_currentMes.messageId === message.preMessageId) {
                currentMes = _currentMes
              }
            }
          }
          if (!currentMes) {
            let messages = await chatComponent.loadMessage({
              ownerPeerId: myselfPeerClient.peerId,
              messageId: message.preMessageId
            })
            if (messages && messages.length > 0) {
              currentMes = messages[0]
            }
          } else {
            currentMes = await chatComponent.get(ChatDataType.MESSAGE, currentMes._id)
          }
          currentMes.actualReceiveTime = message.receiveTime
          await chatComponent.update(ChatDataType.MESSAGE, currentMes, null)
        } else {
          let receives = await chatComponent.loadReceive({
            ownerPeerId: myselfPeerClient.peerId,
            messageId: message.preMessageId,
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
          if (_message.messageId === message.preMessageId) {
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
          linkman.signalPublicKey = content.signalPublicKey
          signalProtocol.signalPublicKeys.set(linkmanPeerId, linkman.signalPublicKey)
          if (message.syncType === `init`) {
            let signalSession = await _that.getSignalSession(linkmanPeerId)
            if (signalSession) {
              await signalSession.close()
            }
          }
          linkman.downloadSwitch = content.downloadSwitch
          //linkman.localDataCryptoSwitch = content.localDataCryptoSwitch
          linkman.autoLoginSwitch = content.autoLoginSwitch
          if (content.recallTimeLimit !== linkman.recallTimeLimit || linkman.recallAlert !== content.recallAlert) {
            let _sysMessageContent
            let _type
            let _value
            if (content.recallTimeLimit !== linkman.recallTimeLimit) {
              _type = _that.$i18n.t("Recall Time Limit")
              _value = content.recallTimeLimit
            } else {
              _type = _that.$i18n.t("Recall Alert")
              _value = content.recallAlert
              _that.$forceUpdate()
            }
            _sysMessageContent = `${(linkman.givenName ? linkman.givenName : linkman.name)}${(_value ? _that.$i18n.t("Add") : _that.$i18n.t("Cancel"))}${_type}`

            let chat = await store.getChat(linkmanPeerId)
            let chatMessage = {
              messageType: P2pChatMessageType.CHAT_SYS,
              contentType: ChatContentType.EVENT,
              content: _sysMessageContent
            }
            await store.addCHATSYSMessage(chat, chatMessage)

          }
          linkman.recallTimeLimit = content.recallTimeLimit
          linkman.recallAlert = content.recallAlert
          linkman.udpSwitch = content.udpSwitch
          store.state.linkmanMap[linkmanPeerId] = linkman
          let linkmen = await contactComponent.loadLinkman({
            ownerPeerId: myselfPeerClient.peerId,
            peerId: linkmanPeerId
          })
          if (linkmen && linkmen.length > 0) {
            for (let _linkman of linkmen) {
              _linkman.name = content.name
              _linkman.mobile = content.mobile
              _linkman.avatar = content.avatar
              _linkman.publicKey = content.publicKey
              _linkman.downloadSwitch = content.downloadSwitch
              _linkman.signalPublicKey = content.signalPublicKey
              //_linkman.localDataCryptoSwitch = content.localDataCryptoSwitch
              _linkman.autoLoginSwitch = content.autoLoginSwitch
              _linkman.recallTimeLimit = content.recallTimeLimit
              _linkman.recallAlert = content.recallAlert
              _linkman.udpSwitch = content.udpSwitch
            }
            await contactComponent.update(ContactDataType.LINKMAN, linkmen, null)
          }
        }
      }
      else if (messageType === P2pChatMessageType.ADD_GROUPCHAT && content) {
        // 重复消息不处理、但仍发送Receive收条
        let _id = content._id
        let currentTime = new Date()
        let groupChat = store.state.groupChatMap[content.groupId]
        if (!groupChat) {
          // 新增群组
          let groupChat = {}
          groupChat._id = _id + peerId
          groupChat.ownerPeerId = myselfPeerClient.peerId
          groupChat.groupId = content.groupId
          groupChat.groupCategory = 'Chat'
          groupChat.groupType = 'Private'
          groupChat.name = content.groupName
          groupChat.pyName = pinyinUtil.getPinyin(content.groupName)
          groupChat.description = content.groupDescription
          groupChat.pyDescription = pinyinUtil.getPinyin(content.groupDescription)
          groupChat.createDate = content.groupCreateDate
          groupChat.status = GroupStatus.EFFECTIVE
          groupChat.locked = false
          groupChat.notAlert = false
          groupChat.top = false
          groupChat.recallTimeLimit = true
          groupChat.recallAlert = true

          await contactComponent.insert(ContactDataType.GROUP, groupChat, null)

          // 新增群组成员（已包括自己）
          let groupMembers = []
          let groupOwnerPeerId
          let inviterName = ''
          let groupMemberNames
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
            if (gm.memberPeerId !== myselfPeerClient.peerId) {
              let linkman = store.state.linkmanMap[gm.memberPeerId]
              if (linkman) {
                linkman.groupChats.unshift(groupChat)
                if (linkman.activeStatus === ActiveStatus.UP && groupChat.activeStatus !== ActiveStatus.UP) {
                  groupChat.activeStatus = ActiveStatus.UP
                }
              }
              let member = linkman
              if (!member) {
                member = await peerClientService.getCachedPeerClient(gm.memberPeerId)
              }
              if (member) {
                if (gm.memberPeerId === content.senderPeerId) {
                  inviterName = (member.givenName ? member.givenName : member.name)
                } else {
                  groupMemberNames = (groupMemberNames ? groupMemberNames + _that.$i18n.t(", ") : '') + (member.givenName ? member.givenName : member.name)
                }
              }
            }
          }

          groupChat.groupOwnerPeerId = groupOwnerPeerId
          groupChat.groupMembers = groupMembers
          store.state.groupChats.unshift(groupChat)
          store.state.groupChatMap[groupChat.groupId] = groupChat
          let chatMessage = {
            _id: _id + peerId,
            messageType: P2pChatMessageType.CHAT_SYS,
            contentType: ChatContentType.EVENT,
            content: inviterName + _that.$i18n.t(" has invited ") + _that.$i18n.t("you") + (groupMemberNames ? _that.$i18n.t(" and ") + groupMemberNames : '') + _that.$i18n.t(" to join group chat")
          }
          let chat = await store.getChat(groupChat.groupId)
          await store.addCHATSYSMessage(chat, chatMessage)
        }
        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.ADD_GROUPCHAT_RECEIPT,
          ownerPeerId: myselfPeerClient.peerId,
          subjectId: content.senderPeerId,
          content: linkmanRequest
        }
        await _that.sendOrSaveReceipt(message)
      }
      else if (messageType === P2pChatMessageType.DISBAND_GROUPCHAT && content) {
        let _id = content._id
        let currentTime = new Date()
        let groupChat = store.state.groupChatMap[content.groupId]
        if (groupChat) {
          // 修改群组
          groupChat.status = GroupStatus.DISBANDED
          store.state.groupChatMap[content.groupId] = groupChat
          let groupChatRecord = await contactComponent.get(ContactDataType.GROUP, groupChat._id)
          if (groupChatRecord) {
            groupChatRecord.status = GroupStatus.DISBANDED
            await contactComponent.update(ContactDataType.GROUP, groupChatRecord)
          }

          let modifierName
          let sender = store.state.linkmanMap[content.senderPeerId]
          if (!sender) {
            sender = await peerClientService.getCachedPeerClient(content.senderPeerId)
          }
          if (sender) {
            modifierName = sender.givenName ? sender.givenName : sender.name
          }
          let _content
          if (modifierName) {
            _content = modifierName + _that.$i18n.t(" has disbanded this group chat")
          }
          if (_content) {
            let chat = await store.getChat(groupChat.groupId)
            let chatMessage = {
              _id: _id + peerId,
              messageType: P2pChatMessageType.CHAT_SYS,
              contentType: ChatContentType.EVENT,
              content: _content
            }
            await store.addCHATSYSMessage(chat, chatMessage)
          }
        }

        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.DISBAND_GROUPCHAT_RECEIPT,
          ownerPeerId: myselfPeerClient.peerId,
          subjectId: content.senderPeerId,
          content: linkmanRequest
        }
        await _that.sendOrSaveReceipt(message)
      }
      else if (messageType === P2pChatMessageType.MODIFY_GROUPCHAT && content) {
        let _id = content._id
        let currentTime = new Date()
        let groupChat = store.state.groupChatMap[content.groupId]
        if (groupChat) {
          // 修改群组
          let nameChanged = false
          let descriptionChanged = false
          let recallTimeLimitChanged = false
          let recallAlertChanged = false
          if (groupChat.groupOwnerPeerId === content.senderPeerId) {
            if ((groupChat.name || content.groupName) && groupChat.name !== content.groupName) {
              nameChanged = true
              groupChat.name = content.groupName
              groupChat.pyName = pinyinUtil.getPinyin(content.groupName)
            }
            if ((groupChat.description || content.groupDescription) && groupChat.description !== content.groupDescription) {
              descriptionChanged = true
              groupChat.description = content.groupDescription
              groupChat.pyDescription = pinyinUtil.getPinyin(content.groupDescription)
            }
            if (groupChat.recallTimeLimit !== content.recallTimeLimit) {
              recallTimeLimitChanged = true
              groupChat.recallTimeLimit = content.recallTimeLimit
            }
            if (groupChat.recallAlert !== content.recallAlert) {
              recallAlertChanged = true
              groupChat.recallAlert = content.recallAlert
            }
          }
          if (nameChanged || descriptionChanged || recallTimeLimitChanged || recallAlertChanged) {
            let groupChatRecord = await contactComponent.get(ContactDataType.GROUP, groupChat._id)
            if (groupChatRecord) {
              groupChatRecord.name = groupChat.name
              groupChatRecord.pyName = groupChat.pyName
              groupChatRecord.description = groupChat.description
              groupChatRecord.pyDescription = groupChat.pyDescription
              groupChatRecord.recallTimeLimit = groupChat.recallTimeLimit
              groupChatRecord.recallAlert = groupChat.recallAlert
              await contactComponent.update(ContactDataType.GROUP, groupChatRecord)
            }
          }

          // 修改发送人在本群的昵称
          let aliasChanged = false
          let senderGroupMember
          let groupMembers = groupChat.groupMembers
          for (let groupMember of groupMembers) {
            if (groupMember.memberPeerId === content.senderPeerId) {
              if ((groupMember.memberAlias || content.myAlias) && groupMember.memberAlias !== content.myAlias) {
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

          let modifierName
          let sender = store.state.linkmanMap[content.senderPeerId]
          if (!sender) {
            sender = await peerClientService.getCachedPeerClient(content.senderPeerId)
          }
          if (sender) {
            modifierName = sender.givenName ? sender.givenName : sender.name
          }
          let _content
          if (modifierName && (nameChanged || descriptionChanged)) {
            _content = modifierName + _that.$i18n.t(" has modified ") + (nameChanged ? (descriptionChanged ? _that.$i18n.t("Group Name to be : ") + groupChat.name + _that.$i18n.t(",") + _that.$i18n.t(" modified ")
              + _that.$i18n.t("Group Description to be : ") + groupChat.description : _that.$i18n.t("Group Name to be : ") + groupChat.name) : _that.$i18n.t("Group Description to be : ") + groupChat.description)
          } else if (modifierName && (recallTimeLimitChanged || recallAlertChanged)) {
            let _type
            let value
            if (recallTimeLimitChanged) {
              _type = _that.$i18n.t("Recall Time Limit")
              value = groupChat.recallTimeLimit
            } else {
              _type = _that.$i18n.t("Recall Alert")
              value = groupChat.recallAlert
            }
            _content = `${modifierName}${(value ? _that.$i18n.t(" has switched on ") : _that.$i18n.t(" has switched off "))}${_type}`
          }
          if (_content) {
            let chat = await store.getChat(groupChat.groupId)
            let chatMessage = {
              _id: _id + peerId,
              messageType: P2pChatMessageType.CHAT_SYS,
              contentType: ChatContentType.EVENT,
              content: _content
            }
            await store.addCHATSYSMessage(chat, chatMessage)
          }
        }

        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.MODIFY_GROUPCHAT_RECEIPT,
          ownerPeerId: myselfPeerClient.peerId,
          subjectId: content.senderPeerId,
          content: linkmanRequest
        }
        await _that.sendOrSaveReceipt(message)
      }
      else if (messageType === P2pChatMessageType.ADD_GROUPCHAT_MEMBER && content) {
        // 重复消息不处理、但仍发送Receive收条
        let _id = content._id
        let currentTime = new Date()
        let groupChat = store.state.groupChatMap[content.groupId]
        let newCreated = false
        // 新增群组（对于新增群组成员群组还不存在）
        if (!groupChat) {
          newCreated = true
          groupChat = {}
          groupChat._id = _id + peerId
          groupChat.ownerPeerId = myselfPeerClient.peerId
          groupChat.groupId = content.groupId
          groupChat.groupCategory = 'Chat'
          groupChat.groupType = 'Private'
          groupChat.name = content.groupName
          groupChat.pyName = pinyinUtil.getPinyin(content.groupName)
          groupChat.description = content.groupDescription
          groupChat.pyDescription = pinyinUtil.getPinyin(content.groupDescription)
          groupChat.createDate = content.groupCreateDate
          groupChat.status = GroupStatus.EFFECTIVE
          groupChat.locked = false
          groupChat.notAlert = false
          groupChat.top = false
          groupChat.recallTimeLimit = true
          groupChat.recallAlert = true
          await contactComponent.insert(ContactDataType.GROUP, groupChat, null)
        }

        // 新增群组成员（对于新增群组成员为全量，否则为增量）
        let gms = groupChat.groupMembers
        if (!gms) {
          gms = []
        }
        let groupOwnerPeerId
        let inviterName = ''
        let addedGroupMemberNames
        for (let gm of content.data) {
          let linkman = store.state.linkmanMap[gm.memberPeerId]
          let member = linkman
          if (!member) {
            member = await peerClientService.getCachedPeerClient(gm.memberPeerId)
          }
          let notExists = true
          if (!newCreated) {
            let existingGms = await contactComponent.loadGroupMember({
              ownerPeerId: myselfPeerClient.peerId,
              groupId: content.groupId,
              memberPeerId: gm.memberPeerId
            })
            if (existingGms && existingGms.length > 0) {
              notExists = false
            }
          }
          if (notExists) {
            let groupMember = {}
            groupMember._id = _id + gm.memberPeerId
            groupMember.ownerPeerId = myselfPeerClient.peerId
            groupMember.groupId = content.groupId
            groupMember.memberPeerId = gm.memberPeerId
            groupMember.memberType = gm.memberType
            groupMember.createDate = gm.createDate
            groupMember.status = gm.status
            await contactComponent.insert(ContactDataType.GROUP_MEMBER, groupMember, gms)
            if (gm.memberPeerId !== myselfPeerClient.peerId && linkman) {
              linkman.groupChats.unshift(groupChat)
              if (linkman.activeStatus === ActiveStatus.UP && groupChat.activeStatus !== ActiveStatus.UP) {
                groupChat.activeStatus = ActiveStatus.UP
              }
            }
            if (gm.memberPeerId !== content.senderPeerId && gm.memberPeerId !== myselfPeerClient.peerId && member) {
              addedGroupMemberNames = (addedGroupMemberNames ? addedGroupMemberNames + _that.$i18n.t(", ") : '') + (member.givenName ? member.givenName : member.name)
            }
          }
          if (gm.memberType === MemberType.OWNER) {
            groupOwnerPeerId = gm.memberPeerId
          }
          if (gm.memberPeerId === content.senderPeerId && member) {
            inviterName = (member.givenName ? member.givenName : member.name)
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
          _id: _id + peerId,
          messageType: P2pChatMessageType.CHAT_SYS,
          contentType: ChatContentType.EVENT,
          content: newCreated ?
            inviterName + _that.$i18n.t(" has invited ") + _that.$i18n.t("you") + _that.$i18n.t(" to join group chat") + _that.$i18n.t(", other group members: ") + (addedGroupMemberNames ? addedGroupMemberNames : '')
            :
            inviterName + _that.$i18n.t(" has invited ") + (addedGroupMemberNames ? addedGroupMemberNames : '') + _that.$i18n.t(" to join group chat")
        }
        await store.addCHATSYSMessage(chat, chatMessage)
        /*}*/

        if (!newCreated) {
          _that.$forceUpdate()
        }

        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.ADD_GROUPCHAT_RECEIPT,
          ownerPeerId: myselfPeerClient.peerId,
          subjectId: content.senderPeerId,
          content: linkmanRequest
        }
        await _that.sendOrSaveReceipt(message)
      }
      else if (messageType === P2pChatMessageType.REMOVE_GROUPCHAT_MEMBER && content) {
        let _id = content._id
        let currentTime = new Date()
        let groupChat = store.state.groupChatMap[content.groupId]
        if (groupChat) {
          let gms = groupChat.groupMembers
          let removeGroupChat = false
          for (let gm of content.data) {
            if (gm.memberPeerId === myselfPeerClient.peerId) {
              removeGroupChat = true
            }
          }
          let inviterName = ''
          let removedGroupMemberNames
          for (let groupChatMember of gms) {
            if (groupChatMember.memberPeerId === content.senderPeerId) {
              let member = store.state.linkmanMap[groupChatMember.memberPeerId]
              if (!member) {
                member = await peerClientService.getCachedPeerClient(groupChatMember.memberPeerId)
              }
              if (member) {
                inviterName = (member.givenName ? member.givenName : member.name)
              }
              break
            }
          }
          if (removeGroupChat) {
            // 删除聊天记录
            /*let messages = await chatComponent.loadMessage({
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
            delete store.state.chatMap[groupChat.groupId]*/

            // 删除群组成员
            let removeGroupMembers = await contactComponent.loadGroupMember({
              ownerPeerId: myselfPeerClient.peerId,
              groupId: groupChat.groupId,
              memberPeerId: myselfPeerClient.peerId
            })
            if (removeGroupMembers && removeGroupMembers.length > 0) {
              await contactComponent.remove(ContactDataType.GROUP_MEMBER, removeGroupMembers, gms)
            }

            // 删除群组
            /*let groupChatRecord = await contactComponent.get(ContactDataType.GROUP, groupChat._id)
            await contactComponent.remove(ContactDataType.GROUP, groupChatRecord, store.state.groupChats)
            delete store.state.groupChatMap[groupChat.groupId]
            if (store.state.currentChat && store.state.currentChat.subjectId === groupChat.groupId) {
              store.state.currentChat = null
              _that.subKind = "default"
              if (store.state.ifMobileStyle) {
                store.toggleDrawer(false)
              }
            }*/
            groupChat.groupMembers = gms
            store.state.groupChatMap[content.groupId] = groupChat

            let chat = await store.getChat(groupChat.groupId)
            let chatMessage = {
              _id: _id + peerId,
              messageType: P2pChatMessageType.CHAT_SYS,
              contentType: ChatContentType.EVENT,
              content: inviterName + _that.$i18n.t(" has removed ") + _that.$i18n.t("you") + _that.$i18n.t(" from group chat")
            }
            await store.addCHATSYSMessage(chat, chatMessage)
          } else {
            // 删除群组成员
            let fromGroupOwner = false
            for (let groupChatMember of gms) {
              if (groupChatMember.memberType === MemberType.OWNER && groupChatMember.memberPeerId === content.senderPeerId) {
                fromGroupOwner = true
                break
              }
            }
            for (let gm of content.data) {
              let linkman = store.state.linkmanMap[gm.memberPeerId]
              let member = linkman
              if (!member) {
                member = await peerClientService.getCachedPeerClient(gm.memberPeerId)
              }
              if (fromGroupOwner) {
                if (member) {
                  removedGroupMemberNames = (removedGroupMemberNames ? removedGroupMemberNames + _that.$i18n.t(", ") : '') + (member.givenName ? member.givenName : member.name)
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
              if (linkman) {
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
              _id: _id + peerId,
              messageType: P2pChatMessageType.CHAT_SYS,
              contentType: ChatContentType.EVENT,
              content: fromGroupOwner ?
                inviterName + _that.$i18n.t(" has removed ") + (removedGroupMemberNames ? removedGroupMemberNames : '') + _that.$i18n.t(" from group chat")
                :
                inviterName + _that.$i18n.t(" has left the group chat")
            }
            await store.addCHATSYSMessage(chat, chatMessage)
          }
        }
        _that.$forceUpdate()

        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.REMOVE_GROUPCHAT_MEMBER_RECEIPT,
          ownerPeerId: myselfPeerClient.peerId,
          subjectId: content.senderPeerId,
          content: linkmanRequest
        }
        await _that.sendOrSaveReceipt(message)
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

        let newOwnerName = ''
        if (newOwner.memberPeerId !== myselfPeerClient.peerId) {
          let newOwnerLinkman = store.state.linkmanMap[newOwner.memberPeerId]
          if (!newOwnerLinkman) {
            newOwnerLinkman = await peerClientService.getCachedPeerClient(newOwner.memberPeerId)
          }
          if (newOwnerLinkman) {
            newOwnerName = newOwnerLinkman.givenName ? newOwnerLinkman.givenName : newOwnerLinkman.name
          }
        }
        let chat = await store.getChat(groupChat.groupId)
        let chatMessage = {
          _id: _id + peerId,
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
          ownerPeerId: myselfPeerClient.peerId,
          subjectId: content.senderPeerId,
          content: linkmanRequest
        }
        await _that.sendOrSaveReceipt(message)
      }
      else if (messageType === P2pChatMessageType.DROP_LINKMAN && content) {
        let peerId = content.senderPeerId
        let linkman = store.state.linkmanMap[peerId]
        if (linkman) {
          linkman.droppedMe = true
          linkman.blackedMe = false
          store.state.linkmanMap[peerId] = linkman
          _that.$forceUpdate()
          let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
          if (linkmanRecord) {
            linkmanRecord.droppedMe = true
            linkmanRecord.blackedMe = false
            await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
          }
        }
        let _id = content._id
        let currentTime = new Date()
        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.DROP_LINKMAN_RECEIPT,
          ownerPeerId: myselfPeerClient.peerId,
          subjectId: content.senderPeerId,
          content: linkmanRequest
        }
        await _that.sendOrSaveReceipt(message)
      }
      else if (messageType === P2pChatMessageType.BLACK_LINKMAN && content) {
        let peerId = content.senderPeerId
        let linkman = store.state.linkmanMap[peerId]
        if (linkman) {
          linkman.blackedMe = true
          store.state.linkmanMap[peerId] = linkman
          _that.$forceUpdate()
          let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
          if (linkmanRecord) {
            linkmanRecord.blackedMe = true
            await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
          }
        }
        let _id = content._id
        let currentTime = new Date()
        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.BLACK_LINKMAN_RECEIPT,
          ownerPeerId: myselfPeerClient.peerId,
          subjectId: content.senderPeerId,
          content: linkmanRequest
        }
        await _that.sendOrSaveReceipt(message)
      }
      else if (messageType === P2pChatMessageType.UNBLACK_LINKMAN && content) {
        let peerId = content.senderPeerId
        let linkman = store.state.linkmanMap[peerId]
        if (linkman) {
          linkman.blackedMe = false
          store.state.linkmanMap[peerId] = linkman
          _that.$forceUpdate()
          let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
          if (linkmanRecord) {
            linkmanRecord.blackedMe = false
            await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
          }
        }
        let _id = content._id
        let currentTime = new Date()
        // 发送Receive收条
        let linkmanRequest = {}
        linkmanRequest._id = _id
        linkmanRequest.receiveTime = currentTime
        let message = {
          messageType: P2pChatMessageType.UNBLACK_LINKMAN_RECEIPT,
          ownerPeerId: myselfPeerClient.peerId,
          subjectId: content.senderPeerId,
          content: linkmanRequest
        }
        await _that.sendOrSaveReceipt(message)
      }
      else if ((messageType === P2pChatMessageType.ADD_GROUPCHAT_RECEIPT
        || messageType === P2pChatMessageType.DISBAND_GROUPCHAT_RECEIPT
        || messageType === P2pChatMessageType.MODIFY_GROUPCHAT_RECEIPT
        || messageType === P2pChatMessageType.ADD_GROUPCHAT_MEMBER_RECEIPT
        || messageType === P2pChatMessageType.REMOVE_GROUPCHAT_MEMBER_RECEIPT
        || messageType === P2pChatMessageType.MODIFY_GROUPCHAT_OWNER_RECEIPT
        || messageType === P2pChatMessageType.DROP_LINKMAN_RECEIPT
        || messageType === P2pChatMessageType.BLACK_LINKMAN_RECEIPT
        || messageType === P2pChatMessageType.UNBLACK_LINKMAN_RECEIPT) && content) {
        let receiveTime = content.receiveTime
        let receives = await chatComponent.loadReceive({
          ownerPeerId: myselfPeerClient.peerId,
          messageId: content._id,
          receiverPeerId: message.ownerPeerId,
          receiveTime: { $eq: null }
        }, null, null, null)
        if (receives && receives.length > 0) {
          for (let receive of receives) {
            receive.receiveTime = receiveTime
          }
          await chatComponent.update(ChatDataType.RECEIVE, receives, null)
        }
      }
      else if (messageType === P2pChatMessageType.CALL_REQUEST) {
        await _that.receiveCallRequest(message)
      }
      else if (messageType === P2pChatMessageType.CALL_CLOSE) {
        await _that.receiveCallClose(message)
      }
      else if (messageType === P2pChatMessageType.RECALL) {
        await _that.receiveRecallMessage(message)
      }
      else if (messageType === P2pChatMessageType.CHAT_LINKMAN) {
        await store.insertReceivedMessage(message)
      }
      else if (messageType === P2pChatMessageType.ADD_LINKMAN && content) {
        let data = content
        let srcPeerId = data.srcPeerId
        let linkman = store.state.linkmanMap[srcPeerId]
        let clientPeerId = myselfPeerClient.peerId
        let currentTime = new Date()
        // 重复消息不处理、但仍发送Receive收条
        let duplicated = false
        let srcName = data.srcName
        let srcMobile = data.srcMobile
        let srcAvatar = data.srcAvatar
        let _id = data._id
        let blackedMe = data.blackedMe
        for (let linkmanRequest of store.state.linkmanRequests) {
          if (linkmanRequest._id === _id + peerId) {
            duplicated = true
            break
          }
        }
        if (!duplicated) {
          // 新增linkmanRequest
          let linkmanRequest = {}
          linkmanRequest.requestType = RequestType.ADD_LINKMAN
          linkmanRequest.ownerPeerId = clientPeerId
          linkmanRequest.senderPeerId = srcPeerId
          linkmanRequest.receiverPeerId = clientPeerId
          linkmanRequest.name = srcName
          linkmanRequest.mobile = srcMobile
          linkmanRequest.avatar = srcAvatar
          //linkmanRequest.publicKey = srcPeerClient.publicKey
          linkmanRequest._id = _id + peerId // 标识重复消息
          linkmanRequest.message = data.message
          linkmanRequest.createDate = data.createDate
          if (linkman && linkman.status !== LinkmanStatus.REQUESTED) { // 如果请求方已是联系人，直接接受
            linkmanRequest.status = RequestStatus.ACCEPTED
            linkmanRequest.statusDate = currentTime
          } else {
            linkmanRequest.status = RequestStatus.RECEIVED
            linkmanRequest.receiveTime = currentTime
          }
          if (blackedMe) {
            linkmanRequest.blackedMe = true
          }
          await contactComponent.insert(ContactDataType.LINKMAN_REQUEST, linkmanRequest, null)
          store.state.linkmanRequests.unshift(linkmanRequest)
          /*if (linkman) { // 之前的我的请求，状态置为Expired（Received状态记录可能有多条，Sent状态记录只应有1条），不包括群组请求
            let linkmanRequests = await contactComponent.loadLinkmanRequest(
              {
                ownerPeerId: clientPeerId,
                senderPeerId: clientPeerId,
                receiverPeerId: srcPeerId,
                status: { $in: [RequestStatus.SENT, RequestStatus.RECEIVED] },
                requestType: RequestType.ADD_LINKMAN
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
                && linkmanRequest.requestType === RequestType.ADD_LINKMAN) {
                linkmanRequest.status = RequestStatus.EXPIRED
                linkmanRequest.statusDate = currentTime
              }
            }
          }*/
        }
        let newPayload = {}
        newPayload._id = _id
        newPayload.srcClientId = myselfPeerClient.clientId
        newPayload.srcPeerId = clientPeerId
        if (linkman && linkman.status !== LinkmanStatus.REQUESTED) {
          newPayload.receiveTime = currentTime
          newPayload.acceptTime = currentTime
          if (linkman.status === LinkmanStatus.BLACKED) {
            newPayload.blackedMe = true
          }
        } else {
          newPayload.receiveTime = currentTime
        }
        let msg = {
          messageType: P2pChatMessageType.ADD_LINKMAN_REPLY,
          content: newPayload
        }
        await store.p2pSend(msg, srcPeerId)
        // 打招呼
        if (linkman && linkman.status !== LinkmanStatus.REQUESTED) {
          /*let chat = await store.getChat(srcPeerId)
          let chatMessage = {
            messageType: P2pChatMessageType.CHAT_SYS,
            contentType: ChatContentType.EVENT,
            content: _that.$i18n.t("You") + _that.$i18n.t(" have accepted ") + (linkman.givenName ? linkman.givenName : linkman.name) + _that.$i18n.t(", you can chat now")
          }
          await store.addCHATSYSMessage(chat, chatMessage)
          _that.$q.notify({
            message: _that.$i18n.t("Receive contacts request from ") + srcName + _that.$i18n.t(", auto accept it as the requestor is already in your contacts list"),
            timeout: 3000,
            type: "info",
            color: "info",
          })*/
          linkman.droppedMe = false
          store.state.linkmanMap[srcPeerId] = linkman
          let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
          if (linkmanRecord) {
            linkmanRecord.droppedMe = false
            await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
          }
        } else {
          _that.$q.notify({
            message: _that.$i18n.t("Receive contacts request from ") + srcName,
            timeout: 3000,
            type: "info",
            color: "info",
          })
        }
      } else if (messageType === P2pChatMessageType.ADD_LINKMAN_REPLY && content) {
        let data = content
        let _id = data._id
        let srcPeerId = data.srcPeerId
        let clientPeerId = myselfPeerClient.peerId
        let linkman = store.state.linkmanMap[srcPeerId]
        let acceptTime = data.acceptTime
        let receiveTime = data.receiveTime
        let blackedMe = data.blackedMe
        if (acceptTime && !receiveTime) {
          // 更新Received状态记录（可能有多条)，不包括群组请求
          let linkmanRequests = await contactComponent.loadLinkmanRequest(
            {
              ownerPeerId: clientPeerId,
              senderPeerId: clientPeerId,
              receiverPeerId: srcPeerId,
              status: RequestStatus.RECEIVED,
              requestType: RequestType.ADD_LINKMAN
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
              && linkmanRequest.requestType === RequestType.ADD_LINKMAN) {
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
              requestType: RequestType.ADD_LINKMAN
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
              && linkmanRequest.requestType === RequestType.ADD_LINKMAN) {
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
              requestType: RequestType.ADD_LINKMAN
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
              && linkmanRequest.requestType === RequestType.ADD_LINKMAN) {
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
              requestType: RequestType.ADD_LINKMAN
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
              && linkmanRequest.requestType === RequestType.ADD_LINKMAN) {
              linkmanRequest.status = RequestStatus.ACCEPTED
              linkmanRequest.receiveTime = receiveTime
              linkmanRequest.statusDate = acceptTime
            }
          }
        }
        if (acceptTime) {
          if (linkman) {
            let status = linkman.status
            let droppedMe = linkman.droppedMe
            if (status === LinkmanStatus.REQUESTED) {
              linkman.status = LinkmanStatus.EFFECTIVE
              if (blackedMe === true) {
                linkman.blackedMe = true
              }
            } else {
              if (droppedMe === true) {
                linkman.droppedMe = false
              }
            }
            store.state.linkmanMap[srcPeerId] = linkman
            let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
            if (linkmanRecord) {
              if (status === LinkmanStatus.REQUESTED) {
                linkmanRecord.status = LinkmanStatus.EFFECTIVE
                if (blackedMe === true) {
                  linkmanRecord.blackedMe = true
                }
              } else {
                if (droppedMe === true) {
                  linkmanRecord.droppedMe = false
                }
              }
              await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
            }
            //await webrtcPeerPool.create(srcPeerId)
            let chat = store.state.chatMap[srcPeerId]
            if (!chat) { // 尚未创建对应聊天时才需要执行
              chat = await store.getChat(srcPeerId)
            }
            let chatMessage = {
              _id: _id + peerId,
              messageType: P2pChatMessageType.CHAT_SYS,
              contentType: ChatContentType.EVENT,
              content: (linkman.givenName ? linkman.givenName : linkman.name) + _that.$i18n.t(" has accepted ") + _that.$i18n.t("you") + _that.$i18n.t(", you can chat now")
            }
            await store.addCHATSYSMessage(chat, chatMessage)
          }
        }
      }
    },
    async receiveRecallMessage(message) {
      let _that = this
      let store = _that.$store
      let preMessageId = message.preMessageId
      let myselfPeerClient = myself.myselfPeerClient
      let currentMes
      let subjectId
      if (message.preSubjectType === SubjectType.GROUP_CHAT) {
        subjectId = message.preSubjectId
      } else {
        subjectId = message.senderPeerId
      }
      let chat = store.state.chatMap[subjectId]
      if (chat) {
        let chatMessages = chat.messages
        if (chatMessages && chatMessages.length > 0) {
          if (chatMessages[chatMessages.length - 1].messageId === preMessageId) {
            chat.content = `[${_that.$i18n.t("This message has been recalled")}]`
            let db_chat = await chatComponent.get(ChatDataType.CHAT, chat._id)
            db_chat.content = chat.content
            await chatComponent.update(ChatDataType.CHAT, db_chat)
          }
          for (let i = chatMessages.length; i--; i > -1) {
            let _currentMes = chatMessages[i]
            if (_currentMes.messageId === preMessageId) {
              currentMes = _currentMes
              currentMes.status = ChatMessageStatus.RECALL
            }
          }
        }
      }
      if (!currentMes) {
        let messages = await chatComponent.loadMessage(
          {
            ownerPeerId: myselfPeerClient.peerId,
            messageId: preMessageId,
          })
        if (messages && messages.length > 0) {
          currentMes = messages[0]
        }
      } else {
        currentMes.status = ChatMessageStatus.RECALL
        currentMes = await chatComponent.get(ChatDataType.MESSAGE, currentMes._id)
      }
      if (!currentMes) return
      currentMes.status = ChatMessageStatus.RECALL
      await chatComponent.update(ChatDataType.MESSAGE, currentMes, null)
    },
    async sendOrSaveReceipt(message) {
      let _that = this
      let webrtcPeers = webrtcPeerPool.getConnected(message.subjectId)
      if (webrtcPeers && webrtcPeers.length > 0) {
        await store.p2pSend(message, message.subjectId)
      } else if (message._id != undefined) {
        await chatComponent.insert(ChatDataType.MESSAGE, message)
      }
    },
    async webrtcConnect(evt) {
      let _that = this
      let myselfPeerClient = myself.myselfPeerClient
      let peerId = evt.source.targetPeerId
      let linkman = store.state.linkmanMap[peerId]
      if (!linkman) return
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
            requestType: RequestType.ADD_LINKMAN
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
            && linkmanRequest.requestType === RequestType.ADD_LINKMAN) {
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
            requestType: RequestType.ADD_LINKMAN
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
            && linkmanRequest.requestType === RequestType.ADD_LINKMAN) {
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
            requestType: RequestType.ADD_LINKMAN
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
            && linkmanRequest.requestType === RequestType.ADD_LINKMAN) {
            linkmanRequest.status = RequestStatus.ACCEPTED
            linkmanRequest.statusDate = currentTime
          }
        }
        await _that.sendLinkmanInfo(peerId, `init`)
        await _that.sendUnsentMessage(peerId)
      }
    },
    async sendLinkmanInfo(peerId, syncType) {
      let _that = this
      let myselfPeerClient = myself.myselfPeerClient
      let linkman = store.state.linkmanMap[peerId]
      if (!linkman) return
      if (linkman.activeStatus !== ActiveStatus.UP) {
        return
      }
      let myselfBasicInfo = {}
      myselfBasicInfo.peerId = myselfPeerClient.peerId
      myselfBasicInfo.name = myselfPeerClient.name
      if (myselfPeerClient.visibilitySetting && myselfPeerClient.visibilitySetting.substring(1, 2) === 'N') {
        myselfBasicInfo.mobile = ''
      } else {
        myselfBasicInfo.mobile = myselfPeerClient.mobile
      }
      myselfBasicInfo.avatar = myselfPeerClient.avatar
      myselfBasicInfo.publicKey = myselfPeerClient.publicKey
      myselfBasicInfo.signalPublicKey = myselfPeerClient.signalPublicKey
      myselfBasicInfo.udpSwitch = myselfPeerClient.udpSwitch
      myselfBasicInfo.recallTimeLimit = linkman.myselfRecallTimeLimit
      myselfBasicInfo.recallAlert = linkman.myselfRecallAlert
      let message = {
        messageType: P2pChatMessageType.SYNC_LINKMAN_INFO,
        content: myselfBasicInfo,
        syncType: syncType
      }
      await store.p2pSend(message, peerId)
    },
    async webrtcClose(evt) {
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
        if (signalSession) {
          await signalSession.close()
        }
        // 更新lastConnectTime
        linkman.lastConnectTime = currentTime
        let lks = await contactComponent.loadLinkman({
          ownerPeerId: myselfPeerClient.peerId,
          peerId: peerId
        })
        if (lks && lks.length > 0) {
          for (let lk of lks) {
            lk.lastConnectTime = currentTime
          }
          await contactComponent.update(ContactDataType.LINKMAN, lks, null)
        }
        console.log('activeStatus => Down, peerId:' + peerId)
        if (_that.pendingCall && store.state.currentCallChat && store.state.currentCallChat.streamMap && store.state.currentCallChat.streamMap[peerId]) {
          _that.pendingCall(peerId)
        }
      }
    },
    async p2pSend(message, peerId) {
      try {
        let _that = this
        let blockId = UUID.string(null, null)
        let store = _that.$store
        if (store.state.networkStatus !== 'CONNECTED') {
          if (store.displayActiveStatus) {
            _that.$q.notify({
              message: _that.$i18n.t('CONNECTING'),
              timeout: 3000,
              type: "info",
              color: "info",
            })
          }
          return
        }
        if (message.subjectType === SubjectType.CHAT) {
          let messages = await chatComponent.loadMessage(
            {
              ownerPeerId: message.ownerPeerId,
              messageId: message.messageId
            })
          if (messages && messages.length > 0) {
            let currentMes = messages[0]
            currentMes.blockId = blockId
            await chatComponent.update(ChatDataType.MESSAGE, currentMes, null)
          }
        } else if (message.subjectType === SubjectType.GROUP_CHAT) {
          let receives = await chatComponent.loadReceive(
            {
              ownerPeerId: message.ownerPeerId,
              messageId: message.messageId,
              receiverPeerId: peerId
            })
          if (receives && receives.length > 0) {
            let receive = receives[0]
            receive.blockId = blockId
            await chatComponent.update(ChatDataType.RECEIVE, receives[0], null)
          }
        }
        //todo 暂时取消signal加密，解决问题后启用
        // if (typeof message === "object" && message.messageType !== P2pChatMessageType.SYNC_LINKMAN_INFO && message.messageType !== P2pChatMessageType.CALL_REQUEST) {
        //   let signalSession = await _that.getSignalSession(peerId)
        //   if (signalSession) {
        //     message = await signalSession.encrypt(JSON.stringify(message))
        //   }
        // }
        let messageString = JSON.stringify(message)
        let createTimestamp = new Date().getTime()
        let expireDate = new Date().getTime() + 1000 * 3600 * 24 * 365 * 100 // 100 years
        let payload = { payload: messageString, metadata: null, expireDate: expireDate }
        let dataBlock = DataBlockService.create(blockId, null, peerId, BlockType.P2pChat, createTimestamp, payload, [])
        await dataBlockService.encrypt(dataBlock)
        let dataBlocks = await DataBlockService.slice(dataBlock)
        if (dataBlocks.length !== 1) {
          console.error('P2pChat DataBlock sliceSize is greater than 1')
          return
        }
        dataBlock = dataBlocks[0]
        dataBlock.payload = messageString // for webrtc send
        // socket已连接，webrtc未连接且最后连接时间超过1分钟
        let linkman = store.state.linkmanMap[peerId]
        if (linkman && store.state.networkStatus === 'CONNECTED' && linkman.activeStatus === ActiveStatus.DOWN
          && (!linkman.lastWebrtcRequestTime || (linkman.lastWebrtcRequestTime && (createTimestamp - linkman.lastWebrtcRequestTime) / 1000 > 60))
          && message.messageType !== P2pChatMessageType.CALL_REQUEST
          && message.messageType !== P2pChatMessageType.ADD_LINKMAN
          && message.messageType !== P2pChatMessageType.ADD_LINKMAN_REPLY
          && message.messageType !== P2pChatMessageType.DROP_LINKMAN
          && message.messageType !== P2pChatMessageType.DROP_LINKMAN_RECEIPT
          && message.messageType !== P2pChatMessageType.BLACK_LINKMAN
          && message.messageType !== P2pChatMessageType.BLACK_LINKMAN_RECEIPT) {
          let option = {}
          option.config = {
            "iceServers": config.appParams.iceServer[0]
          }
          await webrtcPeerPool.create(linkman.peerId, option)
          linkman.lastWebrtcRequestTime = createTimestamp
        }
        let response = await p2pChatAction.chat(null, dataBlock, peerId)
        if (response && response.MessageType === MsgType.CONSENSUS_REPLY && response.Payload === MsgType.OK) {
          let actualReceiveTime = new Date().getTime()
          message.actualReceiveTime = actualReceiveTime
          await _that.receiveMessageBlockReply(blockId, actualReceiveTime)
        }
      } catch (e) {
        await logService.log(e, 'p2pSendError', 'error')
      }
    },
    async getSignalSession(peerId) {
      let signalSession, clientId
      let linkman = store.state.linkmanMap[peerId]
      let webrtcPeers = webrtcPeerPool.getConnected(peerId)
      if (linkman && linkman.signalPublicKey && webrtcPeers && webrtcPeers.length > 0) {
        clientId = webrtcPeers[0].clientId
        if (!signalProtocol.signalPublicKeys.get(peerId)) {
          signalProtocol.signalPublicKeys.set(peerId, linkman.signalPublicKey)
        }
        signalSession = await signalProtocol.get(peerId, clientId)
      }
      return signalSession
    },
    async cloudSyncP2pChat() {
      let _that = this
      let store = _that.$store
      // 查询cloud全量DataBlock索引信息
      let conditionBean = {}
      conditionBean['businessNumber'] = myself.myselfPeerClient.peerId
      conditionBean['getAllBlockIndex'] = true
      conditionBean['blockType'] = BlockType.P2pChat
      let downloadList = await queryValueAction.queryValue(null, conditionBean)
      console.log('downloadList:' + JSON.stringify(downloadList))
      // 下载
      if (downloadList && downloadList.length > 0) {
        if (store.p2pChatWorkerEnabler) {
          /*let options = {}
          options.privateKey = myself.privateKey
          openpgp.clonePackets(options)
          let worker = _that.initP2pChatDownloadWorker()
          worker.postMessage([downloadList, myself.myselfPeerClient, options.privateKey])*/
        } else {
          let ps = []
          for (let download of downloadList) {
            let promise = dataBlockService.findTxPayload(null, download['blockId'])
            ps.push(promise)
          }
          let responses = await Promise.all(ps)
          if (responses && responses.length > 0) {
            let dataBlocks = []
            for (let i = 0; i < responses.length; ++i) {
              dataBlocks.push(responses[i][0])
            }
            dataBlocks = CollaUtil.sortByKey(dataBlocks, 'createDate', 'asc')
            //let callbackPs = []
            let _peerIds = new Map()
            for (let i = 0; i < dataBlocks.length; ++i) {
              let dataBlock = dataBlocks[i]
              if (dataBlock) {
                //let _callbackP = new Promise(async function(resolve, reject) {
                console.log(dataBlock)
                await _that.p2pChatReceiver(dataBlock.peerId, dataBlock.payload)
                await collectionUtil.deleteBlock(dataBlock, true, BlockType.P2pChat)
                if (!_peerIds.get(dataBlock.peerId)) {
                  _peerIds.set(dataBlock.peerId, dataBlock.peerId)
                }
                console.log('------one block resolve')
                //resolve()
                // })
                // callbackPs.push(_callbackP)
              }
            }
            // Promise.all(callbackPs).then(async function() {
            console.log('-------Promise.all then')
            for (let _peerId of _peerIds.keys()) {
              let signalSession = await _that.getSignalSession(_peerId)
              if (signalSession) {
                await signalSession.close()
              }
            }
            //})
          }
        }
      }
    },
    async consensusReceiver(data) {
      let _that = this
      let store = _that.$store
      if (data &&
        (data.MessageType === MsgType[MsgType.CONSENSUS_REPLY] || data.MessageType === MsgType[MsgType.CONSENSUS_RAFT_REPLY] || data.MessageType === MsgType[MsgType.CONSENSUS_PBFT_REPLY]) &&
        data.PayloadType === PayloadType.ConsensusLog) {
        let consensusLog = data.Payload
        console.log('consensusReceiver consensusLog:' + JSON.stringify(consensusLog))
        console.log('consensusReceiver time:' + new Date())
        if (consensusLog.blockType === BlockType.Collection) {
          let condition = {}
          condition['ownerPeerId'] = myself.myselfPeerClient.peerId
          let dbLogs = await blockLogComponent.load(condition, null, null)
          if (dbLogs && dbLogs.length > 0) {
            for (let dbLog of dbLogs) {
              if (dbLog.blockId === consensusLog.blockId && dbLog.sliceNumber === consensusLog.sliceNumber) {
                dbLog.state = EntityState.Deleted // 如果上传不成功，需要保留blockLog在以后继续处理，否则删除 - 多节点异步保存模式
                await blockLogComponent.save(dbLog, null, dbLogs)
                console.log('delete blockLog, blockId:' + dbLog.blockId + ';sliceNumber:' + dbLog.sliceNumber)
                break
              }
            }
          }

          // 刷新syncFailed标志
          let newDbLogMap = CollaUtil.clone(store.state.dbLogMap)
          for (let blockId in newDbLogMap) {
            let syncFailed = false
            if (dbLogs && dbLogs.length > 0) {
              for (let dbLog of dbLogs) {
                if (dbLog.blockId === blockId) {
                  syncFailed = true
                  break
                }
              }
            }
            if (!syncFailed) {
              delete newDbLogMap[blockId]
              console.log('delete dbLogMap, blockId:' + blockId)
            }
          }
          store.state.dbLogMap = newDbLogMap
        } else if (consensusLog.blockType === BlockType.P2pChat && consensusLog.peerId) { // this is a create (otherwise delete) P2pChat consensus reply
          // 标记发送回执
          let blockId = data.Payload.blockId
          let actualReceiveTime = new Date().getTime()
          // TODO: 内存中对应message.actualReceiveTime更新？
          await _that.receiveMessageBlockReply(blockId, actualReceiveTime)
        }
      }
    },
    async receiveMessageBlockReply(blockId, actualReceiveTime) {
      let messages = await chatComponent.loadMessage(
        {
          ownerPeerId: myself.myselfPeerClient.peerId,
          blockId: blockId
        })
      if (messages && messages.length > 0) {
        let currentMes = messages[0]
        currentMes.receiveTag = true
        currentMes.actualReceiveTime = actualReceiveTime
        await chatComponent.update(ChatDataType.MESSAGE, currentMes, null)
      } else {
        let receives = await chatComponent.loadReceive(
          {
            blockId: blockId
          })
        if (receives && receives.length > 0) {
          let currentRec = receives[0]
          currentRec.receiveTag = true
          currentRec.actualReceiveTime = actualReceiveTime
          await chatComponent.update(ChatDataType.RECEIVE, currentRec, null)
        }
      }
    },
    showInitMigrateDialog: async function (url, filename) {
      let _that = this
      _that.initMigrateDialog = true
      let content = 'Migration::' + url + '::' + filename
      let logoSrc = myself.myselfPeerClient.avatar ? myself.myselfPeerClient.avatar : store.defaultActiveAvatar
      _that.$nextTick(() => {
        mediaComponent.generateQRCode('qrCode', content, 256, logoSrc)
      })
    },
    cancelInitMigrate: function () {
      let _that = this
      _that.initMigrateDialog = false
      if (_that.logoutFlag) {
        _that.gotoLogin()
      }
    },
    acceptMigrate: async function () {
      let _that = this
      let store = _that.$store
      if (_that.migrateQRContent) {
        let arr = _that.migrateQRContent.split('::')
        if (arr.length === 3) {
          let migrateUrl = arr[1]
          let migrateFilename = arr[2]
          let url = migrateUrl + '/' + migrateFilename
          let json
          try {
            const httpsAgent = new https.Agent({
              rejectUnauthorized: false
            })
            let _client = axios.create({ httpsAgent: httpsAgent })
            if (_client) {
              let serviceData = await _client.get(url)
              if (serviceData) {
                json = serviceData.data
              }
            }
          } catch (e) {
            await logService.log(e, 'acceptMigrateError', 'error')
            Dialog.create({
              title: _that.$i18n.t('Alert'),
              message: _that.$i18n.t('This function uses self-signed ssl certificate, when you first time use it, a Not secure error page will be prompted, please click Advanced button and Proceed to ... link.'),
              cancel: false,
              ok: { "label": _that.$i18n.t('Ok'), "color": "primary", "unelevated": true, "no-caps": true },
              persistent: true
            }).onOk(() => {
              url = migrateUrl + '?language=' + _that.$i18n.locale
              if (store.ios === true) {
                let inAppBrowser = inAppBrowserComponent.open(url, '_system', 'location=no')
              } else if (store.android === true) {
                let inAppBrowser = inAppBrowserComponent.open(url, '_system', 'location=no')
              } else if (store.safari === true) {
                window.open(url, '_blank')
              } else {
                window.open(url, '_blank')
              }
            }).onCancel(() => {
            })
          }
          if (json) {
            await store.restoreChatRecord(json)
            await _that.closeMigrate('Accept')
            _that.$q.notify({
              message: _that.$i18n.t("Migrate successfully"),
              timeout: 3000,
              type: "info",
              color: "info",
            })
          }
        }
      }
    },
    closeMigrate: async function (operation) {
      let _that = this
      let clientPeerId = myself.myselfPeerClient.peerId
      let newPayload = {}
      newPayload.type = ChatMessageType.MIGRATE
      newPayload.srcClientId = myself.myselfPeerClient.clientId
      newPayload.srcPeerId = clientPeerId
      newPayload.operation = operation
      await chatAction.chat(null, newPayload, clientPeerId)
      _that.migrateDialog = false
    },
    showInitBackupDialog: function () {
      let _that = this
      _that.initBackupDialog = true
    },
    closeInitBackup: async function () {
      let _that = this
      _that.initBackupDialog = false
      if (_that.logoutFlag) {
        await _that.logout()
      }
    },
    async initBackup() {
      let _that = this
      let store = _that.$store
      let clientPeerId = myself.myselfPeerClient.peerId
      let newPayload = {}
      newPayload.type = ChatMessageType.BACKUP
      newPayload.srcClientId = myself.myselfPeerClient.clientId
      newPayload.srcPeerId = clientPeerId
      newPayload.url = _that.initBackupUrl
      newPayload.filename = _that.initBackupFilename
      await chatAction.chat(null, newPayload, clientPeerId)
    },
    acceptBackup: async function () {
      let _that = this
      let url = _that.backupUrl + '/' + _that.backupFilename
      let json
      try {
        let _client = axios.create()
        if (_client) {
          let serviceData = await _client.get(url)
          if (serviceData) {
            json = serviceData.data
          }
        }
      } catch (e) {
        await logService.log(e, 'acceptBackupError', 'error')
        url = _that.backupUrl + '?language=' + _that.$i18n.locale
        if (store.ios === true) {
          let inAppBrowser = inAppBrowserComponent.open(url, '_system', 'location=no')
        } else if (store.android === true) {
          let inAppBrowser = inAppBrowserComponent.open(url, '_system', 'location=no')
        } else if (store.safari === true) {
          window.open(url, '_blank')
        } else {
          window.open(url, '_blank')
        }
      }
      if (json) {
        if (_that.backupFilename) {
          /*let filenameArr = _that.backupFilename.split('-')
          if (filenameArr.length === 3) {
            let arr = filenameArr[2].split('.')
            let filename = filenameArr[0] + '-' + filenameArr[1] + '(' + date.formatDate(new Date(parseInt(arr[0])), 'YYYY-MM-DD_HH:mm:ss') + ').db'*/
          let filename = _that.backupFilename
          let element = document.createElement('a')
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json))
          element.setAttribute('download', filename)
          element.style.display = 'none'
          document.body.appendChild(element)
          element.click()
          document.body.removeChild(element)
          /*}*/
        }
        await _that.closeBackup('Accept')
      }
    },
    closeBackup: async function (operation) {
      let _that = this
      let clientPeerId = myself.myselfPeerClient.peerId
      let newPayload = {}
      newPayload.type = ChatMessageType.BACKUP
      newPayload.srcClientId = myself.myselfPeerClient.clientId
      newPayload.srcPeerId = clientPeerId
      newPayload.operation = operation
      await chatAction.chat(null, newPayload, clientPeerId)
      _that.backupDialog = false
    },
    showInitRestoreDialog: function () {
      let _that = this
      _that.initRestoreDialog = true
    },
    closeInitRestore: async function () {
      let _that = this
      _that.initRestoreDialog = false
      if (_that.logoutFlag) {
        await _that.logout()
      }
    },
    async initRestore() {
      let _that = this
      let store = _that.$store
      let clientPeerId = myself.myselfPeerClient.peerId
      let newPayload = {}
      newPayload.type = ChatMessageType.RESTORE
      newPayload.srcClientId = myself.myselfPeerClient.clientId
      newPayload.srcPeerId = clientPeerId
      await chatAction.chat(null, newPayload, clientPeerId)
    },
    acceptRestore: async function () {
      let _that = this
      let store = _that.$store
      let dirEntry = await fileComponent.getRootDirEntry('/')
      let dirPath = dirEntry.toInternalURL()
      let url = dirPath + '/' + _that.restoreFilename
      let fileEntry = await fileComponent.getFileEntry(url)
      let json = await fileComponent.readFile(fileEntry, { format: 'txt' })
      if (json) {
        await store.restoreChatRecord(json)
        await _that.closeRestore('Accept')
        _that.$q.notify({
          message: _that.$i18n.t("Restore successfully"),
          timeout: 3000,
          type: "info",
          color: "info",
        })
      }
    },
    closeRestore: async function (operation) {
      let _that = this
      let clientPeerId = myself.myselfPeerClient.peerId
      let newPayload = {}
      newPayload.type = ChatMessageType.RESTORE
      newPayload.srcClientId = myself.myselfPeerClient.clientId
      newPayload.srcPeerId = clientPeerId
      newPayload.operation = operation
      await chatAction.chat(null, newPayload, clientPeerId)
      _that.restoreDialog = false
    },
    restoreChatRecord: async function (txt) {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      try {
        // decrypt
        let json = ''
        if (txt.indexOf('[payloadKey:]') > -1 && txt.indexOf('[:payloadKey]') > -1) {
          let payloadKey = txt.substring(txt.indexOf('[payloadKey:]') + 13, txt.indexOf('[:payloadKey]'))
          console.log(payloadKey)
          txt = txt.substring(txt.indexOf('[:payloadKey]') + 13)
          if (payloadKey) {
            let securityParams = {}
            securityParams.NeedCompress = false
            securityParams.NeedEncrypt = true
            securityParams.PayloadKey = payloadKey
            let payload = await SecurityPayload.decrypt(txt, securityParams)
            if (payload) {
              json = payload
            }
          }
        }
        // restore
        // 联系人同步：跨实例云端同步功能提供前临时使用 - start
        let changeFlag = false
        let linkmansJson = null
        if (json.indexOf('[linkmansJson:]') > -1 && json.indexOf('[:linkmansJson]') > -1) {
          linkmansJson = json.substring(json.indexOf('[linkmansJson:]') + 15, json.indexOf('[:linkmansJson]'))
          console.log(linkmansJson)
          let linkmans = JSON.parse(linkmansJson)
          if (linkmans && linkmans.length > 0) {
            for (let i = linkmans.length - 1; i >= 0; i--) {
              if (linkmans[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                let localLinkmans = await contactComponent.loadLinkman({
                  ownerPeerId: myself.myselfPeerClient.peerId,
                  peerId: linkmans[i].peerId
                })
                if (localLinkmans && localLinkmans.length > 0) {
                  linkmans.splice(i, 1)
                }
              } else {
                linkmans.splice(i, 1)
              }
            }
            if (linkmans.length > 0) {
              changeFlag = true
              await contactComponent.insert(ContactDataType.LINKMAN, linkmans, null)
            }
          }
        }
        let groupsJson = null
        if (json.indexOf('[groupsJson:]') > -1 && json.indexOf('[:groupsJson]') > -1) {
          groupsJson = json.substring(json.indexOf('[groupsJson:]') + 13, json.indexOf('[:groupsJson]'))
          console.log(groupsJson)
          let groups = JSON.parse(groupsJson)
          if (groups && groups.length > 0) {
            for (let i = groups.length - 1; i >= 0; i--) {
              if (groups[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                let localGroups = await contactComponent.loadGroup({
                  ownerPeerId: myself.myselfPeerClient.peerId,
                  groupId: groups[i].groupId
                })
                if (localGroups && localGroups.length > 0) {
                  groups.splice(i, 1)
                }
              } else {
                groups.splice(i, 1)
              }
            }
            if (groups.length > 0) {
              changeFlag = true
              await contactComponent.insert(ContactDataType.GROUP, groups, null)
              let groupMembersJson = null
              if (json.indexOf('[groupMembersJson:]') > -1 && json.indexOf('[:groupMembersJson]') > -1) {
                groupMembersJson = json.substring(json.indexOf('[groupMembersJson:]') + 19, json.indexOf('[:groupMembersJson]'))
                console.log(groupMembersJson)
                let groupMembers = JSON.parse(groupMembersJson)
                if (groupMembers && groupMembers.length > 0) {
                  for (let i = groupMembers.length - 1; i >= 0; i--) {
                    if (groupMembers[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                      let newFlag = false
                      for (let group of groups) {
                        if (group.groupId === groupMembers[i].groupId) {
                          newFlag = true
                          break
                        }
                      }
                      if (newFlag) {
                        // 保守的做法，一般groupId为new，不会存在其下memberPeerId的记录
                        let localGroupMembers = await contactComponent.loadGroupMember({
                          ownerPeerId: myself.myselfPeerClient.peerId,
                          groupId: groupMembers[i].groupId,
                          memberPeerId: groupMembers[i].memberPeerId
                        })
                        if (localGroupMembers && localGroupMembers.length > 0) {
                          groupMembers.splice(i, 1)
                        }
                      } else {
                        groupMembers.splice(i, 1)
                      }
                    } else {
                      groupMembers.splice(i, 1)
                    }
                  }
                  if (groupMembers.length > 0) {
                    await contactComponent.insert(ContactDataType.GROUP_MEMBER, groupMembers, null)
                  }
                }
              }
            }
          }
        }
        let linkmanTagsJson = null
        if (json.indexOf('[linkmanTagsJson:]') > -1 && json.indexOf('[:linkmanTagsJson]') > -1) {
          linkmanTagsJson = json.substring(json.indexOf('[linkmanTagsJson:]') + 18, json.indexOf('[:linkmanTagsJson]'))
          console.log(linkmanTagsJson)
          let linkmanTags = JSON.parse(linkmanTagsJson)
          if (linkmanTags && linkmanTags.length > 0) {
            for (let i = linkmanTags.length - 1; i >= 0; i--) {
              if (linkmanTags[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                let localLinkmanTag = await contactComponent.get(ContactDataType.LINKMAN_TAG, linkmanTags[i]._id)
                if (localLinkmanTag) {
                  linkmanTags.splice(i, 1)
                }
              } else {
                linkmanTags.splice(i, 1)
              }
            }
            if (linkmanTags.length > 0) {
              changeFlag = true
              await contactComponent.insert(ContactDataType.LINKMAN_TAG, linkmanTags, null)
              let linkmanTagLinkmansJson = null
              if (json.indexOf('[linkmanTagLinkmansJson:]') > -1 && json.indexOf('[:linkmanTagLinkmansJson]') > -1) {
                linkmanTagLinkmansJson = json.substring(json.indexOf('[linkmanTagLinkmansJson:]') + 25, json.indexOf('[:linkmanTagLinkmansJson]'))
                console.log(linkmanTagLinkmansJson)
                let linkmanTagLinkmans = JSON.parse(linkmanTagLinkmansJson)
                if (linkmanTagLinkmans && linkmanTagLinkmans.length > 0) {
                  for (let i = linkmanTagLinkmans.length - 1; i >= 0; i--) {
                    if (linkmanTagLinkmans[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                      let newFlag = false
                      for (let linkmanTag of linkmanTags) {
                        if (linkmanTag.tagId === linkmanTagLinkmans[i].tagId) {
                          newFlag = true
                          break
                        }
                      }
                      if (newFlag) {
                        // 保守的做法，一般tagId为new，不会存在其下linkmanPeerId的记录
                        let localLinkmanTagLinkmans = await contactComponent.loadLinkmanTagLinkman({
                          ownerPeerId: myself.myselfPeerClient.peerId,
                          tagId: linkmanTagLinkmans[i].tagId,
                          linkmanPeerId: linkmanTagLinkmans[i].linkmanPeerId
                        })
                        if (localLinkmanTagLinkmans && localLinkmanTagLinkmans.length > 0) {
                          linkmanTagLinkmans.splice(i, 1)
                        }
                      } else {
                        linkmanTagLinkmans.splice(i, 1)
                      }
                    } else {
                      linkmanTagLinkmans.splice(i, 1)
                    }
                  }
                  if (linkmanTagLinkmans.length > 0) {
                    await contactComponent.insert(ContactDataType.LINKMAN_TAGLINKMAN, linkmanTagLinkmans, null)
                  }
                }
              }
            }
          }
        }
        if (changeFlag) {
          await store.refreshData()
        }
        // 联系人同步：跨实例云端同步功能提供前临时使用 - end
        let chatsJson = null
        let needInsertMessageChats = []
        if (json.indexOf('[chatsJson:]') > -1 && json.indexOf('[:chatsJson]') > -1) {
          chatsJson = json.substring(json.indexOf('[chatsJson:]') + 12, json.indexOf('[:chatsJson]'))
          console.log(chatsJson)
          let chats = JSON.parse(chatsJson)
          if (chats && chats.length > 0) {
            for (let i = chats.length - 1; i >= 0; i--) {
              if (chats[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                let localChats = await chatComponent.loadMessage({
                  ownerPeerId: myself.myselfPeerClient.peerId,
                  subjectId: chats[i].subjectId
                })
                if (localChats && localChats.length > 0) {
                  chats.splice(i, 1)
                }
              } else {
                chats.splice(i, 1)
              }
            }
            if (chats.length > 0) {
              await chatComponent.insert(ChatDataType.CHAT, chats, null)
              for (let i = chats.length - 1; i >= 0; i--) {
                let _chat = await store.getChat(chats[i].subjectId)
                needInsertMessageChats.push(_chat)
              }
            }
          }
        }
        let messagesJson = null
        if (json.indexOf('[messagesJson:]') > -1 && json.indexOf('[:messagesJson]') > -1) {
          messagesJson = json.substring(json.indexOf('[messagesJson:]') + 15, json.indexOf('[:messagesJson]'))
          console.log(messagesJson)
          let messages = JSON.parse(messagesJson)
          if (messages && messages.length > 0) {
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                let localMessages = await chatComponent.loadMessage({
                  ownerPeerId: myself.myselfPeerClient.peerId,
                  messageId: messages[i].messageId
                }, null, null, null, true)
                if (localMessages && localMessages.length > 0) {
                  messages.splice(i, 1)
                }
              } else {
                messages.splice(i, 1)
              }
            }
            if (messages.length > 0) {
              await chatComponent.insert(ChatDataType.MESSAGE, messages, null)
              let mergeMessagesJson = null
              if (json.indexOf('[mergeMessagesJson:]') > -1 && json.indexOf('[:mergeMessagesJson]') > -1) {
                mergeMessagesJson = json.substring(json.indexOf('[mergeMessagesJson:]') + 20, json.indexOf('[:mergeMessagesJson]'))
                console.log(mergeMessagesJson)
                let mergeMessages = JSON.parse(mergeMessagesJson)
                if (mergeMessages && mergeMessages.length > 0) {
                  for (let i = mergeMessages.length - 1; i >= 0; i--) {
                    if (mergeMessages[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                      let newFlag = false
                      for (let message of messages) {
                        if (message.messageId === mergeMessages[i].topMergeMessageId) {
                          newFlag = true
                          break
                        }
                      }
                      if (newFlag) {
                        // 保守的做法，一般topMergeMessageId为new，不会存在其下mergeMessageId的记录
                        let localMergeMessages = await chatComponent.loadMergeMessage({
                          ownerPeerId: myself.myselfPeerClient.peerId,
                          topMergeMessageId: mergeMessages[i].topMergeMessageId,
                          mergeMessageId: mergeMessages[i].mergeMessageId
                        })
                        if (localMergeMessages && localMergeMessages.length > 0) {
                          mergeMessages.splice(i, 1)
                        }
                      } else {
                        mergeMessages.splice(i, 1)
                      }
                    } else {
                      mergeMessages.splice(i, 1)
                    }
                  }
                  if (mergeMessages.length > 0) {
                    await chatComponent.insert(ChatDataType.MERGEMESSAGE, mergeMessages, null)
                  }
                }
              }
              let chatAttachsJson = null
              if (json.indexOf('[chatAttachsJson:]') > -1 && json.indexOf('[:chatAttachsJson]') > -1) {
                chatAttachsJson = json.substring(json.indexOf('[chatAttachsJson:]') + 18, json.indexOf('[:chatAttachsJson]'))
                console.log(chatAttachsJson)
                let chatAttachs = JSON.parse(chatAttachsJson)
                if (chatAttachs && chatAttachs.length > 0) {
                  for (let i = chatAttachs.length - 1; i >= 0; i--) {
                    if (chatAttachs[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                      let newFlag = false
                      for (let message of messages) {
                        if (message.messageId === chatAttachs[i].messageId) {
                          newFlag = true
                          break
                        }
                      }
                      if (newFlag) {
                        // 保守的做法，一般messageId为new，不会存在其下的记录
                        let localChatAttachs = await chatBlockComponent.loadLocalAttach(chatAttachs[i].attachBlockId, null, true)
                        if (localChatAttachs && localChatAttachs.length > 0) {
                          chatAttachs.splice(i, 1)
                        }
                      } else {
                        chatAttachs.splice(i, 1)
                      }
                    } else {
                      chatAttachs.splice(i, 1)
                    }
                  }
                  if (chatAttachs.length > 0) {
                    await chatComponent.insert(ChatDataType.ATTACH, chatAttachs, null)
                  }
                }
              }
            }
          }
        }
        if (needInsertMessageChats.length > 0) {
          for (let needInsertMessageChat of needInsertMessageChats) {
            needInsertMessageChat.messages = []
            let _messages = await chatComponent.loadMessage(
              {
                ownerPeerId: myself.myselfPeerClient.peerId,
                subjectId: needInsertMessageChat.subjectId,
              }, [{ _id: 'desc' }], null, 10
            )
            if (_messages && _messages.length > 0) {
              CollaUtil.sortByKey(_messages, 'receiveTime', 'asc')
              needInsertMessageChat.messages = _messages
            } else {
              needInsertMessageChat.noMoreMessageTag = true
            }
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        _that.$q.loading.hide()
      }
    },
    async refreshData() {
      let _that = this
      let store = _that.$store
      let clientPeerId = myself.myselfPeerClient.peerId
      store.state.linkmanTagNames = []
      store.state.linkmanTagNameMap = {}
      store.state.linkmanTagIdMap = {}
      store.state.linkmans = []
      store.state.linkmanMap = {}
      store.state.groupChats = []
      store.state.groupChatMap = {}
      store.state.channels = []
      store.state.channelMap = {}
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
              } else {
                let peerClient = await peerClientService.getCachedPeerClient(groupMemberDBItem.memberPeerId)
                if (!peerClient) {
                  console.error('getCachedPeerClient is empty, memberPeerId:' + groupMemberDBItem.memberPeerId)
                }
              }
            }
            groupDBItem.groupMembers = groupMemberDBItems
          }
          store.state.groupChatMap[groupDBItem.groupId] = groupDBItem
        }
      }
      let channelDBItems = await channelComponent.loadChannel({
        ownerPeerId: clientPeerId,
        updateDate: { $gt: null }
      }, [{ updateDate: 'desc' }])
      if (channelDBItems && channelDBItems.length > 0) {
        for (let channelDBItem of channelDBItems) {
          channelDBItem.newArticleFlag = false
          // 查询local article
          let articleList = []
          let ret = await channelComponent.loadArticle({
            ownerPeerId: myself.myselfPeerClient.peerId,
            channelId: channelDBItem.channelId,
            updateDate: { $gt: null }
          }, [{ updateDate: 'desc' }])
          if (ret && ret.length > 0) {
            articleList = ret
            channelDBItem.newArticleFlag = false
            channelDBItem.newArticleUpdateDate = articleList[0].updateDate
            channelDBItem.newArticleTitle = articleList[0].title
          }
          store.state.channelMap[channelDBItem.channelId] = channelDBItem
        }
        store.state.channels = channelDBItems
      }
    },
    startServer: function (type, filename) {
      let _that = this
      let httpd = (cordova && cordova.plugins && cordova.plugins.CorHttpd) ? cordova.plugins.CorHttpd : null
      if (httpd) {
        httpd.getURL(function (url) {
          if (url.length > 0) {
            console.log('server is up:' + url)
            httpd.stopServer(function () {
              console.log('server is stopped.')
              _that.start(httpd, type, filename)
            }, function (error) {
              console.error('failed to stop server:' + error)
            })
          } else {
            _that.start(httpd, type, filename)
          }
        })
      } else {
        alert('CorHttpd plugin not available/ready.')
      }
    },
    start: async function (httpd, type, filename) {
      let _that = this
      let store = _that.$store
      let dirEntry = await fileComponent.getRootDirEntry('/')
      let dirPath = dirEntry.toInternalURL()
      let fileEntry = await fileComponent.getFileEntry(dirPath + '/')
      let path = fileEntry.toURL()
      let pos = path.indexOf('file://')
      if (pos > -1) {
        path = path.substring(pos + 7)
      }
      console.log('path:' + path)
      httpd.startServer({
        'www_root': path,
        'port': 8090
      }, async function (url) {
        if (url.length > 0) {
          console.log('server is started:' + url)
          httpd.getLocalPath(function (path) {
            console.log('localpath:' + path)
          })
          if (type === 'migrate') {
            await store.showInitMigrateDialog(url, filename)
          } else if (type === 'backup') {
            _that.initBackupUrl = url
            _that.initBackupFilename = filename
            store.changeBackupMigrationSubKind('default')
            store.showInitBackupDialog()
          } else if (type === 'restore') {
            let clientPeerId = myself.myselfPeerClient.peerId
            let newPayload = {}
            newPayload.type = ChatMessageType.RESTORE
            newPayload.srcClientId = myself.myselfPeerClient.clientId
            newPayload.srcPeerId = clientPeerId
            newPayload.url = url
            await chatAction.chat(null, newPayload, clientPeerId)
          }
        } else {
          console.log('server is down')
        }
      }, async function (error) {
        await logService.log(error, 'startServerError', 'error')
      })
    },
    async cloudSyncChannelArticle(channelId) {
      let _that = this
      let store = _that.$store
      let articleList = []
      let ret = await channelComponent.loadArticle({
        ownerPeerId: myself.myselfPeerClient.peerId,
        channelId: channelId,
        updateDate: { $gt: null }
      }, [{ updateDate: 'desc' }])
      if (ret && ret.length > 0) {
        articleList = ret
      }
      // 查询cloud全量ChannelArticle索引信息
      let conditionBean = {}
      conditionBean['parentBusinessNumber'] = channelId
      conditionBean['getAllBlockIndex'] = true
      conditionBean['blockType'] = BlockType.ChannelArticle
      let articleIndexList = []
      if (store.state.networkStatus === 'CONNECTED') {
        let ret = await queryValueAction.queryValue(null, conditionBean)
        if (ret && ret.length > 0) {
          articleIndexList = ret
        }
      }
      console.log('articleIndexList:' + JSON.stringify(articleIndexList))
      for (let articleIndex of articleIndexList) {
        articleIndex.cover = articleIndex.thumbnail
        articleIndex.thumbnail = null
        articleIndex.title = articleIndex.name
        articleIndex.name = null
        articleIndex.abstract = articleIndex.description
        articleIndex.description = null
      }
      let changed = false
      for (let article of articleList) {
        let exists = false
        for (let articleIndex of articleIndexList) {
          if (article.articleId === articleIndex.businessNumber) {
            exists = true
            if (article.blockId !== articleIndex.blockId || articleIndex.createTimestamp > article.updateDate) {
              changed = true
              article.state = EntityState.Modified
              article.cover = articleIndex.cover
              article.title = articleIndex.title
              article.abstract = articleIndex.abstract
              article.blockId = articleIndex.blockId
              article.updateDate = articleIndex.createTimestamp
            }
            break
          }
        }
        if (!exists) {
          changed = true
          article.state = EntityState.Deleted
        }
      }
      for (let articleIndex of articleIndexList) {
        let exists = false
        for (let article of articleList) {
          if (article.articleId === articleIndex.businessNumber) {
            exists = true
            break
          }
        }
        if (!exists) {
          changed = true
          let newArticle = {
            ownerPeerId: myself.myselfPeerClient.peerId,
            channelId: articleIndex.parentBusinessNumber,
            articleId: articleIndex.businessNumber,
            cover: articleIndex.cover,
            //author: articleIndex.author,
            title: articleIndex.title,
            abstract: articleIndex.abstract,
            //content: content,
            plainContent: articleIndex.metadata,
            pyPlainContent: pinyinUtil.getPinyin(articleIndex.metadata),
            metadata: articleIndex.metadata,
            businessNumber: articleIndex.businessNumber,
            blockId: articleIndex.blockId,
            createDate: articleIndex.createTimestamp,
            updateDate: articleIndex.createTimestamp,
            state: EntityState.New
          }
          articleList.push(newArticle)
          let theChannel = store.state.channelMap[newArticle.channelId]
          if (theChannel) {
            theChannel.newArticleFlag = true
            if (newArticle.updateDate && (!theChannel.newArticleUpdateDate || newArticle.updateDate > theChannel.newArticleUpdateDate)) {
              theChannel.newArticleUpdateDate = newArticle.updateDate
              theChannel.newArticleTitle = newArticle.title
            }
          }
        }
      }
      if (changed) {
        await channelComponent.save(ChannelDataType.ARTICLE, articleList, null)
      }
    },
    async acquireChannel(channelId) {
      let _that = this
      let store = _that.$store
      let channel = null
      if (!store.cloudSyncing) {
        store.cloudSyncing = true
        try {
          // 查询cloud全量Channel索引信息
          let conditionBean = {}
          conditionBean['getAllBlockIndex'] = true
          conditionBean['blockType'] = BlockType.Channel
          let channelIndexList = []
          if (store.state.networkStatus === 'CONNECTED') {
            let ret = await queryValueAction.queryValue(null, conditionBean)
            if (ret && ret.length > 0) {
              channelIndexList = ret
            }
          }
          console.log('channelIndexList:' + JSON.stringify(channelIndexList))
          let exists = false
          for (let channelIndex of channelIndexList) {
            if (channelId === channelIndex.businessNumber) {
              exists = true
              channelIndex.avatar = channelIndex.thumbnail
              channelIndex.thumbnail = null
              channel = {
                ownerPeerId: myself.myselfPeerClient.peerId,
                creator: channelIndex.peerId,
                channelType: ChannelType.PUBLIC,
                channelId: channelIndex.businessNumber,
                avatar: channelIndex.avatar,
                name: channelIndex.name,
                description: channelIndex.description,
                entityType: EntityType.INDIVIDUAL,
                businessNumber: channelIndex.businessNumber,
                blockId: channelIndex.blockId,
                createDate: channelIndex.createTimestamp,
                updateDate: channelIndex.createTimestamp,
                state: EntityState.New
              }
              break
            }
          }
          if (exists) {
            await channelComponent.save(ChannelDataType.CHANNEL, channel, null)
            store.state.channels.push(channel)
            store.state.channelMap[channel.channelId] = channel
            // 同步ChannelArticle
            await store.cloudSyncChannelArticle(channel.channelId)
          }
        } catch (e) {
          console.error(e)
        } finally {
          store.cloudSyncing = false
          return channel
        }
      }
    },
    async cloudSyncChannel(timer) {
      let _that = this
      let store = _that.$store
      if (!store.cloudSyncing) {
        if (!timer) {
          _that.$q.loading.show()
        }
        store.cloudSyncing = true
        try {
          // 同步Channel
          let channelList = store.state.channels
          // 查询cloud全量Channel索引信息
          let conditionBean = {}
          conditionBean['getAllBlockIndex'] = true
          conditionBean['blockType'] = BlockType.Channel
          let channelIndexList = []
          if (store.state.networkStatus === 'CONNECTED') {
            let ret = await queryValueAction.queryValue(null, conditionBean)
            if (ret && ret.length > 0) {
              channelIndexList = ret
            }
          }
          console.log('channelIndexList:' + JSON.stringify(channelIndexList))
          for (let channelIndex of channelIndexList) {
            channelIndex.avatar = channelIndex.thumbnail
            channelIndex.thumbnail = null
          }
          let changed = false
          let deleteChannelList = []
          for (let channel of channelList) {
            let exists = false
            for (let channelIndex of channelIndexList) {
              if (channel.channelId === channelIndex.businessNumber) {
                exists = true
                if (channelIndex.createTimestamp > channel.updateDate) {
                  changed = true
                  channel.state = EntityState.Modified
                  channel.avatar = channelIndex.avatar
                  channel.name = channelIndex.name
                  channel.description = channelIndex.description
                  channel.updateDate = channelIndex.createTimestamp
                }
                break
              }
            }
            if (!exists) {
              changed = true
              channel.state = EntityState.Deleted
              deleteChannelList.push(channel)
            }
          }
          for (let channelIndex of channelIndexList) {
            let exists = false
            for (let channel of channelList) {
              if (channel.channelId === channelIndex.businessNumber) {
                exists = true
                break
              }
            }
            if (!exists) {
              changed = true
              let newChannel = {
                ownerPeerId: myself.myselfPeerClient.peerId,
                creator: channelIndex.peerId,
                channelType: ChannelType.PUBLIC,
                channelId: channelIndex.businessNumber,
                avatar: channelIndex.avatar,
                name: channelIndex.name,
                description: channelIndex.description,
                entityType: EntityType.INDIVIDUAL,
                businessNumber: channelIndex.businessNumber,
                blockId: channelIndex.blockId,
                createDate: channelIndex.createTimestamp,
                updateDate: channelIndex.createTimestamp,
                state: EntityState.New
              }
              channelList.push(newChannel)
            }
          }
          if (changed) {
            await channelComponent.save(ChannelDataType.CHANNEL, channelList, null)
            for (let i = channelList.length - 1; i >= 0; i--) {
              let channel = channelList[i]
              let deleted = false
              for (let deleteChannel of deleteChannelList) {
                if (channel.channelId === deleteChannel.channelId) {
                  deleted = true
                  channelList.splice(i, 1)
                  delete store.state.channelMap[channel.channelId]
                }
              }
              if (!deleted) {
                store.state.channelMap[channel.channelId] = channel
              }
            }
          }
          for (let channel of channelList) {
            // 同步ChannelArticle
            await store.cloudSyncChannelArticle(channel.channelId)
          }
        } catch (e) {
          console.error(e)
        } finally {
          store.cloudSyncing = false
          if (!timer) {
            _that.$q.loading.hide()
          }
        }
      }
    },
    async addLinkman(findLinkman, linkmanData) {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      let peerId = findLinkman.peerId
      let message = linkmanData.message
      let givenName = linkmanData.givenName
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
        newLinkman.status = LinkmanStatus.REQUESTED
        newLinkman.activeStatus = ActiveStatus.DOWN
        newLinkman.locked = false
        newLinkman.notAlert = false
        newLinkman.top = false
        newLinkman.recallTimeLimit = true
        newLinkman.recallAlert = true
        newLinkman.myselfRecallTimeLimit = true
        newLinkman.myselfRecallAlert = true
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
        for (let findLinkmanDataTagName of linkmanData.tagNames) {
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
        newLinkman.tagNames = linkmanData.tagNames
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
          requestType: RequestType.ADD_LINKMAN
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
          && linkmanRequest.requestType === RequestType.ADD_LINKMAN) {
          linkmanRequest.status = RequestStatus.EXPIRED
          linkmanRequest.statusDate = currentTime
        }
      }

      // 新增Sent请求
      let linkmanRequest = {}
      linkmanRequest.requestType = RequestType.ADD_LINKMAN
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
      let payload = {}
      payload.srcClientId = myselfPeerClient.clientId
      payload.srcPeerId = myselfPeerClient.peerId
      payload.srcName = myselfPeerClient.name
      if (myselfPeerClient.visibilitySetting && myselfPeerClient.visibilitySetting.substring(1, 2) === 'N') {
        payload.srcMobile = ''
      } else {
        payload.srcMobile = myselfPeerClient.mobile
      }
      payload.srcAvatar = myselfPeerClient.avatar
      payload._id = linkmanRequest._id // 标识重复消息
      payload.message = message
      payload.createDate = currentTime
      if (linkman && linkman.status === LinkmanStatus.BLACKED) {
        payload.blackedMe = true
      }
      let msg = {
        messageType: P2pChatMessageType.ADD_LINKMAN,
        content: payload
      }
      await store.p2pSend(msg, peerId)
      _that.$q.notify({
        message: _that.$i18n.t("Send contacts request successfully"),
        timeout: 3000,
        type: "info",
        color: "info",
      })
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
    let now0 = new Date().getTime()
    console.log('------------------------------------------------------------index start:' + now0)
    window.store = store
    console.log('screen.availWidth:' + screen.availWidth + ',screen.availHeight:' + screen.availHeight + ',window.devicePixelRatio:' + window.devicePixelRatio)
    store.screenHeight = _that.$q.screen.height
    if (window.device) {
      document.addEventListener('deviceready', async function () {
        if (window.device.platform === 'Android') {
          let permissions = cordova.plugins.permissions
          permissionHelper.init(permissions)
          let list = [
            'android.permission.CAMERA',
            'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
            'android.permission.WAKE_LOCK',
            'android.permission.FOREGROUND_SERVICE',
            'android.permission.MODIFY_AUDIO_SETTINGS',
            'android.permission.READ_PHONE_STATE',
            'android.permission.WRITE_EXTERNAL_STORAGE',
            'android.permission.READ_CONTACTS',
            //'android.permission.WRITE_CONTACTS',
            //'android.permission.GET_ACCOUNTS',
            //'android.permission.USE_BIOMETRIC',
            //'android.permission.ACCESS_COARSE_LOCATION',
            'android.permission.RECORD_VIDEO',
            'android.permission.RECORD_AUDIO',
            'android.permission.READ_EXTERNAL_STORAGE',
            'android.permission.ACCESS_NETWORK_STATE',
            'android.permission.MANAGE_DOCUMENTS',
            'android.permission.VIBRATE'
          ]
          await permissionHelper.requestPermissions(list)
          document.addEventListener('backbutton', function (e) {
            navigator.app.clearHistory()
            if (!(_that.$refs[`mainDrawer`] && _that.$refs[`mainDrawer`].value)) {
              navigator.Backbutton.goHome(function () {
                console.log('goHome success')
              }, function () {
                console.log('goHome fail')
              })
            }
          }, false)
        }
      })
      if (AudioToggle) {
        AudioToggle.setAudioMode(AudioToggle.EARPIECE)
      }
      /*cordova.plugins.backgroundMode.enable()
      cordova.plugins.backgroundMode.on('activate', function() {
        cordova.plugins.backgroundMode.disableWebViewOptimizations()
        cordova.plugins.backgroundMode.disableBatteryOptimizations()
      })*/
      document.addEventListener("pause", function () {
        if (cordova.plugins.notification) {
          cordova.plugins.notification.foreground = false
        }
      })
      document.addEventListener("resume", function () {
        if (cordova.plugins.notification) {
          cordova.plugins.notification.foreground = true
        }
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
      /*if (localNotificationComponent && JSON.stringify(localNotificationComponent) !== '{}') {
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
      }*/
    }
    store.collectionWorkerEnabler = false // collection中是否使用service worker
    if (store.ios === true || store.safari === true) {
      store.collectionWorkerEnabler = false
    }
    store.useNativeAndroid = true // 是否使用Android原生拍照、拍摄、相册等功能
    store.uploadFileSizeLimit = 100 // 上传文件大小限制（单位：M）
    store.uploadFileNumLimit = 10 // 同时上传文件数量限制
    store.displayActiveStatus = false // 是否显示在线状态
    store.imageMaxWidth = '50%'
    store.videoMaxWidth = '50%'
    store.audioMaxWidth = '50%'
    let linkmanRequestDBItems = await contactComponent.loadLinkmanRequest({
      ownerPeerId: myself.myselfPeerClient.peerId,
      requestType: RequestType.ADD_LINKMAN,
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
    await _that.refreshData()

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
          _that.channelKind = 'newChannel'
        }
        _that.kind = _that.channelKind
      } else if (tab === 'me') {
        if (!_that.meKind || (_that.kind === 'collection' && store.collectionEntry === 'message')) {
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
    store.channelForwardToChat = _that.channelForwardToChat
    store.articleForwardToChat = _that.articleForwardToChat
    store.imgForwardToChat = _that.imgForwardToChat
    store.saveFileInMessage = _that.saveFileInMessage
    store.saveFileAndSendMessage = _that.saveFileAndSendMessage
    store.findContacts = _that.findContacts
    store.logout = _that.logout
    store.gotoChat = _that.gotoChat
    store.connect = _that.connect
    store.getChatContent = _that.getChatContent
    store.p2pSend = _that.p2pSend
    store.refreshData = _that.refreshData
    store.getArticleList = _that.getArticleList
    store.showInitBackupDialog = _that.showInitBackupDialog
    store.showInitRestoreDialog = _that.showInitRestoreDialog
    store.showInitMigrateDialog = _that.showInitMigrateDialog
    store.restoreChatRecord = _that.restoreChatRecord
    store.startServer = _that.startServer
    store.sendLinkmanInfo = _that.sendLinkmanInfo
    store.cloudSyncChannelArticle = _that.cloudSyncChannelArticle
    store.acquireChannel = _that.acquireChannel
    store.cloudSyncChannel = _that.cloudSyncChannel
    store.addLinkman = _that.addLinkman
    _that.tab = 'chat'
    _that.kind = 'message'
    _that.chatKind = 'message'
    _that.contactsKind = 'receivedList'
    _that.channelKind = 'newChannel'
    _that.meKind = 'accountInformation'
    if (!(_that.ifMobileSize || store.state.ifMobileStyle)) {
      _that.drawer = true
    }

    store.defaultCountryCode = '86'
    if (myself.myselfPeerClient.mobile) {
      let myMobileCountryCode = MobileNumberUtil.parse(myself.myselfPeerClient.mobile).getCountryCode()
      console.log('myMobileCountryCode:' + myMobileCountryCode)
      if (myMobileCountryCode) {
        store.defaultCountryCode = myMobileCountryCode
      }
    }
    store.state.countryCode = store.defaultCountryCode

    chatAction.registReceiver('chat', _that.chatReceiver)
    p2pChatAction.registReceiver('p2pChat', _that.p2pChatReceiver)
    consensusAction.registReceiver('consensus', _that.consensusReceiver)
    connectAction.registReceiver('connect', _that.connectReceiver)
    webrtcPeerPool.peerId = myself.myselfPeerClient.peerId
    webrtcPeerPool.peerPublicKey = myself.myselfPeerClient.peerPublicKey
    webrtcPeerPool.registEvent('connect', _that.webrtcConnect)
    webrtcPeerPool.registEvent('close', _that.webrtcClose)
    webrtcPeerPool.registEvent('stream', async function (evt) {
      await _that.receiveRemoteStream(evt.stream, evt.source.targetPeerId)
      let signalSession = await _that.getSignalSession(evt.source.targetPeerId)
      if (signalSession) {
        await signalSession.close()
      }
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
    let now1 = new Date().getTime()
    console.log('------------------------------------------------------------index created:' + (now1 - now0))
    await _that.preSetupSocket()
    let now2 = new Date().getTime()
    console.log('------------------------------------------------------------index setupSocket:' + (now2 - now1))
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
            if (_that.kind === 'message') {
              statusBarComponent.style(false, '#2d2d2d')
            } else {
              statusBarComponent.style(false, '#1d1d1d')
            }
          } else {
            if (_that.kind === 'message') {
              statusBarComponent.style(true, '#eeeeee') // grey-3
            } else {
              statusBarComponent.style(true, '#ffffff')
            }
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
