import { date } from 'quasar'

import { CollaUtil } from 'libcolla'
import { myself } from 'libcolla'
import { BlockType, dataBlockService } from 'libcolla'

import { collectionUtil } from '@/libs/biz/colla-collection-util'
import { channelComponent, ChannelDataType } from '@/libs/biz/colla-channel'
import NewArticle from '@/components/newArticle'

export default {
  name: "ChannelDetails",
  components: {
    newArticle: NewArticle,
  },
  data() {
    return {
      subKind: 'default',
      channelData: {
        avatar: null,
        name: null,
        description: null
      }
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
    ArticleFilteredList() {
      let _that = this
      let store = _that.$store
      let articleList = store.state.articles
      if (articleList && articleList.length > 0) {
        CollaUtil.sortByKey(articleList, 'updateDate', 'asc')
      }
      return articleList
    },
    detailDateFormat() {
      let _that = this
      return function (createDate) {
        if (createDate) {
          createDate = new Date(createDate)
          let currentDate = new Date()
          let dateString = createDate.toDateString()
          let currentDateString = currentDate.toDateString()
          if (dateString === currentDateString) {
            return date.formatDate(createDate, 'HH:mm')
          } else if ((new Date(currentDateString) - new Date(dateString)) / (1000 * 60 * 60 * 24) < 7) {
            let weekTimeString = date.formatDate(createDate, 'dddd HH:mm')
            let weekTimeArrary = weekTimeString.split(' ')
            let weekString = `${_that.$i18n.t(weekTimeArrary[0])} ${weekTimeArrary[1]}`
            return weekString
            } else {
              return date.formatDate(createDate, 'YYYY-MM-DD HH:mm')
            }
        }
      }
    },
  },
  methods: {
    async articleSelected(article, index) {
      let _that = this
      let store = _that.$store
      if (!article) {
        return
      }
      if (!article.content) {
        let blocks = await dataBlockService.findTxPayload(null, article.blockId)
        if (blocks && blocks.length > 0) {
          article = blocks[0]
        }
      }
      store.state.currentArticle = article
      _that.subKind = 'view'
    },
    viewCommand() {
      let _that = this
      let store = _that.$store
      let actions = [
        {
          label: _that.$i18n.t('Forward'),
          icon: 'forward',
          id: 'forward'
        },
        {},
        {
          label: _that.$i18n.t('Delete'),
          icon: 'delete',
          id: 'delete'
        },
        {},
        {
          label: _that.$i18n.t('Cancel'),
          icon: 'cancel',
          id: 'cancel'
        }
      ]
      let channel = store.state.currentChannel
      if (channel.creator === myself.myselfPeerClient.peerId) {
        actions.unshift({
          label: _that.$i18n.t('Edit'),
          icon: 'edit',
          id: 'edit'
        },{})
      }
      _that.$q.bottomSheet({
        actions: actions
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        if (action.id === 'edit') {
          let article = store.state.currentArticle
          store.state.articleData = {
            cover: article.cover,
            author: article.author,
            title: article.title,
            abstract: article.abstract,
            content: article.content
          }
          store.newArticleEntry = 'editArticle'
          _that.subKind = 'newArticle'
        } else if (action.id === 'forward') {
          store.selectChatEntry = 'articleForward'
          _that.subKind = 'selectChat'
        } else if (action.id === 'delete') {
          await _that.deleteArticle()
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    channelCommand() {
      let _that = this
      let store = _that.$store
      let channel = store.state.currentChannel
      let actions = [
        {
          label: channel.top ? _that.$i18n.t('Untop') : _that.$i18n.t('Top'),
          icon: channel.top ? 'star_outline' : 'star',
          id: 'top'
        },
        {},
        {
          label: _that.$i18n.t('Forward'),
          icon: 'forward',
          id: 'forward'
        },
        {},
        {
          label: _that.$i18n.t('Cancel'),
          icon: 'cancel',
          id: 'cancel'
        }
      ]
      if (channel.creator === myself.myselfPeerClient.peerId) {
        actions.unshift({
          label: _that.$i18n.t('Delete'),
          icon: 'delete',
          id: 'delete'
        },{})
        actions.unshift({
          label: _that.$i18n.t('Edit'),
          icon: 'edit',
          id: 'edit'
        },{})
        actions.unshift({
          label: _that.$i18n.t('New Article'),
          icon: 'article',
          id: 'newArticle'
        },{})
      }
      _that.$q.bottomSheet({
        actions: actions
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        if (action.id === 'newArticle') {
          store.state.articleData = {
            cover: null,
            author: null,
            title: null,
            abstract: null,
            content: null
          }
          store.newArticleEntry = 'newArticle'
          _that.subKind = 'newArticle'
        } else if (action.id === 'edit') {
          _that.channelData = {
            avatar: store.state.currentChannel.avatar,
            name: store.state.currentChannel.name,
            description: store.state.currentChannel.description
          }
          _that.subKind = 'editChannel'
        } else if (action.id === 'delete') {
          _that.deleteChannel()
        } else if (action.id === 'top') {
          _that.top()
        } else if (action.id === 'forward') {
          store.selectChatEntry = 'channelForward'
          _that.subKind = 'selectChat'
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    async follow() {
      let _that = this
      let store = _that.$store
      let channel = store.state.currentChannel
      let markDate = channel.markDate
    },
    async top() {
      let _that = this
      let store = _that.$store
      let channel = store.state.currentChannel
      let top = channel.top
    },
    async editChannel() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      try {
        let currentTime = new Date().getTime()
        let current = store.state.currentChannel
        current.avatar = _that.channelData.avatar
        current.name = _that.channelData.name
        current.description = _that.channelData.description
        current.updateDate = new Date().getTime()
        let blockType = BlockType.Channel
        let _peers = []
        let expireDate = currentTime + 3600*24*365*100 // 100 years
        // ????????????
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
        // ????????????
        await channelComponent.update(ChannelDataType.CHANNEL, current)
        store.state.channelMap[current.channelId] = current
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
    async deleteChannel() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      try {
        let current = store.state.currentChannel
        // ????????????
        await collectionUtil.deleteBlock(current, true, BlockType.Channel)
        // ????????????
        let channelRecord = await channelComponent.get(ChannelDataType.CHANNEL, current._id)
        await channelComponent.remove(ChannelDataType.CHANNEL, channelRecord, store.state.channels)
        delete store.state.channelMap[current.channelId]
        store.state.currentChannel = null
        if (store.state.ifMobileStyle) {
          store.toggleDrawer(false)
        }
      } catch (error) {
        console.error(error)
        _that.$q.notify({
          message: _that.$i18n.t("Delete failed"),
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
      newImage.setAttribute('crossOrigin', 'Anonymous') // url??????????????????
      newImage.onload = function () {
        let imgWidth = this.width
        let imgHeight = this.height
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        // ???????????????????????????300px
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
        // ???????????????????????????10k??????
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
    async deleteArticle() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      try {
        let current = store.state.currentArticle
        // ????????????
        await collectionUtil.deleteBlock(current, true, BlockType.Article)
        // ????????????
        let articleDBItems = await channelComponent.loadArticle({
          ownerPeerId: myself.myselfPeerClient.peerId,
          articleId: current.articleId,
          updateDate: { $gt: null }
        }, [{ updateDate: 'desc' }])
        if (articleDBItems && articleDBItems.length > 0) {
          current._id = articleDBItems[0]._id
          let articleRecord = await channelComponent.get(ChannelDataType.ARTICLE, current._id)
          await channelComponent.remove(ChannelDataType.ARTICLE, articleRecord, store.state.articles)
        }
        store.state.currentArticle = null
        _that.subKind = "default"
      } catch (error) {
        console.error(error)
        _that.$q.notify({
          message: _that.$i18n.t("Delete failed"),
          timeout: 3000,
          type: "warning",
          color: "warning"
        })
      } finally {
        _that.$q.loading.hide()
      }
    },
  },
  async created() {
    let _that = this
    let store = _that.$store
    store.changeChannelDetailsSubKind = function (subKind) {
      _that.subKind = subKind
    }
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  watch: {
  }
}
