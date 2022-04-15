import html2canvas from 'html2canvas'
import RecordRTC from 'recordrtc'
import Compressor from 'compressorjs'
import QrCodeWithLogo from 'qr-code-with-logo'
import { getThumbnails } from 'video-metadata-thumbnails'
import Transform from 'css3transform'
import AlloyFinger from 'alloyfinger'
import heic2any from 'heic2any'

import { BlobUtil, TypeUtil, UUID } from 'libcolla'

import { fileComponent } from '@/libs/base/colla-cordova'

import alertAudioSrc from '@/assets/media/alert.mp3'
import audioMessageSendAudioSrc from '@/assets/media/audioMessageSend.mp3'
import mediaCloseAudioSrc from '@/assets/media/mediaClose.mp3'
import mediaInvitationAudioSrc from '@/assets/media/mediaInvitation.mp3'
import scanAudioSrc from '@/assets/media/scan.mp3'

/**
 * 本类的功能可以适用于所有的App和浏览器，处理相片
 */
class CameraComponent {
  constructor() {
  }
  /**
   * 设置照片的来源和属性
   *
   * 参数是Camera.PictureSourceType.CAMERA，
   *
   * @param {*} srcType
   */
  setOptions(srcType, quality) {
    if (!quality) {
      quality = 100
    }
    var options = {
      // Some common settings are 20, 50, and 100
      quality: quality,
      destinationType: Camera.DestinationType.DATA_URL, // destinationType.NATIVE_URI,FILE_URI
      // In this app, dynamically set the picture source, Camera or photo gallery
      sourceType: srcType,
      encodingType: Camera.EncodingType.JPEG,
      mediaType: Camera.MediaType.PICTURE,
      allowEdit: true,
      correctOrientation: true,  //Corrects Android orientation quirks
      //popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false
    }
    return options
  }
  /**
   * 从相机或者文件（srcType）获取照片，返回文件的路径
   *
   * 参数用于设置目标照片的参数，比如高度，宽度
   * @param {*} params
   */
  getPicture(srcType, params) {
    if (!srcType) {
      srcType = Camera.PictureSourceType.CAMERA // Camera.PictureSourceType.PHOTOLIBRARY,Camera.PictureSourceType.SAVEDPHOTOALBUM
    }
    let options = this.setOptions(srcType)
    if (params && param.quality) {
      options.quality = params.quality
    }
    if (params && params.targetHeight) {
      options.targetHeight = params.targetHeight
    }
    if (params && params.targetWidth) {
      options.targetWidth = params.targetWidth
    }
    return new Promise(function (resolve, reject) {
      navigator.camera.getPicture(function cameraSuccess(imageUri) {
        console.debug('Picture imageUri.length: ' + imageUri.length, 'app')
        resolve(imageUri)
      }, function cameraError(error) {
        console.debug('Unable to obtain picture: ' + error, 'app')
        reject(error)
      }, options)
    })
  }
  cleanup(srcType, params) {
    navigator.camera.cleanup(function onSuccess() {
      console.log('Camera cleanup success.')
    }, function onFail(message) {
      console.log('Failed because: ' + message)
    })
  }
  /**
   * 显示照片
   * 参数为img元素的编号，内容可以是照片的文件路径（因为节省内存的原因，不采用数据路径）
   * blob对象，fileEntry对象，base64字符串
   *
   * @param {*} img
   */
  displayImage(ele, img) {
    if (TypeUtil.isString(ele)) {
      ele = document.getElementById(ele)
    }
    if (img.substr(5) === 'file:') {
      ele.src = img
    } else {
      ele.src = 'data:image/jpeg;base64,' + img
    }
    // ele.src = blob ? window.URL.createObjectURL(blob) : null
    // ele.src = fileEntry.toURL()
  }
}
export let cameraComponent = new CameraComponent()

/**
 * 媒体捕捉功能，cordova插件只适用于app，三个捕捉方法直接进入app的捕捉界面，捕捉完成后返回媒体文件数组
 */
class MediaCaptureComponent {
  constructor() {
    this.captureAudioOptions = {
      limit: 1, duration: 60
    }
    this.captureImageOptions = {
      limit: 1
    }
    this.captureVideoOptions = {
      limit: 1, quality: 1,
      //mime:'video/mp4'
    }
  }
  captureAudio(captureAudioOptions) {
    if (!captureAudioOptions) {
      captureAudioOptions = this.captureAudioOptions
    }
    return new Promise(function (resolve, reject) {
      navigator.device.capture.captureAudio(
        function captureSuccess(mediaFiles) {
          console.info(mediaFiles)
          resolve(mediaFiles)
        }, function captureError(error) {
          console.error('Capture Error code: ' + error.code)
          navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error')
          reject(error)
        }, captureAudioOptions
      )
    })
  }
  captureVideo(captureVideoOptions) {
    if (!captureVideoOptions) {
      captureVideoOptions = this.captureVideoOptions
    }
    return new Promise(function (resolve, reject) {
      navigator.device.capture.captureVideo(
        function captureSuccess(mediaFiles) {
          console.info(mediaFiles)
          resolve(mediaFiles)
        }, function captureError(error) {
          console.error('Capture Error code: ' + error.code)
          if (error.code !== 3) {
            navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error')
          }
          reject(error)
        }, captureVideoOptions
      )
    })
  }
  captureImage(captureImageOptions) {
    if (!captureImageOptions) {
      captureImageOptions = this.captureImageOptions
    }
    return new Promise(function (resolve, reject) {
      navigator.device.capture.captureImage(
        function captureSuccess(mediaFiles) {
          console.info(mediaFiles)
          resolve(mediaFiles)
        }, function captureError(error) {
          console.error('Capture Error code: ' + error.code)
          if (error.code !== 3) {
            navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error')
          }
          reject(error)
        }, captureImageOptions
      )
    })
  }
  supportedImageModes() {
    let imageModes = navigator.device.capture.supportedImageModes

    return imageModes
  }
  getFormatData(mediaFile) {
    let _that = this
    return new Promise(function (resolve, reject) {
      mediaFile.getFormatData(
        function successCallback(mediaFileData) {
          console.info(mediaFileData)
          resolve(mediaFileData)
        },
        function errorCallback(err) {
          console.error(err)
          reject(err)
        }
      )
    })
  }
  onDeviceReady() {
    // pendingcaptureresult is fired if the capture call is successful
    document.addEventListener('pendingcaptureresult', function (mediaFiles) {
      // Do something with result
      console.info(mediaFiles)
    })

    // pendingcaptureerror is fired if the capture call is unsuccessful
    document.addEventListener('pendingcaptureerror', function (error) {
      // Handle error case
      console.error(error)
    })
  }
}
export let mediaCaptureComponent = new MediaCaptureComponent()

/**
 *  音频播放和捕捉功能，捕捉功能只能用于app，采用media插件实现，适用于原生的音频捕捉界面
 */
class AudioMediaComponent {
  constructor() {
  }
  /**
   * cdvfile path: cdvfile://localhost/temporary/recording.mp3
   * @param {*} src
   */
  create(src) {
    let media = new Media(src, function mediaSuccess() {

    }, function mediaError(error) {

    }, function mediaStatus(status) {

    })

    return media
  }
  getCurrentAmplitude(media) {
    return new Promise(function (resolve, reject) {
      media.getCurrentAmplitude(
        // success callback
        function (amp) {
          resolve(amp)
        },
        // error callback
        function (e) {
          reject(e)
        }
      )
    })
  }
  getCurrentPosition(media) {
    return new Promise(function (resolve, reject) {
      // get media position
      media.getCurrentPosition(
        // success callback
        function (position) {
          resolve(position)
        },
        // error callback
        function (e) {
          reject(e)
        }
      )
    })
  }
  getDuration(media) {
    let dur = media.getDuration()

    return dur
  }
  getDurationAsync(media) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let dur = media.getDuration()
        resolve(dur)
      }, 100)
    })
  }
  startRecord(media) {
    // startRecord audio
    media.startRecord()
  }
  pauseRecord(media) {
    // pauseRecord audio
    media.pauseRecord()
  }
  resumeRecord(media) {
    // resumeRecord audio
    media.resumeRecord()
  }
  stopRecord(media) {
    // stopRecord audio
    media.stopRecord()
  }
  play(media) {
    // Play audio
    media.play()
  }
  pause(media) {
    // Play audio
    media.pause()
  }
  stop(media) {
    // stop audio
    media.stop()
  }
  release(media) {
    // release audio
    media.release()
  }
  seekTo(media, milliseconds) {
    // seekTo audio
    media.seekTo(milliseconds)
  }
  setVolume(media, volume) {
    // setVolume audio
    media.seekTo(volume)
  }
  setRate(media, rate) {
    // setRate audio
    media.setRate(rate)
  }
}
export let audioMediaComponent = new AudioMediaComponent()

/**
  采用cordova-plugin-audio-recorder-api插件，录制的音频是m4a格式
 */
class AudioRecorderComponent {
  constructor() {
    if (window.cordova && window.plugins && window.plugins.audioRecorderAPI) {
      this.recorder = window.plugins.audioRecorderAPI
      console.info('recorder:' + this.recorder)
      this.file = window.cordova.file
    }
  }
  /**
   * iOS: /var/mobile/Applications/<UUID>/Library/NoCloud/<file-id>.m4a
   * Android: /data/data/<app-id>/files/<file-id>.m4a
   * @param {*} targetFile
   * @param {*} duration
   */
  startRecord(duration = 600) {
    let _this = this
    return new Promise(function (resolve, reject) {
      // startRecord audio
      _this.recorder.record(function (msg) {
        console.info('AudioRecorderComponent record msg:' + msg)
        resolve(msg)
      }, function (err) {
        console.error('error: ' + err)
        reject(err)
      }, duration)
    })
  }
  stopRecord(options = { format: 'blob', type: 'audio/m4a' }) {
    let _this = this
    return new Promise(function (resolve, reject) {
      // Stop capturing audio input
      _this.recorder.stop(function (fileName) {
        console.info('capture file:' + fileName)
        if (options.format === 'file') {
          resolve(fileName)
        } else {
          fileComponent.getFileEntry(fileName).then(function (fileEntry) {
            fileComponent.readFile(fileEntry, options).then(function (result) {
              _this.recorder.audioData = result
              resolve(result)
            }).catch(function (err) {
              console.error(err)
              reject(err)
            })
          }).catch(function (err) {
            console.error(err)
            reject(err)
          })
        }
      })
    })
  }
  play(blob) {
    let _this = this
    if (!blob) {
      blob = _this.recorder.audioData
    }
    if (blob) {
      var fr = new FileReader()
      fr.onload = function () {
        var arrBuff = this.result
        window.AudioContext = window.AudioContext || window.webkitAudioContext
        let audioContext = new window.AudioContext()
        audioContext.decodeAudioData(arrBuff, function (buffer) {
          var source = audioContext.createBufferSource()
          source.buffer = buffer
          source.connect(audioContext.destination)
          source.start(0)
        })
      }
      fr.readAsArrayBuffer(blob)
    } else {
      return new Promise(function (resolve, reject) {
        _this.recorder.playback(function (msg) {
          console.info(msg)
          resolve(msg)
        }, function (err) {
          console.error(err)
          reject(err)
        })
      })
    }
  }
}
export let audioRecorderComponent = new AudioRecorderComponent()

/**
    cordova-plugin-audioinput插件的实现
   */
class AudioInputComponent {
  constructor() {
    if (window.audioinput) {
      this.audioinput = window.audioinput
      this.file = window.cordova.file
      this.initialize()
      window.addEventListener('audioinput', this.onAudioInput, false)
      window.addEventListener('audioinputerror', this.onAudioInputError, false)
      window.addEventListener('audioinputfinished', this.onAudioinputFinished, false)
    }
  }

  /**
   * 初始化参数，权限
   */
  initialize(captureCfg) {
    let _this = this
    return new Promise(function (resolve, reject) {
      // Initialize the audioinput plugin.
      _this.audioinput.initialize(captureCfg, function () {
        // First check whether we already have permission to access the microphone.
        _this.audioinput.checkMicrophonePermission(function (hasPermission) {
          if (hasPermission) {
            console.log('We already have permission to record.')
            resolve(true)
          } else {
            // Ask the user for permission to access the microphone
            _this.audioinput.getMicrophonePermission(function (hasPermission, message) {
              if (hasPermission) {
                console.log('User granted us permission to record.')
                resolve(true)
              } else {
                console.warn('User denied permission to record.')
                resolve(false)
              }
            })
          }
        })
      })
    })
  }
  isCapturing() {
    return this.audioinput.isCapturing()
  }
  connect(audioNode) {
    return this.audioinput.connect(audioNode)
  }
  disconnect() {
    return this.audioinput.disconnect()
  }
  getAudioContext() {
    return this.audioinput.getAudioContext()
  }
  onAudioInput(evt) {
    console.info(evt.data)
  }
  onAudioInputError(error) {
    console.info(error)
  }
  onAudioinputFinished(evt) {
    console.info('capture file:' + evt.file)
    let fileName = evt.file
    let _this = this
    fileComponent.getFileEntry(fileName).then(function (fileEntry) {
      let options = { format: 'blob', type: 'audio/wav' }
      fileComponent.readFile(fileEntry, options).then(function (result) {
        console.info('readFile capture blob:' + result)
        _this.audioinput.audioData = result
        if (_this.audioinput.stopCallback) {
          _this.audioinput.stopCallback(_this.audioinput.audioData)
        }
        if (_this.onAudioBlobFinished) {
          _this.onAudioBlobFinished(result)
        }
      }).catch(function (err) {
        console.error(err)
      })
    }).catch(function (err) {
      console.error(err)
    })
  }
  startRecord(options) {
    if (this.audioinput.isCapturing()) {
      console.error('audioinput isCapturing')
      return
    }
    if (!options) {
      options = {}
    }
    if (!options.fileUrl) {
      options.fileUrl = cordova.file.cacheDirectory + 'temp.wav'
    }
    this.audioinput.start(options)
    if (options.streamToWebAudio === true) {
      // Create a filter to avoid too much feedback
      // let filterNode = this.audioinput.getAudioContext().createBiquadFilter()
      // filterNode.frequency.setValueAtTime(2048, this.audioinput.getAudioContext().currentTime)

      // this.audioinput.connect(filterNode)
      // filterNode.connect(this.audioinput.getAudioContext().destination)

      this.audioinput.connect(this.audioinput.getAudioContext().destination)
    }
  }

  stopRecord() {
    if (!this.audioinput.isCapturing()) {
      console.error('audioinput is not Capturing')
      return
    }
    let _this = this
    return new Promise(function (resolve, reject) {
      // Stop capturing audio input
      _this.audioinput.stop(function (msg) {
        console.info('stop capture:' + msg)
      })
    })
  }
  getBlob() {
    return this.audioinput.audioData
  }
  play(blob) {
    if (!blob) {
      blob = this.audioinput.audioData
    }
    if (!blob) {
      console.error('No blob')
      //this.audioinput.start(0)
      return
    }
    var fr = new FileReader()
    fr.onload = function () {
      var arrBuff = this.result
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      let audioContext = new window.AudioContext()
      audioContext.decodeAudioData(arrBuff, function (buffer) {
        var source = audioContext.createBufferSource()
        source.buffer = buffer
        source.connect(audioContext.destination)
        source.start(0)
      })
    }
    fr.readAsArrayBuffer(blob)
  }
}
export let audioInputComponent = new AudioInputComponent()

/**
 * 本类采用recordrtc js库实现，适用于chrome浏览器为基础的应用，具有图像，音频和视频的捕捉功能
 *
 * 比如，android app，IOS，MAC，Windows的chrome浏览器，不适用于IOS App和Safari浏览器
 */
class MediaRecorderComponent {
  constructor() {
    this.StereoAudioRecorder = RecordRTC.StereoAudioRecorder
    this.MediaStreamRecorder = RecordRTC.MediaStreamRecorder
    this.WebAssemblyRecorder = RecordRTC.WebAssemblyRecorder
    this.CanvasRecorder = RecordRTC.CanvasRecorder
    this.GifRecorder = RecordRTC.GifRecorder
    this.WhammyRecorder = RecordRTC.WhammyRecorder
    this.MultiStreamRecorder = RecordRTC.MultiStreamRecorder
  }
  /**
   * 创建流的记录器
   *
   * @param {*} stream
   * @param {*} options // recorderType: MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
   * CanvasRecorder, GifRecorder, WhammyRecorder
   */
  async create(stream, options = {
    type: 'video',
    mimeType: 'video/webm;codecs=h264',
    recorderType: RecordRTC.MediaStreamRecorder,
    ////timeSlice: 1000, //108, // get intervals based blobs value in milliseconds
    //bitsPerSecond: 128000, // both for audio and video tracks
    ////audioBitsPerSecond: 128000, //91040, //128000, // only for audio track
    ////videoBitsPerSecond: 128000, // only for video track
    //frameInterval: 28, //90 || 10, // used by CanvasRecorder and WhammyRecorder it is kind of a "frameRate"
    //sampleRate: 48000, //44100, //96000, // used by StereoAudioRecorder the range 22050 to 96000.
    //desiredSampRate: 16000, // used by StereoAudioRecorder the range 22050 to 96000. let us force 16khz recording:
    //bufferSize: 16384, // used by StereoAudioRecorder Legal values are (256, 512, 1024, 2048, 4096, 8192, 16384).
    //numberOfAudioChannels: 2, // used by StereoAudioRecorder 1 or 2
    //frameRate: 30, // used by WebAssemblyRecorder; values: usually 30; accepts any.
    //bitrate: 128000 // used by WebAssemblyRecorder; values: 0 to 1000+
  }) {
    if (stream) {
      return new RecordRTC.RecordRTCPromisesHandler(stream, options)
    } else {
      let stream = await mediaStreamComponent.openUserMedia()
      let recorder = new RecordRTC.RecordRTCPromisesHandler(stream, options)

      return recorder
    }
  }
  startRecording(recorder) {
    return recorder.startRecording()
  }
  /**
   * let blob = recorder.getBlob()
   * @param {*} recorder
   */
  async stopRecording(recorder, format = 'url') {
    await recorder.stopRecording()
    let blob = await recorder.getBlob()
    if (format === 'url') {
      blob = blob ? window.URL.createObjectURL(blob) : null
    }
    recorder.destroy()

    return blob
  }
  // pause the recording
  pauseRecording(recorder) {
    return recorder.pauseRecording()
  }
  // resume the recording
  resumeRecording(recorder) {

    return recorder.resumeRecording()
  }
  // auto stop recording after specific duration
  setRecordingDuration(recorder, dur) {

    return recorder.setRecordingDuration(dur)
  }
  // reset recorder states and remove the data
  reset(recorder) {

    return recorder.reset()
  }
  // invoke save as dialog
  save(recorder, fileName) {

    return recorder.save(fileName)
  }
  // returns recorded Blob
  getBlob(recorder) {

    return recorder.getBlob()
  }
  // returns Blob-URL
  toURL(recorder) {

    return recorder.toURL()
  }
  // returns Data-URL
  getDataURL(recorder, dataURL) {

    return recorder.getDataURL(dataURL)
  }
  // fired if recorder's state changes
  onStateChanged(recorder, state) {

    return recorder.onStateChanged(state)
  }
  // write recorded blob into indexed-db storage
  writeToDisk(recorder, audio, video, gif) {

    return recorder.writeToDisk(audio, video, gif)
  }
  // get recorded blob from indexded-db storage
  getFromDisk(recorder, dataURL, type) {

    return recorder.getFromDisk(dataURL, type)
  }
  // clear memory; clear everything
  destroy(recorder) {

    return recorder.destroy()
  }
  // get recorder's state
  getState(recorder) {

    return recorder.getState()
  }
  /**
   * 根据打开的pc电脑的摄像头进行拍照，输出图片的链接
   * @param {*} canvas
   * @param {*} video
   * @param {*} width
   * @param {*} height
   * @param {*} format
   */
  getPicture(video, width, height, format = 'base64', imageFormat = 'image/jpeg') {
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d')
    canvas.style = 'position: absolute; top: 0; left: 0; opacity: 0; margin-top: -9999999999; margin-left: -9999999999; top: -9999999999; left: -9999999999; z-index: -1;'
    document.body.appendChild(canvas)
    canvas.width = width
    canvas.height = height
    context.drawImage(video, 0, 0, width, height)

    let dataurl = canvas.toDataURL(imageFormat)
    if (format === 'blob') {
      dataurl = BlobUtil.base64ToFile(dataurl, new Date().toTimeString() + imageFormat.substr(6)) // base64 转图片file
    }
    return dataurl
  }
}
export let mediaRecorderComponent = new MediaRecorderComponent()

/**
 * 浏览器提供的基础流媒体处理功能
 */
class MediaStreamComponent {
  constructor() {
  }
  supportMediaRecorder() {
    if (typeof MediaRecorder === 'undefined') {
      return false
    }
    return true

    let supported = navigator.mediaDevices.getSupportedConstraints()
  }
  getSupportedConstraints() {
    return navigator.mediaDevices.getSupportedConstraints()
  }
  getCapabilities(track) {
    return track.getCapabilities()
  }
  enumerateDevices() {
    return navigator.mediaDevices.enumerateDevices()
  }
  isTypeSupported(type) {
    if (!MediaRecorder.isTypeSupported) {
      return
    }
    if (type) {
      return MediaRecorder.isTypeSupported(type)
    } else {
      let mimeTypes = ['video/webm',
        'audio/webm',
        'audio/wav',
        'audio/ogg',
        'audio/webm;codecs=opus',
        'video/mpeg',
        'video/webm;codecs=vp8',
        'video/webm;codecs=vp9',
        'video/webm;codecs=daala',
        'video/webm;codecs=h264',
        'video/mp4',
        'video/x-matroska;codecs=avc1']
      let types = []
      for (let mimeType of mimeTypes) {
        let support = MediaRecorder.isTypeSupported(mimeType)
        if (support === true) {
          types.push(mimeType)
        }
      }

      return types
    }
  }


  /**
  * 捕获摄像头流
  */
  openUserMedia(constraints) {
    if (!constraints) {
      constraints = {
        audio: { echoCancellation: true, noiseSuppression: true },
        video: { echoCancellation: true, noiseSuppression: true }
      }
    }
    // 旧版本浏览器可能根本不支持mediaDevices.getUserMedia，我们首先设置一个空对象
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices.getUserMedia(constraints)
    } else if (navigator.getUserMedia) {
      return navigator.getUserMedia(constraints)
    } else {
      throw new Error('Not support getUserMedia')
    }
  }
  /**
    捕获显示器屏幕或者应用屏幕流
   */
  openDisplayMedia() {
    if (!navigator.getDisplayMedia && !navigator.mediaDevices.getDisplayMedia) {
      var error = 'Your browser does NOT support the getDisplayMedia API.'
      throw new Error(error)
    }
    let displaymediastreamconstraints = {
      video: {
        displaySurface: 'monitor', // monitor, window, application, browser
        logicalSurface: true,
        cursor: 'always' // never, always, motion
      }
    }

    // above constraints are NOT supported YET
    // that's why overridnig them
    displaymediastreamconstraints = {
      video: true
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      return navigator.mediaDevices.getDisplayMedia(displaymediastreamconstraints)
    } else if (navigator.getDisplayMedia) {
      return navigator.getDisplayMedia(displaymediastreamconstraints)
    } else {
      throw new Error('Not support getDisplayMedia')
    }
  }
  /**
    捕获浏览器的画布流
   */
  captureCanvasStream(canvas, dur = 15) {
    let canvasStream = canvas.captureStream(dur)

    return canvasStream
  }
  /**
   * 关闭pc电脑的摄像头
   * @param {*} video
   */
  stop(stream) {
    stream.stop()
  }
  /**
   * 这个方法算是播放的例子，说明了如何播放的方法之一
   * @param {*} media
   * @param {*} stream
   * @param {*} callback
   */
  _play(media, stream, callback) {
    // 旧的浏览器可能没有srcObject
    if ('srcObject' in media) {
      media.srcObject = stream
    } else {
      // 避免在新的浏览器中使用它，因为它正在被弃用。
      media.src = stream ? window.URL.createObjectURL(stream) : null
    }
    if (callback) {
      callback(stream)
    }
  }
  /**
   * 这个方法算是播放的例子，说明了如何播放的方法之一
   * @param {*} media
   * @param {*} stream
   * @param {*} callback
   */
  play(media, constraints, stream, callback) {
    if (TypeUtil.isString(media)) {
      media = document.getElementById(media)
    }
    media.onloadedmetadata = function (e) {
      media.play()
    }
    let _this = this
    return new Promise(function (resolve, reject) {
      if (stream) {
        _this._play(media, stream, callback)
        resolve(stream)
      } else {
        _this.openUserMedia(constraints).then(function (stream) {
          _this._play(media, stream, callback)
          resolve(stream)
        })
      }
    })
  }
  getTracks(stream, kind) {
    if (!stream || !stream.getTracks) {
      return []
    }
    if (kind) {
      return stream.getTracks().filter(function (t) {
        return t.kind === (kind)
      })
    } else {
      return stream.getTracks()
    }
  }
  createCanvas() {
    /**
    * 创建画布
    */
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d')
    canvas.style = 'position: absolute; top: 0; left: 0; opacity: 0; margin-top: -9999999999; margin-left: -9999999999; top: -9999999999; left: -9999999999; z-index: -1;'
    document.body.appendChild(canvas)

    return { canvas: canvas, context: context }
  }
  createVideo() {
    /**
    * 创建视频组件实时播放摄像头
    */
    let video = document.createElement('video')
    video.autoplay = true
    video.playsinline = true
    video.style.display = 'none'
      (document.body || document.documentElement).appendChild(video)

    return video
  }
  /**
   * 创建画布流，实现方式是对画布进行video，canvas，图像，文字绘画，
   *
   * targets是需要合并到画布的目标数组，element表示元素，stream表示元素的流，
   *
   * 另外有绘制element的left，top，width和height等属性
   *
   * 例如：let targets = [
        { element: screenVideo, stream:screenStream },
        { element: logoImage, left: 10, top: 10, width: 32, height: 32 }
      ]
  */
  createCanvasStream(targets, options = { fps: 15, timeout: 100, left: 0, top: 0, width: 320, height: 240 }) {
    /**
     * 创建画布
     */
    let { canvas, context } = mediaStreamComponent.createCanvas()
    canvas.width = options.width
    canvas.height = options.height
    /**
     * 15 FPS，按照指定的帧数捕捉画布的流
     */
    let canvasStream = canvas.captureStream(options.fps)
    canvasStream.width = options.width
    canvasStream.height = options.height
    canvasStream.top = options.top
    canvasStream.left = options.left
    function looper() {
      for (let target of targets) {
        context.drawImage(target.element, target.left, target.top, target.width, target.height)
      }
    }
    setInterval(looper, options.timeout)

    return canvasStream
  }
  /**
   * 把图片，文字合并到视频流的特定位置
   *
   * 实现方式是对画布进行video，canvas，图像，文字绘画，
   *
   * 再构造新的流对象，将画布流和目标视频流的音频部分进行合并
   */
  async mergeStream(targets, options = { fps: 15, timeout: 100, left: 0, top: 0, width: 320, height: 240 }) {
    /**
     * 创建视频组件实时播放摄像头
     */
    if (!targets[0].element) {
      targets[0].element = mediaStreamComponent.createVideo()
    }
    if (!targets[0].stream) {
      targets[0].stream = await mediaStreamComponent.openUserMedia()
    }
    targets[0].element.srcObject = targets[0].stream
    let canvasStream = mediaStreamComponent.createCanvasStream(targets, options)
    /**
     * 创建新的流对象
     */
    let mergeStream = new MediaStream()
    /**
     * 把摄像头音频和画布的轨道都加入新的流对象中
     */
    mediaStreamComponent.getTracks(canvasStream, 'video').forEach(function (videoTrack) {
      mergeStream.addTrack(videoTrack)
    })
    mediaStreamComponent.getTracks(targets[0].stream, 'audio').forEach(function (audioTrack) {
      mergeStream.addTrack(audioTrack)
    })

    return mergeStream
  }
  /**
   * 合并媒体流，返回合并后记录器，可以设置预览元素
   *
   * 实现方式是生成媒体流数组的记录器，并预览
   * @param {*} streams
   * @param {*} preview
   */
  async mergeRecorder(streams, preview, blobs) {
    let recorder = await mediaRecorderComponent.create(streams, {
      type: 'video',
      mimeType: 'video/webm',
      previewStream: function (s) {
        if (preview) {
          preview.muted = true
          preview.srcObject = s
        }
      },
      timeSlice: 1000, // pass this parameter
      // getNativeBlob: true,
      ondataavailable: function (blob) {
        blobs.push(blob)

        let size = 0
        blobs.forEach(function (b) {
          size += b.size
        })

        console.info('Total blobs: ' + blobs.length + ' (Total size: ' + size + ')')
      }
    })
    return recorder
  }
}
export let mediaStreamComponent = new MediaStreamComponent()

/**
 * 媒体文件的处理
 */
class MediaComponent {
  constructor() {
  }
  /**
  * 存储数据到磁盘文件
  * @param {*} blob, base64, file
  * @param {*} fileName
  */
  save(blob, fileName) {
    if (TypeUtil.isString(blob)) {
      blob = BlobUtil.base64toBlob(blob)
    }
    let fileURL = blob ? window.URL.createObjectURL(blob) : null
    // for non-IE
    if (!window.ActiveXObject) {
      var save = document.createElement('a')
      save.href = fileURL
      save.download = fileName || 'unknown'
      save.style = 'display:none;opacity:0;color:transparent;'
      let fn = document.body || document.documentElement
      fn.appendChild(save)
      if (typeof save.click === 'function') {
        save.click()
      } else {
        save.target = '_blank'
        var event = document.createEvent('Event')
        event.initEvent('click', true, true)
        save.dispatchEvent(event)
      }
      (window.URL || window.webkitURL).revokeObjectURL(save.href)
    }
    // for IE
    else if (!!window.ActiveXObject && document.execCommand) {
      var _window = window.open(fileURL, '_blank')
      _window.document.close()
      _window.document.execCommand('SaveAs', true, fileName || fileURL)
      _window.close()
    }
  }
  isAssetTypeAnImage(ext) {
    if (!ext) return
    return [
      'png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'svg', 'tiff', 'heic'].indexOf(ext.toLowerCase()) !== -1
  }
  isAssetTypeAVideo(ext) {
    if (!ext) return
    return ['ogg', 'mp4', 'webm', 'mov'].indexOf(ext.toLowerCase()) !== -1
  }
  isAssetTypeAnAudio(ext) {
    if (!ext) return
    return ['wav', 'mp3', 'acc'/*, 'webm'*/].indexOf(ext.toLowerCase()) !== -1
  }
  compress(file, quality = 0.1) {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: quality,
        success(result) {
          resolve(result)
        },
        error(err) {
          console.log(err.message)
          reject(err)
        }
      })
    })
  }
  rotateImg(img, direction, canvas) {
    //最小与最大旋转方向，图片旋转4次后回到原方向
    const min_step = 0
    const max_step = 3
    if (img == null) {
      return
    }
    //img的高度和宽度不能在img元素隐藏后获取，否则会出错
    let height = img.height
    let width = img.width
    let step = 2
    if (step == null) {
      step = min_step
    }
    if (direction == "right") {
      step++
      //旋转到原位置，即超过最大值
      step > max_step && (step = min_step)
    } else if (direction == "right2") {
      step = 2
    } else {
      step--
      step < min_step && (step = max_step)
    }
    //旋转角度以弧度值为参数
    let degree = step * 90 * Math.PI / 180
    let ctx = canvas.getContext("2d")
    switch (step) {
      case 0:
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0)
        break
      case 1:
        canvas.width = height
        canvas.height = width
        ctx.rotate(degree)
        ctx.drawImage(img, 0, -height)
        break
      case 2:
        canvas.width = width
        canvas.height = height
        ctx.rotate(degree)
        ctx.drawImage(img, -width, -height)
        break
      case 3:
        canvas.width = height
        canvas.height = width
        ctx.rotate(degree)
        ctx.drawImage(img, -width, 0)
        break
    }
  }
  async html2canvas(element, options = { type: 'base64' }) {
    const canvas = await html2canvas(element, options)
    if (options.type && options.type === 'base64') {
      return canvas.toDataURL()
    } else {
      return canvas
    }
  }
  async html2canvasById(divId, type) {
    let div = document.getElementById(divId)
    let divWidth = div.offsetWidth
    div.style.width = divWidth + 'px'
    const canvas = await html2canvas(div, { dpi: window.devicePixelRatio, width: divWidth, scale: 1, useCORS: true })
    if (type === 'base64') {
      return canvas.toDataURL('image/png', 1.0)
    } else {
      return canvas
    }
  }
  image2canvas(img) {
    let canvas = document.createElement('canvas')
    let ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  }
  // 导出div图片
  exportDiv(divId, fileName) {
    let div = document.getElementById(divId)
    let divWidth = div.offsetWidth
    div.style.width = divWidth + 'px'
    html2canvas(div, { dpi: window.devicePixelRatio, width: divWidth, scale: 1, useCORS: true }).then(function (canvas) {
      var a = document.createElement('a')
      a.href = BlobUtil.blobToUrl(BlobUtil.base64ToBlob(canvas.toDataURL('image/jpeg', 1.0)))
      a.download = fileName + '.jpeg'
      a.click()
    })
  }
  // 导出二维码图片
  exportQRCode(fileName, content, width, logoSrc) {
    QrCodeWithLogo.toImage({
      download: true,
      downloadName: fileName,
      content: content,
      width: width,
      logo: {
        src: logoSrc,
        //logoRadius: 8
      }
    }).then(() => new Promise(resolve => void setTimeout(resolve, 100)))
      .then(() => {
        console.log('save success')
      })
  }
  // 生成二维码
  generateQRCode(canvasId, content, width, logoSrc) {
    let canvas = document.getElementById(canvasId)
    if (canvas) {
      QrCodeWithLogo.toCanvas({
        canvas,
        content: content,
        width: width,
        /*nodeQrCodeOptions: { // 兼容 node-qrcode
          margin: 4,
          color: {
            dark: '#ff4538',
            light: '#d2ffdb'
          }
        },*/
        logo: {
          src: logoSrc,
          /*logoRadius: 14, // 8
          borderRadius: 8,
          borderColor: '#d2ffdb',
          borderSize: 0.06 // 边框大小 相对二维码的比例*/
        }
      })
    }
  }
  // 生成视频缩略预览图
  createVideoThumbnail(sourceVideoPath, targetThumbnailPath, options) {
    if (!targetThumbnailPath && !options) {
      targetThumbnailPath = 'IGNORE'
      options = {
        mode: 'base64',
        position: 1.0,
        quality: 0.8,
        resize: {
          height: 384, // On Android, the width and height must neither exceed 512x384 nor the resolution of the video, or an error is generated.
          width: 384
        }
      }
    }
    return new Promise(function (resolve, reject) {
      window.PKVideoThumbnail.createThumbnail(sourceVideoPath, targetThumbnailPath, options, function onSuccess(data) {
        console.log('createThumbnail success:' + data)
        resolve(data)
      }, function onFailure(err) {
        console.log('createThumbnail failure:' + err)
        reject(err)
      })
    })
  }
  async compressImage(imageBase64) {
    return await new Promise(function (resolve, reject) {
      let newImage = new Image()
      newImage.src = imageBase64
      newImage.setAttribute('crossOrigin', 'Anonymous') //url为外域时需要
      let imgWidth, imgHeight

      newImage.onload = function () {
        imgWidth = this.width
        imgHeight = this.height
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        // 缩小图片尺寸：短边128px
        console.log('imgWidth: ' + imgWidth + ', imgHeight: ' + imgHeight)
        let w = 128
        if (Math.max(imgWidth, imgHeight) > w) {
          if (imgWidth > imgHeight) {
            canvas.width = w
            canvas.height = w * imgHeight / imgWidth
          } else {
            canvas.height = w
            canvas.width = w * imgWidth / imgHeight
          }
        } else {
          canvas.width = imgWidth
          canvas.height = imgHeight
        }
        console.log('canvasWidth: ' + canvas.width + ', canvasHeight: ' + canvas.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(newImage, 0, 0, canvas.width, canvas.height)
        // 压缩图片大小：长度20k以下
        console.log('imageBase64.length: ' + imageBase64.length)
        let quality = 1.0
        let arr = imageBase64.split(',')
        let mime = arr[0].match(/:(.*?);/)[1]
        mime = (mime === 'image/png' ? 'image/jpeg' : mime)
        while (imageBase64.length / 1024 > 10) {
          let length = imageBase64.length
          quality -= 0.01
          imageBase64 = canvas.toDataURL(mime, quality)
          if (imageBase64.length === length) {
            console.log('no effect')
          }
        }
        resolve(imageBase64)
      }
      newImage.onerror = function () {
        reject(new Error('Could not load image'))
      }
    })
  }
  async createVideoThumbnailByBase64(base64) {
    let thumbnail = null
    if (window.device && (window.device.platform === 'Android' || window.device.platform === 'iOS')) {
      let dirEntry = await fileComponent.getRootDirEntry('tmp')
      let dirPath = dirEntry.toInternalURL()
      let fileName = 'thumbnail' + UUID.string(null, null) + '.' + base64.substring(11, base64.indexOf(';', 11))
      let localURL = dirEntry.toInternalURL() + fileName
      let fileEntry = await fileComponent.createNewFileEntry(fileName, dirPath)
      let blob = BlobUtil.base64ToBlob(base64)
      await fileComponent.writeFile(fileEntry, blob, false).then(async function () {
        thumbnail = await mediaComponent.createVideoThumbnail(localURL)
      })
    } else {
      let blob = BlobUtil.base64ToBlob(base64)
      let thumbnails = await getThumbnails(blob, {
        quality: 0.7,
        start: 0,
        end: 0
      })
      if (thumbnails && thumbnails.length > 0) {
        thumbnail = await BlobUtil.blobToBase64(thumbnails[0].blob)
      }
    }
    return thumbnail
  }
  //
  fixVideoUrl(url) {
    // let videoUrlFragment = ['data:video/quicktime;base64,','data:video/x-matroska;codecs=avc1,opus;base64,',
    //   'data:video/webm;codecs=vp8,opus;base64,','data:video/webm;codecs=h264,opus;base64,',
    //   'data:video/webm;base64,']
    let repairFragment = 'data:video/mp4;base64,'
    let pcRepairFragment = 'data:video/webm;base64,'
    let urlArray = url.split(';base64,')
    if (url.indexOf('data:video/x-matroska;codecs=avc1,opus;base64,') > -1) {
      url = pcRepairFragment + urlArray[1]
    } else {
      url = repairFragment + urlArray[1]
    }
    return url
  }
  async heicToPNG(heicBase64) {
    let blob = BlobUtil.base64ToBlob(heicBase64)
    let jpegBlob = await heic2any({
      blob,
      toType: "image/png",
      quality: 1,
    })
    return BlobUtil.blobToBase64(jpegBlob)
  }
}
export let mediaComponent = new MediaComponent()

class PaletteComponent {
  constructor() {
  }
  init(canvas, {
    drawType = 'line',
    drawColor = 'rgba(19, 206, 102, 1)',
    lineWidth = 5,
    sides = 3,
    allowCallback,
    moveCallback
  }
  ) {
    this.canvas = canvas
    this.width = canvas.width // 宽
    this.height = canvas.height // 高
    this.paint = canvas.getContext('2d')
    this.isClickCanvas = false // 是否点击canvas内部
    this.isMoveCanvas = false // 鼠标是否有移动
    this.imgData = [] // 存储上一次的图像，用于撤回
    this.index = 0 // 记录当前显示的是第几帧
    this.x = 0 // 鼠标按下时的 x 坐标
    this.y = 0 // 鼠标按下时的 y 坐标
    this.last = [this.x, this.y] // 鼠标按下及每次移动后的坐标
    this.drawType = drawType // 绘制形状
    this.drawColor = drawColor // 绘制颜色
    this.lineWidth = lineWidth // 线条宽度
    this.sides = sides // 多边形边数
    this.allowCallback = allowCallback || function () { } // 允许操作的回调
    this.moveCallback = moveCallback || function () { } // 鼠标移动的回调
    this.bindMousemove = function () { } // 解决 eventlistener 不能bind
    this.bindMousedown = function () { } // 解决 eventlistener 不能bind
    this.bindMouseup = function () { } // 解决 eventlistener 不能bind

    this.paint.fillStyle = '#fff'
    this.paint.fillRect(0, 0, this.width, this.height)
    this.gatherImage()
    this.bindMousemove = this.onmousemove.bind(this) // 解决 eventlistener 不能bind
    this.bindMousedown = this.onmousedown.bind(this)
    this.bindMouseup = this.onmouseup.bind(this)
    this.canvas.addEventListener('mousedown', this.bindMousedown)
    document.addEventListener('mouseup', this.bindMouseup)
  }
  onmousedown(e) { // 鼠标按下
    this.isClickCanvas = true
    this.x = e.offsetX
    this.y = e.offsetY
    this.last = [this.x, this.y]
    this.canvas.addEventListener('mousemove', this.bindMousemove)
  }
  gatherImage() { // 采集图像
    this.imgData = this.imgData.slice(0, this.index + 1) // 每次鼠标抬起时，将储存的imgdata截取至index处
    let imgData = this.paint.getImageData(0, 0, this.width, this.height)
    this.imgData.push(imgData)
    this.index = this.imgData.length - 1 // 储存完后将 index 重置为 imgData 最后一位
    this.allowCallback(this.index > 0, this.index < this.imgData.length - 1)
  }
  reSetImage() { // 重置为上一帧
    this.paint.clearRect(0, 0, this.width, this.height)
    if (this.imgData.length >= 1) {
      this.paint.putImageData(this.imgData[this.index], 0, 0)
    }
  }
  onmousemove(e) { // 鼠标移动
    this.isMoveCanvas = true
    let endx = e.offsetX
    let endy = e.offsetY
    let width = endx - this.x
    let height = endy - this.y
    let now = [endx, endy] // 当前移动到的位置
    switch (this.drawType) {
      case 'line': {
        let params = [this.last, now, this.lineWidth, this.drawColor]
        this.moveCallback('line', ...params)
        this.line(...params)
      }
        break
      case 'rect': {
        let params = [this.x, this.y, width, height, this.lineWidth, this.drawColor]
        this.moveCallback('rect', ...params)
        this.rect(...params)
      }
        break
      case 'polygon': {
        let params = [this.x, this.y, this.sides, width, height, this.lineWidth, this.drawColor]
        this.moveCallback('polygon', ...params)
        this.polygon(...params)
      }
        break
      case 'arc': {
        let params = [this.x, this.y, width, height, this.lineWidth, this.drawColor]
        this.moveCallback('arc', ...params)
        this.arc(...params)
      }
        break
      case 'eraser': {
        let params = [endx, endy, this.width, this.height, this.lineWidth]
        this.moveCallback('eraser', ...params)
        this.eraser(...params)
      }
        break
    }
  }
  onmouseup() { // 鼠标抬起
    if (this.isClickCanvas) {
      this.isClickCanvas = false
      this.canvas.removeEventListener('mousemove', this.bindMousemove)
      if (this.isMoveCanvas) { // 鼠标没有移动不保存
        this.isMoveCanvas = false
        this.moveCallback('gatherImage')
        this.gatherImage()
      }
    }
  }
  line(last, now, lineWidth, drawColor) { // 绘制线性
    this.paint.beginPath()
    this.paint.lineCap = "round" // 设定线条与线条间接合处的样式
    this.paint.lineJoin = "round"
    this.paint.lineWidth = lineWidth
    this.paint.strokeStyle = drawColor
    this.paint.moveTo(last[0], last[1])
    this.paint.lineTo(now[0], now[1])
    this.paint.closePath()
    this.paint.stroke() // 进行绘制
    this.last = now
  }
  rect(x, y, width, height, lineWidth, drawColor) { // 绘制矩形
    this.reSetImage()
    this.paint.lineWidth = lineWidth
    this.paint.strokeStyle = drawColor
    this.paint.strokeRect(x, y, width, height)
  }
  polygon(x, y, sides, width, height, lineWidth, drawColor) { // 绘制多边形
    this.reSetImage()
    let n = sides
    let ran = 360 / n
    let rn = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
    this.paint.beginPath()
    this.paint.strokeStyle = drawColor
    this.paint.lineWidth = lineWidth
    for (let i = 0; i < n; i++) {
      this.paint.lineTo(x + Math.sin((i * ran + 45) * Math.PI / 180) * rn, y + Math.cos((i * ran + 45) * Math.PI / 180) * rn)
    }
    this.paint.closePath()
    this.paint.stroke()
  }
  arc(x, y, width, height, lineWidth, drawColor) { // 绘制圆形
    this.reSetImage()
    this.paint.beginPath()
    this.paint.lineWidth = lineWidth
    let r = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
    this.paint.arc(x, y, r, 0, Math.PI * 2, false)
    this.paint.strokeStyle = drawColor
    this.paint.closePath()
    this.paint.stroke()
  }
  eraser(endx, endy, width, height, lineWidth) { // 橡皮擦
    this.paint.save()
    this.paint.beginPath()
    this.paint.arc(endx, endy, lineWidth / 2, 0, 2 * Math.PI)
    this.paint.closePath()
    this.paint.clip()
    this.paint.clearRect(0, 0, width, height)
    this.paint.fillStyle = '#fff'
    this.paint.fillRect(0, 0, width, height)
    this.paint.restore()
  }
  cancel() { // 撤回
    if (--this.index < 0) {
      this.index = 0
      return
    }
    this.allowCallback(this.index > 0, this.index < this.imgData.length - 1)
    this.paint.putImageData(this.imgData[this.index], 0, 0)
  }
  go() { // 前进
    if (++this.index > this.imgData.length - 1) {
      this.index = this.imgData.length - 1
      return
    }
    this.allowCallback(this.index > 0, this.index < this.imgData.length - 1)
    this.paint.putImageData(this.imgData[this.index], 0, 0)
  }
  clear() { // 清屏
    this.imgData = []
    this.paint.clearRect(0, 0, this.width, this.height)
    this.paint.fillStyle = '#fff'
    this.paint.fillRect(0, 0, this.width, this.height)
    this.gatherImage()
  }
  changeWay({ type, color, lineWidth, sides }) { // 绘制条件
    this.drawType = type !== 'color' && type || this.drawType // 绘制形状
    this.drawColor = color || this.drawColor // 绘制颜色
    this.lineWidth = lineWidth || this.lineWidth // 线宽
    this.sides = sides || this.sides // 边数
  }
  destroy() {
    this.clear()
    this.canvas.removeEventListener('mousedown', this.bindMousedown)
    document.removeEventListener('mouseup', this.bindMouseup)
    this.canvas = null
    this.paint = null
  }
}
export let paletteComponent = new PaletteComponent()

class MediaPickerComponent {
  constructor() {
  }
  getMedias(args) {
    if (!args) {
      args = {
        'selectMode': 101, // 101=picker image and video , 100=image , 102=video
        'maxSelectCount': 40, // default 40 (Optional)
        'maxSelectSize': 188743680, // 188743680=180M (Optional)
      }
    }
    return new Promise(function (resolve, reject) {
      MediaPicker.getMedias(args,
        function success(medias) {
          resolve(medias)
        }, function error(error) {
          console.log('getMedias failure: ' + error)
          reject(error)
        }
      )
    })
  }
  compressImage(media) {
    return new Promise(function (resolve, reject) {
      MediaPicker.compressImage(media,
        function success(compressMedia) {
          resolve(compressMedia)
        }, function error(error) {
          console.log('compressImage failure: ' + error)
          reject(error)
        }
      )
    })
  }
}
export let mediaPickerComponent = new MediaPickerComponent()

class SystemAudioComponent {
  constructor() {
    this.alertAudio = new Audio()
    this.alertAudio.src = alertAudioSrc

    this.audioMessageSendAudio = new Audio()
    this.audioMessageSendAudio.src = audioMessageSendAudioSrc

    this.mediaCloseAudio = new Audio()
    this.mediaCloseAudio.src = mediaCloseAudioSrc

    this.mediaInvitationAudio = new Audio()
    this.mediaInvitationAudio.src = mediaInvitationAudioSrc
    this.mediaInvitationAudio.loop = 'loop'


    this.scanAudio = new Audio()
    this.scanAudio.src = scanAudioSrc
  }
  alertPlay() {
    this.alertAudio.play()
  }
  alertStop() {
    this.alertAudio.pause()
    this.alertAudio.currentTime = 0
  }
  audioMessageSendPlay() {
    this.audioMessageSendAudio.play()
  }
  audioMessageSendStop() {
    this.audioMessageSendAudio.pause()
    this.audioMessageSendAudio.currentTime = 0
  }
  mediaCloseAudioPlay() {
    this.mediaCloseAudio.play()
  }
  mediaCloseAudioStop() {
    this.mediaCloseAudio.pause()
    this.mediaCloseAudio.currentTime = 0
  }
  mediaInvitationAudioPlay() {
    this.mediaInvitationAudio.play()
  }
  mediaInvitationAudioStop() {
    //if (this.mediaInvitationAudio) {
      this.mediaInvitationAudio.pause()
     // this.mediaInvitationAudio = null
    //}
  }
  scanAudioPlay() {
    this.scanAudio.play()
  }
  scanAudioStop() {
    this.scanAudio.pause()
    this.scanAudio.currentTime = 0
  }
}
export let systemAudioComponent = new SystemAudioComponent()

class AlloyFingerComponent {
  constructor() {
  }
  getOffset(el) {
    let element = typeof el == 'string' ? document.querySelector(el) : el
    let result = {
      top: 0,
      left: 0
    }
    // 当前为 IE11以下, 直接返回 {top: 0,left: 0}
    if (!element.getClientRects().length) {
      return result
    }
    // 当前 DOM 节点的 display === 'none' 时,直接返回 {top: 0,left: 0}
    if (window.getComputedStyle(element)['display'] === 'none') {
      return result
    }

    result = element.getBoundingClientRect()
    // 得到element所在文档的HTML节点
    let document = element.ownerDocument.documentElement
    return {
      //docElement.clientTop 一个元素顶部边框的宽度（以像素表示）。不包括顶部外边距或内边距。clientTop 是只读的
      top: result.top + window.pageYOffset - document.clientTop,
      left: result.left + window.pageXOffset - document.clientLeft
    }
  }
  initImage(el, longTapCallback, singleTapCallback) {
    let self = this
    let element = typeof el == 'string' ? document.querySelector(el) : el
    let gapWidth = 0
    let parent = element.parentNode
    if (parent) {
      gapWidth = window.innerWidth - parent.clientWidth // 如drawer的border-left不为0时需要考虑
    }
    let initLeft = gapWidth // 初始化时self.getOffset(element).left的值等于宽度、不正确，宽度为100%时等于gapWidth
    let initTop = self.getOffset(element).top // 在dialog中初始化时self.getOffset(element).top的值可能不正确，在tabPanel中时正确
    console.log('initLeft:' + initLeft + ',initTop:' + initTop + ',gapWidth:' + gapWidth)
    Transform(element, true)
    let initScale = 1
    let af = new AlloyFinger(element, {
      longTap: function (evt) {
        if (longTapCallback) {
          console.log('initImage-longTap')
          longTapCallback()
        }
      },
      singleTap: function (evt) {
        if (singleTapCallback) {
          console.log('initImage-singleTap')
          singleTapCallback()
        }
      },
      multipointStart: function (evt) {
        console.log('initImage-multipointStart')
        //reset origin x and y
        let centerX = (evt.touches[0].pageX + evt.touches[1].pageX) / 2
        let centerY = (evt.touches[0].pageY + evt.touches[1].pageY) / 2
        let cr = element.getBoundingClientRect()
        let img_centerX = cr.left + cr.width / 2
        let img_centerY = cr.top + cr.height / 2
        let offX = centerX - img_centerX
        let offY = centerY - img_centerY
        let preOriginX = element.originX
        let preOriginY = element.originY
        element.originX = offX / element.scaleX
        element.originY = offY / element.scaleY
        //reset translateX and translateY
        element.translateX += offX - preOriginX * element.scaleX
        element.translateY += offY - preOriginY * element.scaleX
        initScale = element.scaleX
        console.log('initScale:' + initScale)
      },
      pinch: function (evt) {
        console.log('initImage-pinch')
        let tempo = evt.zoom
        if (initScale * tempo > 10) {
          return
        }
        element.scaleX = element.scaleY = initScale * tempo
      },
      multipointEnd: function (evt) {
        console.log('initImage-multipointEnd')
        let width = element.width * element.scaleX
        let height = element.height * element.scaleY
        //console.log("scaleX:" + element.scaleX + ",width:" + width + ",height:" + height)
        let left = self.getOffset(element).left
        let top = self.getOffset(element).top
        //console.log("left:" + left + ",top:" + top + ",translateX:" + element.translateX + ",translateY:" + element.translateY)
        if (width + gapWidth > window.innerWidth) {
          if (left > gapWidth) {
            console.log('stickLeft')
            element.translateX += gapWidth - left
            //evt.preventDefault()
          } else if (width + left < window.innerWidth) {
            console.log('stickRight')
            element.translateX += window.innerWidth - (width + left)
            //evt.preventDefault()
          }
        }
        if (height > window.innerHeight) {
          if (top > 0) {
            console.log('stickTop')
            element.translateY += 0 - top
            //evt.preventDefault()
          } else if (height + top < window.innerHeight) {
            console.log('stickBottom')
            element.translateY += window.innerHeight - (height + top)
            //evt.preventDefault()
          }
        }
        if (element.scaleX < 1) {
          console.log('restoreSize')
          element.scaleX = element.scaleY = 1
        }
        if (element.scaleX === 1) {
          console.log('restorePosition')
          let left = self.getOffset(element).left
          let top = self.getOffset(element).top
          element.translateX += initLeft - left
          element.translateY += initTop - top
          //evt.preventDefault()
        }
      },
      pressMove: function (evt) {
        console.log('initImage-pressMove')
        let width = element.width * element.scaleX
        let height = element.height * element.scaleY
        if (width + gapWidth > window.innerWidth) {
          console.log('pressMoveXXX')
          element.translateX += evt.deltaX
          //evt.preventDefault()
        }
        if (height > window.innerHeight) {
          console.log('pressMoveYYY')
          element.translateY += evt.deltaY
          //evt.preventDefault()
        }
      },
      doubleTap: function (evt) {
        console.log('initImage-doubleTap')
        if (element.scaleX > 1) {
          element.scaleX = element.scaleY = 1
        } else if (element.scaleX === 1) {
          element.scaleX = element.scaleY = 2
        }
      }
    })
  }
  initLongSingleTap(el, longTapCallback, singleTapCallback) {
    let element = typeof el == 'string' ? document.querySelector(el) : el
    let af = new AlloyFinger(element, {
      longTap: function (evt) {
        if (longTapCallback) {
          console.log('initLongSingleTap-longTap')
          longTapCallback()
        }
      },
      singleTap: function (evt) {
        if (singleTapCallback) {
          console.log('initLongSingleTap-singleTap')
          singleTapCallback()
        }
      }
    })
  }
}
export let alloyFingerComponent = new AlloyFingerComponent()
