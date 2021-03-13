import { chatComponent, ChatContentType, ChatDataType, P2pChatMessageType, SubjectType, chatBlockComponent } from '@/libs/biz/colla-chat'

export default {
  name: 'NoteMessageDialog',
  props: [],
  data() {
    return {
      SubjectType: SubjectType
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
  },
  methods: {
    getAvatar(message) {
      let state = this.$store.state
      let senderPeer = state.linkmanMap[message.senderPeerId]
      let avatar1 = state.myselfPeerClient.avatar ? state.myselfPeerClient.avatar : this.$store.defaultActiveAvatar
      let avatar2 = (senderPeer && senderPeer.avatar) ? senderPeer.avatar : this.$store.defaultActiveAvatar
      let avatar = message.senderPeerId === state.myselfPeerClient.peerId ? avatar1 : avatar2

      return avatar
    },
    getName(message) {
      let state = this.$store.state
      let senderPeer = state.linkmanMap[message.senderPeerId]
      let gName = senderPeer ? senderPeer.givenName : null
      let name = senderPeer ? senderPeer.name : null
      let name1 = gName ? gName : name
      let name2 = message.senderPeerId === state.myselfPeerClient.peerId ? state.myselfPeerClient.name : name1
      name = (message.subjectType === SubjectType.CHAT) ? '' : name2

      return name
    },
    closeNoteMessageDialog() {
      let _that = this
      let store = _that.$store
      store.state.noteMessageDialog = false
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
