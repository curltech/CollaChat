import { date } from 'quasar'

import { BlockType } from 'libcolla'
import { dataBlockService, queryValueAction } from 'libcolla'
import { CollaUtil } from 'libcolla'
import { myself } from 'libcolla'

import { channelComponent, ChannelDataType } from '@/libs/biz/colla-channel'

export default {
  name: "Channel",
  components: {
  },
  data() {
    return {
      channelfilter: null,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search'),
      searchDone: false,
      searching: false,
      searchLoading: false,
      searchText: null,
      subKind: 'default',
      followChannelResultList: [],
      followChannelArticleResultList: [],
      unfollowChannelResultList: [],
      unfollowChannelArticleResultList: [],
      searchResult: 'allResult',
      cloudSyncing: false
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
      let channelList = store.state.channels
      if (channelList && channelList.length > 0) {
        let channelFilter = _that.channelFilter
        if (channelFilter) {
          channelFilteredArray = channelList.filter((channel) => {
            if (channel) {
              return channel.markDate && (channel.name.toLowerCase().includes(channelFilter.toLowerCase())
              || pinyinUtil.getPinyin(channel.name).toLowerCase().includes(channelFilter.toLowerCase())
              || channel.description.toLowerCase().includes(channelFilter.toLowerCase())
              || pinyinUtil.getPinyin(channel.description).toLowerCase().includes(channelFilter.toLowerCase()))
            }
          })
        } else {
          channelFilteredArray = channelList.filter((channel) => {
            if (channel) {
              return channel.markDate
            }
          })
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
    async cloudSync(done) {
      let _that = this
      let store = _that.$store
      if (!_that.cloudSyncing) {
        _that.cloudSyncing = true
        try {
          let channelList = store.state.channels
          // 查询cloud全量Channel索引信息
          let conditionBean = {}
          conditionBean['getAllBlockIndex'] = true
          conditionBean['blockType'] = BlockType.Channel
          let channelIndexList = []
          if(store.state.networkStatus === 'CONNECTED'){
            channelIndexList = await queryValueAction.queryValue(null, conditionBean)
          }
          console.log('channelIndexList:' + JSON.stringify(channelIndexList))
          if (channelIndexList && channelIndexList.length > 0) {
            for (let channelIndex of channelIndexList) {
              channelIndex.avatar = channelIndex.thumbnail
              channelIndex.thumbnail = null
            }
            for (let channel of channelList) {
              let exists = false
              for (let channelIndex of channelIndexList) {
                if (channel.channelId === channelIndex.channelId) {
                  exists = true
                  break
                }
              }
              if (!exists) {
                if (localBlockIndex.versionFlag === 'sync' || (localBlockIndex.versionFlag === 'local' && !localFailedBlockIds.includes(localBlockIndex._id))) {
                  deleteList.push(localBlockIndex._id)
                }
              }
            }
          }
        } catch (e) {
          console.error(e)
        } finally {
          done()
          _that.cloudSyncing = false
        }
      }
    },
    searchBack() {
      let _that = this
      let store = _that.$store
      _that.searchText = null
      _that.searching = false
      _that.subKind = 'default'
    },
    searchFocus(e) {
      let _that = this
      _that.subKind = 'search'
    },
    searchInput(value) {
      let _that = this
      _that.searching = false
    },
    async searchKeyup(e) {
      let _that = this
      _that.searchText = (_that.searchText || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '')
      if (e.keyCode === 13 && _that.searchText) {
        await _that.search()
        let searchTextInputs = document.getElementsByClassName('q-field__native')
        if (searchTextInputs || searchTextInputs[0] || searchTextInputs[0].style.display !== 'none') {
          searchTextInputs[0].blur()
        }
      }
    },
    async search() {
      let _that = this
      let store = _that.$store
      _that.searching = true
      _that.followChannelResultList.splice(0)
      _that.followChannelArticleResultList.splice(0)
      _that.unfollowChannelResultList.splice(0)
      _that.unfollowChannelArticleResultList.splice(0)
      let followChannelResults = await channelComponent.searchPhase(ChannelDataType.CHANNEL, _that.searchText)
      console.info(followChannelResults)
      if (followChannelResults && followChannelResults.rows && followChannelResults.rows.length > 0) {
        for (let followChannelResult of followChannelResults.rows) {
          let channel = store.state.channelMap[followChannelResult.doc.channelId]
          if (channel) {
            if (followChannelResult.highlighting.name) {
              channel.highlightingName = followChannelResult.highlighting.name
            }
            _that.followChannelResultList.push(channel)
          }
        }
      }
      let followChannelArticleResults = await channelComponent.searchPhase(ChannelDataType.ARTICLE, _that.searchText)
      console.info(followChannelArticleResults)
      if (followChannelArticleResults && followChannelArticleResults.rows && followChannelArticleResults.rows.length > 0) {
        for (let followChannelArticleResult of followChannelArticleResults.rows) {
          let article = followChannelArticleResult.doc
          if (article) {
            if (followChannelArticleResult.highlighting.title) {
              article.highlightingTitle = followChannelArticleResult.highlighting.title
            }
            if (followChannelArticleResult.highlighting.plainContent) {
              article.highlightingPlainContent = followChannelArticleResult.highlighting.plainContent
            }
            _that.followChannelArticleResultList.push(article)
          }
        }
      }
    },
    async channelSelected(channel, index) {
      let _that = this
      let store = _that.$store
      let prevCurrentChannel = store.state.currentChannel
      store.state.currentChannel = channel
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
      let currentChannel = store.state.currentChannel
      if (currentChannel) {
        if (currentChannel.markDate) {
          // 查询local
          let articleList = await channelComponent.loadArticle({
            ownerPeerId: myself.myselfPeerClient.peerId,
            channelId: currentChannel.channelId,
            updateDate: { $gt: null }
          }, [{ updateDate: 'desc' }])
          if (articleList && articleList.length > 0) {
            store.state.articles = articleList
          }
        } else {
          // 查询cloud全量DataBlock索引信息
          let conditionBean = {}
          conditionBean['parentBusinessNumber'] = currentChannel.channelId
          conditionBean['getAllBlockIndex'] = true
          conditionBean['blockType'] = BlockType.ChannelArticle
          //let articleList = []
          let indexList = []
          if(store.state.networkStatus === 'CONNECTED'){
            indexList = await queryValueAction.queryValue(null, conditionBean)
          }
          console.log('getArticleList-indexList:' + JSON.stringify(indexList))
          if (indexList && indexList.length > 0) {
            /*let ps = []
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
            })*/
            for (let index of indexList) {
              index.cover = index.thumbnail
              index.thumbnail = null
              index.title = index.name
              index.name = null
              index.abstract = index.description
              index.description = null
            }
            CollaUtil.sortByKey(indexList, 'updateDate', 'desc')
          }
          //console.log('getArticleList-articleList:' + JSON.stringify(articleList))
          //store.state.articles = articleList
          store.state.articles = indexList
        }
      }
      _that.$q.loading.hide()
    },
    newChannel() {
      let _that = this
      let store = _that.$store
      store.changeKind('newChannel', 'channel')
      store.toggleDrawer(true)
    },
    searchChannel() {
      let _that = this
      let store = _that.$store
      store.changeKind('searchChannel', 'channel')
      store.toggleDrawer(true)
    },
    async followChannelResultSelected(followChannel, followChannelIndex) {
      let _that = this
      let store = _that.$store
      await _that.channelSelected(followChannel, followChannelIndex)
    },
    async followChannelArticleResultSelected(article, articleIndex) {
      let _that = this
      let store = _that.$store
      if (!article) {
        return
      }
      // put content into attach
      if (!article.content) {
        let attachs = await channelComponent.loadAttach(article, null, null)
        if (attachs && attachs.length > 0) {
          article.content = attachs[0].content
        }
        if (!article.content) {
          let blocks = await dataBlockService.findTxPayload(null, article.blockId)
          if (blocks && blocks.length > 0) {
            article = blocks[0]
          }
        }
      }
      store.state.currentArticle = article
      store.changeKind('channelDetails')
      store.toggleDrawer(true)
      store.changeChannelDetailsSubKind('view')
    },
    followChannelResult() {
      let _that = this
      _that.searchResult = 'followChannelResult'
    },
    followChannelArticleResult() {
      let _that = this
      _that.searchResult = 'followChannelArticleResult'
    },
    async unfollowChannelResultSelected(unfollowChannel, unfollowChannelIndex) {
      let _that = this
      let store = _that.$store
      await _that.channelSelected(unfollowChannel, unfollowChannelIndex)
    },
    async unfollowChannelArticleResultSelected(unfollowChannelArticle, unfollowChannelArticleIndex) {

    },
    unfollowChannelResult() {
      let _that = this
      _that.searchResult = 'unfollowChannelResult'
    },
    unfollowChannelArticleResult() {
      let _that = this
      _that.searchResult = 'unfollowChannelArticleResult'
    },
    resultBack() {
      let _that = this
      _that.searchResult = 'allResult'
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
    store.getArticleList = _that.getArticleList
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  watch: {
  }
}
