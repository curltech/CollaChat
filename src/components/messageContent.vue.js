import { date } from 'quasar'

import { webrtcPeerPool } from 'libcolla'

import {  ChatDataType, chatComponent, ChatContentType, P2pChatMessageType, SubjectType } from '@/libs/biz/colla-chat'
import { ActiveStatus } from '@/libs/biz/colla-contact'

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
      let senderPeer = state.linkmanMap[message.senderPeerId]
      let avatar1 = state.myselfPeerClient.avatar ? state.myselfPeerClient.avatar : this.$store.defaultActiveAvatar
      let avatar2 = (senderPeer && senderPeer.avatar) ? senderPeer.avatar : this.$store.defaultActiveAvatar
      let avatar = message.senderPeerId === state.myselfPeerClient.peerId ? avatar1 : avatar2
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
      let senderPeer = state.linkmanMap[message.senderPeerId]
      let name
      if(senderPeer){
        let gName = senderPeer ? senderPeer.givenName : null
        name = senderPeer ? senderPeer.name : null
        let name1 = gName ? gName : name
        let name2 = message.senderPeerId === state.myselfPeerClient.peerId ? state.myselfPeerClient.name : name1
        name = (message.subjectType === SubjectType.CHAT && this.entry === 'message') ? '' : name2
      }else{
        name = this.$i18n.t("NonContacts")
      }

      return name
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
