import Wallet from '@/components/wallet'
import General from '@/components/general'
import AdvanceSetting from '@/components/advanceSetting'
import About from '@/components/about'
import { p2pPeer } from 'libcolla'

export default {
  name: 'Me',
  components: {
    wallet: Wallet,
    general: General,
    advanceSetting: AdvanceSetting,
    about: About
  },
  data() {
    return {
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
