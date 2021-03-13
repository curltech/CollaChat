import { Platform } from 'quasar'

import { myself } from 'libcolla'
import { webrtcPeerPool } from 'libcolla'
import { CollaUtil } from 'libcolla'

import { systemAudioComponent, mediaStreamComponent } from '@/libs/base/colla-media'
import { localNotificationComponent } from '@/libs/base/colla-cordova'
import { ActiveStatus } from '@/libs/biz/colla-contact'
import { ChatContentType, P2pChatMessageType, SubjectType } from '@/libs/biz/colla-chat'

export default {
  name: 'VideoChat',
  data() {
    return {
      Platform: Platform,
      mediaTimer: null,
      chatMute:false,
      chatMic:true,
      addStreamCount: 0,
      localCloneStream: {},
      SubjectType: SubjectType,
      ActiveStatus: ActiveStatus,
      fullSize: false,
      ChatContentType: ChatContentType,
      P2pChatMessageType: P2pChatMessageType
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
        if(_that.$refs[`memberVideo${memberPeerId}`]){
          let width = _that.$refs[`memberVideo${memberPeerId}`].clientWidth*1.33
          return width + 'px'
        }
      }
    },
    dialogSizeClass(){
      let _that = this
      let store = _that.$store
      return Platform.is.ios?'ios-linkman-video': _that.ifMobileSize || store.state.ifMobileStyle ?'linkman-video':'linkman-video pc-video-card'
    },
    activeStatus() {
      let _that = this
      let store = _that.$store
      return function (currentChat) {
        if (!currentChat) {
          return false;
        } else if (currentChat.subjectType === SubjectType.CHAT) {
          return store.state.linkmanMap[currentChat.subjectId] && store.state.linkmanMap[currentChat.subjectId].activeStatus === ActiveStatus.UP;
        } else if (currentChat.subjectType === SubjectType.GROUP_CHAT) {
          return store.state.groupChatMap[currentChat.subjectId] && store.state.groupChatMap[currentChat.subjectId].activeStatus === ActiveStatus.UP;
        }
      }
    },
    // groupVideoSize(){
    //   let _that = this
    //   let store = _that.$store
    //   return function (peerId) {
    //     let videoDom =  _that.$refs[`memberVideo${peerId}`]
    //    return videoDom.clientWidth
    //   }
    // },
    Avatar() {
      let _that = this
      let store = _that.$store
      return function (subjectId) {
        if (store.state.linkmanMap[subjectId]) {
          return store.state.linkmanMap[store.state.currentCallChat.subjectId].avatar ? store.state.linkmanMap[store.state.currentCallChat.subjectId].avatar : store.defaultActiveAvatar;
        } else if(store.state.currentPhoneContact){
          return store.state.currentPhoneContact.avatar ? store.state.currentPhoneContact.avatar : store.defaultActiveAvatar;
        }
      }
    },
    getName() {
      let _that = this
      let store = _that.$store
      return function (peerId) {
        let state = store.state
        let peer = state.linkmanMap[peerId]
        let name = peer && peer.givenName  ? peer.givenName  : peer.name
        return name
      }
    },
    fullSizeShow(){
      let _that = this
      let store = _that.$store
      return  !_that.ifMobileSize && store.state.currentCallChat.stream && store.state.currentCallChat.stream.length > 1
    },
    ifConnected(){
      let _that = this
      let store = _that.$store
      let currentChat = store.state.currentCallChat
      if(currentChat){
        if(currentChat.subjectType === SubjectType.CHAT){
          if(store.state.currentCallChat.stream){
            return true
          }else{
            return false
          }
        } else if(currentChat.subjectType === SubjectType.GROUP_CHAT){
          if(store.state.currentCallChat.stream && store.state.currentCallChat.stream.length > 1){
            return true
          }else{
            return false
          }
        }
      }else{
        return false;
      }
    }
  },
  methods: {
    changeChatMute(){
      let _that = this
      let store = _that.$store
      if(_that.chatMute){
        _that.chatMute = false
      }else{
        _that.chatMute = true
      }
      let mediaChat = store.state.currentCallChat
      if(mediaChat.mediaProperty.type === 'audio'){
        if(mediaChat.audio){
          for(let ind in mediaChat.stream){
            let streamObj  = mediaChat.stream[ind]
            if(streamObj.peerId !== myself.myselfPeerClient.peerId){
              let audioItem = mediaChat.audio[streamObj.peerId]
              audioItem.muted = _that.chatMute
            }
          }
        }
      }
    },
    changeChatMic(){
      let _that = this
      let store = _that.$store
      let callChat = store.state.currentCallChat
      let stream = callChat.streamMap[callChat.ownerPeerId]
      if(_that.chatMic){
        _that.chatMic = false
      }else{
        _that.chatMic = true
      }
      if(stream.getAudioTracks() && stream.getAudioTracks()[0]){
        let track = stream.getAudioTracks()[0]
        track.enabled = _that.chatMic;
      }

    },
    startMediaTimer() {
      let _that = this
      _that.mediaTimer =  CollaUtil.timerInterval(_that.$refs.mediaTimer)
    },
    saveStream(peerId,stream){
      let streamArray = store.state.currentCallChat.stream ? store.state.currentCallChat.stream : store.state.currentCallChat.stream = []
      let streamMap = store.state.currentCallChat.streamMap ? store.state.currentCallChat.streamMap : store.state.currentCallChat.streamMap = {}
      streamArray.push({
        peerId : peerId,
        stream : stream
      })
      streamMap[peerId] = stream
    },
     async removeStream(peerId){
      let _that = this
      let callChat = store.state.currentCallChat
      let streams = store.state.currentCallChat.stream
      if(!streams)return
      for (let i = streams.length-1;i>=0;i--) {
        let streamItem = streams[i]
        let _peerId = streamItem.peerId
        if(!peerId || _peerId === peerId){
          streams.splice(i, 1);
          let webrtcPeers = await webrtcPeerPool.get(_peerId)
          if (webrtcPeers && webrtcPeers.length > 0) {
            for (let webrtcPeer of webrtcPeers) {
              webrtcPeer.removeStream()
            }
          }
          if(_peerId === myself.myselfPeerClient.peerId){
            callChat.streamMap[_peerId].getTracks().forEach((track) => {
              track.stop();
            });
          }
          if(callChat.subjectType === SubjectType.GROUP_CHAT){
            if(callChat.callMessage.hasAddStream && callChat.callMessage.hasAddStream[_peerId]){
              callChat.callMessage.hasAddStream[_peerId] = null
            }
            if(_that.localCloneStream[_peerId]){
              _that.localCloneStream[_peerId].getTracks().forEach((track) => {
                track.stop();
              });
            }
          }
          callChat.streamMap[_peerId] = null
          _that.$forceUpdate()
        }
      }
      
      if(streams.length === 0){
        store.state.currentCallChat.stream = null
      }
    },
    async initiateCallRequest(type,entry) {
      let _that = this
      let store = _that.$store
      let subjectId;
      if(entry === 'phoneContacts'){
        let peerContact = store.state.currentPhoneContact
        subjectId = peerContact.peerId
        store.state.currentCallChat = {
          ownerPeerId : myself.myselfPeerClient.peerId,
          subjectId : subjectId,
          subjectType : SubjectType.CHAT,
          entry : 'phoneContacts'
        }
      }else{
        subjectId = store.state.currentChat.subjectId
        store.state.currentCallChat = store.state.currentChat
      }
      store.state.currentCallChat.callType = type
      let options = {}
      if (type == "video") {
        let ideal;
        if(store.state.ifMobileStyle){
          ideal = 1.33
        }else{
          ideal = 0.7486
        }
        options = { video: {
            aspectRatio: { ideal: ideal },
            facingMode: "user"
          }, audio: true }
      } else {
        options = { video: false, audio: true }
      }
      store.state.currentCallChat.options = options
      if (store.state.currentCallChat.subjectType === SubjectType.CHAT) {
        await _that.sendCallMessage()
        store.state.videoDialog = true
        let localStream = await mediaStreamComponent.openUserMedia(options)
        _that.saveStream(store.state.currentCallChat.ownerPeerId,localStream)
        _that.$nextTick(async () => {
          if (type === 'video') {
            let currentVideoDom = _that.$refs.currentVideo
            currentVideoDom.srcObject = localStream
          } else { }
          systemAudioComponent.mediaInvitationAudioPlay()
        })
      }
      //initiateGroupCallRequest
      else if (store.state.currentCallChat.subjectType === SubjectType.GROUP_CHAT) {
        let linkmans = store.state.linkmans // 实际选择的不是GroupChatMember，而是对应的linkman
        if (linkmans && linkmans.length > 0) {
          for (let linkman of linkmans) {
            linkman.selected = false
            linkman.existing = false
          }
        }
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
      store.state.videoDialog = true
      _that.$nextTick(async () => {
        let localStream = await mediaStreamComponent.openUserMedia(store.state.currentCallChat.options)
        _that.saveStream(ownerPeerId, localStream)
        store.state.currentCallChat.callMessage.content = []
        _that.$set(store.state.currentCallChat.callMessage.content,0,ownerPeerId)
        let _i = 1
        for (let selectedGroupChatMember of selectedGroupChatMembers) {
          _that.$set(store.state.currentCallChat.callMessage.content,_i,selectedGroupChatMember.peerId)
          _i++
        }
        _that.$forceUpdate()
        _that.$nextTick(() => {
          if (localStream.getVideoTracks().length > 0) {//video
            let currentVideoDom = _that.$refs[`memberVideo${ownerPeerId}`][0]
            currentVideoDom.srcObject = localStream
          } else {//audio
            if (!store.state.currentCallChat.audio) {
              store.state.currentCallChat.audio = {}
            }
            let audioItem = new Audio()
            audioItem.muted = true
            audioItem.srcObject = localStream
            audioItem.play();
            store.state.currentCallChat.audio[ownerPeerId] = audioItem
          }
        })
        await _that.sendCallMessage()
      })
    },
    async sendCallMessage(){
      let message = {
        content: store.state.currentChat.subjectType === SubjectType.CHAT ? store.state.currentChat.subjectId : store.state.currentCallChat.callMessage.content,
        messageType: P2pChatMessageType.CALL_REQUEST
      }
      if (store.state.currentCallChat.callType  === 'video') {
        message.contentType = ChatContentType.VIDEO_INVITATION
      } else {
        message.contentType = ChatContentType.AUDIO_INVITATION
      }
      await store.sendChatMessage(store.state.currentChat, message)
      store.state.currentCallChat.callMessage = message
    },
    async receiveCallRequest(message) {
      let _that = this
      let store = _that.$store
      let subjectId = message.senderPeerId
      if (message.subjectType === SubjectType.CHAT) {
        if (store.state.linkmanMap[subjectId].activeStatus !== ActiveStatus.UP) {
          return;
        }
        if (store.state.currentCallChat && store.state.currentCallChat.subjectId && store.state.videoDialog) {
          await _that.sendCallCloseMessage(subjectId,ChatContentType.MEDIA_BUSY,'')
          return;
        }
        let name;
        if(store.state.linkmanMap[subjectId]){
          let chat = await store.getChat(subjectId)
          store.state.currentCallChat = chat
          store.state.currentChat = chat
          name = store.getChatName(chat.subjectType, chat.subjectId)
        }else{
          store.state.currentCallChat = {
            ownerPeerId : myself.myselfPeerClient.peerId,
            subjectId : subjectId,
            subjectType : SubjectType.CHAT
            //name : srcName
          }
          //name = srcName
          //todo
        }
        localNotificationComponent.sendNotification(name, "CALL", {subjectId:subjectId,type:'call'}
        )
        if (message.contentType === ChatContentType.VIDEO_INVITATION) {
          store.state.currentCallChat.callType = "video"
        }else{
          store.state.currentCallChat.callType = "audio"
          }
        store.state.currentCallChat.callMessage = message
        systemAudioComponent.mediaInvitationAudioPlay()
        store.state.videoDialog = true
      }
      else {
        if(message.contentType === ChatContentType.CALL_JOIN_REQUEST){
          _that.receiveJoinGroupCallRequest(message)
        }else{
          store.insertReceivedMessage(message)
        }
      }
    },
    acceptSingleCall() {//linkman
      let _that = this
      let store = _that.$store
      systemAudioComponent.mediaInvitationAudioStop()
      let options = {}
      let peerId = store.state.currentCallChat.subjectId
      let callMessage = store.state.currentCallChat.callMessage
      if (callMessage.contentType === ChatContentType.VIDEO_INVITATION) {
        store.state.currentCallChat.callType = "video"
        let ideal;
        // if(store.state.ifMobileStyle){
        //   ideal = 1.77
        // }else{
        //   ideal = 0.5625
        // }
        if(store.state.ifMobileStyle){
          ideal = 1.33
        }else{
          ideal = 0.7486
        }
        // if(_that.$q.platform.is.ios){
        //   options = { video: true, audio: true }
        // }else{
        options = { video: {
            aspectRatio: { ideal: ideal },
            facingMode: "user"
          }, audio: true }
        //}
      } else {
        store.state.currentCallChat.callType = "audio"
        options = { video: false, audio: true }
      }
      _that.$nextTick(async () => {
        let localStream = await mediaStreamComponent.openUserMedia(options);
        _that.saveStream(store.state.currentCallChat.ownerPeerId,localStream)
        if (callMessage.contentType === ChatContentType.VIDEO_INVITATION) {
          let currentVideoDom = _that.$refs.currentVideo
          currentVideoDom.srcObject = localStream
        } else { }
        _that.addStreamCount++
        let webrtcPeers = await webrtcPeerPool.get(peerId)
        if (webrtcPeers && webrtcPeers.length > 0) {
          let ps = []
          for (let webrtcPeer of webrtcPeers) {
            webrtcPeer.addStream(localStream)
          }
        }
      })
    },
    async acceptGroupCall(message) {
      let _that = this
      let store = _that.$store
      let subjectId = store.state.currentChat.subjectId
      let messages = store.state.currentChat.messages
      let latestInvitationMessage ;
      for(let i = messages.length-1; i > -1; i--){
        let message_n = messages[i]
        if(message_n.contentType === ChatContentType.AUDIO_INVITATION || message_n.contentType === ChatContentType.VIDEO_INVITATION) //if latest
        {
          latestInvitationMessage = message_n
          break;
        }
      }
      if(latestInvitationMessage.messageId !== message.messageId){
        _that.$q.notify({
          message: _that.$i18n.t('Chat already ended'),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        return;
      }
      store.state.currentCallChat = store.state.currentChat
      store.state.currentCallChat.callMessage = message
      let options = {}
      if (message.contentType === ChatContentType.AUDIO_INVITATION) {
        store.state.currentCallChat.callType = "audio"
        options = { video: false, audio: true }
      } else {
        store.state.currentCallChat.callType = "video"
        let ideal ;
        if(store.state.ifMobileStyle){
          ideal = 1.33
        }else{
          ideal = 0.7486
        }
        options = { video: {
            aspectRatio: { ideal: ideal },
            facingMode: "user"
          }, audio: true }
      }

      store.state.videoDialog = true
      _that.$nextTick(async () => {
        let localStream = await mediaStreamComponent.openUserMedia(options)
        _that.saveStream(store.state.currentCallChat.ownerPeerId, localStream)
        _that.$forceUpdate()
        _that.$nextTick(() => {
          if (localStream.getVideoTracks().length > 0) {//video
            let currentVideoDom = _that.$refs[`memberVideo${store.state.currentCallChat.ownerPeerId}`][0]
            currentVideoDom.srcObject = localStream
          } else {//audio
            if (!store.state.currentCallChat.audio) {
              store.state.currentCallChat.audio = {}
            }
            let audioItem = new Audio()
            audioItem.muted = true
            audioItem.srcObject = localStream
            audioItem.play();
            store.state.currentCallChat.audio[store.state.currentCallChat.ownerPeerId] = audioItem

          }
        })
        let _message = {
          content: message.content,
          messageType: P2pChatMessageType.CALL_REQUEST,
          contentType : ChatContentType.CALL_JOIN_REQUEST
        }
        await store.sendChatMessage(store.state.currentChat, _message)
      })
    },
    async receiveJoinGroupCallRequest(message){
        let _that = this
        let store = _that.$store
        let callChat = store.state.currentCallChat
        let senderPeerId = message.senderPeerId
        if(callChat && callChat.subjectId === message.subjectId){
          let webrtcPeers = await webrtcPeerPool.get(senderPeerId)
          if (webrtcPeers && webrtcPeers.length > 0) {
            for (let webrtcPeer of webrtcPeers) {
              let _cloneStream = callChat.streamMap[callChat.ownerPeerId].clone()
              _that.localCloneStream[senderPeerId] = _cloneStream
              webrtcPeer.addStream(_cloneStream)
            }
          }
          if(callChat.callMessage.hasAddStream){
            callChat.callMessage.hasAddStream[senderPeerId] = senderPeerId
          }else{
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
      if (!callChat){
        return;
      }
      if (callChat.subjectType === SubjectType.GROUP_CHAT) {
        if (callChat.streamMap && callChat.streamMap[peerId]) return
        if(!(callChat.callMessage.hasAddStream && callChat.callMessage.hasAddStream[peerId])){//发起方--这里需要addStream给对方
          let webrtcPeers = await webrtcPeerPool.get(peerId)
          if (webrtcPeers && webrtcPeers.length > 0) {
            for (let webrtcPeer of webrtcPeers) {
                let _cloneStream = callChat.streamMap[callChat.ownerPeerId].clone()
                _that.localCloneStream[peerId] = _cloneStream
                webrtcPeer.addStream(_cloneStream)
            }
          }
        }
        _that.saveStream(peerId, stream)
        _that.$nextTick(() => {
            setTimeout(function () {
              if (stream.getVideoTracks().length > 0 && _that.$refs[`memberVideo${peerId}`]) {//video
                let currentVideoDom = _that.$refs[`memberVideo${peerId}`][0]
                currentVideoDom.srcObject = stream
              } else {//audio
                if (!store.state.currentCallChat.audio) {
                  store.state.currentCallChat.audio = {}
                }
                let audioItem = new Audio()
                audioItem.srcObject = stream;
                audioItem.play();
                store.state.currentCallChat.audio[peerId] = audioItem
              }
              if (!_that.mediaTimer) {
                _that.startMediaTimer()
              }
              _that.addStreamCount++;
            }, 200)
          }
        )
      } else {
        if(store.state.currentCallChat.callMessage.senderPeerId === myself.myselfPeerClient.peerId){//发起方--这里需要addStream给对方
          let webrtcPeers = await webrtcPeerPool.get(peerId)
          if (webrtcPeers && webrtcPeers.length > 0) {
            let ps = []
            for (let webrtcPeer of webrtcPeers) {
              webrtcPeer.addStream(store.state.currentCallChat.streamMap[store.state.currentCallChat.ownerPeerId])
            }
          }
        }
        systemAudioComponent.mediaInvitationAudioStop()
        for(let track of stream.getTracks()) {
          track.onended = function(event) {
            _that.closeCall()
          }
        }
        _that.saveStream(peerId,stream)
        _that.$nextTick(() => {
          setTimeout(function () {
            if (store.state.currentCallChat.callMessage.contentType === ChatContentType.VIDEO_INVITATION) {
              let zoomVideoDom = _that.$refs.zoomVideo;
              if(zoomVideoDom){
                zoomVideoDom.srcObject = stream;
              }
            } else {
              store.state.currentCallChat.audio = new Audio()
              store.state.currentCallChat.audio.srcObject = stream;
              store.state.currentCallChat.audio.play();
            }

            if (!_that.mediaTimer) {
              _that.startMediaTimer()
            }
            _that.addStreamCount++;
          }, 200)
        })
      }
      _that.addStreamCount++;
    },
    //发起方接收到stream,仅单聊
    originatorReceiveStream(){},
    //应答方接收到stream,仅单聊
    answererReceiveStream(){

    },
    async closeCall(isReceived) {
      let _that = this
      let store = _that.$store
      let callChat = store.state.currentCallChat
      if(!callChat)return
      systemAudioComponent.mediaInvitationAudioStop()
      systemAudioComponent.mediaCloseAudioPlay()

      if (isReceived !== true && _that.activeStatus(callChat)) {
        let members = []
        if (callChat.subjectType === SubjectType.GROUP_CHAT) {
          for (let memberPeerId of callChat.callMessage.content) {
            if (memberPeerId !== callChat.ownerPeerId && callChat.streamMap[memberPeerId]) {
              members.push(memberPeerId)
            }
          }
        }
        if (callChat.subjectType === SubjectType.CHAT || (callChat.subjectType === SubjectType.GROUP_CHAT && members.length > 0)) {
          await _that.sendCallCloseMessage( callChat.subjectId ,
            (callChat.streamMap && callChat.streamMap[callChat.ownerPeerId]) ? ChatContentType.MEDIA_CLOSE : ChatContentType.MEDIA_REJECT ,
            callChat.subjectType === SubjectType.GROUP_CHAT ? members : '')
        }
      }
      if(callChat.subjectType === SubjectType.CHAT) {
        let message = {}
        message.messageType = P2pChatMessageType.CHAT_LINKMAN
        if (callChat.callMessage.contentType === ChatContentType.VIDEO_INVITATION) {
          message.contentType = ChatContentType.VIDEO_HISTORY
        } else {
          message.contentType = ChatContentType.AUDIO_HISTORY
        }
        if(_that.$refs.mediaTimer && _that.$refs.mediaTimer.innerHTML){
          message.content = _that.$refs.mediaTimer.innerHTML
        }else{
          message.content = _that.$i18n.t('Unconnected')
        }
        message.actualReceiveTime = new Date().getTime()
        await store.addCHATSYSMessage(callChat, message)
      }
      await _that.removeStream()
      //close miniButton which is in index.vue
      store.state.miniVideoDialog = false
      clearInterval(_that.mediaTimer);
      _that.mediaTimer = null
      _that.mediaMemberList = []
      store.state.currentCallChat.audio = null
      store.state.currentCallChat = null
      _that.$nextTick(() => {
        store.state.videoDialog = false;
        _that.chatMute = false
        _that.chatMic = true
      })
    },
    changeMiniVideoDialog() {
      let _that = this
      let store = _that.$store
      document.getElementById('videoDialog').style.display = 'none'
      store.state.miniVideoDialog = true
    },
    async sendCallCloseMessage(peerId,type,content){
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
      if (callChat.subjectType === SubjectType.CHAT) {
        message.subjectId = message.senderPeerId
      }
      if (!callChat || !store.state.videoDialog || message.subjectId !== callChat.subjectId) return;
      if (callChat.subjectType === SubjectType.GROUP_CHAT) {
        await _that.removeStream(senderPeerId)
      } else if(callChat.subjectType === SubjectType.CHAT) {
        let text;
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
      if (callChat.streamMap[callChat.ownerPeerId].getVideoTracks().length > 0) {
        options = { audio: true, video: false }
      } else {
        options = { audio: true, video: true }
      }
      let localStream = await mediaStreamComponent.openUserMedia(options)
      _that.saveStream(callChat.ownerPeerId,localStream)
      let videoTrack = null
      if (localStream.getVideoTracks().length > 0) {
        videoTrack = localStream.getVideoTracks()[0];
      }
      for (let streamObj of callChat.stream) {
        if (streamObj.peerId === callChat.ownerPeerId) {
          continue;
        }
        if (localStream.getVideoTracks().length > 0) {
          webrtcPeerPool.addTrack(videoTrack, localStream)
        }
        else {
          let sender = pc.getSenders().find(function (s) {
            return s.track.kind == 'video';
          });
          if (sender) {
            webrtcPeerPool.removeTrack(sender);
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
      
      if(zoomVideoDom.srcObject === callChat.streamMap[callChat.ownerPeerId]){
          zoomVideoDom.srcObject = callChat.streamMap[callChat.subjectId]
          currentVideoDom.srcObject = callChat.streamMap[callChat.ownerPeerId]
      }else{
        zoomVideoDom.srcObject = callChat.streamMap[callChat.ownerPeerId]
        currentVideoDom.srcObject = callChat.streamMap[callChat.subjectId]
      }
    },
    canCall() {
      let _that = this
      let store = _that.$store
      return store.state.currentCallChat && !store.state.currentCallChat.stream  && store.state.currentCallChat.callMessage &&(store.state.currentCallChat.callMessage.senderPeerId !== store.state.currentCallChat.ownerPeerId)
    }
  },
  mounted() {
    let _that = this
    let store = this.$store
    store.receiveCallClose = _that.receiveCallClose
    store.receiveRemoteStream = _that.receiveRemoteStream
    store.receiveCallRequest = _that.receiveCallRequest
    store.receiveGroupCallRequest = _that.receiveGroupCallRequest
    store.selectedGroupCallMember = _that.selectedGroupCallMember
    store.initiateCallRequest = _that.initiateCallRequest
    store.acceptGroupCall = _that.acceptGroupCall
    store.sendCallCloseMessage  = _that.sendCallCloseMessage
    store.closeCall = _that.closeCall
  },
  created() {
    let _that = this
    let store = _that.$store
  }
}
