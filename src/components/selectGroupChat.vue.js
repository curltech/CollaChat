import { SubjectType } from '@/libs/biz/colla-chat'
import { ActiveStatus } from '@/libs/biz/colla-contact'
import { myself } from 'libcolla'
import GroupAvatar from '@/components/groupAvatar'

export default {
  name: "SelectGroupChat",
  components: {
    groupAvatar: GroupAvatar
  },
  props: [],
  data() {
    return {
      ActiveStatus: ActiveStatus,
      SubjectType: SubjectType,
      groupChatData: {
        name: null,
        description: null,
        givenName: null,
        tag: null,
        myAlias: null
      },
      selectGroupChatFilter: null,
      includedGroupChat: [],
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
    SelectGroupChatFilteredList() { // 发起群聊待选择联系人（含黑名单、上锁联系人显示控制、selectContactsfilter过滤搜索）
      let _that = this
      let store = _that.$store
      let SelectGroupChatFilteredArray = []
      let groupChats = store.state.groupChats
      if (groupChats && groupChats.length > 0) {
        let selectGroupChatFilter = _that.selectGroupChatFilter
        if (selectGroupChatFilter) {
          SelectGroupChatFilteredArray = groupChats.filter((groupChat) => {
            return ((groupChat.name && groupChat.name.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (groupChat.pyName && groupChat.pyName.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (groupChat.givenName && groupChat.givenName.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (groupChat.pyGivenName && groupChat.pyGivenName.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (groupChat.description && groupChat.description.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (groupChat.pyDescription && groupChat.pyDescription.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (groupChat.tag && groupChat.tag.toLowerCase().includes(selectContactsfilter.toLowerCase()))
              || (groupChat.pyTag && groupChat.pyTag.toLowerCase().includes(selectContactsfilter.toLowerCase())))
              && ((store.state.lockContactsSwitch && !groupChat.locked) || !store.state.lockContactsSwitch)
          })
        } else {
          SelectGroupChatFilteredArray = groupChats.filter((groupChat) => {
            return (store.state.lockContactsSwitch && !groupChat.locked) || !store.state.lockContactsSwitch
          })
        }
      }
      return SelectGroupChatFilteredArray
    },
    SelectedGroupChatList() {
      let _that = this
      let store = _that.$store
      let SelectedLinkmanArray = []
      SelectedLinkmanArray = _that.includedGroupChat.filter((includedLinkman) => {
        return (!includedLinkman.existing)
      })
      return SelectedLinkmanArray
    },
    groupChatShortName() {
      return function (groupId) {
        let _that = this
        let store = _that.$store
        let chatName = store.getChatName(SubjectType.GROUP_CHAT, groupId)
        return chatName.length > 3 ? chatName.substr(0, 3) + '...' : chatName
      }
    }
  },
  methods: {
    selectGroupChat(groupChat, ifCheckbox) {
      let _that = this
      if (!ifCheckbox) {
        groupChat.selected = !groupChat.selected
      }
      if (groupChat.selected) {
        _that.includedGroupChat.push(groupChat)
      } else {
        let index = 0
        for (let includedLinkman of _that.includedGroupChat) {
          if (includedLinkman.peerId === groupChat.peerId) {
            _that.includedGroupChat.splice(index, 1)
            return
          }
          index++
        }
      }
    },
    unselectGroupChat(index) {
      let _that = this
      _that.includedGroupChat[index].selected = false
      _that.includedGroupChat.splice(index, 1)
    },
    async doneSelectGroupChat() {
      let _that = this
      let store = _that.$store
      if (store.selectGroupChatEntry === 'selectChat') {
        for (let group of _that.includedGroupChat) {
          let chatRecord = await store.getChat(group.groupId)
          if (store.selectChatEntry === 'collectionForward') {
            let currentCollection = store.state.currentCollection
            await store.collectionForwardToChat(currentCollection, chatRecord)
          } else if (store.selectChatEntry === 'messageForward') {
            await store.forwardToChat(chatRecord)
          } else if (store.selectChatEntry === 'accountInformationQrCode'
            || store.selectChatEntry === 'accountSecurityQrCode'
            || store.selectChatEntry === 'aboutQrCode'
            || store.selectChatEntry === 'collectionImg'
            || store.selectChatEntry === 'articleImg') {
            await store.imgForwardToChat(store.state.currentQrCode, chatRecord)
          } else if (store.selectChatEntry === 'channelForward') {
            await store.channelForwardToChat(store.state.currentChannel, chatRecord)
          } else if (store.selectChatEntry === 'articleForward') {
            await store.articleForwardToChat(store.state.currentArticle, chatRecord)
          }
        }
      }
    },
    back() {
      let _that = this
      let store = _that.$store
      if (store.selectGroupChatEntry === 'selectChat') {
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
