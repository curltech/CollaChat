import { date } from 'quasar'

import { webrtcPeerPool, peerClientService } from 'libcolla'

import {  ChatDataType, chatComponent, ChatMessageStatus, ChatContentType, P2pChatMessageType, SubjectType } from '@/libs/biz/colla-chat'
import { ActiveStatus } from '@/libs/biz/colla-contact'
import { channelComponent } from '@/libs/biz/colla-channel'
import NotePreview from '@/components/notePreview'
import MobileAudio from '@/components/mobileAudio'

export default {
  name: 'MessageContent',
  components: {
    notePreview: NotePreview,
    mobileAudio: MobileAudio,
  },
  props: ['message', 'entry',"showContacts"],
  data() {
    return {
      SubjectType: SubjectType,
      ActiveStatus: ActiveStatus,
      P2pChatMessageType: P2pChatMessageType,
      ChatMessageStatus:ChatMessageStatus,
      ChatContentType: ChatContentType,
      date: date,
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
  },
  methods: {
    isSent(message) {
      return (message.senderPeerId == this.$store.state.myselfPeerClient.peerId && this.entry === 'message') ? true : false
    },
    getAvatar(message) {
      let state = this.$store.state
      let avatar = this.$store.defaultActiveAvatar
      if (message.senderPeerId === state.myselfPeerClient.peerId) {
        if (state.myselfPeerClient.avatar) {
          avatar = state.myselfPeerClient.avatar
        }
      } else {
        let senderPeer = state.linkmanMap[message.senderPeerId]
        if (senderPeer) {
          if (senderPeer.avatar) {
            avatar = senderPeer.avatar
          }
        } else {
          let peerClient = peerClientService.getPeerClientFromCache(message.senderPeerId)
          if (peerClient && peerClient.avatar) {
            avatar = peerClient.avatar
          }
        }
      }
      return avatar
    },
    getStamp(message) {
      let state = this.$store.state
      let createTime = message.createTime
      if (createTime) {
        createTime = new Date(createTime)
        let currentDate = new Date()
        let dateString = createTime.toDateString()
        let currentDateString = currentDate.toDateString()
        if (dateString === currentDateString) {
          return date.formatDate(createTime, 'HH:mm')
        } else {
          return date.formatDate(createTime, 'YYYY-MM-DD')
        }
      } else {
        return ''
      }
    },
    getName(message) {
      let state = this.$store.state
      let name = ''
      if (message.subjectType !== SubjectType.CHAT || this.entry !== 'message') {
        if (message.senderPeerId === state.myselfPeerClient.peerId) {
          name = state.myselfPeerClient.name
        } else {
          let senderPeer = state.linkmanMap[message.senderPeerId]
          if (senderPeer) {
            name = senderPeer.givenName ? senderPeer.givenName : senderPeer.name
          } else {
            //name = this.$i18n.t("NonContacts")
            if (message.subjectType === SubjectType.GROUP_CHAT) {
              let group = state.groupChatMap[message.subjectId]
              let groupChatMembers = group.groupMembers
              if (groupChatMembers && groupChatMembers.length > 0) {
                for (let groupChatMember of groupChatMembers) {
                  if (groupChatMember.peerId === message.senderPeerId) {
                    if (groupChatMember.memberAlias) {
                      name = groupChatMember.memberAlias
                    }
                    break
                  }
                }
              }
              if (!name) {
                let peerClient = peerClientService.getPeerClientFromCache(message.senderPeerId)
                if (peerClient && peerClient.name) {
                  name = peerClient.name
                }
              }
            }
          }
        }
      }

      return name
    },
    isShowRecalld(message){
      let _that = this
      let store = _that.$store
      let recallSetting
      if(message.subjectType === SubjectType.CHAT){
        let linkman = store.state.linkmanMap[message.subjectId]
        if(message.senderPeerId == this.$store.state.myselfPeerClient.peerId){
            recallSetting = linkman.myselfRecallAlert
        }else{
            recallSetting = linkman.recallAlert
        }
      }else if(message.subjectType === SubjectType.GROUP_CHAT){
        let group = store.state.groupChatMap[message.subjectId]
        recallSetting = group.recallAlert
      }
      let result = message.status === ChatMessageStatus.RECALL && recallSetting
      return result
    },
    isResend(message) {
      let state = this.$store.state
      let createDate = message.createDate
      let now = new Date().getTime()
      let gapTime = ((now - createDate) / 1000).toFixed(0)
      let result = state.currentChat.subjectType === SubjectType.CHAT
        // && state.linkmanMap[state.currentChat.subjectId]
        // && state.linkmanMap[state.currentChat.subjectId].activeStatus !== ActiveStatus.UP
        && message.senderPeerId === state.myselfPeerClient.peerId && !message.actualReceiveTime
        //&& gapTime > 5
      return result
    },
    async attemptConnect(message) {
      let _that = this
      let store = _that.$store
      let peerId = store.state.currentChat.subjectId
      if(store.state.linkmanMap[store.state.currentChat.subjectId].activeStatus !== ActiveStatus.UP){
        webrtcPeerPool.create(peerId)
      }else{
        await store.sendUnsentMessage(peerId)
      }

    },
    async openCard(message) {
      let _that = this
      let store = _that.$store
      store.findContactsEntry = 'card'
      store.state.findLinkmanData = {
        peerId: null,
        message: null,
        givenName: null,
        tag: null
      }
      store.state.findLinkmanResult = 0
      store.state.findLinkmanTip = ''
      store.findLinkman = null
      await store.findContacts('card', message.content.peerId)
    },
    async openChannel(message) {
      let _that = this
      let store = _that.$store
      let channelDBItems = await channelComponent.loadChannel({
        ownerPeerId: store.state.myselfPeerClient.peerId,
        channelId:message.content.channelId
      })
      if (channelDBItems && channelDBItems.length > 0) {
        let channel = message.content
        store.changeTab('channel')
        let prevCurrentChannel = store.state.currentChannel
        channel.newArticleFlag = false
        store.state.currentChannel = channel
        store.changeKind('channelDetails')
        store.toggleDrawer(true)
        if (!(_that.ifMobileSize || store.state.ifMobileStyle) && prevCurrentChannel/* && prevCurrentChannel.channelId !== channel.channelId*/) {
          if (store.changeChannelDetailsSubKind) {
            store.changeChannelDetailsSubKind('default')
          }
        }
        await store.getArticleList()
      }else{
        _that.$q.notify({
          message: _that.$i18n.t("Channel unsynchronized or deleted"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
      }
    },
    async openArticle(message) {
      let _that = this
      let store = _that.$store
      let articleDBItems = await channelComponent.loadArticle({
        ownerPeerId: store.state.myselfPeerClient.peerId,
        articleId:message.content.articleId
      })
      if (articleDBItems && articleDBItems.length > 0) {
        let article = articleDBItems[0]
        if (!article.content) {
            let blocks = await dataBlockService.findTxPayload(null, article.blockId)
            if (blocks && blocks.length > 0) {
              article = blocks[0]
            }
        }
        store.state.currentArticle = article
        store.changeKind('channelDetails')
        _that.$nextTick(() => {
          store.channelDetailsEntry = "message"
          store.changeChannelDetailsSubKind('view') 
        })
      }else{
        _that.$q.notify({
          message: _that.$i18n.t("Article unsynchronized or deleted"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
      }
    },
    async openMergeMessage(message) {
      let _that = this
      let store = _that.$store
      if (!(message.mergeMessages && message.mergeMessages.length > 0)) {
        let messages = await chatComponent.loadMergeMessage(
          {
            mergeMessageId: message.messageId
          }, null, null)
        message.mergeMessages = messages
      }
      store.state.currentMergeMessage = message
      store.state.mergeMessageDialog = true
    },
    async openNoteMessage(message) {
      let _that = this
      let store = _that.$store
      store.state.noteMessageSrc = await store.getMessageFile(message)
      store.state.noteMessageDialog = true
    },
    avatarClick(mouseEvent,message){
      if(this.entry === 'message' && mouseEvent.path[0].getAttribute("class") && mouseEvent.path[0].getAttribute("class").indexOf('q-message-avatar') > -1){
        this.showContacts(message.senderPeerId)
      }
    },
    async openDestroyMessage(message){
          let _that = this
          let store = _that.$store
          message.opened = true
          message.countDown = message.destroyTime / 1000
          let countDownInterval = setInterval(async function () {
              if (!message.countDown) {
                  clearInterval(countDownInterval)
                  let currentChatMessages = store.state.chatMap[message.senderPeerId].messages
                  for (let i = currentChatMessages.length - 1; i >= 0; i--) {
                      if (message == currentChatMessages[i]) {
                          await chatComponent.remove(ChatDataType.MESSAGE, message, store.state.currentChat.messages)
                      }
                  }
                  return
              }
              message.countDown--
          }, 1000)
      }
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  created() {
    let _that = this
    let store = _that.$store
  }
}
