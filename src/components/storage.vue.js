import { myself } from 'libcolla'
import { CollaUtil } from 'libcolla'

import { deviceComponent } from '@/libs/base/colla-cordova'

export default {
  name: "Storage",
  components: {
  },
  data() {
    return {
      range: {
        min: 0,
        max: 100,
        step: 1
      },
      zones: [
        { color: myself.myselfPeerClient.primaryColor, min: 0, max: 0 },
        { color: 'orange', min: 0, max: 0 }
      ],
      colla: '',
      others: '',
      free: '',
    }
  },
  methods: {
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    },
    trackStyle () {
      const colors = []
      const { min, max } = this.range
      const range = max - min

      let prev = min

      for (let i = 0; i < this.zones.length; i++) {
        const zone = this.zones[i]

        if (zone.min > prev) {
          colors.push(`transparent ${(prev - min) / range * 100}%`)
          colors.push(`transparent ${(zone.min - min) / range * 100}%`)
        }

        colors.push(`${zone.color} ${(zone.min - min) / range * 100}%`)
        colors.push(`${zone.color} ${(zone.max - min) / range * 100}%`)

        prev = zone.max
      }

      if (prev < max) {
        colors.push(`transparent ${(prev - min) / range * 100}%`)
        colors.push(`transparent ${(max - min) / range * 100}%`)
      }

      return {
        '--track-bg': `linear-gradient(to right,${colors.join(',')})`
      }
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
    if (store.ios === true || store.android === true) {
      let diskInfo = await deviceComponent.getDiskInfo({location: 1})
      console.log(JSON.stringify(diskInfo))
      if (diskInfo && diskInfo.total) {
        _that.zones[0].max = parseInt(diskInfo.app / diskInfo.total * 100)
        _that.zones[1].min = _that.zones[0].max
        _that.zones[1].max = parseInt((diskInfo.total - diskInfo.free) / diskInfo.total * 100)
        _that.colla = CollaUtil.formatSpaceSize(diskInfo.app)
        //_that.other = CollaUtil.formatSpaceSize(diskInfo.total - diskInfo.free - diskInfo.app)
        _that.free = CollaUtil.formatSpaceSize(diskInfo.free)
      }
    //} else if (store.chrome === true) {
    } else {
      let storageInfo = await deviceComponent.getStorageInfo()
      if (storageInfo && storageInfo.quota) {
        _that.zones[0].max = parseInt(storageInfo.usage / storageInfo.quota * 100)
        if (!_that.zones[0].max) {
          _that.zones[0].max = Math.round(storageInfo.usage / storageInfo.quota * 100	 * 10) / 10
          if (!_that.zones[0].max) {
            _that.zones[0].max = Math.round(storageInfo.usage / storageInfo.quota * 100	 * 100) / 100
            if (!_that.zones[0].max) {
              _that.zones[0].max = Math.round(storageInfo.usage / storageInfo.quota * 100	 * 1000) / 1000
            }
          }
        }
        console.log('CollaData:' + _that.zones[0].max)
        _that.colla = CollaUtil.formatSpaceSize(storageInfo.usage)
        _that.free = CollaUtil.formatSpaceSize(storageInfo.quota - storageInfo.usage)
      }
      /*let temporaryStorageInfo = await deviceComponent.getTemporaryStorageInfo()
      console.log(JSON.stringify(temporaryStorageInfo))
      let persistentStorageInfo = await deviceComponent.getPersistentStorageInfo()
      console.log(JSON.stringify(persistentStorageInfo))*/
    //} else {
    //  debugger
    }
  }
}