import { myself } from 'libcolla'
import { CollaUtil, UUID } from 'libcolla'

import pinyinUtil from '@/libs/base/colla-pinyin'
import { ChatContentType, P2pChatMessageType, SubjectType } from '@/libs/biz/colla-chat'
import { ContactDataType, RequestType, RequestStatus, LinkmanStatus, GroupStatus, MemberType, ActiveStatus, contactComponent } from '@/libs/biz/colla-contact'

export default {
  name: "SelectContacts",
  components: {
  },
  props: [],
  data() {
    return {
      ActiveStatus: ActiveStatus,
      groupChatData: {
        name: null,
        description: null,
        givenName: null,
        tag: null,
        myAlias: null
      },
      selectContactsfilter: null,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search')
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    heightStyle() {
      return {
        height: `${this.ifMobileSize || this.$store.state.ifMobileStyle ? this.$q.screen.height - 72 : this.$q.screen.height}px`
      }
    },
    SelectLinkmanFilteredList() { // 发起群聊待选择联系人（含黑名单、上锁联系人显示控制、selectContactsfilter过滤搜索）
      let _that = this
      let store = _that.$store
      let SelectLinkmanFilteredArray = []
      let linkmans = store.state.linkmans
      if (linkmans && linkmans.length > 0) {
        let selectContactsfilter = _that.selectContactsfilter
        if (selectContactsfilter) {
          SelectLinkmanFilteredArray = linkmans.filter((linkman) => {
            return (linkman.peerId.toLowerCase().includes(selectContactsfilter.toLowerCase())
              || (linkman.mobile && linkman.mobile.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || linkman.name.toLowerCase().includes(selectContactsfilter.toLowerCase())
              || linkman.pyName.toLowerCase().includes(selectContactsfilter.toLowerCase())
              || (linkman.givenName && linkman.givenName.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (linkman.pyGivenName && linkman.pyGivenName.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (linkman.tag && linkman.tag.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (linkman.pyTag && linkman.pyTag.toLowerCase().includes(selectContactsfilter.toLowerCase())))
              && ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
              && linkman.status !== LinkmanStatus.REQUESTED
              && linkman.peerId !== myself.myselfPeerClient.peerId
          })
        } else {
          SelectLinkmanFilteredArray = linkmans.filter((linkman) => {
            return ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
              && linkman.status !== LinkmanStatus.REQUESTED
              && linkman.peerId !== myself.myselfPeerClient.peerId
          })
        }
      }
      return SelectLinkmanFilteredArray
    },
    SelectedLinkmanList() { // 添加群组成员
      let _that = this
      let store = _that.$store
      let SelectedLinkmanArray = []
      SelectedLinkmanArray = store.state.includedLinkmans.filter((includedLinkman) => {
        return (!includedLinkman.existing)
      })
      return SelectedLinkmanArray
    }
  },
  methods: {
    selectGroupChatLinkman(linkman, ifCheckbox) {
      if (!ifCheckbox) {
        linkman.selected = !linkman.selected
      }
      if (linkman.selected) {
        this.$store.state.includedLinkmans.push(linkman)
      } else {
        let index = 0
        for (let includedLinkman of this.$store.state.includedLinkmans) {
          if (includedLinkman.peerId === linkman.peerId) {
            this.$store.state.includedLinkmans.splice(index, 1)
            return
          }
          index++
        }
      }
    },
    unselectGroupChatLinkman(index) {
      this.$store.state.includedLinkmans[index].selected = false
      this.$store.state.includedLinkmans.splice(index, 1)
    },
    async doneSelectGroupChatLinkman() {
      let _that = this
      let store = _that.$store
      if (store.selectContactsEntry === 'addGroupChat' || store.selectContactsEntry === 'CHATDetails') {
        if (store.state.includedLinkmans.length === 1) {
          let linkman = store.state.includedLinkmans[0]
          await store.getChat(linkman.peerId)
          store.setCurrentChat(linkman.peerId)
          store.changeKind('message')
        } else {
          _that.groupChatData = {
            name: null,
            description: null,
            givenName: null,
            tag: null,
            myAlias: null
          }
          await _that.addGroupChat()
        }
      } else if (store.selectContactsEntry === 'GROUP_CHATDetails') {
        await _that.addGroupChatMember()
      } else if (store.selectContactsEntry === 'contactsTagList') {
        store.state.linkmanTagData.linkmans = store.state.includedLinkmans
        store.changeContactsTagListSubKind('editContactsTag')
      } else if (store.selectContactsEntry === 'linkmanCard') {
        await store.selectedLinkmanCard()
        store.changeKind('message')
      } else if (store.selectContactsEntry === 'selectChat') {
        for (let linkman of store.state.includedLinkmans) {
          let chatRecord =  await store.getChat(linkman.peerId)
          if (store.selectChatEntry === 'collectionForward') {
            let currentCollection = store.state.currentCollection
            await store.collectionForwardToChat(currentCollection,chatRecord)
          } else if (store.selectChatEntry === 'messageForward') {
            await store.forwardToChat(chatRecord)
          } else if (store.selectChatEntry === 'accountInformationQrCode'
            || store.selectChatEntry === 'accountSecurityQrCode'
            || store.selectChatEntry === 'aboutQrCode'
            || store.selectChatEntry === 'collectionImg'
            || store.selectChatEntry === 'articleImg') {
            await store.imgForwardToChat(store.state.currentQrCode,chatRecord)
          } else if (store.selectChatEntry === 'channelForward') {
            await store.channelForwardToChat(store.state.currentChannel,chatRecord)
          } else if (store.selectChatEntry === 'articleForward') {
            await store.articleForwardToChat(store.state.currentArticle,chatRecord)
          }
        }
      }
    },
    async addGroupChat() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      let groupChat = {}
      try {
        let myselfPeerClient = myself.myselfPeerClient
        let name = _that.groupChatData.name
        let description = _that.groupChatData.description
        let givenName = _that.groupChatData.givenName
        let tag = _that.groupChatData.tag
        let myAlias = _that.groupChatData.myAlias
        let currentTime = new Date()

        // 新增群组
        groupChat.ownerPeerId = myselfPeerClient.peerId
        groupChat.groupId = UUID.string(null, null)
        groupChat.groupCategory = 'Chat'
        groupChat.groupType = 'Private'
        groupChat.name = name
        groupChat.pyName = pinyinUtil.getPinyin(name)
        groupChat.description = description
        groupChat.pyDescription = pinyinUtil.getPinyin(description)
        groupChat.givenName = givenName
        groupChat.pyGivenName = pinyinUtil.getPinyin(givenName)
        groupChat.tag = tag
        groupChat.pyTag = pinyinUtil.getPinyin(tag)
        groupChat.myAlias = myAlias
        groupChat.createDate = currentTime
        groupChat.status = GroupStatus.EFFECTIVE
        groupChat.locked = false
        groupChat.notAlert = false
        groupChat.top = false
        groupChat.recallTimeLimit = true
        groupChat.recallAlert = true
        await contactComponent.insert(ContactDataType.GROUP, groupChat, null)

        // 新增群组成员，包括自己
        let groupMembers = []
        // 先增加自己
        let groupMember = {}
        groupMember.ownerPeerId = myselfPeerClient.peerId
        groupMember.groupId = groupChat.groupId
        groupMember.memberPeerId = myselfPeerClient.peerId
        groupMember.memberType = MemberType.OWNER
        groupMember.createDate = currentTime
        groupMember.status = LinkmanStatus.EFFECTIVE
        await contactComponent.insert(ContactDataType.GROUP_MEMBER, groupMember, groupMembers)
        let hasActiveGroupMember = false
        // 再增加其他群组成员
        for (let includedLinkman of store.state.includedLinkmans) {
          let groupMember = {}
          groupMember.ownerPeerId = myselfPeerClient.peerId
          groupMember.groupId = groupChat.groupId
          groupMember.memberPeerId = includedLinkman.peerId
          groupMember.memberType = MemberType.MEMBER
          groupMember.createDate = currentTime
          groupMember.status = LinkmanStatus.EFFECTIVE
          await contactComponent.insert(ContactDataType.GROUP_MEMBER, groupMember, groupMembers)
          let linkman = store.state.linkmanMap[groupMember.memberPeerId]
          if (linkman) {
            linkman.groupChats.unshift(groupChat)
            // groupChat activeStatus
            if (linkman.activeStatus === ActiveStatus.UP && groupChat.activeStatus !== ActiveStatus.UP) {
              groupChat.activeStatus = ActiveStatus.UP
            }
          }
        }

        groupChat.groupOwnerPeerId = myselfPeerClient.peerId
        groupChat.groupMembers = groupMembers
        store.state.groupChats.unshift(groupChat)
        store.state.groupChatMap[groupChat.groupId] = groupChat

        // 新增Sent请求
        let linkmanRequest = {}
        linkmanRequest.requestType = RequestType.ADD_GROUPCHAT
        linkmanRequest.ownerPeerId = myselfPeerClient.peerId
        linkmanRequest.senderPeerId = myselfPeerClient.peerId
        linkmanRequest.data = JSON.stringify(groupMembers) // 数据库为JSON格式
        linkmanRequest.groupId = groupChat.groupId
        linkmanRequest.groupCreateDate = groupChat.createDate
        linkmanRequest.groupName = groupChat.name
        linkmanRequest.groupDescription = groupChat.description
        linkmanRequest.createDate = currentTime
        linkmanRequest.status = RequestStatus.SENT
        await contactComponent.insert(ContactDataType.LINKMAN_REQUEST, linkmanRequest, null)
        linkmanRequest.data = groupMembers // 内存为对象格式

        // 保存/发送Sent请求
        let message = {
          subjectType: SubjectType.LINKMAN_REQUEST,
          messageType: P2pChatMessageType.ADD_GROUPCHAT,
          content: linkmanRequest
        }
        let groupMemberNames
        for (let includedLinkman of store.state.includedLinkmans) {
          await store.saveAndSendMessage(message, includedLinkman.peerId)
          groupMemberNames = (groupMemberNames ? groupMemberNames + _that.$i18n.t(", ") : '') + (includedLinkman.givenName ? includedLinkman.givenName : includedLinkman.name)
        }

        let chat = await store.getChat(groupChat.groupId)
        let chatMessage = {
          messageType: P2pChatMessageType.CHAT_SYS,
          contentType: ChatContentType.EVENT,
          content: _that.$i18n.t("You") + _that.$i18n.t(" have invited ") + groupMemberNames + _that.$i18n.t(" to join group chat")
        }
        await store.addCHATSYSMessage(chat, chatMessage)
      } catch (error) {
        console.error(error)
      } finally {
        _that.$q.loading.hide()
        await store.getChat(groupChat.groupId)
        store.setCurrentChat(groupChat.groupId)
        store.changeKind('message')
        store.changeMessageSubKind('default')
      }
    },
    async addGroupChatMember() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      try {
        let myselfPeerClient = myself.myselfPeerClient
        let groupChat = store.state.groupChatMap[store.state.currentChat.subjectId]
        let groupMembers = groupChat.groupMembers
        let currentTime = new Date()

        // 新增群组成员
        let groupMembersWithFlag = CollaUtil.clone(groupMembers)
        let addedGroupMemberNames
        for (let includedLinkman of store.state.includedLinkmans) {
          if (!includedLinkman.existing && includedLinkman.selected) {
            let groupMember = {}
            groupMember.ownerPeerId = myselfPeerClient.peerId
            groupMember.groupId = groupChat.groupId
            groupMember.memberPeerId = includedLinkman.peerId
            groupMember.memberType = MemberType.MEMBER
            groupMember.createDate = currentTime
            groupMember.status = LinkmanStatus.EFFECTIVE
            await contactComponent.insert(ContactDataType.GROUP_MEMBER, groupMember, groupMembers)
            groupMember.dirtyFlag = 'NEW' // 脏标志
            groupMembersWithFlag.push(groupMember)
            addedGroupMemberNames = (addedGroupMemberNames ? addedGroupMemberNames + _that.$i18n.t(", ") : '') + (includedLinkman.givenName ? includedLinkman.givenName : includedLinkman.name)
            store.state.linkmanMap[groupMember.memberPeerId].groupChats.unshift(groupChat)
            // 更新groupChat activeStatus
            if (includedLinkman.activeStatus === ActiveStatus.UP && groupChat.activeStatus !== ActiveStatus.UP) {
              groupChat.activeStatus = ActiveStatus.UP
            }
          }
        }

        groupChat.groupMembers = groupMembers
        store.state.groupChatMap[groupChat.groupId] = groupChat

        // 新增Sent请求
        let linkmanRequest = {}
        linkmanRequest.requestType = RequestType.ADD_GROUPCHAT_MEMBER
        linkmanRequest.ownerPeerId = myselfPeerClient.peerId
        linkmanRequest.senderPeerId = myselfPeerClient.peerId
        linkmanRequest.data = JSON.stringify(groupMembersWithFlag) // 数据库为JSON格式
        linkmanRequest.groupId = groupChat.groupId
        linkmanRequest.groupCreateDate = groupChat.createDate
        linkmanRequest.groupName = groupChat.name
        linkmanRequest.groupDescription = groupChat.description
        linkmanRequest.createDate = currentTime
        linkmanRequest.status = RequestStatus.SENT
        await contactComponent.insert(ContactDataType.LINKMAN_REQUEST, linkmanRequest, null)
        linkmanRequest.data = groupMembersWithFlag // 内存为对象格式

        // 保存/发送Sent请求
        let message = {
          subjectType: SubjectType.LINKMAN_REQUEST,
          messageType: P2pChatMessageType.ADD_GROUPCHAT_MEMBER,
          content: linkmanRequest
        }
        for (let includedLinkman of store.state.includedLinkmans) {
          if(includedLinkman.peerId !== myselfPeerClient.peerId){
            await store.saveAndSendMessage(message, includedLinkman.peerId)
          }
        }

        let chat = await store.getChat(groupChat.groupId)
        let chatMessage = {
          messageType: P2pChatMessageType.CHAT_SYS,
          contentType: ChatContentType.EVENT,
          content: _that.$i18n.t("You") + _that.$i18n.t(" have invited ") + addedGroupMemberNames + _that.$i18n.t(" to join group chat")
        }
        await store.addCHATSYSMessage(chat, chatMessage)
      } catch (error) {
        console.error(error)
      } finally {
        _that.$q.loading.hide()
        store.changeMessageSubKind('GROUP_CHATDetails')
      }
    },
    back() {
      let _that = this
      let store = _that.$store
      if (store.selectContactsEntry === 'addGroupChat') {
        if (_that.ifMobileSize || store.state.ifMobileStyle) {
          store.toggleDrawer(false)
        } else {
          store.changeKind('message')
        }
      } else if (store.selectContactsEntry === 'linkmanCard') {
        store.changeKind('message')
      } else if (store.selectContactsEntry === 'CHATDetails' || store.selectContactsEntry === 'GROUP_CHATDetails') {
        store.changeMessageSubKind(store.selectContactsEntry)
      } else if (store.selectContactsEntry === 'contactsTagList') {
        store.changeContactsTagListSubKind('editContactsTag')
      } else if (store.selectContactsEntry === 'selectChat') {
        store.changeSelectChatSubKind('selectChatRecord')
      }
    }
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  watch: {
  }
}
