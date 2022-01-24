import { UUID } from 'libcolla'
import { myself } from 'libcolla'
import { BlockType } from 'libcolla'

import { channelComponent, ChannelDataType, ChannelType, EntityType } from '@/libs/biz/colla-channel'
import { collectionUtil } from '@/libs/biz/colla-collection-util'

export default {
  name: "NewChannel",
  components: {
  },
  data() {
    return {
      channelData: {
        avatar: null,
        name: null,
        description: null
      },
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
    }
  },
  methods: {
    async createChannel() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      try {
        let blockId = UUID.string(null, null)
        let currentTime = new Date().getTime()
        let current = {
          ownerPeerId: myself.myselfPeerClient.peerId,
          creator: myself.myselfPeerClient.peerId,
          channelType: ChannelType.PUBLIC,
          channelId: blockId,
          avatar: _that.channelData.avatar,
          name: _that.channelData.name,
          description: _that.channelData.description,
          entityType: EntityType.INDIVIDUAL,
          businessNumber: blockId,
          blockId: blockId,
          createDate: currentTime,
          updateDate: currentTime,
          markDate: currentTime,
          top: true
        }
        let blockType = BlockType.Channel
        let _peers = []
        let expireDate = currentTime + 1000 * 3600 * 24 * 365 * 100 // 100 years
        // 云端保存
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
        await channelComponent.insert(ChannelDataType.CHANNEL, current)
        store.state.channels.unshift(current)
        store.state.channelMap[current.channelId] = current
        store.toggleDrawer(false)
        _that.channelData = {
          avatar: null,
          name: null,
          description: null
        }
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
    channelUpload: function (files) {
      let _that = this
      let file = files[0]
      let reader = new FileReader()
      reader.onload = _that.onChangeAvatar
      reader.readAsDataURL(file)
      _that.$refs.channelUpload.reset()
    },
    onChangeAvatar: function (e) {
      this.processAvatar2(e.target.result)
    },
    processAvatar2(avatarBase64) {
      let _that = this
      let newImage = new Image()
      newImage.src = avatarBase64
      newImage.setAttribute('crossOrigin', 'Anonymous') // url为外域时需要
      newImage.onload = function () {
        let imgWidth = this.width
        let imgHeight = this.height
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        // 缩小图片尺寸：短边300px
        console.log('imgWidth: ' + imgWidth + ', imgHeight: ' + imgHeight)
        let w = 300
        if (imgWidth > imgHeight) {
          canvas.width = w
          canvas.height = w * imgHeight / imgWidth
        } else {
          canvas.height = w
          canvas.width = w * imgWidth / imgHeight
        }
        console.log('canvasWidth: ' + canvas.width + ', canvasHeight: ' + canvas.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(newImage, 0, 0, canvas.width, canvas.height)
        // 压缩图片大小：长度10k以下
        console.log('avatarBase64.length: ' + avatarBase64.length)
        let quality = 1.0
        let arr = avatarBase64.split(',')
        let mime = arr[0].match(/:(.*?);/)[1]
        mime = (mime === 'image/png' ? 'image/jpeg' : mime)
        while (avatarBase64.length / 1024 > 10) {
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
        _that.channelData.avatar = avatarBase64
      }
    },
  },
  created() {
    let _that = this
    let store = _that.$store
  }
}
