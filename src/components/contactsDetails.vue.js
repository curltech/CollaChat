import { date } from 'quasar'

import { myself, chatAction } from 'libcolla'
import { ChatMessageType } from 'libcolla'
import { CollaUtil, BlobUtil } from 'libcolla'
import { EntityState } from 'libcolla'

import pinyinUtil from '@/libs/base/colla-pinyin'
import { statusBarComponent } from '@/libs/base/colla-cordova'
import { alloyFingerComponent } from '@/libs/base/colla-media'
import { ChatDataType, chatComponent, SubjectType, P2pChatMessageType, ChatContentType } from '@/libs/biz/colla-chat'
import { ContactDataType, RequestType, RequestStatus, LinkmanStatus, ActiveStatus, contactComponent } from '@/libs/biz/colla-contact'
import GroupAvatar from '@/components/groupAvatar'

export default {
  name: "ContactsDetails",
  components: {
    groupAvatar: GroupAvatar
  },
  props: [],
  data() {
    return {
      subKind: 'default',
      ActiveStatus: ActiveStatus,
      date: date,
      linkmanData: {
        peerId: null,
        message: null,
        givenName: null,
        tagNames: null
      },
      filterOptions: this.$store.state.linkmanTagNames,
      itemName: null
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
    showModifyContacts(itemName) {
      let _that = this
      let store = _that.$store
      _that.linkmanData.givenName = store.state.currentLinkman.givenName
      _that.linkmanData.tagNames = CollaUtil.clone(store.state.currentLinkman.tagNames)
      _that.itemName = itemName
      _that.subKind = 'modifyContacts'
    },
    async modifyLinkman() {
      let _that = this
      let store = _that.$store
      let linkmanPeerId = store.state.currentLinkman.peerId
      let linkman = store.state.linkmanMap[linkmanPeerId]
      linkman.givenName = _that.linkmanData.givenName
      let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
      linkmanRecord.givenName = linkman.givenName
      await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
      let clientPeerId = myself.myselfPeerClient.peerId
      let linkmanTagLinkmans = await contactComponent.loadLinkmanTagLinkman({ // pouchDB删除前需先load
        ownerPeerId: clientPeerId,
        linkmanPeerId: linkmanPeerId,
        createDate: { $gt: null }
      }, [{ createDate: 'asc' }])
      for (let linkmanTagLinkman of linkmanTagLinkmans) {
        let removed = true
        let name = store.state.linkmanTagIdMap[linkmanTagLinkman.tagId]
        for (let tagName of _that.linkmanData.tagNames) {
          if (name === tagName) {
            removed = false
            break
          }
        }
        if (removed) {
          linkmanTagLinkman.state = EntityState.Deleted
        }
      }
      let tag = ''
      for (let linkmanDataTagName of _that.linkmanData.tagNames) {
        let added = true
        for (let currentLinkmanTagName of store.state.currentLinkman.tagNames) {
          if (linkmanDataTagName === currentLinkmanTagName) {
            added = false
            break
          }
        }
        if (added) {
          let id = store.state.linkmanTagNameMap[linkmanDataTagName]
          if (!id) {
            let linkmanTag = {}
            linkmanTag.ownerPeerId = clientPeerId
            linkmanTag.name = linkmanDataTagName
            linkmanTag.createDate = new Date()
            await contactComponent.insert(ContactDataType.LINKMAN_TAG, linkmanTag, null)
            id = linkmanTag._id
            store.state.linkmanTagNames.push(linkmanDataTagName)
            store.state.linkmanTagNameMap[linkmanDataTagName] = id
            store.state.linkmanTagIdMap[id] = linkmanDataTagName
          }
          let linkmanTagLinkman = {}
          linkmanTagLinkman.ownerPeerId = clientPeerId
          linkmanTagLinkman.tagId = id
          linkmanTagLinkman.linkmanPeerId = linkmanPeerId
          linkmanTagLinkman.createDate = new Date()
          linkmanTagLinkman.state = EntityState.New
          linkmanTagLinkmans.push(linkmanTagLinkman)
        }
        tag = (tag ? tag + ", " + linkmanDataTagName : linkmanDataTagName)
      }
      await contactComponent.save(ContactDataType.LINKMAN_TAGLINKMAN, linkmanTagLinkmans, null)
      linkman.tagNames = _that.linkmanData.tagNames
      linkman.tag = tag
      linkman.pyTag = pinyinUtil.getPinyin(tag)
      store.state.linkmanMap[linkmanPeerId] = linkman
      _that.subKind = 'default'
    },
    showSendInvitation() {
      this.linkmanData.message = this.$i18n.t("I'm ") + myself.myselfPeerClient.name
      this.subKind = 'sendInvitation'
    },
    async addLinkman() {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      let findLinkman = store.state.currentLinkman
      let peerId = findLinkman.peerId
      let message = _that.linkmanData.message
      let givenName = _that.linkmanData.givenName
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

      _that.subKind = 'default'
    },
    async confirmBlackList(value) {
      let _that = this
      let store = _that.$store
      if (value === LinkmanStatus.EFFECTIVE) {
        await _that.changeStatus(LinkmanStatus.EFFECTIVE)
      } else if (value === LinkmanStatus.BLOCKED) {
        _that.$q.bottomSheet({
          message: _that.$i18n.t('Add into blacklist (you will not receive his/her messages)?'),
          actions: [
            {},
            {
              label: _that.$i18n.t('Confirm'),
              icon: 'check_circle',
              color: 'primary',
              id: 'confirm'
            },
            {},
            {
              label: _that.$i18n.t('Cancel'),
              icon: 'cancel',
              color: 'primary',
              id: 'cancel'
            }
          ]
        }).onOk(async action => {
          // console.log('Action chosen:', action.id)
          if (action.id === 'confirm') {
            await _that.changeStatus(LinkmanStatus.BLOCKED)
          } else if (action.id === 'cancel') {
            let linkman = store.state.linkmanMap[store.state.currentLinkman.peerId]
            linkman.status = LinkmanStatus.EFFECTIVE
          }
        }).onCancel(() => {
          // console.log('Dismissed')
          let linkman = store.state.linkmanMap[store.state.currentLinkman.peerId]
          linkman.status = LinkmanStatus.EFFECTIVE
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    },
    async changeStatus(value) {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      let currentTime = new Date()
      let linkman = store.state.linkmanMap[store.state.currentLinkman.peerId]
      linkman.status = value
      linkman.statusDate = currentTime
      let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
      if (linkmanRecord) {
        linkmanRecord.status = value
        linkmanRecord.statusDate = currentTime
        await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
      }
      //todo setupRTC
      // webrtcComponent.resetFlag = false
      // webrtcComponent.closeDataChannel(store.state.currentLinkman.peerId)
    },
    async updateContactsLock() {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      let newLocked = store.state.currentLinkman.locked
      let linkman = store.state.linkmanMap[store.state.currentLinkman.peerId]
      linkman.locked = newLocked
      let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
      if (linkmanRecord) {
        linkmanRecord.locked = newLocked
        await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
      }
      if (store.state.lockContactsSwitch) {
        if (_that.ifMobileSize || store.state.ifMobileStyle) {
          $store.toggleDrawer(false)
          store.state.currentLinkman = null
        } else {
          store.changeKind('receivedList')
          store.state.currentLinkman = null
        }
      }
    },
    confirmCallMobile() {
      let _that = this
      let store = _that.$store
      if (!(store.state.currentLinkman && store.state.currentLinkman.mobile && /^[0-9]+$/.test(store.state.currentLinkman.mobile.substring(1)))) {
        return
      }
      if (window.device) {
        if (window.device.platform === 'iOS') {
          let a = document.createElement('a')
          a.href = 'tel:' + store.state.currentLinkman.mobile
          a.click()
        } else if (window.device.platform === 'Android') {
          _that.$q.bottomSheet({
            actions: [
              {
                label: _that.$i18n.t('Call') + ' ' + store.state.currentLinkman.mobile,
                icon: 'phone',
                color: 'primary',
                id: 'confirm'
              },
              {},
              {
                label: _that.$i18n.t('Cancel'),
                icon: 'cancel',
                id: 'cancel'
              }
            ]
          }).onOk(async action => {
            // console.log('Action chosen:', action.id)
            if (action.id === 'confirm') {
              let a = document.createElement('a')
              a.href = 'tel:' + store.state.currentLinkman.mobile
              a.click()
            }
          }).onCancel(() => {
            // console.log('Dismissed')
          }).onDismiss(() => {
            // console.log('I am triggered on both OK and Cancel')
          })
        }
      }
    },
    async confirmRemoveContacts() {
      let _that = this
      let store = _that.$store
      let message = ''
      let managedJointGroupChats = []
      let myselfPeerClient = myself.myselfPeerClient
      let groupChats = store.state.currentLinkman.groupChats
      if (groupChats && groupChats.length > 0) {
        for (let groupChat of groupChats) {
          if (groupChat.groupOwnerPeerId === myselfPeerClient.peerId) {
            managedJointGroupChats.push(groupChat)
          }
        }
      }
      if (managedJointGroupChats.length === 0) {
        message = _that.$i18n.t('Remove this contact (together with chat records)?')
      } else {
        message = _that.$i18n.t('Remove this contact (together with chat records, membership of group chats managed by you)?')
      }
      _that.$q.bottomSheet({
        message: message,
        actions: [
          {},
          {
            label: _that.$i18n.t('Confirm'),
            icon: 'check_circle',
            color: 'primary',
            id: 'confirm'
          },
          {},
          {
            label: _that.$i18n.t('Cancel'),
            icon: 'cancel',
            color: 'primary',
            id: 'cancel'
          }
        ]
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        if (action.id === 'confirm') {
          await _that.removeContacts(managedJointGroupChats)
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    async removeContacts(managedJointGroupChats) {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      let currentLinkmanPeerId = store.state.currentLinkman.peerId
      //todo setupRTC
      // webrtcComponent.resetFlag = false
      // webrtcComponent.closeDataChannel(currentLinkmanPeerId)
      // 删除聊天记录
      let messages = await chatComponent.loadMessage({
        ownerPeerId: myselfPeerClient.peerId,
        subjectId: currentLinkmanPeerId
      })
      if (messages && messages.length > 0) {
        await chatComponent.remove(ChatDataType.MESSAGE, messages, null)
      }
      let chat = store.state.chatMap[currentLinkmanPeerId]
      if (chat) {
        chat = await chatComponent.get(ChatDataType.CHAT, chat._id)
        if (chat) {
          await chatComponent.remove(ChatDataType.CHAT, chat, store.state.chats)
        }
        delete store.state.chatMap[currentLinkmanPeerId]
      }

      // 删除管理的群中的成员关系
      let selectedGroupChatMembers = []
      selectedGroupChatMembers.push(store.state.linkmanMap[currentLinkmanPeerId])
      if (managedJointGroupChats.length > 0) {
        for (let managedJointGroupChat of managedJointGroupChats) {
          await _that.removeGroupChatMember(managedJointGroupChat, selectedGroupChatMembers)
        }
      }

      // 删除联系人
      let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, store.state.currentLinkman._id)
      await contactComponent.remove(ContactDataType.LINKMAN, linkmanRecord, store.state.linkmans)
      delete store.state.linkmanMap[currentLinkmanPeerId]
      // 页面重定向
      if (_that.ifMobileSize || store.state.ifMobileStyle) {
        store.toggleDrawer(false)
        store.state.currentLinkman = null
      } else {
        store.changeKind('receivedList')
        store.state.currentLinkman = null
      }
    },
    async removeGroupChatMember(groupChat, selectedGroupChatMembers) {
      let _that = this
      let store = _that.$store
      let myselfPeerClient = myself.myselfPeerClient
      ////let groupChat = store.state.groupChatMap[store.state.currentChat.subjectId]
      let groupMembers = groupChat.groupMembers
      let currentTime = new Date()
      // 先保存要通知的群组成员
      let groupChatLinkmans = []
      for (let groupMember of groupMembers) {
        let linkman = store.state.linkmanMap[groupMember.memberPeerId]
        if (linkman) { // 自己和非联系人除外
          groupChatLinkmans.push(store.state.linkmanMap[groupMember.memberPeerId])
        }
      }

      // 删除群组成员
      let groupMembersWithFlag = []
      let removedGroupMemberNames
      ////for (let selectedGroupChatMember of _that.selectedGroupChatMembers) {
      for (let selectedGroupChatMember of selectedGroupChatMembers) {
        let gms = await contactComponent.loadGroupMember({
          ownerPeerId: myselfPeerClient.peerId,
          groupId: groupChat.groupId,
          memberPeerId: selectedGroupChatMember.peerId
        })
        await contactComponent.remove(ContactDataType.GROUP_MEMBER, gms, groupMembers)

        let groupMember = {}
        groupMember.groupId = groupChat.groupId
        groupMember.memberPeerId = selectedGroupChatMember.peerId
        groupMember.dirtyFlag = 'DELETED' // 脏标志
        groupMembersWithFlag.push(groupMember)
        removedGroupMemberNames = (removedGroupMemberNames ? removedGroupMemberNames + _that.$i18n.t(", ") : '') + (selectedGroupChatMember.givenName ? selectedGroupChatMember.givenName : selectedGroupChatMember.name)
        let linkman = store.state.linkmanMap[groupMember.memberPeerId]
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
        for (let groupChatMember of groupMembers) {
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

      groupChat.groupMembers = groupMembers
      store.state.groupChatMap[groupChat.groupId] = groupChat

      // 新增Sent请求
      let linkmanRequest = {}
      linkmanRequest.requestType = RequestType.REMOVE_GROUPCHAT_MEMBER
      linkmanRequest.ownerPeerId = myselfPeerClient.peerId
      linkmanRequest.senderPeerId = myselfPeerClient.peerId
      linkmanRequest.data = JSON.stringify(groupMembersWithFlag) // 数据库为JSON格式
      linkmanRequest.groupId = groupChat.groupId
      linkmanRequest.createDate = currentTime
      linkmanRequest.status = RequestStatus.SENT
      await contactComponent.insert(ContactDataType.LINKMAN_REQUEST, linkmanRequest)

      linkmanRequest.data = groupMembersWithFlag // 内存为对象格式

      // 保存/发送Sent请求
      let message = {
        subjectType: SubjectType.LINKMAN_REQUEST,
        messageType: P2pChatMessageType.REMOVE_GROUPCHAT_MEMBER,
        content: linkmanRequest
      }
      for (let groupChatLinkman of groupChatLinkmans) {
        await store.saveAndSendMessage(message, groupChatLinkman)
      }

      let chat = await store.getChat(groupChat.groupId)
      let chatMessage = {
        messageType: P2pChatMessageType.CHAT_SYS,
        contentType: ChatContentType.EVENT,
        content: _that.$i18n.t("You") + _that.$i18n.t(" have removed ") + removedGroupMemberNames + _that.$i18n.t(" from group chat")
      }
      await store.addCHATSYSMessage(chat, chatMessage)
    },
    back() {
      let _that = this
      let store = _that.$store
      if (store.contactsDetailsEntry === 'contacts') {
        store.toggleDrawer(false)
      } else if (store.contactsDetailsEntry === 'findContacts') {
        store.state.findContactsSubKind = 'default'
      } else if (store.contactsDetailsEntry === 'CHATDetails' || store.contactsDetailsEntry === 'GROUP_CHATDetails' || store.contactsDetailsEntry === 'default') {
        store.changeMessageSubKind(store.contactsDetailsEntry)
      } else if (store.contactsDetailsEntry === 'message') {
        store.changeKind('message')
      } else if (store.contactsDetailsEntry === 'blackList') {
        store.changeBlackListSubKind('default')
      } else if (store.contactsDetailsEntry === 'lockList') {
        store.changeLockListSubKind('default')
      } else if (store.contactsDetailsEntry === 'contactsTagList') {
        store.changeContactsTagListSubKind('editContactsTag')
      } else if (store.contactsDetailsEntry === 'phoneContactsList') {
        store.changePhoneContactsListSubKind('default')
      }
      /*if (store.contactsDetailsEntry !== 'contacts') {
        if (store.state.ifMobileStyle) {
          statusBarComponent.style(true, '#eee')
        }
      }*/
    },
    showFullscreen() {
      let _that = this
      let store = _that.$store
      _that.subKind = 'fullscreen'
      _that.$nextTick(() => {
        var img = new Image()
        img.src = store.state.currentLinkman.avatar ? store.state.currentLinkman.avatar : store.defaultActiveAvatar
        console.log('img.width: ' + img.width + ', img.height: ' + img.height)
        let avatarContainer = document.getElementById('avatarContainer')
        let canvas = document.getElementById('avatar')
        let ctx = canvas.getContext('2d')
        canvas.width = _that.ifMobileSize || store.state.ifMobileStyle ? _that.$q.screen.width : (img.width > avatarContainer.clientWidth ? avatarContainer.clientWidth : img.width)
        canvas.height = canvas.width * img.height / img.width
        console.log('canvasWidth: ' + canvas.width + ', canvasHeight: ' + canvas.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        let avatarImg = document.querySelector('#avatarImg')
        avatarImg.src = canvas.toDataURL('image/png', 1.0)
        let marginTop = (_that.$q.screen.height - canvas.height) / 2
        avatarImg.style.cssText += 'margin-top: ' + (marginTop < 0 ? 0 : marginTop) + 'px'
        if (store.ifMobile()) {
          alloyFingerComponent.initImage('#avatarImg')
          alloyFingerComponent.initLongSingleTap('#avatarContainer', _that.operateAvatar, _that.fullscreenBack)
        }
      })
    },
    fullscreenBack() {
      let _that = this
      let bottomSheet = document.getElementsByClassName('q-bottom-sheet')
      if (!bottomSheet || !bottomSheet[0] || bottomSheet[0].style.display === 'none') { // 排除longTap触发的singleTapCallback
        _that.subKind = 'default'
      }
    },
    operateAvatar: function () {
      let _that = this
      let store = _that.$store
      if (store.ifMobile()) {
        _that.$q.bottomSheet({
          actions: [
            {
              label: _that.$i18n.t('Save Picture'),
              icon: 'save',
              color: 'primary',
              id: 'save'
            },
            {},
            {
              label: _that.$i18n.t('Cancel'),
              icon: 'cancel',
              color: 'primary',
              id: 'cancel'
            }
          ]
        }).onOk(async action => {
          // console.log('Action chosen:', action.id)
          if (action.id === 'save') {
            window.canvas2ImagePlugin.saveImageDataToLibrary(
              function (msg) {
                console.log(msg)
                _that.$q.notify({
                  message: _that.$i18n.t("Save successfully"),
                  timeout: 3000,
                  type: "info",
                  color: "info",
                })
              },
              function (err) {
                console.log(err)
                _that.$q.notify({
                  message: _that.$i18n.t("Save failed"),
                  timeout: 3000,
                  type: "warning",
                  color: "warning",
                })
              },
              document.getElementById('avatar'),
              "jpeg" // format is optional, defaults to 'png'
            )
          }
        }).onCancel(() => {
          // console.log('Dismissed')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      } else {
        _that.$q.bottomSheet({
          actions: [
            {
              label: _that.$i18n.t('Save Picture'),
              icon: 'save',
              color: 'primary',
              id: 'save'
            },
            {},
            {
              label: _that.$i18n.t('Cancel'),
              icon: 'cancel',
              color: 'primary',
              id: 'cancel'
            }
          ]
        }).onOk(action => {
          // console.log('Action chosen:', action.id)
          if (action.id === 'save') {
            let avatarBase64 = myself.myselfPeerClient.avatar ? myself.myselfPeerClient.avatar : store.defaultActiveAvatar
            let arr = avatarBase64.split(',')
            let mime = arr[0].match(/:(.*?);/)[1]
            let extension = mime.split('/')[1]
            var a = document.createElement('a')
            a.href = BlobUtil.blobToUrl(BlobUtil.base64ToBlob(avatarBase64))
            a.download = (store.state.currentLinkman.givenName ? store.state.currentLinkman.givenName : store.state.currentLinkman.name) + '-' + _that.$i18n.t('collaAvatar') + '.' + extension
            a.click()
          }
        }).onCancel(() => {
          // console.log('Dismissed')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
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
  mounted() {
    let _that = this
    let store = _that.$store
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeContactsDetailsSubKind = function (subKind) {
      _that.subKind = subKind
    }
  },
  watch: {
    /*subKind(val) {
      let _that = this
      let store = _that.$store
      if (store.state.ifMobileStyle) {
        if (val === 'default') {
          statusBarComponent.style(true, '#ffffff')
        } else if (val === 'fullscreen') {
          statusBarComponent.style(false, '#000000')
        } else {
          statusBarComponent.style(true, '#eee')
        }
      }
    }*/
  }
}
