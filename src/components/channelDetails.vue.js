export default {
  name: "ChannelDetails",
  components: {
  },
  data() {
    return {
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
  methods: {
    articleSelected(channel, index) {
      let _that = this
      let store = _that.$store
      let prevCurrentChannel = store.state.currentChannel
      store.state.currentChannel = channel
      store.channelDetailsEntry = 'channel'
      store.changeKind('channelDetails')
      store.toggleDrawer(true)
      if (!(_that.ifMobileSize || store.state.ifMobileStyle) && prevCurrentChannel && prevCurrentChannel._id !== channel._id) {
        store.changeChannelDetailsSubKind('default')
      }
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  watch: {
  }
}
