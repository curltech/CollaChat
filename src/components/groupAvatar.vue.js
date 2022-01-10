import { peerClientService } from 'libcolla'

export default {
  name: "groupAvatar",
  props: ['group_members','unReadCount','avatar_width','bgClass'],
  data() {
    return {
      messageText: null,
    }
  },
  computed: {
  },
  methods: {
    pasteCapture(evt) {
      debugger
    },
    groupChatMemeberAvatar(groupChatMember) {
      let _that = this
      let store = _that.$store
      let state = store.state
      let avatar = this.$store.defaultActiveAvatar
      let memberPeerId = groupChatMember.memberPeerId
      if (memberPeerId === state.myselfPeerClient.peerId) {
        if (state.myselfPeerClient.avatar) {
          avatar = state.myselfPeerClient.avatar
        }
      } else {
        let linkman = store.state.linkmanMap[memberPeerId]
        if (linkman) {
          if (linkman.avatar) {
            avatar = linkman.avatar
          }
        } else {
          let peerClient = peerClientService.getPeerClientFromCache(memberPeerId)
          if (peerClient && peerClient.avatar) {
            avatar = peerClient.avatar
          }
        }
      }
      return avatar
    }
  },
  async mounted() {
    let _that = this
    let store = _that.$store
  }
}
