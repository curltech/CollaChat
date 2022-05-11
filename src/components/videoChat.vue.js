import { Platform } from 'quasar'
import Vue from 'vue'
import { myself } from 'libcolla'
import { webrtcPeerPool, UUID } from 'libcolla'
import { CollaUtil, peerClientService } from 'libcolla'

import { systemAudioComponent, mediaStreamComponent } from '@/libs/base/colla-media'
import { statusBarComponent/*, localNotificationComponent*/ } from '@/libs/base/colla-cordova'
import { ActiveStatus } from '@/libs/biz/colla-contact'
import { ChatContentType, P2pChatMessageType, SubjectType } from '@/libs/biz/colla-chat'

export default {
  name: 'VideoChat',
  data() {
    return {
      Platform: Platform,
      mediaTimer: null,
      chatMute: false,
      chatMic: true,
      audioToggle: 'earpiece',
      addStreamCount: 0,
      localCloneStream: {},
      SubjectType: SubjectType,
      ActiveStatus: ActiveStatus,
      fullSize: false,
      ChatContentType: ChatContentType,
      P2pChatMessageType: P2pChatMessageType,
      groupFocusNum: 0
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    videoHeight() {
      let _that = this
      let store = _that.$store
      return function (memberPeerId) {
        if (_that.$refs[`memberVideo${memberPeerId}`]) {
          let width = _that.$refs[`memberVideo${memberPeerId}`].clientWidth * 1.33
          return width + 'px'
        }
      }
    },
    activeStatus() {
      let _that = this
      let store = _that.$store
      return function (currentChat) {
        if (!currentChat) {
          return false
        } else if (currentChat.subjectType === SubjectType.CHAT) {
          return store.state.linkmanMap[currentChat.subjectId] && store.state.linkmanMap[currentChat.subjectId].activeStatus === ActiveStatus.UP
        } else if (currentChat.subjectType === SubjectType.GROUP_CHAT) {
          return store.state.groupChatMap[currentChat.subjectId] && store.state.groupChatMap[currentChat.subjectId].activeStatus === ActiveStatus.UP
        }
      }
    },
    Avatar() {
      let _that = this
      let store = _that.$store
      return function (subjectId) {
        if (store.state.linkmanMap[subjectId]) {
          return store.state.linkmanMap[subjectId].avatar ? store.state.linkmanMap[subjectId].avatar : store.defaultActiveAvatar
        } else {
          let peerClient = peerClientService.getPeerClientFromCache(subjectId)
          if (peerClient && peerClient.avatar) {
            return peerClient.avatar
          } else {
            return store.defaultActiveAvatar
          }
        }
      }
    },
    getName() {
      let _that = this
      let store = _that.$store
      return function (peerId) {
        let state = store.state
        let name
        if (peerId === state.myselfPeerClient.peerId) {
          name = state.myselfPeerClient.name
        } else {
          let group = state.groupChatMap[store.state.currentCallChat.subjectId]
          let groupChatMembers = group.groupMembers
          if (groupChatMembers && groupChatMembers.length > 0) {
            for (let groupChatMember of groupChatMembers) {
              if (groupChatMember.memberPeerId === peerId) {
                if (groupChatMember.memberAlias) {
                  name = groupChatMember.memberAlias
                }
                break
              }
            }
          }
          if (!name) {
            let linkman = state.linkmanMap[peerId]
            if (linkman) {
              name = linkman.givenName ? linkman.givenName : linkman.name
            } else {
              let peerClient = peerClientService.getPeerClientFromCache(peerId)
              if (peerClient && peerClient.name) {
                name = peerClient.name
              }
            }
          }
        }
        return name
      }
    },
    fullSizeShow() {
      let _that = this
      let store = _that.$store
      return !_that.ifMobileSize && store.state.currentCallChat.stream && store.state.currentCallChat.stream.length > 1
    },
  },
  methods: {
    changeDropdownChatMute(type) {
      let _that = this
      let store = _that.$store
      if (type === 'mute' && !_that.chatMute) {
        _that.changeChatMute()
      } else if (type !== 'mute') {
        if (_that.chatMute) {
          _that.changeChatMute()
        }
        if (window.device && (window.device.platform === 'Android' || window.device.platform === 'iOS') && AudioToggle) {
          if (type === "earpiece") {
            _that.audioToggle = "earpiece"
            AudioToggle.setAudioMode(AudioToggle.EARPIECE)
          } else {
            setTimeout(() => {
              _that.audioToggle = "speaker"
              AudioToggle.setAudioMode(AudioToggle.SPEAKER)
            }, 1000);
          }
        }
      }
      _that.$forceUpdate()
    },
    changeAudioToggle() {
      let _that = this
      let store = _that.$store
      if (AudioToggle) {
        if (_that.audioToggle === "speaker") {
          _that.audioToggle = "earpiece"
          AudioToggle.setAudioMode(AudioToggle.EARPIECE)
        } else {
          _that.audioToggle = "speaker"
          AudioToggle.setAudioMode(AudioToggle.SPEAKER)
        }
      }
    },
    changeChatMute() {
      let _that = this
      let store = _that.$store
      _that.chatMute = !_that.chatMute
      let callChat = store.state.currentCallChat
      for (let streamObj of callChat.stream) {
        let _stream = streamObj.stream
        if (_stream && streamObj.peerId !== callChat.ownerPeerId && _stream.getAudioTracks().length > 0) {
          let audioTrack = _stream.getAudioTracks()[0]
          _that.chatMute ? audioTrack.enabled = false : audioTrack.enabled = true
        }
      }
    },
    async changeChatMic() {
      let _that = this
      let store = _that.$store
      let callChat = store.state.currentCallChat
      _that.chatMic = !_that.chatMic
      for (let streamObj of callChat.stream) {
        let _peerId = streamObj.peerId
        if (_peerId !== callChat.ownerPeerId) {
          let webrtcPeers = await webrtcPeerPool.get(_peerId)
          if (webrtcPeers && webrtcPeers.length > 0) {
            for (let webrtcPeer of webrtcPeers) {
              if (webrtcPeer.localStreams.length > 0) {
                let _stream = webrtcPeer.localStreams[0]
                let audioTrack = _stream.getAudioTracks()[0]
                _that.chatMic ? audioTrack.enabled = true : audioTrack.enabled = false
              }
            }
          }
        }
      }
    },
    startMediaTimer() {
      let _that = this
      _that.mediaTimer = CollaUtil.timerInterval(_that.$refs.mediaTimer)
    },
    saveStream(peerId, stream) {
      let streamArray = store.state.currentCallChat.stream ? store.state.currentCallChat.stream : store.state.currentCallChat.stream = []
      let streamMap = store.state.currentCallChat.streamMap ? store.state.currentCallChat.streamMap : store.state.currentCallChat.streamMap = {}
      streamArray.push({
        peerId: peerId,
        stream: stream,
      })
      streamMap[peerId] = { stream: stream, pending: false, focus: false }
    },
    async removeStream(peerId) {
      let _that = this
      let callChat = store.state.currentCallChat
      if (!callChat) return
      let streams = store.state.currentCallChat.stream
      if (!streams) return
      for (let i = streams.length - 1; i >= 0; i--) {
        let streamItem = streams[i]
        let _peerId = streamItem.peerId
        if (!peerId || _peerId === peerId) {
          streams.splice(i, 1)
          let webrtcPeers = await webrtcPeerPool.get(_peerId)
          if (webrtcPeers && webrtcPeers.length > 0) {
            for (let webrtcPeer of webrtcPeers) {
              webrtcPeer.removeStream()
              webrtcPeer.destroy({})
            }
          }
          if (_peerId === myself.myselfPeerClient.peerId && callChat.streamMap[_peerId] && callChat.streamMap[_peerId].stream) {
            callChat.streamMap[_peerId].stream.getTracks().forEach((track) => {
              track.stop()
            })
          }
          if (callChat.callMessage.hasAddStream && callChat.callMessage.hasAddStream[_peerId]) {
            callChat.callMessage.hasAddStream[_peerId] = null
          }
          if (_that.localCloneStream[_peerId]) {
            _that.localCloneStream[_peerId].getTracks().forEach((track) => {
              track.stop()
            })
          }
          callChat.streamMap[_peerId] = null
          _that.$forceUpdate()
        }
      }

      if (streams.length === 0) {
        store.state.currentCallChat.stream = null
      }
    },
    async initiateCallRequest(type, entry) {
      let _that = this
      let store = _that.$store
      let subjectId
      if (entry === 'phoneContacts') {
        let peerContact = store.state.currentPhoneContact
        subjectId = peerContact.peerId
        store.state.currentCallChat = {
          ownerPeerId: myself.myselfPeerClient.peerId,
          subjectId: subjectId,
          subjectType: SubjectType.CHAT,
          entry: 'phoneContacts'
        }
      } else {
        if (!store.preCheck()) {
          return
        }
        subjectId = store.state.currentChat.subjectId
        store.state.currentCallChat = store.state.currentChat
      }
      store.state.currentCallChat.callType = type
      let options = {}
      if (type === "video") {
        let ideal
        if (store.state.ifMobileStyle) {
          ideal = 1.33
        } else {
          ideal = 0.5625
        }
        options = {
          video: {
            aspectRatio: { ideal: ideal },
            facingMode: "user"
          }, audio: true
        }
      } else {
        options = { video: false, audio: true }
      }
      store.state.currentCallChat.options = options
      if (store.state.currentCallChat.subjectType === SubjectType.CHAT) {
        await _that.sendCallMessage()
        _that.showVideoDialog(true)
        systemAudioComponent.mediaInvitationAudioPlay()
      }
      // initiateGroupCallRequest
      else if (store.state.currentCallChat.subjectType === SubjectType.GROUP_CHAT) {
        store.groupMediaSelect()
      }
    },
    selectedGroupCallMember(selectedGroupChatMembers) {
      let _that = this
      let store = _that.$store
      let ownerPeerId = store.state.currentCallChat.ownerPeerId
      store.state.currentCallChat = store.state.currentChat
      store.state.currentCallChat.callMessage = {}
      store.state.currentCallChat.callMessage.senderPeerId = ownerPeerId
      _that.showVideoDialog(true)
      _that.$nextTick(async () => {
        systemAudioComponent.mediaInvitationAudioPlay()
        setTimeout(function(){
          systemAudioComponent.mediaInvitationAudioStop()
        },5000)
        let localStream = await mediaStreamComponent.openUserMedia(store.state.currentCallChat.options)
        _that.saveStream(ownerPeerId, localStream)
        store.state.currentCallChat.callMessage.content = []
        _that.$set(store.state.currentCallChat.callMessage.content, 0, ownerPeerId)
        let _i = 1
        for (let selectedGroupChatMember of selectedGroupChatMembers) {
          _that.$set(store.state.currentCallChat.callMessage.content, _i, selectedGroupChatMember.peerId)
          _i++
        }
        _that.$forceUpdate()
        _that.$nextTick(() => {
          if (localStream.getVideoTracks().length > 0) { // video
            if (Platform.is.ios) {
              setTimeout(() => {
                let currentVideoDom = _that.$refs.zoomVideo
                currentVideoDom.srcObject = localStream
                currentVideoDom.muted = true
                _that.iosGroupVideoFocus(0)
              }, 500)
            } else {
              if (_that.$refs[`memberVideo${ownerPeerId}`]) {
                let currentVideoDom = _that.$refs[`memberVideo${ownerPeerId}`].length ? _that.$refs[`memberVideo${ownerPeerId}`][0] : _that.$refs[`memberVideo${ownerPeerId}`]
                currentVideoDom.srcObject = localStream
              }
            }
          } else { // audio
            if (!store.state.currentCallChat.audio) {
              store.state.currentCallChat.audio = {}
            }
            let audioItem = new Audio()
            audioItem.muted = true
            audioItem.srcObject = localStream
            audioItem.play()
            store.state.currentCallChat.audio[ownerPeerId] = audioItem
          }
        })
        await _that.sendCallMessage()
      })
    },
    async sendCallMessage() {
      let message = {
        content: store.state.currentCallChat.subjectType === SubjectType.CHAT ? store.state.currentCallChat.subjectId : store.state.currentCallChat.callMessage.content,
        messageType: P2pChatMessageType.CALL_REQUEST,
        meetingId: UUID.string(null, null)
      }
      if (store.state.currentCallChat.callType === 'video') {
        message.contentType = ChatContentType.VIDEO_INVITATION
      } else {
        message.contentType = ChatContentType.AUDIO_INVITATION
      }
      await store.sendChatMessage(store.state.currentCallChat, message)
      store.state.currentCallChat.callMessage = message
    },
    async receiveCallRequest(message) {
      let _that = this
      let store = _that.$store
      let subjectId = message.senderPeerId
      if (message.subjectType === SubjectType.CHAT) {
        let currentTime = new Date().getTime()
        //大于20秒的请求忽略掉
        if (((currentTime - message.createDate) / 1000 > 20)) {
          return
        }
        if (store.state.currentCallChat && store.state.currentCallChat.subjectId && store.state.videoDialog) {
          await _that.sendCallCloseMessage(subjectId, ChatContentType.MEDIA_BUSY, '')
          return
        }
        let name
        if (store.state.linkmanMap[subjectId]) {
          let chat = await store.getChat(subjectId)
          store.state.currentCallChat = chat
          store.state.currentChat = chat
          name = store.getChatName(chat.subjectType, chat.subjectId)
        } else {
          store.state.currentCallChat = {
            ownerPeerId: myself.myselfPeerClient.peerId,
            subjectId: subjectId,
            subjectType: SubjectType.CHAT
            //name : srcName
          }
          //name = srcName
          //todo
        }
        //localNotificationComponent.sendNotification(name, "CALL", {subjectId:subjectId,type:'call'})
        if (message.contentType === ChatContentType.VIDEO_INVITATION) {
          store.state.currentCallChat.callType = "video"
        } else {
          store.state.currentCallChat.callType = "audio"
        }
        store.state.currentCallChat.callMessage = message
        systemAudioComponent.mediaInvitationAudioPlay()
        _that.showVideoDialog(true)
      }else { 
        if(message.contentType !== ChatContentType.CALL_JOIN_REQUEST){
          systemAudioComponent.mediaInvitationAudioPlay()
          setTimeout(function(){
            systemAudioComponent.mediaInvitationAudioStop()
          },5000)
        }
        
      }
      if (message.contentType === ChatContentType.CALL_JOIN_REQUEST) {
        _that.receiveJoinGroupCallRequest(message)
      } else {
        store.insertReceivedMessage(message)
      }
      
    },
    acceptSingleCall() { // linkman
      let _that = this
      let store = _that.$store
      systemAudioComponent.mediaInvitationAudioStop()
      let options = {}
      let peerId = store.state.currentCallChat.subjectId
      let callMessage = store.state.currentCallChat.callMessage
      if (callMessage.contentType === ChatContentType.VIDEO_INVITATION) {
        store.state.currentCallChat.callType = "video"
        let ideal
        // if (store.state.ifMobileStyle) {
        //   ideal = 1.77
        // } else {
        //   ideal = 0.5625
        // }
        if (store.state.ifMobileStyle) {
          ideal = 1.33
        } else {
          ideal = 0.5625
        }
        // if (_that.$q.platform.is.ios) {
        //   options = { video: true, audio: true }
        // } else {
        options = {
          video: {
            aspectRatio: { ideal: ideal },
            facingMode: "user"
          }, audio: true
        }
        // }
      } else {
        store.state.currentCallChat.callType = "audio"
        options = { video: false, audio: true }
      }
      _that.$nextTick(async () => {
        let localStream = await mediaStreamComponent.openUserMedia(options)
        _that.saveStream(store.state.currentCallChat.ownerPeerId, localStream)
        if (callMessage.contentType === ChatContentType.VIDEO_INVITATION) {
          let currentVideoDom = _that.$refs.currentVideo
          currentVideoDom.srcObject = localStream
          //_that.changeDropdownChatMute('speaker')
        }
        _that.addStreamCount++
        // let webrtcPeers = webrtcPeerPool.getConnected(peerId)
        // if (webrtcPeers && webrtcPeers.length > 0) {
        //   for (let webrtcPeer of webrtcPeers) {
        //     _that.localCloneStream[peerId] = localStream.clone()
        //     webrtcPeer.addStream(_that.localCloneStream[peerId])
        //   }
        // }else{
        let option = {}
        _that.localCloneStream[peerId] = localStream.clone()
        option.stream = _that.localCloneStream[peerId]
        await webrtcPeerPool.create(peerId, option)
        //}
      })
    },
    async acceptGroupCall(message) {
      let _that = this
      let store = _that.$store
      //let messages = store.state.currentChat.messages
      // let latestInvitationMessage
      // for (let i = messages.length - 1; i > -1; i--) {
      //   let message_n = messages[i]
      //   if (message_n.contentType === ChatContentType.AUDIO_INVITATION || message_n.contentType === ChatContentType.VIDEO_INVITATION) //if latest
      //   {
      //     latestInvitationMessage = message_n
      //     break
      //   }
      // }
      // if (latestInvitationMessage.messageId !== message.messageId) {
      //   _that.$q.notify({
      //     message: _that.$i18n.t('Chat already ended'),
      //     timeout: 3000,
      //     type: "warning",
      //     color: "warning",
      //   })
      //   return
      // }
      store.state.currentCallChat = store.state.currentChat
      store.state.currentCallChat.callMessage = message
      let options = {}
      if (message.contentType === ChatContentType.AUDIO_INVITATION) {
        store.state.currentCallChat.callType = "audio"
        options = { video: false, audio: true }
      } else {
        store.state.currentCallChat.callType = "video"
        let ideal
        if (store.state.ifMobileStyle) {
          ideal = 1.33
        } else {
          ideal = 0.5625
        }
        options = {
          video: {
            aspectRatio: { ideal: ideal },
            facingMode: "user"
          }, audio: true
        }
      }
      _that.showVideoDialog(true)
      _that.$nextTick(async () => {
        let localStream = await mediaStreamComponent.openUserMedia(options)
        _that.saveStream(store.state.currentCallChat.ownerPeerId, localStream)
        _that.$forceUpdate()
        _that.$nextTick(() => {
          if (localStream.getVideoTracks().length > 0) { // video
            if (Platform.is.ios) {
              setTimeout(() => {
                let currentVideoDom = _that.$refs.zoomVideo
                currentVideoDom.srcObject = localStream
                currentVideoDom.muted = true
              }, 500)
            } else {
              let memberVideoDom = _that.$refs[`memberVideo${store.state.currentCallChat.ownerPeerId}`]
              if (memberVideoDom) {
                let currentVideoDom = memberVideoDom.length ? memberVideoDom[0] : memberVideoDom
                currentVideoDom.srcObject = localStream
                currentVideoDom.muted = true
              }

            }
            //_that.changeDropdownChatMute('speaker')
          } else { // audio
            if (!store.state.currentCallChat.audio) {
              store.state.currentCallChat.audio = {}
            }
            let audioItem = new Audio()
            audioItem.muted = true
            audioItem.srcObject = localStream
            audioItem.play()
            store.state.currentCallChat.audio[store.state.currentCallChat.ownerPeerId] = audioItem

          }
        })
        let _message = {
          content: message.content,
          messageType: P2pChatMessageType.CALL_REQUEST,
          contentType: ChatContentType.CALL_JOIN_REQUEST,
          meetingId: message.meetingId
        }
        await store.sendChatMessage(store.state.currentChat, _message)
        if (Platform.is.ios) {
          _that.iosGroupVideoFocus(0)
        }
      })
    },
    async receiveJoinGroupCallRequest(message) {
      let _that = this
      let store = _that.$store
      let callChat = store.state.currentCallChat
      let senderPeerId = message.senderPeerId
      if (callChat && callChat.subjectId === message.subjectId && callChat.callMessage.meetingId === message.meetingId) {
        let option = {}
        _that.localCloneStream[senderPeerId] = callChat.streamMap[callChat.ownerPeerId].stream.clone()
        option.stream = _that.localCloneStream[senderPeerId]
        await webrtcPeerPool.create(senderPeerId, option)
        if (callChat.callMessage.hasAddStream) {
          callChat.callMessage.hasAddStream[senderPeerId] = senderPeerId
        } else {
          callChat.callMessage.hasAddStream = {}
          callChat.callMessage.hasAddStream[senderPeerId] = senderPeerId
        }
      }
    },
    async receiveRemoteStream(stream, peerId) {
      console.log('stream coming ' + peerId)
      let _that = this
      let store = _that.$store
      let callChat = store.state.currentCallChat
      if (!callChat) {
        return
      }
      systemAudioComponent.mediaInvitationAudioStop()
      if (callChat.subjectType === SubjectType.GROUP_CHAT) {
        if (!(callChat.callMessage.hasAddStream && callChat.callMessage.hasAddStream[peerId]) || (callChat.streamMap && callChat.streamMap[peerId] && callChat.streamMap[peerId].pending)) { // 发起方--这里需要addStream给对方
          if(callChat.streamMap && callChat.streamMap[peerId] && callChat.streamMap[peerId].pending){
            callChat.streamMap[peerId].pending = false
          }
          let webrtcPeers = await webrtcPeerPool.get(peerId)
          if (webrtcPeers && webrtcPeers.length > 0) {
            for (let webrtcPeer of webrtcPeers) {
              let _cloneStream = callChat.streamMap[callChat.ownerPeerId].stream.clone()
              _that.localCloneStream[peerId] = _cloneStream
              console.log('addStream --------')
              webrtcPeer.addStream(_cloneStream)
            }
          }
        }
        _that.saveStream(peerId, stream)
        _that.$nextTick(() => {
          setTimeout(function () {
            if (stream.getVideoTracks().length > 0 && _that.$refs[`memberVideo${peerId}`]) { // video
              setTimeout(function () {
                let dom = _that.$refs[`memberVideo${peerId}`]
                let currentVideoDom = dom.length ? dom[0] : dom
                currentVideoDom.srcObject = stream
              }, 500)
            } else { // audio
              if (!store.state.currentCallChat.audio) {
                store.state.currentCallChat.audio = {}
              }
              let audioItem = new Audio()
              audioItem.srcObject = stream
              audioItem.play()
              store.state.currentCallChat.audio[peerId] = audioItem
            }
            if (!_that.mediaTimer) {
              _that.startMediaTimer()
            }
            _that.addStreamCount++
          }, 200)
        }
        )
      } else {
        if (store.state.currentCallChat.callMessage.senderPeerId === myself.myselfPeerClient.peerId || (callChat.streamMap && callChat.streamMap[peerId] && callChat.streamMap[peerId].pending)) { // 发起方--这里需要addStream给对方
          let localStream = await mediaStreamComponent.openUserMedia(store.state.currentCallChat.options)
          _that.saveStream(store.state.currentCallChat.ownerPeerId, localStream)
          _that.$nextTick(async () => {
            if (store.state.currentCallChat.callType === 'video') {
              let currentVideoDom = _that.$refs.currentVideo
              currentVideoDom.srcObject = localStream
              //_that.changeDropdownChatMute('speaker')
            } else { }
          })
          let webrtcPeers = await webrtcPeerPool.get(peerId)
          if (webrtcPeers && webrtcPeers.length > 0) {
            for (let webrtcPeer of webrtcPeers) {
              _that.localCloneStream[peerId] = localStream.clone()
              webrtcPeer.addStream(_that.localCloneStream[peerId])
            }
          }
        }
        store.state.currentCallChat.streamMap[store.state.currentCallChat.ownerPeerId].stream.getAudioTracks()[0].enabled = false
        systemAudioComponent.mediaInvitationAudioStop()
        for (let track of stream.getTracks()) {
          track.onended = function (event) {
            //_that.pendingCall(peerId)
          }
        }
        _that.saveStream(peerId, stream)
        _that.$nextTick(() => {
          setTimeout(function () {
            if (store.state.currentCallChat.callMessage.contentType === ChatContentType.VIDEO_INVITATION) {
              let zoomVideoDom = _that.$refs.zoomVideo
              if (zoomVideoDom) {
                zoomVideoDom.srcObject = stream
              }
            } else {
              store.state.currentCallChat.audio = new Audio()
              store.state.currentCallChat.audio.srcObject = stream
              store.state.currentCallChat.audio.play()
            }

            if (!_that.mediaTimer) {
              _that.startMediaTimer()
            }
            _that.addStreamCount++
          }, 200)
        })
      }
      _that.addStreamCount++
      if (store.state.currentCallChat.callType === 'video' && store.state.currentCallChat.stream.length === 2 && window.HeadsetDetection) {//视频默认外放
        window.HeadsetDetection.detect(function (detected) {
           if(!detected){
             _that.changeDropdownChatMute('speaker')
           }
          })
      }
    },
    async pendingCall(peerId) {
      let _that = this
      let store = _that.$store
      let currentCallChat = store.state.currentCallChat
      if (!currentCallChat || !currentCallChat.streamMap || !currentCallChat.streamMap[peerId] || currentCallChat.streamMap[peerId].pending) return
      currentCallChat.streamMap[peerId].pending = true
      _that.$forceUpdate()
      let pendingCallTimeOut = setTimeout(async function () {
        if (currentCallChat.streamMap[peerId].pending) {
          if (currentCallChat.subjectType === SubjectType.CHAT) {
            _that.$q.notify({
              message: _that.$i18n.t('Chat already ended'),
              timeout: 3000,
              type: "warning",
              color: "warning",
            })
            await _that.closeCall(true)
          } else if (currentCallChat.subjectType === SubjectType.GROUP_CHAT) {
            await _that.removeStream(peerId)
          }
        }
      }, 20000)

    },
    async closeCall(isReceived) {
      let _that = this
      let store = _that.$store
      try {
        let callChat = store.state.currentCallChat
        if (!callChat) return
        systemAudioComponent.mediaInvitationAudioStop()
        systemAudioComponent.mediaCloseAudioPlay()
        //if (callChat.subjectType === SubjectType.CHAT) {
          let message = {}
          message.messageType = P2pChatMessageType.CHAT_LINKMAN
          if (callChat.callMessage.contentType === ChatContentType.VIDEO_INVITATION) {
            message.contentType = ChatContentType.VIDEO_HISTORY
          } else {
            message.contentType = ChatContentType.AUDIO_HISTORY
          }
          if (_that.$refs.mediaTimer && _that.$refs.mediaTimer.innerHTML) {
            message.content = _that.$refs.mediaTimer.innerHTML
          } else {
            message.content = _that.$i18n.t('Unconnected')
          }
          message.actualReceiveTime = new Date().getTime()
          await store.addCHATSYSMessage(callChat, message)
        //}
        if (isReceived !== true) {
          let members = []
          if (callChat.subjectType === SubjectType.GROUP_CHAT) {
            for (let memberPeerId of callChat.callMessage.content) {
              if (memberPeerId !== callChat.ownerPeerId && callChat.streamMap[memberPeerId]) {
                members.push(memberPeerId)
              }
            }
          }
          if (callChat.subjectType === SubjectType.CHAT || (callChat.subjectType === SubjectType.GROUP_CHAT && members.length > 0)) {
            await _that.sendCallCloseMessage(callChat.subjectId,
              (callChat.streamMap && callChat.streamMap[callChat.ownerPeerId]) ? ChatContentType.MEDIA_CLOSE : ChatContentType.MEDIA_REJECT,
              callChat.subjectType === SubjectType.GROUP_CHAT ? members : '')
          }
          await _that.removeStream()
        }
        //close miniButton which is in index.vue
        store.state.miniVideoDialog = false
        clearInterval(_that.mediaTimer)
        _that.mediaTimer = null
        _that.mediaMemberList = []
        _that.groupFocusNum = 0
        store.state.currentCallChat.audio = null
        store.state.currentCallChat = null
        _that.$nextTick(() => {
          _that.showVideoDialog(false)
          _that.chatMute = false
          _that.chatMic = true
          _that.audioToggle = 'earpiece'
        })
      } catch (e) { await _that.removeStream() }
    },
    changeMiniVideoDialog() {
      let _that = this
      let store = _that.$store
      document.getElementById('videoDialog').style.display = 'none'
      store.state.miniVideoDialog = true
    },
    async sendCallCloseMessage(peerId, type, content) {
      let _that = this
      let store = _that.$store
      let currentCallChat = store.state.currentCallChat
      let message = {
        content: content,
        contentType: type,
        messageType: P2pChatMessageType.CALL_CLOSE
      }
      await store.sendChatMessage(currentCallChat, message)
    },
    async receiveCallClose(message) {
      let _that = this
      let store = _that.$store
      let callChat = store.state.currentCallChat
      let senderPeerId = message.senderPeerId
      if (callChat && callChat.subjectType === SubjectType.CHAT) {
        message.subjectId = message.senderPeerId
      }
      if (!callChat || !store.state.videoDialog || message.subjectId !== callChat.subjectId) {
        return
      }
      if (callChat.subjectType === SubjectType.GROUP_CHAT) {
        await _that.removeStream(senderPeerId)
      } else if (callChat.subjectType === SubjectType.CHAT) {
        await _that.removeStream()
        let text
        if (message.contentType === ChatContentType.MEDIA_CLOSE) {
          text = _that.$i18n.t('Chat already ended')
        } else if (message.contentType === ChatContentType.MEDIA_REJECT) {
          text = _that.$i18n.t('Chat reject')
        } else if (message.contentType === ChatContentType.MEDIA_BUSY) {
          text = _that.$i18n.t('Chat busy')
        }
        _that.$q.notify({
          message: text,
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        _that.closeCall(true)
      }
    },
    async changeMediaType() {
      let _that = this
      let store = _that.$store
      let callChat = store.state.currentCallChat
      let options
      if (callChat.streamMap[callChat.ownerPeerId].stream.getVideoTracks().length > 0) {
        options = { audio: true, video: false }
      } else {
        options = { audio: true, video: true }
      }
      let localStream = await mediaStreamComponent.openUserMedia(options)
      _that.saveStream(callChat.ownerPeerId, localStream)
      let videoTrack = null
      if (localStream.getVideoTracks().length > 0) {
        videoTrack = localStream.getVideoTracks()[0]
      }
      for (let streamObj of callChat.stream) {
        if (streamObj.peerId === callChat.ownerPeerId) {
          continue
        }
        if (localStream.getVideoTracks().length > 0) {
          webrtcPeerPool.addTrack(videoTrack, localStream)
        }
        else {
          let sender = pc.getSenders().find(function (s) {
            return s.track.kind === 'video'
          })
          if (sender) {
            webrtcPeerPool.removeTrack(sender)
          }
        }
      }
    },
    zoomVideoChange() {
      let _that = this
      let store = _that.$store
      let callChat = store.state.currentCallChat
      let currentVideoDom = _that.$refs.currentVideo
      let zoomVideoDom = _that.$refs.zoomVideo
      if (currentVideoDom.srcObject === callChat.streamMap[callChat.ownerPeerId].stream) {
        if (zoomVideoDom) {
          zoomVideoDom.srcObject = callChat.streamMap[callChat.ownerPeerId].stream
        }
        currentVideoDom.srcObject = callChat.streamMap[callChat.subjectId].stream
      } else {
        if (zoomVideoDom) {
          zoomVideoDom.srcObject = callChat.streamMap[callChat.subjectId].stream
        }
        currentVideoDom.srcObject = callChat.streamMap[callChat.ownerPeerId].stream
      }
      _that.$forceUpdate()
    },
    iosGroupVideoFocus(index) {
      let _that = this
      let store = _that.$store
      let callChat = store.state.currentCallChat
      let content = callChat.callMessage.content
      _that.groupFocusNum = index
      _that.$forceUpdate
      let memberPeerId = content[index]
      _that.$nextTick(() => {
        let memberVideoDom = _that.$refs[`memberVideo${memberPeerId}`]
        if (memberVideoDom) { // video
          setTimeout(() => {
            let currentVideoDom = memberVideoDom.length ? memberVideoDom[0] : memberVideoDom
            currentVideoDom.srcObject = callChat.streamMap[memberPeerId].stream
            if (memberPeerId === callChat.ownerPeerId) {
              currentVideoDom.muted = true
            }
          }, 500)
        }
      })
    },
    groupVideoOnplay(event) {
      let _that = this
      let videos = document.getElementsByClassName('groupVideo')
      _that.$nextTick(() => {
        for (var i = 0; i < videos.length; i++) {
          let video = videos[i]
          let targetWidth = video.clientWidth
          if (video.srcObject && video.srcObject.getVideoTracks()[0].getSettings().aspectRatio > 2) {
            video.parentElement.style.height = `${video.parentElement.clientWidth}px`
            video.parentElement.style.position = `relative`
            video.style.position = `absolute`
            video.style.left = '50%'
            video.style.marginLeft = `-${targetWidth / 2}px`
          } else {
            video.parentElement.style.height = `${targetWidth}px`
          }
        }
      })
    },
    canCall() {
      let _that = this
      let store = _that.$store
      return store.state.currentCallChat && !store.state.currentCallChat.stream && store.state.currentCallChat.callMessage && (store.state.currentCallChat.callMessage.senderPeerId !== store.state.currentCallChat.ownerPeerId)
    },
    showVideoDialog(ifShow) {
      let _that = this
      let store = _that.$store
      if (ifShow) {
        store.state.videoDialog = true
        if (store.ifMobile()) {
          statusBarComponent.hide()
        }
      } else {
        store.state.videoDialog = false
        if (store.ifMobile()) {
          statusBarComponent.show(false)
        }
      }
    }
  },
  mounted() {
    let _that = this
    Vue.prototype.receiveCallClose = _that.receiveCallClose
    Vue.prototype.receiveRemoteStream = _that.receiveRemoteStream
    Vue.prototype.receiveCallRequest = _that.receiveCallRequest
    Vue.prototype.selectedGroupCallMember = _that.selectedGroupCallMember
    Vue.prototype.initiateCallRequest = _that.initiateCallRequest
    Vue.prototype.acceptGroupCall = _that.acceptGroupCall
    Vue.prototype.sendCallCloseMessage = _that.sendCallCloseMessage
    Vue.prototype.pendingCall = _that.pendingCall
  },
  created() {
  }
}
