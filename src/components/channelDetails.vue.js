
export default {
  name: "ChannelDetails",
  components: {
  },
  data() {
    return {
      channelData: {
        avatar: this.$store.defaultActiveAvatar,
        name: null,
        description: null
      },
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
  },
  created() {
    let _that = this
    let store = _that.$store
  },
  watch: {
  }
}
