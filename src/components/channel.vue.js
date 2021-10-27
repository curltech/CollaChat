import { date } from 'quasar'

import { EntityState } from 'libcolla'
import { BlockType } from 'libcolla'
import { dataBlockService, queryValueAction } from 'libcolla'
import { CollaUtil } from 'libcolla'
import { myself } from 'libcolla'

import { channelComponent, ChannelDataType, ChannelType, EntityType } from '@/libs/biz/colla-channel'

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
        if (channelFilteredArray.length > 0) {
          let topChannelArrary = []
          let untopChannelArray = []
          for (let channel of channelFilteredArray) {
            if (channel.top === true) {
              topChannelArrary.push(channel)
            } else {
              untopChannelArray.push(channel)
            }
          }
          CollaUtil.sortByKey(topChannelArrary, 'updateDate', 'desc')
          CollaUtil.sortByKey(untopChannelArray, 'updateDate', 'desc')
          for (let topChannel of topChannelArrary) {
            untopChannelArray.unshift(topChannel)
          }
          channelFilteredArray = untopChannelArray
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
      await store.cloudSyncChannel()
      let channelList = store.state.channels
      let channelFilteredArray = channelList.filter((channel) => {
        if (channel) {
          return channel.markDate
        }
      })
      if (channelFilteredArray.length > 0) {
        CollaUtil.sortByKey(channelFilteredArray, 'updateDate', 'desc')
      }
      if (channelFilteredArray.length === 0 || store.state.ifMobileStyle) {
        store.state.currentChannel = null
        store.toggleDrawer(false)
      } else {
        store.state.currentChannel = channelFilteredArray[0]
        await _that.channelSelected(store.state.currentChannel, 0)
      }
      if (done && typeof done === 'function') {
        done()
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
      let channelResults = await channelComponent.searchPhase(ChannelDataType.CHANNEL, _that.searchText)
      console.info(channelResults)
      if (channelResults && channelResults.rows && channelResults.rows.length > 0) {
        for (let channelResult of channelResults.rows) {
          let channel = store.state.channelMap[channelResult.doc.channelId]
          if (channel) {
            channel.highlightingName = null
            if (channelResult.highlighting.name) {
              channel.highlightingName = channelResult.highlighting.name
            }
            if (channel.markDate) {
              _that.followChannelResultList.push(channel)
            } else {
              _that.unfollowChannelResultList.push(channel)
            }
          }
        }
      }
      let channelArticleResults = await channelComponent.searchPhase(ChannelDataType.ARTICLE, _that.searchText)
      console.info(channelArticleResults)
      if (channelArticleResults && channelArticleResults.rows && channelArticleResults.rows.length > 0) {
        for (let channelArticleResult of channelArticleResults.rows) {
          let article = channelArticleResult.doc
          if (article) {
            article.highlightingTitle = null
            article.highlightingPlainContent = null
            if (channelArticleResult.highlighting.title) {
              article.highlightingTitle = channelArticleResult.highlighting.title
            }
            if (channelArticleResult.highlighting.plainContent) {
              article.highlightingPlainContent = channelArticleResult.highlighting.plainContent
            }
            if (article.channelId) {
              let channel = store.state.channelMap[article.channelId]
              if (channel) {
                if (channel.markDate) {
                  _that.followChannelArticleResultList.push(article)
                } else {
                  _that.unfollowChannelArticleResultList.push(article)
                }
              }
            }
          }
        }
      }
    },
    async channelSelected(channel, index) {
      let _that = this
      let store = _that.$store
      let prevCurrentChannel = store.state.currentChannel
      channel.newArticleFlag = false
      store.state.currentChannel = channel
      store.changeKind('channelDetails')
      store.toggleDrawer(true)
      if (!(_that.ifMobileSize || store.state.ifMobileStyle) && prevCurrentChannel/* && prevCurrentChannel.channelId !== channel.channelId*/) {
        if (store.changeChannelDetailsSubKind) {
          store.changeChannelDetailsSubKind('default')
        }
      }
      await store.getArticleList()
    },
    async articleSelected(article, index) {
      let _that = this
      let store = _that.$store
      if (!article) {
        return
      }
      // put content into attach
      if (!article.content) {
        /*let attachs = await channelComponent.loadAttach(article, null, null)
        if (attachs && attachs.length > 0) {
          article.content = attachs[0].content
        }
        if (!article.content) {*/
          let blocks = await dataBlockService.findTxPayload(null, article.blockId)
          if (blocks && blocks.length > 0) {
            article = blocks[0]
          } else {
            _that.$q.notify({
              message: `${_that.$i18n.t("Article")} ${_that.$i18n.t("Deleted")}`,
              timeout: 3000,
              type: "warning",
              color: "warning",
            })
          }
        /*}*/
      }
      store.state.currentArticle = article
      store.changeKind('channelDetails')
      /*if (store.changeChannelDetailsSubKind) {
        store.changeChannelDetailsSubKind('view')
      } else {
        store.state.currentChannel = store.state.channelMap[article.channelId]
        await _that.channelSelected(store.state.currentChannel)
        if (store.changeChannelDetailsSubKind) {
          store.changeChannelDetailsSubKind('view')
        }
      }*/
      _that.$nextTick(() => {
        store.channelDetailsArticleEntry = 'search'
        store.changeChannelDetailsSubKind('view')
        store.toggleDrawer(true)
      })
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
    async followChannelArticleResultSelected(followChannelArticle, followChannelArticleIndex) {
      let _that = this
      let store = _that.$store
      await _that.articleSelected(followChannelArticle, followChannelArticleIndex)
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
      let _that = this
      let store = _that.$store
      await _that.articleSelected(unfollowChannelArticle, unfollowChannelArticleIndex)
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
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  watch: {
  }
}
