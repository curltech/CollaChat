import Recorder from 'recorder-core/recorder.mp3.min' // 已包含recorder-core和mp3格式支持
import 'recorder-core/src/extensions/frequency.histogram.view'
import 'recorder-core/src/extensions/lib.fft.js'

import { CollaUtil } from 'libcolla'

import { mediaRecorderComponent, mediaStreamComponent, mediaComponent } from '@/libs/base/colla-media'

export default {
  name: "CaptureMedia",
  components: {
  },
  props: [],
  data() {
    return {
      captureSlide: '1',
      constraints: null,
      initWidth: null,
      initHeight: null,
      srcStream: null,
      captureStatus: false,
      captureRecorder: null,
      imageUrl: null,
      videoUrl: null,
      audioUrl: null,
      rec: null,
      wave: null
    }
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    },
    recwaveHeightStyle() {
      return {
        height: `${this.$q.screen.height - 280}px`
      }
    }
  },
  methods: {
    openStream: function () {
      let _that = this
      let store = _that.$store
      let captureType = store.captureType
      _that.$nextTick(async () => {
        if (captureType === 'image' || captureType === 'video') {
          let videoContainer = document.querySelector('#videoContainer')
          _that.initWidth = _that.ifMobileSize || store.state.ifMobileStyle ? _that.$q.screen.width : videoContainer.clientWidth
          if (store.ifMobile()) {
            _that.initHeight = store.screenHeight - 50 - 80 // 不使用_that.$q.screen.height，避免键盘弹出时的影响
          } else {
            _that.initHeight = videoContainer.clientHeight - 50 - 80
          }
          _that.constraints = {
            audio: {
              echoCancellation: { exact: true },
              noiseSuppression: true
            },
            video: {
              echoCancellation: { exact: true },
              noiseSuppression: true,
              width: _that.initHeight,
              height: _that.initWidth,
              facingMode: 'environment'
            }
          }
          let srcVideo = _that.$refs['srcVideo']
          if (srcVideo) {
            try {
              await mediaStreamComponent.play(srcVideo, _that.constraints).then(function (stream) {
                _that.srcStream = stream
              })
            } catch (e) {
              console.error(e)
            }
            srcVideo.addEventListener('canplay', function () {
              let width = this.videoWidth
              let height = this.videoHeight
              /*let initWidth = _that.$q.screen.width < 481 ? _that.$q.screen.width : 480
              let initHeight = initWidth * height / width
              if (initHeight > store.screenHeight - 50 - 80) { // 不使用_that.$q.screen.height，避免键盘弹出时的影响
                initHeight = store.screenHeight - 50 - 80
                initWidth = initHeight * width / height
              }
              _that.initWidth = initWidth
              _that.initHeight = initHeight*/
              _that.initWidth = width
              _that.initHeight = height
              //let marginTop = (store.screenHeight - _that.initHeight - 50 - 80) / 2
              //console.log('initWidth:' + _that.initWidth + ',initHeight:' + _that.initHeight + ',marginTop:' + marginTop)
              let videoCarousel = document.querySelector('#videoCarousel')
              if (videoCarousel) {
                videoCarousel.style.cssText += 'width: ' + _that.initWidth + 'px'
                videoCarousel.style.cssText += 'height: ' + _that.initHeight + 'px !important'
                //videoCarousel.style.cssText += 'margin-top: ' + marginTop + 'px'
              }
            })
          }
        } else if (captureType === 'audio') {
          let newRec = Recorder({
            type: "mp3",
            sampleRate: 16000,
            bitRate: 16, // mp3格式，指定采样率hz、比特率kbps，其他参数使用默认配置；注意：是数字的参数必须提供数字，不要用字符串；需要使用的type类型，需提前把格式支持文件加载进来，比如使用wav格式需要提前加载wav.js编码引擎
            onProcess: function (buffers, powerLevel, bufferDuration, bufferSampleRate, newBufferIdx, asyncEnd) {
              // 录音实时回调，大约1秒调用12次本回调
              //document.querySelector(".recpowerx").style.width = powerLevel + "%"
              //document.querySelector(".recpowert").innerText = bufferDuration + " / " + powerLevel
              document.querySelector(".recpowert").innerText = CollaUtil.formatSeconds(Math.ceil(bufferDuration / 1000))
              // 可视化图形绘制
              _that.wave.input(buffers[buffers.length - 1], powerLevel, bufferSampleRate)
            }
          })
          newRec.open(function () { // 打开麦克风授权获得相关资源
            _that.rec = newRec
            //_that.wave = Recorder.FrequencyHistogramView({elem: ".recwave"}) // 创建音频可视化图形
            _that.wave = Recorder.FrequencyHistogramView({
              elem: ".recwave",
              lineCount: 90,
              position: 0,
              minHeight: 1,
              stripeEnable: false
            })
          }, function (msg, isUserNotAllow) { // 用户拒绝未授权或不支持
            console.log('Recorder open failure:' + (isUserNotAllow ? 'UserNotAllow, ' : '') + msg)
          })
        }
      })
    },
    reverseCamera: async function () {
      let _that = this
      let store = _that.$store
      if (_that.srcStream) {
        mediaStreamComponent.stop(_that.srcStream)
        _that.srcStream = null
      }
      if (_that.constraints.video.facingMode === 'user') {
        _that.constraints.video.facingMode = 'environment'
      } else if (_that.constraints.video.facingMode === 'environment') {
        _that.constraints.video.facingMode = 'user'
      }
      let srcVideo = _that.$refs['srcVideo']
      try {
        await mediaStreamComponent.play(srcVideo, _that.constraints).then(function (stream) {
          _that.srcStream = stream
        })
      } catch (e) {
        console.error(e)
      }
    },
    captureMedia: async function () {
      let _that = this
      let store = _that.$store
      let captureType = store.captureType
      if (captureType === 'image') {
        let takePhotoAudio = document.getElementById('takePhoto-audio')
        takePhotoAudio.play()
        let srcVideo = _that.$refs['srcVideo']
        _that.imageUrl = mediaRecorderComponent.getPicture(srcVideo, _that.initWidth, _that.initHeight)
      } else if (captureType === 'video') {
        let srcVideo = _that.$refs['srcVideo']
        if (_that.captureStatus === false) {
          _that.captureRecorder = await mediaRecorderComponent.create(_that.srcStream)
          mediaRecorderComponent.startRecording(_that.captureRecorder)
          _that.captureStatus = true
        } else if (_that.captureStatus === true) {
          let blob = await mediaRecorderComponent.stopRecording(_that.captureRecorder, 'blob')
          _that.captureStatus = false
          _that.captureRecorder = null
          let fileReader = new FileReader()
          fileReader.onload = function (e) {
            _that.videoUrl = mediaComponent.fixVideoUrl(e.target.result)
            _that.$nextTick(() => {
              let videoReplayer = _that.$refs['videoReplayer']
              console.log('videoReplayer:' + videoReplayer)
              videoReplayer.width = _that.initWidth
              videoReplayer.height = _that.initHeight
            })
          }
          fileReader.readAsDataURL(blob)
        }
      } else if (captureType === 'audio') {
        if (_that.captureStatus === false) {
          /*_that.constraints = {
            audio: {
              echoCancellation: true,
              recorderType: mediaRecorderComponent.StereoAudioRecorder
            }
          }
          _that.srcStream = await mediaStreamComponent.openUserMedia(_that.constraints)
          let options = {
            type: 'audio',
            numberOfAudioChannels: 2,
            checkForInactiveTracks: true,
            bufferSize: 16384
          }
          _that.captureRecorder = await mediaRecorderComponent.create(_that.srcStream, options)
          mediaRecorderComponent.startRecording(_that.captureRecorder)*/
          _that.rec.start()
          _that.captureStatus = true
        } else if (_that.captureStatus === true) {
          /*_that.audioUrl = await mediaRecorderComponent.stopRecording(this.captureRecorder)*/
          _that.rec.stop(function (blob, duration) {
            console.log('duration:' + duration + 'ms,size:' + blob.size + 'bytes')
            let fileReader = new FileReader()
            fileReader.onload = function (e) {
              _that.audioUrl = e.target.result
            }
            fileReader.readAsDataURL(blob)
          }, function (msg) {
            console.error(msg)
          })
          _that.captureStatus = false
        }
      }
    },
    cancel: async function () {
      let _that = this
      let store = _that.$store
      if (store.captureType === 'image' || store.captureType === 'video') {
        _that.imageUrl = null
        _that.videoUrl = null
        if (_that.srcStream) {
          mediaStreamComponent.stop(_that.srcStream)
          _that.srcStream = null
        }
        let srcVideo = _that.$refs['srcVideo']
        try {
          await mediaStreamComponent.play(srcVideo, _that.constraints).then(function (stream) {
            _that.srcStream = stream
          })
        } catch (e) {
          console.error(e)
        }
      } else if (store.captureType === 'audio') {
        _that.audioUrl = null
      }
    },
    saveMedia: async function () {
      let _that = this
      let store = _that.$store
      if (store.captureType === 'image' || store.captureType === 'video') {
        if (_that.srcStream) {
          mediaStreamComponent.stop(_that.srcStream)
          _that.srcStream = null
        }
      } else if (store.captureType === 'audio') {
        _that.rec.close()
      }
      if (store.captureType === 'image') {
        store.mediaUrl = _that.imageUrl
      } else if (store.captureType === 'video') {
        store.mediaUrl = _that.videoUrl
      } else if (store.captureType === 'audio') {
        store.mediaUrl = _that.audioUrl
      }
      if (store.mediaUrl) {
        if (store.captureMediaEntry === 'message') {
          await store.saveChatMediaFile()
        } else if (store.captureMediaEntry === 'collection') {
          await store.collectionSaveMedia()
        } else if (store.captureMediaEntry === 'article') {
          await store.articleSaveMedia()
        }
      }
      store.captureType = null
      store.mediaUrl = null
      _that.imageUrl = null
      _that.videoUrl = null
      _that.audioUrl = null
      if (store.captureMediaEntry === 'message') {
        store.changeMessageSubKind('default')
      } else if (store.captureMediaEntry === 'collection') {
        store.changeCollectionSubKind('edit')
      } else if (store.captureMediaEntry === 'article') {
        store.changeArticleSubKind('default')
      }
    },
    closeStream: async function () {
      let _that = this
      let store = _that.$store
      if (store.captureType === 'image' || store.captureType === 'video') {
        if (_that.captureStatus === true) {
          await mediaRecorderComponent.stopRecording(_that.captureRecorder, 'blob')
          _that.captureStatus = false
          _that.captureRecorder = null
        }
        if (_that.srcStream) {
          mediaStreamComponent.stop(_that.srcStream)
          _that.srcStream = null
        }
      } else if (store.captureType === 'audio') {
        if (_that.captureStatus === true) {
          _that.rec.stop(function (blob, duration) {
            console.log('duration:' + duration + 'ms,size:' + blob.size + 'bytes')
          }, function (msg) {
            console.error(msg)
          })
          _that.captureStatus = false
        }
        _that.rec.close()
      }
      store.captureType = null
      _that.imageUrl = null
      _that.videoUrl = null
      _that.audioUrl = null
      if (store.captureMediaEntry === 'message') {
        store.changeMessageSubKind('default')
      } else if (store.captureMediaEntry === 'collection') {
        store.cancelSelectCollectionCaptureMedia()
        store.changeCollectionSubKind('edit')
      } else if (store.captureMediaEntry === 'article') {
        store.cancelSelectArticleCaptureMedia()
        store.changeArticleSubKind('default')
      }
    }
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  async created() {
    let _that = this
    let store = this.$store
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
      let videoInput = []
      let i = 0
      devices.forEach(function (device) {
        console.log('device.kind:' + device.kind + ',device.label:' + device.label + ',device.deviceId:' + device.deviceId)
        if (device.kind === 'videoinput') {
          videoInput.push(device.deviceId)
          console.log('videoInput[' + i + ']:' + videoInput[i])
          i++
        }
      })
    })
    await _that.openStream()
  },
  watch: {
  }
}
