import { SubjectType } from '@/libs/biz/colla-chat'
import { ActiveStatus } from '@/libs/biz/colla-contact'
import GroupAvatar from '@/components/groupAvatar'
import SelectChatRecord from '@/components/selectChatRecord'
import SelectContacts from '@/components/selectContacts'
import SelectGroupChat from '@/components/selectGroupChat'

export default {
  name: "SelectChat",
  components: {
    groupAvatar: GroupAvatar,
    selectChatRecord: SelectChatRecord,
    selectContacts: SelectContacts,
    selectGroupChat: SelectGroupChat,
  },
  props: [],
  data() {
    return {
      ActiveStatus: ActiveStatus,
      SubjectType: SubjectType,
      subKind: ''
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
  },
  methods: {
    back() {
      let _that = this
      let store = _that.$store
      if (store.selectChatEntry === 'collectionForward') {
        store.changeCollectionSubKind('view')
      } else if (store.selectChatEntry === 'messageForward') {
        store.changeMessageSubKind('default')
      } else if (store.selectChatEntry === 'accountInformationQrCode') {
        store.accountInformationEnterQRCode()
      } else if (store.selectChatEntry === 'accountSecurityQrCode') {
        store.changeAccountSecuritySubKind('qrCode')
      } else if (store.selectChatEntry === 'channelForward') {
        store.changeChannelDetailsSubKind('default')
      } else if (store.selectChatEntry === 'articleForward') {
        store.changeChannelDetailsSubKind('view')
      } else if (store.selectChatEntry === 'aboutQrCode') {
        store.aboutEnterQRCode()
      } else if (store.selectChatEntry === 'collectionImg') {
        store.changeCollectionSubKind('fullscreen')
      } else if (store.selectChatEntry === 'articleImg') {
        store.changeArticleSubKind('fullscreen')
      }
    },
    gotoSelectChatRecord() {
      let _that = this
      let store = _that.$store
      for (let chat of store.state.chats) {
        chat.selected = false
      }
      store.state.includedChatRecords = []
      store.selectChatRecordEntry = 'selectChat'
      _that.subKind = 'selectChatRecord'
    },
    gotoSelectContacts() {
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
      store.selectContactsEntry = 'selectChat'
      _that.subKind = 'selectContacts'
    },
    gotoSelectGroupChat() {
      let _that = this
      let store = _that.$store
      store.selectGroupChatEntry = 'selectChat'
      _that.subKind = 'selectGroupChat'
    }
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  created() {
    let _that = this
    let store = this.$store
    store.changeSelectChatSubKind = function (subKind) {
      _that.subKind = subKind
    }
    store.gotoSelectContacts = _that.gotoSelectContacts
    store.gotoSelectGroupChat = _that.gotoSelectGroupChat
    store.selectChatBack = _that.back
    _that.gotoSelectChatRecord()
  },
  watch: {}
}
