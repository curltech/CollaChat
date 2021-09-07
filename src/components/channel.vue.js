import { date } from 'quasar'

import { BlockType } from 'libcolla'
import { dataBlockService, queryValueAction } from 'libcolla'
import { CollaUtil } from 'libcolla'

export default {
  name: "Channel",
  components: {
  },
  data() {
    return {
      channelfilter: null,
      channelList: [],
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search')
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    ChannelFilteredList() {
      let _that = this
      let store = _that.$store
      let channelFilteredArray = []
      let channelList = _that.channelList
      if (channelList && channelList.length > 0) {
        let channelFilter = _that.channelFilter
        if (channelFilter) {
          channelFilteredArray = channelList.filter((channel) => {
            if (channel) {
              return channel.metadata.toLowerCase().includes(channelFilter.toLowerCase())
              || pinyinUtil.getPinyin(channel.metadata).toLowerCase().includes(channelFilter.toLowerCase())
            }
          })
        } else {
          channelFilteredArray = channelList
        }
        if(channelFilteredArray.length > 0) {
            CollaUtil.sortByKey(channelFilteredArray, 'updateDate', 'desc')
        }
      }
      return channelFilteredArray
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
    async getChannelList() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      // 查询cloud全量DataBlock索引信息
      let conditionBean = {}
      conditionBean['businessNumber'] = 'Channel'
      conditionBean['getAllBlockIndex'] = true
      conditionBean['blockType'] = BlockType.Channel
      _that.channelList = []
      let indexList = []
      if(store.state.networkStatus === 'CONNECTED'){
        indexList = await queryValueAction.queryValue(null, conditionBean)
      }
      console.log('indexList:' + JSON.stringify(indexList))
      if (indexList && indexList.length > 0) {
        let ps = []
        for (let index of indexList) {
          let promise = dataBlockService.findTxPayload(null, index['blockId'])
          ps.push(promise)
        }
        CollaUtil.asyncPool(10, ps, async function(result) {
          let channels = await result
          if (channels && channels.length > 0) {
            let channel = channels[0]
            if (channel) {
              _that.channelList.push(channel)
            }
          }
        })
      }
      console.log('channelList:' + JSON.stringify(_that.channelList))
      _that.$q.loading.hide()
    },
    async channelSelected(channel, index) {
      let _that = this
      let store = _that.$store
      let prevCurrentChannel = store.state.currentChannel
      store.state.currentChannel = channel
      store.channelDetailsEntry = 'channel'
      store.changeKind('channelDetails')
      store.toggleDrawer(true)
      if (!(_that.ifMobileSize || store.state.ifMobileStyle) && prevCurrentChannel && prevCurrentChannel.channelId !== channel.channelId) {
        store.changeChannelDetailsSubKind('default')
      }
      await _that.getArticleList()
    },
    async getArticleList() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      // 查询cloud全量DataBlock索引信息
      let conditionBean = {}
      conditionBean['businessNumber'] = store.state.currentChannel['channelId']
      conditionBean['getAllBlockIndex'] = true
      conditionBean['blockType'] = BlockType.ChannelArticle
      let articleList = []
      let indexList = []
      if(store.state.networkStatus === 'CONNECTED'){
        indexList = await queryValueAction.queryValue(null, conditionBean)
      }
      console.log('indexList:' + JSON.stringify(indexList))
      if (indexList && indexList.length > 0) {
        let ps = []
        for (let index of indexList) {
          let promise = dataBlockService.findTxPayload(null, index['blockId'])
          ps.push(promise)
        }
        CollaUtil.asyncPool(10, ps, async function(result) {
          let articles = await result
          if (articles && articles.length > 0) {
            let article = articles[0]
            if (article) {
              articleList.push(article)
            }
          }
        })
      }
      store.state.articleList = articleList
      console.log('articleList:' + JSON.stringify(articleList))
      _that.$q.loading.hide()
    },
    newChannel() {
      let _that = this
      let store = _that.$store
      store.changeKind('newChannel', 'channel')
      store.toggleDrawer(true)
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
    await _that.getChannelList()
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  watch: {
  }
}
