import { date } from 'quasar'
import jsQR from 'jsqr'
import jimp from 'jimp'

import { CollaUtil } from 'libcolla'
import { myself } from 'libcolla'
import { peerClientService } from 'libcolla'

import { statusBarComponent } from '@/libs/base/colla-cordova'
import { systemAudioComponent } from '@/libs/base/colla-media'
import { chatComponent, ChatContentType, ChatDataType, SubjectType } from '@/libs/biz/colla-chat'
import { ActiveStatus, contactComponent, ContactDataType, GroupStatus, LinkmanStatus } from '@/libs/biz/colla-contact'
import GroupAvatar from '@/components/groupAvatar'
import Message from '@/components/message'

export default {
  name: "Chat",
  components: {
    groupAvatar: GroupAvatar,
    message: Message,
  },
  props: [],
  data() {
    return {
      ChatContentType: ChatContentType,
      SubjectType: SubjectType,
      ActiveStatus: ActiveStatus,
      chatFilter: null,
      date: date,
      lockContactsSwitchDialog: false,
      password: null,
      ifScrollTop: true,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search'),
      placeholder2: '\ue672' + ' ' + (myself.myselfPeerClient.localDataCryptoSwitch === true ? this.$i18n.t('Local Data Crypto mode only search by Tag') : this.$i18n.t('Search')),
      subKind: 'default',
      searchDone: false,
      searching: false,
      searchLoading: false,
      searchText: null,
      linkmanResultList: [],
      groupChatResultList: [],
      chatResultList: [],
      searchResult: 'allResult'
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    activeStatus() {
      let _that = this
      let store = _that.$store
      return function (chat) {
        if (!chat) {
          return false
        } else if (chat.subjectType === SubjectType.CHAT) {
          return store.state.linkmanMap[chat.subjectId] && store.state.linkmanMap[chat.subjectId].activeStatus === ActiveStatus.UP
        } else if (chat.subjectType === SubjectType.GROUP_CHAT) {
          return store.state.groupChatMap[chat.subjectId] && store.state.groupChatMap[chat.subjectId].activeStatus === ActiveStatus.UP
        }
      }
    },
    alertStatus() {
      let _that = this
      let store = _that.$store
      return function (chat) {
        if (!chat) {
          return false
        } else if (chat.subjectType === SubjectType.CHAT) {
          return store.state.linkmanMap[chat.subjectId] && store.state.linkmanMap[chat.subjectId].notAlert
        } else if (chat.subjectType === SubjectType.GROUP_CHAT) {
          return store.state.groupChatMap[chat.subjectId] && store.state.groupChatMap[chat.subjectId].notAlert
        }
      }
    },
    IfAlertUnReadCount() {
      let _that = this
      let store = _that.$store
      return function (chat) {
        return chat && chat.unReadCount && !_that.alertStatus(chat)
      }
    },
    GroupChatUnReadCount() {
      let _that = this
      let store = _that.$store
      return function (chat) {
        if (chat && !_that.alertStatus(chat)) {
          return chat.unReadCount
        } else {
          return 0
        }
      }
    },
    ChatName() {
      let _that = this
      let store = _that.$store
      return function (chat) {
        let subjectType = chat.subjectType
        let subjectId = chat.subjectId
        return store.getChatName(subjectType, subjectId)
      }
    },
    ChatContent() {
      let _that = this
      let store = _that.$store
      return function (chat) {
        if (chat) {
          return (chat.unReadCount && _that.alertStatus(chat) ? '[' + chat.unReadCount + ' ' + _that.$i18n.t('messages') + ']' : '') + (chat.content && !chat.hiddenContent ? chat.content : '')
        } else {
          return ''
        }
      }
    },
    ChatUpdateTime() {
      return function (updateTime) {
        if (updateTime) {
          updateTime = new Date(updateTime)
          let currentDate = new Date()
          let dateString = updateTime.toDateString()
          let currentDateString = currentDate.toDateString()
          if (dateString === currentDateString) {
            return date.formatDate(updateTime, 'HH:mm')
          } else {
            return date.formatDate(updateTime, 'YYYY-MM-DD')
          }
        } else {
          return ''
        }
      }
    },
    ChatFilteredList() {
      let _that = this
      let store = _that.$store
      let chatFilteredArray = []
      let chats = store.state.chats
      if (chats && chats.length > 0) {
        let chatFilter = _that.chatFilter
        if (chatFilter) {
          chatFilteredArray = chats.filter((chat) => {
            if (chat) {
              if (chat.subjectType === SubjectType.CHAT) {
                let linkman = store.state.linkmanMap[chat.subjectId]
                return linkman && (linkman.peerId.toLowerCase().includes(chatFilter.toLowerCase())
                  || (linkman.mobile && linkman.mobile.toLowerCase().includes(chatFilter.toLowerCase()))
                  || linkman.name.toLowerCase().includes(chatFilter.toLowerCase())
                  || linkman.pyName.toLowerCase().includes(chatFilter.toLowerCase())
                  || (linkman.givenName && linkman.givenName.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (linkman.pyGivenName && linkman.pyGivenName.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (linkman.tag && chat.tag.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (linkman.pyTag && chat.pyTag.toLowerCase().includes(chatFilter.toLowerCase())))
                  && ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
              } else if (chat.subjectType === SubjectType.GROUP_CHAT) {
                let groupChat = store.state.groupChatMap[chat.subjectId]
                return (groupChat.groupId.toLowerCase().includes(chatFilter.toLowerCase())
                  || (groupChat.name && groupChat.name.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (groupChat.pyName && groupChat.pyName.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (groupChat.description && groupChat.description.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (groupChat.pyDescription && groupChat.pyDescription.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (groupChat.givenName && groupChat.givenName.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (groupChat.pyGivenName && groupChat.pyGivenName.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (groupChat.tag && groupChat.tag.toLowerCase().includes(chatFilter.toLowerCase()))
                  || (groupChat.pyTag && groupChat.pyTag.toLowerCase().includes(chatFilter.toLowerCase())))
              }
            }
          })
        } else {
          chatFilteredArray = chats.filter((chat) => {
            if (chat) {
              if (chat.subjectType === SubjectType.CHAT) {
                let linkman = store.state.linkmanMap[chat.subjectId]
                return linkman && ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
              } else if (chat.subjectType === SubjectType.GROUP_CHAT) {
                let groupChat = store.state.groupChatMap[chat.subjectId]
                return groupChat
              }
            }
          })
        }
        let topChatArrary = []
        let untopChatArray = []
        for (let chat of chatFilteredArray) {
          let linkman = store.state.linkmanMap[chat.subjectId]
          let groupChat = store.state.groupChatMap[chat.subjectId]
          if ((linkman && linkman.top === true) || (groupChat && groupChat.top === true)) {
            chat.top = true
            topChatArrary.push(chat)
          } else {
            untopChatArray.push(chat)
          }
        }
        CollaUtil.sortByKey(topChatArrary, 'updateTime', 'asc')
        CollaUtil.sortByKey(untopChatArray, 'updateTime', 'desc')
        for (let topChat of topChatArrary) {
          untopChatArray.unshift(topChat)
        }
        chatFilteredArray = untopChatArray
      }
      return chatFilteredArray
    }
  },
  methods: {
    async updateReadTime() {
      let _that = this
      let store = _that.$store
      store.state.currentChat.unReadCount = 0
      let messages = await chatComponent.loadMessage({
        ownerPeerId: store.state.currentChat.ownerPeerId,
        subjectId: store.state.currentChat.subjectId,
        readTime: null
      })
      if (messages && messages.length > 0) {
        for (let message of messages)
          message.readTime = new Date()
        await chatComponent.update(ChatDataType.MESSAGE, messages, null)
      }
    },
    chatSelected(chat, _index) {
      let _that = this
      let store = _that.$store
      let prevCurrentChat = store.state.currentChat
      store.state.currentChat = chat
      if (chat.unReadCount) {
        _that.updateReadTime()
        if(chat.subjectType === SubjectType.GROUP_CHAT && chat.focusedMessage){
          chat.focusedMessage = null
        }
      }
      store.changeKind('message')
      store.toggleDrawer(true)
      if (!(_that.ifMobileSize || store.state.ifMobileStyle) && prevCurrentChat && prevCurrentChat._id !== chat._id) {
        store.changeMessageSubKind('default')
      }
    },
    // group chat ///////////////////////////////////////////////////////////////////////////////////
    showSelectGroupChatLinkman() {
      let _that = this
      let store = _that.$store
      let linkmans = this.$store.state.linkmans
      if (linkmans && linkmans.length > 0) {
        for (let linkman of linkmans) {
          linkman.selected = false
          linkman.existing = false
        }
      }
      store.state.includedLinkmans = []
      store.selectContactsEntry = 'addGroupChat'
      store.changeKind('selectContacts')
      store.toggleDrawer(true)
    },
    showSelectConference() {
      let _that = this
      let store = _that.$store
      store.changeKind('selectConference')
      store.toggleDrawer(true)
    },
    async deleteChat(chat, index) {
      let _that = this
      let store = _that.$store
      chat = await chatComponent.get(ChatDataType.CHAT, chat._id)
      if (chat) {
        await chatComponent.remove(ChatDataType.CHAT, chat, store.state.chats)
      }
      delete store.state.chatMap[chat.subjectId]
    },
    showLockContactsSwitchDialog() {
      let _that = this
      let store = _that.$store
      if (store.state.lockContactsSwitch) {
        _that.password = null
        _that.lockContactsSwitchDialog = true
      } else {
        _that.updateLockContactsSwitch()
      }
    },
    updateLockContactsSwitch() {
      let _that = this
      let store = _that.$store
      if (store.state.lockContactsSwitch && _that.password !== myself.password) {
        _that.$q.notify({
          message: _that.$i18n.t("Wrong password"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        return
      }
      _that.lockContactsSwitchDialog = false
      store.state.lockContactsSwitch = !store.state.lockContactsSwitch
      if (store.state.lockContactsSwitch && store.state.currentChat) {
        if (store.state.currentChat.subjectType === SubjectType.CHAT && store.state.linkmanMap[store.state.currentChat.subjectId].locked) {
          if (_that.ChatFilteredList.length > 0) {
            store.state.currentChat = _that.ChatFilteredList[0]
          } else {
            store.state.currentChat = null
          }
        }
      }
    },
    async load_chat(done) {
      let _that = this
      let store = _that.$store
      let chats = []
      let data = await chatComponent.loadChat({
          ownerPeerId: myself.myselfPeerClient.peerId
        }, null, store.state.chats.length > 0 ? store.state.chats[0].updateTime : null, null, true)
        if (data && data.length > 0) {
          for (let chat of data) {
            let subjectType
            if (store.state.linkmanMap[chat.subjectId]) {
              subjectType = SubjectType.CHAT
            } else if (store.state.groupChatMap[chat.subjectId]) {
              subjectType = SubjectType.GROUP_CHAT
            } else {
              continue
            }
            chat.unReadCount = 0
            chat.mediaProperty = null
            chat.noMoreMessageTag = false
            chat.subjectType = subjectType
            store.state.chatMap[chat.subjectId] = chat
            chats.push(chat)
          }
          store.state.chats = store.state.chats.concat(chats)
        }
      if (typeof done == 'function') {
        done()
      }
    },
    findContacts() {
      let _that = this
      let store = _that.$store
      store.state.findLinkmanData = {
        peerId: null,
        message: null,
        givenName: null,
        tag: null
      }
      store.state.findLinkmanResult = 0
      store.state.findLinkmanTip = ''
      store.state.findLinkman = null
      store.state.findContactsSubKind = 'default'
      store.changeKind('findContacts')
      store.toggleDrawer(true)
    },
    enterScan() {
      let _that = this
      let store = _that.$store
      if (store.ifMobile()) {
        store.scanEntry = 'chat'
        store.scanSwitch(true)
        //store.toggleDrawer(false) // no need to call because no change
        statusBarComponent.style(false, '#33000000')
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
                  store.contactsDetailsEntry = 'chat'
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
                    store.findContactsEntry = 'chat'
                    store.changeKind('findContacts')
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
    },
    getChatName(subjectType, subjectId) {
      let _that = this
      let store = _that.$store
      let chatName = ''
      if (subjectType === SubjectType.CHAT) {
        let linkman = store.state.linkmanMap[subjectId]
        if (linkman) {
          chatName = (linkman.givenName ? linkman.givenName : linkman.name)
        }
      } else if (subjectType === SubjectType.GROUP_CHAT) {
        let groupId = subjectId
        let groupChat = store.state.groupChatMap[groupId]
        if (groupChat) {
          let givenName = groupChat.givenName
          let name = groupChat.name
          if (givenName) {
            chatName = givenName
          } else if (name) {
            chatName = name
          } else {
            let groupChatMembers = groupChat.groupMembers
            if (groupChatMembers && groupChatMembers.length > 0) {
              for (let groupChatMember of groupChatMembers) {
                let member = store.state.linkmanMap[groupChatMember.memberPeerId]
                if (!member) {
                  member = peerClientService.getPeerClientFromCache(groupChatMember.memberPeerId)
                }
                if (member) {
                  chatName = (chatName ? chatName + _that.$i18n.t(", ") : '') + (member.givenName ? member.givenName : member.name)
                }
              }
            }
          }
          if (groupChat.status === GroupStatus.DISBANDED) {
            chatName = '[' + _that.$i18n.t("Disbanded") + '] ' + chatName
          }
        }
      }
      return chatName
    },
    searchBack() {
      let _that = this
      let store = _that.$store
      _that.searchText = null
      _that.searching = false
      if (store.messageEntry === 'search') {
        store.messageEntry = null
      }
      _that.subKind = 'default'
    },
    searchFocus(e) {
      let _that = this
      _that.subKind = 'search'
    },
    searchInput(value) {
      let _that = this
      _that.searching = false
    },
    async searchKeyup(e) {
      let _that = this
      _that.searchText = (_that.searchText || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '')
      if (e.keyCode === 13 && _that.searchText) {
        await _that.search()
        let searchTextInputs = document.getElementsByClassName('q-field__native')
        if (searchTextInputs || searchTextInputs[0] || searchTextInputs[0].style.display !== 'none') {
          searchTextInputs[0].blur()
        }
      }
    },
    async search() {
      let _that = this
      let store = _that.$store
      _that.searching = true
      _that.linkmanResultList.splice(0)
      _that.groupChatResultList.splice(0)
      _that.chatResultList.splice(0)
      let linkmanResults = await contactComponent.searchPhase(ContactDataType.LINKMAN, _that.searchText)
      console.info(linkmanResults)
      let linkmanResultMap = {}
      if (linkmanResults && linkmanResults.rows && linkmanResults.rows.length > 0) {
        for (let linkmanResult of linkmanResults.rows) {
          let linkman = store.state.linkmanMap[linkmanResult.doc.peerId]
          if (linkman && linkman.status !== LinkmanStatus.REQUESTED) {
            linkman.highlightingGivenName = null
            linkman.highlightingName = null
            linkman.highlighting = null
            if (linkmanResult.highlighting.givenName) {
              linkman.highlightingGivenName = linkmanResult.highlighting.givenName
            } else if (linkmanResult.highlighting.name) {
              if (!linkman.givenName) {
                linkman.highlightingName = linkmanResult.highlighting.name
              } else {
                linkman.highlighting = _that.$i18n.t('UserName: ') + linkmanResult.highlighting.name
              }
            } else if (linkmanResult.highlighting.mobile) {
              linkman.highlighting = _that.$i18n.t('Mobile: ') + linkmanResult.highlighting.mobile
            }
            _that.linkmanResultList.push(linkman)
            linkmanResultMap[linkman.peerId] = linkman
          }
        }
      }
      let linkmanTagResults = await contactComponent.searchPhase(ContactDataType.LINKMAN_TAG, _that.searchText)
      console.info(linkmanTagResults)
      if (linkmanTagResults && linkmanTagResults.rows && linkmanTagResults.rows.length > 0) {
        let clientPeerId = myself.myselfPeerClient.peerId
        for (let linkmanTagResult of linkmanTagResults.rows) {
          let linkmanTagLinkmanDBItems = await contactComponent.loadLinkmanTagLinkman(
            {
              ownerPeerId: clientPeerId,
              tagId: linkmanTagResult.doc._id
            }
          )
          if (linkmanTagLinkmanDBItems && linkmanTagLinkmanDBItems.length > 0) {
            for (let linkmanTagLinkmanDBItem of linkmanTagLinkmanDBItems) {
              let linkman = store.state.linkmanMap[linkmanTagLinkmanDBItem.linkmanPeerId]
              if (linkman && linkman.status !== LinkmanStatus.REQUESTED) {
                if (!linkmanResultMap[linkman.peerId]) {
                  linkman.highlightingGivenName = null
                  linkman.highlightingName = null
                  linkman.highlighting = _that.$i18n.t('Tags: ') + linkmanTagResult.highlighting.name
                  _that.linkmanResultList.push(linkman)
                  linkmanResultMap[linkman.peerId] = linkman
                }
              }
            }
          }
        }
      }
      let groupChatResultMap = {}
      let groupChatResults = await contactComponent.searchPhase(ContactDataType.GROUP, _that.searchText)
      console.info(groupChatResults)
      if (groupChatResults && groupChatResults.rows && groupChatResults.rows.length > 0) {
        for (let groupChatResult of groupChatResults.rows) {
          let groupChat = store.state.groupChatMap[groupChatResult.doc.groupId]
          if (groupChat) {
            groupChat.highlightingGivenName = null
            groupChat.highlightingName = null
            groupChat.highlighting = null
            if (groupChatResult.highlighting.givenName) {
              groupChat.highlightingGivenName = groupChatResult.highlighting.givenName
            } else if (groupChatResult.highlighting.name) {
              if (!groupChat.givenName) {
                groupChat.highlightingName = groupChatResult.highlighting.name
              } else {
                groupChat.highlighting = _that.$i18n.t('Name: ') + groupChatResult.highlighting.name
              }
            } else if (groupChatResult.highlighting.description) {
              groupChat.highlighting = _that.$i18n.t('Description: ') + groupChatResult.highlighting.description
            }
            _that.groupChatResultList.push(groupChat)
            groupChatResultMap[groupChat.groupId] = groupChat
          }
        }
      }
      for (let linkmanResult of _that.linkmanResultList) {
        for (let groupChat of store.state.groupChats) {
          if (!groupChatResultMap[groupChat.groupId]) {
            let included = false
            for (let groupMember of groupChat.groupMembers) {
              if (groupMember.memberPeerId === linkmanResult.peerId) {
                included = true
                break
              }
            }
            if (included) {
              groupChat.highlightingGivenName = null
              groupChat.highlightingName = null
              groupChat.highlighting = _that.$i18n.t('Includes: ') + (linkmanResult.highlighting ? ((linkmanResult.givenName ? linkmanResult.givenName : linkmanResult.name) + '(' + linkmanResult.highlighting + ')') : (linkmanResult.highlightingGivenName ? linkmanResult.highlightingGivenName : linkmanResult.highlightingName))
              _that.groupChatResultList.push(groupChat)
              groupChatResultMap[groupChat.groupId] = groupChat
              break
            }
          }
        }
      }
      let groupMemberResults = await contactComponent.searchPhase(ContactDataType.GROUP_MEMBER, _that.searchText)
      console.info(groupMemberResults)
      if (groupMemberResults && groupMemberResults.rows && groupMemberResults.rows.length > 0) {
        for (let groupMemberResult of groupMemberResults.rows) {
          let linkman = store.state.linkmanMap[groupMemberResult.doc.memberPeerId]
          if (linkman) {
            if (!linkmanResultMap[linkman.peerId]) {
              for (let groupChat of store.state.groupChats) {
                if (!groupChatResultMap[groupChat.groupId]) {
                  let included = false
                  for (let groupMember of groupChat.groupMembers) {
                    if (groupMember.memberPeerId === linkman.peerId) {
                      included = true
                      break
                    }
                  }
                  if (included) {
                    groupChat.highlightingGivenName = null
                    groupChat.highlightingName = null
                    groupChat.highlighting = _that.$i18n.t('Includes: ') + ((linkman.givenName ? linkman.givenName : linkman.name) + '(' + _that.$i18n.t('MemberAlias: ') + groupMemberResult.highlighting.memberAlias + ')')
                    _that.groupChatResultList.push(groupChat)
                    groupChatResultMap[groupChat.groupId] = groupChat
                    break
                  }
                }
              }
            }
          }
        }
      }
      /*let filter = function (doc) {
        return doc.ownerPeerId === myself.myselfPeerClient.peerId &&
                (doc.contentType === ChatContentType.NOTE || doc.contentType === ChatContentType.CHAT ||
                 doc.contentType === ChatContentType.TEXT || doc.contentType === ChatContentType.FILE ||
                 doc.contentType === ChatContentType.CARD)
      }*/
      let messageResults = await chatComponent.searchPhase(ChatDataType.MESSAGE, _that.searchText/*, filter*/)
      console.info(messageResults)
      let chatResultMap = {}
      if (messageResults && messageResults.rows && messageResults.rows.length > 0) {
        for (let messageResult of messageResults.rows) {
          let message = messageResult.doc
          if (message.ownerPeerId === myself.myselfPeerClient.peerId &&
              (message.contentType === ChatContentType.NOTE || message.contentType === ChatContentType.CHAT ||
               message.contentType === ChatContentType.TEXT || message.contentType === ChatContentType.FILE ||
               message.contentType === ChatContentType.CARD)) {
            let subjectId = message.subjectId
            let chat = store.state.chatMap[subjectId]
            if (chat) {
              let messageResultList = null
              if (!chatResultMap[subjectId]) {
                messageResultList = []
                chat.messageResultList = messageResultList
                chatResultMap[subjectId] = chat
              } else {
                messageResultList = chatResultMap[subjectId].messageResultList
              }
              message.linkman = store.state.linkmanMap[message.senderPeerId]
              if (messageResult.highlighting.title) {
                message.highlighting = messageResult.highlighting.title
              } else if (messageResult.highlighting.content) {
                message.highlighting = messageResult.highlighting.content
              }
              messageResultList.push(message)
            }
          }
        }
      }
      for (let key in chatResultMap) {
        let chat = chatResultMap[key]
        _that.chatResultList.push(chat)
      }
    },
    async linkmanResultSelected(linkman) {
      let _that = this
      let store = _that.$store
      await store.gotoChat(linkman.peerId)
    },
    async groupResultSelected(groupChat) {
      let _that = this
      let store = _that.$store
      await store.gotoChat(groupChat.groupId)
    },
    async chatResultSelected(chat) {
      let _that = this
      let store = _that.$store
      await store.gotoChat(chat.subjectId)
      store.messageEntry = 'search'
      if (_that.initSearch) {
        _that.initSearch(_that.ChatName(chat), _that.searchText, CollaUtil.clone(chat.messageResultList))
      } else {
        store.messageSearchPrefix = _that.ChatName(chat)
        store.messageSearchText = _that.searchText
        store.messageResultList = CollaUtil.clone(chat.messageResultList)
      }
      store.changeMessageSubKind('searchChatHistory')
    },
    linkmanResult() {
      let _that = this
      _that.searchResult = 'linkmanResult'
    },
    groupChatResult() {
      let _that = this
      _that.searchResult = 'groupChatResult'
    },
    chatResult() {
      let _that = this
      _that.searchResult = 'chatResult'
    },
    resultBack() {
      let _that = this
      _that.searchResult = 'allResult'
    }
  },
  async mounted() {
    let _that = this
    let store = _that.$store
    if(store.state.chats.length === 0){
      await _that.load_chat()
    }
  },
  created() {
    let _that = this
    let store = _that.$store
    _that.$nextTick(() => {
      store.chatLoadingDone()
    })
    store.getChatName = _that.getChatName
    store.chatSearchBack = _that.searchBack
  }
}
