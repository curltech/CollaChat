import { SubjectType } from '@/libs/biz/colla-chat'
import { ActiveStatus } from '@/libs/biz/colla-contact'
import { CollaUtil } from 'libcolla'
import GroupAvatar from '@/components/groupAvatar'

export default {
  name: "SelectChatRecord",
  components: {
    groupAvatar: GroupAvatar
  },
  props: [],
  data() {
    return {
      ActiveStatus: ActiveStatus,
      SubjectType: SubjectType,
      selectChatRecordfilter: null,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search'),
      textOnlyFlag: true,
      selectAllFlag: false,
      inclContactsInfoFlag: true
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
    ChatName() {
      let _that = this
      let store = _that.$store
      return function (chat) {
        let subjectType = chat.subjectType
        let subjectId = chat.subjectId
        return store.getChatName(subjectType, subjectId)
      }
    },
    SelectChatFilteredList() {
      let _that = this
      let store = _that.$store
      let SelectChatFilteredArray = []
      let chats = store.state.chats
      if (chats && chats.length > 0) {
        let selectChatRecordfilter = _that.selectChatRecordfilter
        if (selectChatRecordfilter) {
          SelectChatFilteredArray = chats.filter((chat) => {
            if (chat) {
              if (chat.subjectType === SubjectType.CHAT) {
                let linkman = store.state.linkmanMap[chat.subjectId]
                return (linkman.peerId.toLowerCase().includes(selectChatRecordfilter.toLowerCase())
                  || (linkman.mobile && linkman.mobile.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || linkman.name.toLowerCase().includes(selectChatRecordfilter.toLowerCase())
                  || linkman.pyName.toLowerCase().includes(selectChatRecordfilter.toLowerCase())
                  || (linkman.givenName && linkman.givenName.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (linkman.pyGivenName && linkman.pyGivenName.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (linkman.tag && chat.tag.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (linkman.pyTag && chat.pyTag.toLowerCase().includes(selectChatRecordfilter.toLowerCase())))
                  && ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
              } else if (chat.subjectType === SubjectType.GROUP_CHAT) {
                let groupChat = store.state.groupChatMap[chat.subjectId]
                return (groupChat.groupId.toLowerCase().includes(selectChatRecordfilter.toLowerCase())
                  || (groupChat.name && groupChat.name.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (groupChat.pyName && groupChat.pyName.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (groupChat.description && groupChat.description.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (groupChat.pyDescription && groupChat.pyDescription.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (groupChat.givenName && groupChat.givenName.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (groupChat.pyGivenName && groupChat.pyGivenName.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (groupChat.tag && groupChat.tag.toLowerCase().includes(selectChatRecordfilter.toLowerCase()))
                  || (groupChat.pyTag && groupChat.pyTag.toLowerCase().includes(selectChatRecordfilter.toLowerCase())))
              }
            }
          })
        } else {
          SelectChatFilteredArray = chats.filter((chat) => {
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
        CollaUtil.sortByKey(SelectChatFilteredArray, 'updateTime', 'desc')
      }
      return SelectChatFilteredArray
    }
  },
  methods: {
    selectChatRecord(chat, ifCheckbox) {
      if (!ifCheckbox) {
        chat.selected = !chat.selected
      }
      if (chat.selected) {
        this.$store.state.includedChatRecords.push(chat)
      } else {
        let index = 0
        for (let includedChat of this.$store.state.includedChatRecords) {
          if (includedChat.subjectId === chat.subjectId) {
            this.$store.state.includedChatRecords.splice(index, 1)
            return
          }
          index++
        }
      }
    },
    unselectChatRecord(index) {
      this.$store.state.includedChatRecords[index].selected = false
      this.$store.state.includedChatRecords.splice(index, 1)
    },
    async doneSelectChatRecord() {
      let _that = this
      let store = _that.$store
      if (store.selectChatRecordEntry === 'selectChat') {
        for (let chatRecord of store.state.includedChatRecords) {
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
      } else if (store.selectChatRecordEntry.indexOf('backupMigration') === 0) {
        store.textOnlyFlag = _that.textOnlyFlag
        store.inclContactsInfoFlag = _that.inclContactsInfoFlag
        if (store.selectChatRecordEntry === 'backupMigrationLocalBackup') {
          await store.localBackup()
        } else if (store.selectChatRecordEntry === 'backupMigrationMigrate') {
          await store.migrate()
        } else if (store.selectChatRecordEntry === 'backupMigrationBackup') {
          await store.backup()
        }
      }
    },
    back() {
      let _that = this
      let store = _that.$store
      if (store.selectChatRecordEntry === 'selectChat') {
        store.selectChatBack()
      } else if (store.selectChatRecordEntry.indexOf('backupMigration') === 0) {
        store.changeBackupMigrationSubKind('default')
      }
    },
    selectAll() {
      let _that = this
      let store = _that.$store
      if (_that.selectAllFlag) {
        store.state.includedChatRecords = []
        for (let chat of store.state.chats) {
          chat.selected = false
        }
      } else {
        _that.selectChatRecordfilter = null
        store.state.includedChatRecords = []
        for (let chat of store.state.chats) {
          chat.selected = true
          store.state.includedChatRecords.push(chat)
        }
      }
      _that.selectAllFlag = !_that.selectAllFlag
    }
  },
  created() {
    let _that = this
    let store = this.$store
  },
  watch: {}
}
