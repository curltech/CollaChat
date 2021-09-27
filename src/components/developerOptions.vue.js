import { myself, peerProfileService, logService } from 'libcolla'

import * as CollaConstant from '@/libs/base/colla-constant'

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
      subKind: 'default',
      logLevel: myself.myselfPeerClient && myself.myselfPeerClient.logLevel ? myself.myselfPeerClient.logLevel : 'none',
      logLevelOptions: CollaConstant.logLevelOptions
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
    changeLogLevel: async function () {
      let currentDate = new Date()
      let myselfPeerClient = myself.myselfPeerClient
      myselfPeerClient.logLevel = this.logLevel
      this.$store.state.myselfPeerClient = myselfPeerClient

      let peerProfile = myself.peerProfile
      peerProfile.logLevel = this.logLevel
      peerProfile.updateDate = currentDate
      peerProfile = await peerProfileService.update(peerProfile)
      myself.peerProfile = peerProfile

      logService.setLogLevel(this.logLevel)
    },
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeDeveloperOptionsSubKind = function (subKind) {
      _that.subKind = subKind
    }
  },
  watch: {
    async logLevel(val) {
      await this.changeLogLevel()
    }
  }
}
