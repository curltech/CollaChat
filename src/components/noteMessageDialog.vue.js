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
