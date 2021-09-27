import { webrtcEncrypt } from 'libcolla'
import { mediaStreamComponent } from '@/libs/base/colla-media'

export default {
  name: 'SystemInfo',
  components: {
  },
  data() {
    return {
      mediaDevices: null
    }
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    },
    device() {
      let device = {}
      let is = this.$q.platform.is
      device.platform = is.win === true ? 'win' : (is.ios === true ? 'ios' : (is.android === true ? 'android' : (is.mac === true ? 'mac' : '')))
      device.browser = is.chrome === true ? 'chrome' : (is.safari === true ? 'safari' : (is.edge === true ? 'edge' : ''))
      device.version = is.version
      device.device = is.desktop === true ? 'desktop' : (is.iphone === true ? 'iphone' : (is.ipad === true ? 'ipad' : (is.android === true ? 'android' : '')))
      device.cordova = is.cordova === true ? 'cordova' : (is.electron === true ? 'electron' : '')
      device.touch = this.$q.platform.has.touch
      device.webStorage = this.$q.platform.has.webStorage
      device.userAgent = this.$q.platform.userAgent

      return device
    },
    constraints() {
      let constraints = mediaStreamComponent.getSupportedConstraints()

      return JSON.stringify(constraints)
    },
    isSupportInsertableStream() {

      return webrtcEncrypt.supportInsertableStream()
    },
    getUserMedia() {
      if (navigator.getUserMedia) {
        return true
      }
      if (!navigator.mediaDevices) {
        return false
      }
      if (navigator.mediaDevices.getUserMedia) {
        return true
      }
      return false
    },
    getDisplayMedia() {
      if (navigator.getDisplayMedia) {
        return true
      }
      if (!navigator.mediaDevices) {
        return false
      }
      if (navigator.mediaDevices.getDisplayMedia) {
        return true
      }
      return false
    }
  },
  created() {
    let _this = this
    mediaStreamComponent.enumerateDevices().then(function (mediaDevices) {
      _this.mediaDevices = mediaDevices
    })

    this.mimeTypes = mediaStreamComponent.isTypeSupported()
  }
}
