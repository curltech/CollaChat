import { webrtcEncrypt } from 'libcolla'

import { mediaStreamComponent, mediaCaptureComponent, audioInputComponent } from '@/libs/base/colla-media'

export default {
  name: 'Developer',
  components: {

  },
  data() {
    return {
      mediaDevices: null,
      blob: null
    }
  },
  computed: {
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
    videoCodecs() {
      let peerConnection = new RTCPeerConnection()
      const senders = peerConnection.getSenders()
      //let videoCodecs = webrtcComponent.getVideoCodecs(peerConnection)

      return videoCodecs
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
    },
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    }
  },
  methods: {
    start() {
      audioInputComponent.startRecord()
    },
    async stop() {
      await audioInputComponent.stopRecord()
    },
    play() {
      this.blob = audioInputComponent.getBlob()
      alert(this.blob.type)
      audioInputComponent.play()
    },
    capture(){
      mediaCaptureComponent.captureVideo()
    }
  },
  created() {
    let _this = this
    mediaStreamComponent.enumerateDevices().then(function (mediaDevices) {
      _this.mediaDevices = mediaDevices
    })

    this.mimeTypes = mediaStreamComponent.isTypeSupported()
  },
  mounted() {

  },
  watch: {
  }
}
