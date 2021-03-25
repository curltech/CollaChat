import SystemInfo from '@/components/systemInfo'
import DebugInfo from '@/components/debugInfo'

export default {
  name: "DeveloperOptions",
  components: {
    systemInfo: SystemInfo,
    debugInfo: DebugInfo
  },
  data() {
    return {
      subKind: 'default'
    }
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    }
  },
  methods: {
  },
  mounted() {
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeDeveloperOptionsSubKind = function (subKind) {
      _that.subKind = subKind
    }
  },
  watch: {
  }
}
