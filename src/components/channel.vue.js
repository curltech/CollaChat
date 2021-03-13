export default {
  name: "Channel",
  components: {
  },
  data() {
    return {
      channelfilter: null,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search')
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    }
  },
  methods: {
  },
  created() {
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
