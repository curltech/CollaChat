import { date } from 'quasar'

import { peerClientService } from 'libcolla'

import { ChatDataType, chatComponent, ChatMessageStatus, ChatContentType, P2pChatMessageType, SubjectType } from '@/libs/biz/colla-chat'
import { ActiveStatus, LinkmanStatus } from '@/libs/biz/colla-contact'
import { channelComponent } from '@/libs/biz/colla-channel'
import { inAppBrowserComponent } from '@/libs/base/colla-cordova'
import NotePreview from '@/components/notePreview'
import MobileAudio from '@/components/mobileAudio'

export default {
  name: 'MessageContent',
  components: {
    notePreview: NotePreview,
    mobileAudio: MobileAudio,
  },
  props: ['message', 'entry', "showContacts"],
  data() {
    return {
      SubjectType: SubjectType,
      ActiveStatus: ActiveStatus,
      P2pChatMessageType: P2pChatMessageType,
      ChatMessageStatus: ChatMessageStatus,
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
          if (message.subjectType === SubjectType.GROUP_CHAT) {
            let group = state.groupChatMap[message.subjectId]
            let groupChatMembers = group.groupMembers
            if (groupChatMembers && groupChatMembers.length > 0) {
              for (let groupChatMember of groupChatMembers) {
                if (groupChatMember.memberPeerId === message.senderPeerId) {
                  if (groupChatMember.memberAlias) {
                    name = groupChatMember.memberAlias
                  }
                  break
                }
              }
            }
          }
          if (!name) {
            let senderPeer = state.linkmanMap[message.senderPeerId]
            if (senderPeer) {
              name = senderPeer.givenName ? senderPeer.givenName : senderPeer.name
            } else {
              let peerClient = peerClientService.getPeerClientFromCache(message.senderPeerId)
              if (peerClient && peerClient.name) {
                name = peerClient.name
              }
            }
          }
        }
      }

      return name
    },
    isShowRecalld(message) {
      let _that = this
      let store = _that.$store
      let recallSetting
      if (message.subjectType === SubjectType.CHAT) {
        let linkman = store.state.linkmanMap[message.subjectId]
        if (message.senderPeerId == this.$store.state.myselfPeerClient.peerId) {
          recallSetting = linkman.myselfRecallAlert
        } else {
          recallSetting = linkman.recallAlert
        }
      } else if (message.subjectType === SubjectType.GROUP_CHAT) {
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
    async openCard(message) {
      let _that = this
      let store = _that.$store
      let peerId = message.content.peerId
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
          store.contactsDetailsEntry = 'message'
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
          } else if (linkman.visibilitySetting && linkman.visibilitySetting.substring(4, 5) === 'N') {
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
            store.findContactsEntry = 'message'
            store.changeKind('findContacts')
            await store.findContacts('card', peerId)
          }
        }
      }
    },
    async openChannel(message) {
      let _that = this
      let store = _that.$store
      let channel = message.content
      let currentChannel = store.state.channelMap[channel.channelId]
      if (currentChannel) {
        if (currentChannel.updateDate < channel.updateDate) {
          currentChannel.state = EntityState.Modified
          currentChannel.avatar = channel.avatar
          currentChannel.name = channel.name
          currentChannel.description = channel.description
          currentChannel.updateDate = channel.updateDate
          await channelComponent.save(ChannelDataType.CHANNEL, currentChannel, null)
        }
        channel = currentChannel
      } else {
        channel = await store.acquireChannel(channel.channelId)
      }
      if (channel) {
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
      } else {
        _that.$q.notify({
          message: `${_that.$i18n.t("Channel")} ${_that.$i18n.t("Deleted")}`,
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
      }
    },
    async openArticle(message) {
      let _that = this
      let store = _that.$store
      let article = message.content
      if (!article.content) {
        let blocks = await dataBlockService.findTxPayload(null, article.blockId)
        if (blocks && blocks.length > 0) {
          article = blocks[0]
        } else {
          _that.$q.notify({
            message: `${_that.$i18n.t("Article")} ${_that.$i18n.t("Deleted")}`,
            timeout: 3000,
            type: "warning",
            color: "warning",
          })
        }
      }
      store.state.currentArticle = article
      store.changeKind('channelDetails')
      _that.$nextTick(() => {
        store.channelDetailsArticleEntry = 'message'
        store.changeChannelDetailsSubKind('view')
      })
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
      _that.$q.loading.show()
      try {
        store.state.noteMessageSrc = await store.getMessageFile(message)
        store.state.noteMessageDialog = true
      } catch (error) {
        console.error(error)
      } finally {
        _that.$q.loading.hide()
      }
    },
    htmlConvert(text) {
      let _text = []
      let reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
      let urlArray = text.match(reg);
      let surplus = text
      if (urlArray && urlArray.length > 0) {
        let i = 0
        for (let url of urlArray) {
          let _index = surplus.indexOf(url)
          if (_index !== 0) {
            _text.push({ type: 'text', text: surplus.substring(0, _index) })
          }
          _text.push({ type: 'link', text: surplus.slice(_index, _index + url.length) })
          surplus = surplus.slice(_index + url.length)
        }
        if (surplus) {
          _text.push({ type: 'text', text: surplus })
        }
      } else {
        _text.push({ type: 'text', text: text })
      }
      return _text
    },
    openInnerBrowers(htmlPart) {
      let inAppBrowser = inAppBrowserComponent.open(htmlPart.text, '_blank', 'location=no,footer=yes')
    },
    avatarClick(mouseEvent, message) {
      if (this.entry === 'message' && mouseEvent.target && mouseEvent.target.getAttribute("class") && mouseEvent.target.getAttribute("class").indexOf('q-message-avatar') > -1) {
        this.showContacts(message.senderPeerId)
      }
    },
    async openDestroyMessage(message) {
      let _that = this
      let store = _that.$store
      message.opened = true
      message.countDown = message.destroyTime / 1000
      let _chat = store.state.chatMap[message.senderPeerId]
      let currentChatMessages = _chat.messages
      _that.$forceUpdate()
      let countDownInterval = setInterval(async function () {
        if (!message.countDown) {
          clearInterval(countDownInterval)
          for (let i = currentChatMessages.length - 1; i >= 0; i--) {
            if (message == currentChatMessages[i]) {
              let msg = await chatComponent.get(ChatDataType.MESSAGE, message._id)
              await chatComponent.remove(ChatDataType.MESSAGE, msg, currentChatMessages)
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
