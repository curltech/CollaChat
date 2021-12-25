import { chatComponent, ChatContentType, ChatDataType, P2pChatMessageType, SubjectType, chatBlockComponent } from '@/libs/biz/colla-chat'
import MessageContent from '@/components/messageContent'

export default {
  name: 'MergeMessageDialog',
  components: {
    messageContent: MessageContent
  },
  props: [],
  data() {
    return {
      SubjectType: SubjectType,
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
  },
  methods: {
    closeMergeMessageDialog() {
      let _that = this
      let store = _that.$store
      store.state.mergeMessageDialog = false
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
