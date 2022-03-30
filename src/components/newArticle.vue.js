import { UUID } from 'libcolla'
import { myself } from 'libcolla'
import { BlockType } from 'libcolla'
import { CollaUtil, BlobUtil } from 'libcolla'

import E from '@/libs/base/colla-wangEditor'
import pinyinUtil from '@/libs/base/colla-pinyin'
import { fileComponent, photoLibraryComponent } from '@/libs/base/colla-cordova'
import { mediaCaptureComponent, mediaPickerComponent, alloyFingerComponent, mediaComponent } from '@/libs/base/colla-media'
import { channelComponent, ChannelDataType } from '@/libs/biz/colla-channel'
import { collectionUtil } from '@/libs/biz/colla-collection-util'
import SelectChat from '@/components/selectChat'
import CaptureMedia from '@/components/captureMedia'

let editor

export default {
  name: "NewArticle",
  components: {
    selectChat: SelectChat,
    captureMedia: CaptureMedia
  },
  data() {
    return {
      subKind: 'default',
      selected: null,
      captureType: null,
      imageUrl: null,
      audioUrl: null,
      videoUrl: null
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
    },
    fullscreenStyle() {
      return 'max-width: 100%;max-height: ' + (this.$q.screen.height - 50) + 'px;'
    },
  },
  methods: {
    async createArticle() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      try {
        let clientPeerId = myself.myselfPeerClient.peerId
        let currentTime = new Date().getTime()
        let content = store.state.articleData.content ? store.state.articleData.content : ''
        let plainContent = content ? content.replace(/<[^>]+>/g, '').replace(/^\s*/g, '') : ''
        let pyPlainContent = pinyinUtil.getPinyin(plainContent)
        let current
        let blockType = BlockType.ChannelArticle
        if (store.newArticleEntry === 'newArticle') {
          let channelId = store.state.currentChannel.channelId
          let blockId = UUID.string(null, null)
          current = {
            ownerPeerId: clientPeerId,
            channelId: channelId,
            articleId: blockId,
            cover: store.state.articleData.cover,
            author: store.state.articleData.author,
            title: store.state.articleData.title,
            abstract: store.state.articleData.abstract,
            content: content,
            plainContent: plainContent,
            pyPlainContent: pyPlainContent,
            metadata: plainContent,
            businessNumber: blockId,
            blockId: blockId,
            createDate: currentTime,
            updateDate: currentTime
          }
        } else if (store.newArticleEntry === 'editArticle') {
          current = store.state.currentArticle
          // 云端删除old
          let old = CollaUtil.clone(current)
          await collectionUtil.deleteBlock(old, true, blockType)
          // current
          current.cover = store.state.articleData.cover
          current.author = store.state.articleData.author
          current.title = store.state.articleData.title
          current.abstract = store.state.articleData.abstract
          current.content = content
          current.plainContent = plainContent
          current.pyPlainContent = pyPlainContent
          current.metadata = plainContent
          current.updateDate = currentTime
          current.blockId = UUID.string(null, null)
        }
        // 云端保存
        let _peers = []
        let expireDate = currentTime + 1000 * 3600 * 24 * 365 * 100 // 100 years
        let result = await collectionUtil.saveBlock(current, true, blockType, _peers, expireDate)
        if (!result) {
          _that.$q.notify({
            message: _that.$i18n.t("Save failed"),
            timeout: 3000,
            type: "warning",
            color: "info",
          })
          return
        }
        // 本地保存
        if (store.newArticleEntry === 'newArticle') {
          await channelComponent.insert(ChannelDataType.ARTICLE, current)
          store.state.articles.unshift(current)
        } else if (store.newArticleEntry === 'editArticle') {
          await channelComponent.update(ChannelDataType.ARTICLE, current)
          let i = 0
          for (let article of store.state.articles) {
            if (article.articleId === current.articleId) {
              store.state.articles.splice(i, 1, current)
              break
            }
            i++
          }
        }
        store.changeChannelDetailsSubKind('default')
      } catch (error) {
        console.error(error)
        _that.$q.notify({
          message: _that.$i18n.t("Save failed"),
          timeout: 3000,
          type: "warning",
          color: "warning"
        })
      } finally {
        _that.$q.loading.hide()
      }
    },
    setEditor() {
      let _that = this
      let store = _that.$store
      _that.$nextTick(() => {
        editor = new E(_that.$refs.editorToolbar, _that.$refs.editorContainer)
        editor.customConfig.menus = [
          'head', // 标题
          'bold', // 粗体
          //'fontSize', // 字号
          //'fontName', // 字体
          //'italic', // 斜体
          //'underline', // 下划线
          //'strikeThrough', // 删除线
          //'foreColor', // 文字颜色
          //'backColor', // 背景颜色
          'list', // 列表
          //'justify', // 对齐方式
          //'quote', // 引用
          //'emoticon', // 表情
          //'table', // 表格
          'link', // 插入链接
          'image', // 插入图片
          'video', // 插入视频
          //'code', // 插入代码
          //'undo', // 撤销
          //'redo', // 重复
          //'fullscreen' // 全屏
          'audio' //音频
        ]
        let language = myself.myselfPeerClient && myself.myselfPeerClient.language ? myself.myselfPeerClient.language : _that.$i18n.locale
        if (language === 'zh-tw') {
          editor.customConfig.lang = {
            '设置标题': '設置標題',
            '正文': '正文',
            '设置列表': '設置列表',
            '数字编码': '數字編碼',
            '项目符号': '項目符號',
            '分割横线': '分割橫線',
            '链接文字': '鏈接文字',
            '图片链接': '圖片鏈接',
            '视频链接': '視頻鏈接',
            '音频链接': '音頻鏈接',
            '插入链接': '插入鏈接',
            '删除链接': '刪除鏈接',
            '链接': '鏈接',
            '图片显示': '圖片顯示',
            '视频显示': '視頻顯示',
            '音频显示': '音頻顯示',
            '最大宽度': '最大寬度',
            '预览图片': '預覽圖片',
            '删除图片': '刪除圖片',
            '预览视频': '預覽視頻',
            '删除视频': '刪除視頻',
            '图片': '圖片',
            '视频': '視頻',
            '音频': '音頻',
            '插入': '插入',
            '格式如': '格式如'
          }
        } else if (language !== 'zh-hans') {
          editor.customConfig.lang = {
            '设置标题': 'Title',
            '正文': 'P',
            '设置列表': 'List',
            '数字编码': 'Numbering',
            '项目符号': 'Bullet List',
            '分割横线': 'Split Line',
            '链接文字': 'Link Text',
            '图片链接': 'Image Link',
            '视频链接': 'Video Link',
            '音频链接': 'Audio Link',
            '插入链接': 'Insert',
            '删除链接': 'Delete',
            '链接': 'Link',
            '图片显示': 'Image Display',
            '视频显示': 'Video Display',
            '音频显示': 'Audio Display',
            '最大宽度': 'Width',
            '预览图片': 'Preview',
            '删除图片': 'Delete',
            '预览视频': 'Preview',
            '删除视频': 'Delete',
            '图片': 'Image',
            '视频': 'Video',
            '音频': 'Audio',
            '插入': 'Insert',
            '格式如': 'Format'
          }
        }
        editor.customConfig.uploadImgShowBase64 = true // 使用 base64 保存图片、视频、音频
        editor.customConfig.ios = store.ios // 是否ios
        editor.customConfig.uploadImgMaxSize = store.uploadFileSizeLimit * 1024 * 1024 // 上传文件大小限制（单位：M）
        editor.customConfig.uploadImgMaxLength = store.uploadFileNumLimit // 同时上传文件数量限制
        editor.customConfig.imageMaxWidth = store.imageMaxWidth
        editor.customConfig.videoMaxWidth = store.videoMaxWidth
        editor.customConfig.audioMaxWidth = store.audioMaxWidth
        editor.customConfig.customAlert = (alertInfo) => {
          let message
          let arr = alertInfo.split(',')
          let key = arr[0]
          if (key === 'uploadFileSizeLimit') {
            message = '[' + arr[1] + ']' + _that.$i18n.t(' file size exceeds limit ') + store.uploadFileSizeLimit + 'M'
          } else if (key === 'uploadFileNumLimit') {
            message = _that.$i18n.t('The number of files exceeds the limit ') + store.uploadFileNumLimit
          }
          if (message) {
            _that.$q.notify({
              message: message,
              timeout: 3000,
              type: "warning",
              color: "warning",
            })
          }
        }
        editor.customConfig.onImgSelected = (selectedImg) => {
          _that.showFullscreen(selectedImg)
        }
        editor.customConfig.onVideoSelected = (selectedVideo) => {
          _that.showFullscreen(selectedVideo)
        }
        editor.customConfig.onAudioSelected = (selectedAudio) => {
          _that.showFullscreen(selectedAudio)
        }
        editor.customConfig.captureImage = () => {
          _that.capture('image')
        }
        editor.customConfig.captureVideo = () => {
          _that.capture('video')
        }
        editor.customConfig.captureAudio = () => {
          _that.capture('audio')
        }
        editor.customConfig.selectImage = async () => {
          await _that.select('image')
        }
        editor.customConfig.selectVideo = async () => {
          await _that.select('video')
        }
        editor.customConfig.selectAudio = async () => {
          await _that.select('audio')
        }
        editor.customConfig.onchange = (html) => {
          store.state.articleData.content = html
        }
        editor.customConfig.setMaxWidth = (type, width) => {
          _that.setMaxWidth(type, width)
        }
        editor.create()
        editor.txt.html(store.state.articleData.content ? store.state.articleData.content : '')
      })
    },
    setMaxWidth(type, width) {
      if (type === 'image') {
        store.imageMaxWidth = width
      } else if (type === 'video') {
        store.videoMaxWidth = width
      } else if (type === 'audio') {
        store.audioMaxWidth = width
      }
    },
    showFullscreen(selected) {
      let _that = this
      let store = _that.$store
      selected = _that.selected = selected[0]
      _that.fullscreenEntry = _that.subKind
      _that.subKind = 'fullscreen'
      _that.$nextTick(() => {
        if (selected && selected.nodeName === 'IMG') {
          var img = new Image()
          img.src = selected.src
          img.onload = () => {
            console.log('img.width: ' + img.width + ', img.height: ' + img.height)
            let selectedImg = document.querySelector('#selectedImg')
            /*let selectedContainer = document.getElementById('selectedContainer')
            let canvasWidth = _that.ifMobileSize || store.state.ifMobileStyle ? _that.$q.screen.width : (img.width > selectedContainer.clientWidth ? selectedContainer.clientWidth : img.width)
            let canvasHeight = canvasWidth * img.height / img.width*/
            let canvasWidth = selectedImg.width
            let canvasHeight = selectedImg.height
            let marginTop = 0
            if (store.ifMobile()) { // 不使用_that.$q.screen.height，避免键盘弹出时的影响
              //marginTop = (store.screenHeight - canvasHeight) / 2 - 50
              marginTop = (store.screenHeight - canvasHeight - 50) / 2
            } else {
              //marginTop = (_that.$q.screen.height - canvasHeight) / 2 - 50
              marginTop = (_that.$q.screen.height - canvasHeight - 50) / 2
            }
            //marginTop = marginTop < 0 ? 0 : marginTop
            console.log('screenHeight:' + (store.ifMobile() ? store.screenHeight : _that.$q.screen.height) + ',canvas.width:' + canvas.width + ',canvas.height:' + canvas.height + ',marginTop:' + marginTop)
            selectedImg.style.cssText += 'margin-top: ' + marginTop + 'px'
            if (store.ifMobile()) {
              alloyFingerComponent.initImage('#selectedImg')
              alloyFingerComponent.initLongSingleTap('#selectedContainer', _that.imageCommand, _that.fullscreenBack)
            }
          }
        } else if (selected && selected.nodeName === 'VIDEO') {
          if (window.device && window.device.platform === 'iOS' && selected.src.indexOf('data:video/webm;base64,') > -1) {
            _that.$q.notify({
              message: _that.$i18n.t("Can not play this video"),
              timeout: 3000,
              type: "warning",
              color: "warning",
            })
          }
        }
      })
    },
    canPlay() {
      let _that = this
      let store = _that.$store
      _that.$nextTick(() => {
        let selectedVideo = document.querySelector('#selectedVideo')
        if (selectedVideo) {
          /*let width = selectedVideo.videoWidth
          let height = selectedVideo.videoHeight
          let initWidth = width //_that.$q.screen.width < 481 ? _that.$q.screen.width : 480
          let initHeight = height //initWidth * height / width*/
          let initWidth = selectedVideo.offsetWidth
          let initHeight = selectedVideo.offsetHeight
          let marginTop = 0
          if (store.ifMobile()) { // 不使用_that.$q.screen.height，避免键盘弹出时的影响
            /*if (initHeight > store.screenHeight - 50) {
              initHeight = store.screenHeight - 50
              initWidth = initHeight * width / height
            }*/
            marginTop = (store.screenHeight - initHeight - 50) / 2
          } else {
            /*if (initHeight > _that.$q.screen.height - 50) {
              initHeight = _that.$q.screen.height - 50
              initWidth = initHeight * width / height
            }*/
            marginTop = (_that.$q.screen.height - initHeight - 50) / 2
          }
          console.log('screenHeight:' + (store.ifMobile() ? store.screenHeight : _that.$q.screen.height) + ',initWidth:' + initWidth + ',initHeight:' + initHeight + ',marginTop:' + marginTop)
          selectedVideo.style.cssText += 'margin-top: ' + marginTop + 'px'
          if (store.ifMobile()) {
            alloyFingerComponent.initLongSingleTap('#selectedContainer', _that.videoCommand)
          }
        }
      })
    },
    fullscreenBack() {
      let _that = this
      let bottomSheet = document.getElementsByClassName('q-bottom-sheet')
      if (!bottomSheet || !bottomSheet[0] || bottomSheet[0].style.display === 'none') { // 排除longTap触发的singleTapCallback
        _that.subKind = _that.fullscreenEntry
      }
    },
    imageCommand() {
      let _that = this
      let store = _that.$store
      _that.$q.bottomSheet({
        actions: [
          /*{
            label: _that.$i18n.t('Forward'),
            icon: 'forward',
            id: 'forward'
          },
          {},*/
          {
            label: _that.$i18n.t('Save Picture'),
            icon: 'save',
            id: 'save'
          },
          {},
          {
            label: _that.$i18n.t('Cancel'),
            icon: 'cancel',
            id: 'cancel'
          }
        ]
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        /*if (action.id === 'forward') {
          store.state.currentQrCode = document.getElementById('selectedImg').src
          store.selectChatEntry = 'articleImg'
          _that.subKind = 'selectChat'
        } else */if (action.id === 'save') {
          let img = document.getElementById('selectedImg')
          if (store.ifMobile()) {
            let canvas = mediaComponent.image2canvas(img)
            window.canvas2ImagePlugin.saveImageDataToLibrary(
              function (msg) {
                console.log(msg)
                _that.$q.notify({
                  message: _that.$i18n.t("Save successfully"),
                  timeout: 3000,
                  type: "info",
                  color: "info",
                })
              },
              function (err) {
                console.log(err)
                _that.$q.notify({
                  message: _that.$i18n.t("Save failed"),
                  timeout: 3000,
                  type: "warning",
                  color: "warning",
                })
              },
              canvas,
              "jpeg" // format is optional, defaults to 'png'
            )
          } else {
            let avatarBase64 = img.src
            let arr = avatarBase64.split(',')
            let mime = arr[0].match(/:(.*?);/)[1]
            let extension = mime.split('/')[1]
            let a = document.createElement('a')
            a.href = BlobUtil.blobToUrl(BlobUtil.base64ToBlob(avatarBase64))
            a.download = _that.$i18n.t('Article') + '-' + new Date().getTime() + '.' + extension
            a.click()
          }
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    videoCommand() {
      let _that = this
      let store = _that.$store
      _that.$q.bottomSheet({
        actions: [
          /*{
            label: _that.$i18n.t('Forward'),
            icon: 'forward',
            id: 'forward'
          },
          {},*/
          {
            label: _that.$i18n.t('Save Video'),
            icon: 'save',
            id: 'save'
          },
          {},
          {
            label: _that.$i18n.t('Cancel'),
            icon: 'cancel',
            id: 'cancel'
          }
        ]
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        /*if (action.id === 'forward') {

        } else */if (action.id === 'save') {
          if (store.ifMobile()) {
            let base64 = _that.selected.src
            let dirEntry = await fileComponent.getRootDirEntry('tmp')
            let dirPath = dirEntry.toInternalURL()
            let fileName = 'Video' + UUID.string(null, null) + '.' + base64.substring(11, base64.indexOf(';', 11))
            let fileEntry = await fileComponent.createNewFileEntry(fileName, dirPath)
            let blob = BlobUtil.base64ToBlob(base64)
            await fileComponent.writeFile(fileEntry, blob, false).then(async function () {
              let url = fileEntry.nativeURL
              console.log('saveVideo url:' + url)
              await photoLibraryComponent.saveVideo(url, 'Video' + '-' + new Date().getTime())
            })
            _that.$q.notify({
              message: _that.$i18n.t("Save successfully"),
              timeout: 3000,
              type: "info",
              color: "info",
            })
          } else {
            let base64 = _that.videoRecordMessageSrc
            let arr = base64.split(',')
            let mime = arr[0].match(/:(.*?);/)[1]
            let extension = mime.split('/')[1]
            let a = document.createElement('a')
            a.href = BlobUtil.blobToUrl(BlobUtil.base64ToBlob(base64))
            a.download = _that.$i18n.t('Video') + '-' + new Date().getTime() + '.' + extension
            a.click()
          }
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    async insertEditor(files) {
      let _that = this
      let store = _that.$store
      let insertHtml = await collectionUtil.getInsertHtml(files, store.imageMaxWidth, store.videoMaxWidth, store.audioMaxWidth)
      let html = store.state.articleData.content ? store.state.articleData.content : ''
      html = html.replace('([{PHFI}])', insertHtml)
      store.state.articleData.content = html
      editor.txt.html(html)
    },
    /**
     *
     * @param {*} type image,video,audio
     */
    async capture(type) {
      let _that = this
      let store = _that.$store
      _that.captureType = type
      if (store.ios === true || (store.android === true && store.useNativeAndroid === true && type !== 'audio')) {
        try {
          if (type === 'image') {
            _that.imageUrl = await mediaCaptureComponent.captureImage()
          }
          if (type === 'video') {
            _that.videoUrl = await mediaCaptureComponent.captureVideo()
          }
          if (type === 'audio') {
            _that.audioUrl = await mediaCaptureComponent.captureAudio()
          }
          _that.articleSaveMedia()
        } catch (e) {
          console.log(e)
          _that.cancelSelectArticleCaptureMedia()
        }
      } else if (store.chrome === true) {
        store.captureMediaEntry = 'article'
        store.captureType = type
        _that.subKind = 'captureMedia'
      } else if (store.safari === true) {
        //if (type === 'image') {
        store.captureMediaEntry = 'article'
        store.captureType = type
        _that.subKind = 'captureMedia'
        /*} else {
          console.error('Not support browser safari!')
        }*/
      }
    },
    async select(type) {
      this.captureType = type
      try {
        if (this.$store.ifMobile()) {
          if (type === 'image') {
            let args = {
              'selectMode': 100, // 101=picker image and video , 100=image , 102=video
              'maxSelectCount': 40, // default 40 (Optional)
              'maxSelectSize': 188743680, // 188743680=180M (Optional)
            }
            this.imageUrl = await mediaPickerComponent.getMedias(args)
          } else if (type === 'video') {
            let args = {
              'selectMode': 102, // 101=picker image and video , 100=image , 102=video
              'maxSelectCount': 40, // default 40 (Optional)
              'maxSelectSize': 188743680, // 188743680=180M (Optional)
            }
            this.videoUrl = await mediaPickerComponent.getMedias(args)
          } else if (type === 'audio') {
            let insertHtml = ''
            let html = this.$store.state.articleData.content ? this.$store.state.articleData.content : ''
            html = html.replace('([{PHFI}])', insertHtml)
            this.$store.state.articleData.content = html
            editor.txt.html(html)
            return
          }
          this.articleSaveMedia()
        } else {
          if (type === 'image') {
            this.$refs.uploadImage.pickFiles()
          } else if (type === 'video') {
            this.$refs.uploadVideo.pickFiles()
          } else if (type === 'audio') {
            this.$refs.uploadAudio.pickFiles()
          }
        }
      } catch (e) {
        console.log(e)
        this.cancelSelectArticleCaptureMedia()
      }
    },
    async articleSaveMedia() {
      let _that = this
      let store = _that.$store
      let mediaUrl = null
      if (store.captureType) {
        mediaUrl = store.mediaUrl
      }
      if (!mediaUrl) {
        if (_that.captureType === 'image') {
          mediaUrl = _that.imageUrl
        } else if (_that.captureType === 'audio') {
          mediaUrl = _that.audioUrl
        } else if (_that.captureType === 'video') {
          mediaUrl = _that.videoUrl
        }
      }
      if (mediaUrl) {
        await collectionUtil._saveMedia(mediaUrl, store.ios, store.android, _that.insertEditor)
      }
      _that.captureType = null
      _that.imageUrl = null
      _that.audioUrl = null
      _that.videoUrl = null
    },
    cancelSelectArticleCaptureMedia() {
      let _that = this
      let store = _that.$store
      let html = store.state.articleData.content ? store.state.articleData.content : ''
      html = html.replace('<p>\(\[\{PHFI\}\]\)<br></p>', '')
      html = html.replace('\(\[\{PHFI\}\]\)', '')
      store.state.articleData.content = html
      editor.txt.html(html)
    },
    articleUpload: function (files) {
      let _that = this
      let file = files[0]
      let reader = new FileReader()
      reader.onload = _that.onChangeAvatar
      reader.readAsDataURL(file)
      _that.$refs.articleUpload.reset()
    },
    onChangeAvatar: function (e) {
      this.processAvatar2(e.target.result)
    },
    processAvatar2(avatarBase64) {
      let _that = this
      let store = _that.$store
      let newImage = new Image()
      newImage.src = avatarBase64
      newImage.setAttribute('crossOrigin', 'Anonymous') // url为外域时需要
      newImage.onload = function () {
        let imgWidth = this.width
        let imgHeight = this.height
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        // 调整图片尺寸
        console.log('imgWidth: ' + imgWidth + ', imgHeight: ' + imgHeight)
        if (imgWidth >= imgHeight * 2) {
          canvas.height = 200
          canvas.width = imgWidth * 200 / imgHeight
        } else {
          canvas.width = 400
          canvas.height = imgHeight * 400 / imgWidth
        }
        console.log('canvasWidth: ' + canvas.width + ', canvasHeight: ' + canvas.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(newImage, 0, 0, canvas.width, canvas.height)
        // 压缩图片大小：长度32k以下
        console.log('avatarBase64.length: ' + avatarBase64.length)
        let quality = 1.0
        let arr = avatarBase64.split(',')
        let mime = arr[0].match(/:(.*?);/)[1]
        mime = (mime === 'image/png' ? 'image/jpeg' : mime)
        while (avatarBase64.length / 1024 > 32) {
          let length = avatarBase64.length
          quality -= 0.01
          avatarBase64 = canvas.toDataURL(mime, quality)
          if (avatarBase64.length === length) {
            console.log('no change')
            break
          }
        }
        console.log('compressed avatarBase64.length: ' + avatarBase64.length)
        console.log('quality: ' + quality)
        console.log('avatarBase64: ' + avatarBase64)
        store.state.articleData.cover = avatarBase64
      }
    }
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeArticleSubKind = function (subKind) {
      _that.subKind = subKind
    }
    store.cancelSelectArticleCaptureMedia = _that.cancelSelectArticleCaptureMedia
    store.articleSaveMedia = _that.articleSaveMedia
    _that.setEditor()
  },
  watch: {
    subKind(val) {
      let _that = this
      let store = _that.$store
      /*if (store.state.ifMobileStyle) {
        if (val === 'fullscreen' || val === 'captureMedia') {
          statusBarComponent.style(false, '#000000')
        } else {
          statusBarComponent.style(true, '#eee')
        }
      }*/
      if (val === 'default') {
        _that.setEditor()
      }
    }
  }
}
