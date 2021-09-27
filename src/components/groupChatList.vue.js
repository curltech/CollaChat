import { date } from 'quasar'
import { myself } from 'libcolla'
import GroupAvatar from '@/components/groupAvatar'
import { ActiveStatus } from '@/libs/biz/colla-contact'
import { SubjectType } from '@/libs/biz/colla-chat'

export default {
  name: "GroupChatList",
  components: {
    groupAvatar: GroupAvatar
  },
  props: [],
  data() {
    return {
      tab: 'ownerGroupChatList',
      date: date,
      ActiveStatus: ActiveStatus
    }
  },
  methods: {
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    OwnerGroupChatList() { // 我管理的群聊
      let _that = this
      let store = _that.$store
      let OwnerGroupChatArray = []
      let myselfPeerClient = myself.myselfPeerClient
      let groupChats = store.state.groupChats
      if (groupChats && groupChats.length > 0) {
        for (let groupChat of groupChats) {
          if (groupChat.groupOwnerPeerId === myselfPeerClient.peerId) {
            OwnerGroupChatArray.push(groupChat)
          }
        }
      }
      return OwnerGroupChatArray
    },
    MemberGroupChatList() { // 我加入的群聊
      let _that = this
      let store = _that.$store
      let MemberGroupChatArray = []
      let myselfPeerClient = myself.myselfPeerClient
      let groupChats = store.state.groupChats
      if (groupChats && groupChats.length > 0) {
        for (let groupChat of groupChats) {
          if (groupChat.groupOwnerPeerId !== myselfPeerClient.peerId) {
            MemberGroupChatArray.push(groupChat)
          }
        }
      }
      return MemberGroupChatArray
    },
    ChatName() {
      let _that = this
      let store = _that.$store
      return function (groupChat) {
        return store.getChatName(SubjectType.GROUP_CHAT, groupChat.groupId)
      }
    }
  },
  mounted() {
    let _that = this
    let store = _that.$store
  },
  watch: {
  }
}
