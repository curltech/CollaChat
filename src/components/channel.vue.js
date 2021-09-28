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
      if (!_that.cloudSyncing) {
        _that.$q.loading.show()
        _that.cloudSyncing = true
        try {
          // 同步Channel
          let channelList = store.state.channels
          // 查询cloud全量Channel索引信息
          let conditionBean = {}
          conditionBean['getAllBlockIndex'] = true
          conditionBean['blockType'] = BlockType.Channel
          let channelIndexList = []
          if (store.state.networkStatus === 'CONNECTED'){
            let ret = await queryValueAction.queryValue(null, conditionBean)
            if (ret && ret.length > 0) {
              channelIndexList = ret
            }
          }
          console.log('channelIndexList:' + JSON.stringify(channelIndexList))
          for (let channelIndex of channelIndexList) {
            channelIndex.avatar = channelIndex.thumbnail
            channelIndex.thumbnail = null
          }
          let changed = false
          let deleteChannelList = []
          for (let channel of channelList) {
            let exists = false
            for (let channelIndex of channelIndexList) {
              if (channel.channelId === channelIndex.businessNumber) {
                exists = true
                if (channelIndex.createTimestamp > channel.updateDate) {
                  changed = true
                  channel.state = EntityState.Modified
                  channel.avatar = channelIndex.avatar
                  channel.name = channelIndex.name
                  channel.description = channelIndex.description
                  channel.updateDate = channelIndex.createTimestamp
                }
                break
              }
            }
            if (!exists) {
              changed = true
              channel.state = EntityState.Deleted
              deleteChannelList.push(channel)
            }
          }
          for (let channelIndex of channelIndexList) {
            let exists = false
            for (let channel of channelList) {
              if (channel.channelId === channelIndex.businessNumber) {
                exists = true
                break
              }
            }
            if (!exists) {
              changed = true
              let newChannel = {
                ownerPeerId: myself.myselfPeerClient.peerId,
                creator: channelIndex.peerId,
                channelType: ChannelType.PUBLIC,
                channelId: channelIndex.businessNumber,
                avatar: channelIndex.avatar,
                name: channelIndex.name,
                description: channelIndex.description,
                entityType: EntityType.INDIVIDUAL,
                businessNumber: channelIndex.businessNumber,
                blockId: channelIndex.blockId,
                createDate: channelIndex.createTimestamp,
                updateDate: channelIndex.createTimestamp,
                state: EntityState.New
              }
              channelList.push(newChannel)
            }
          }
          if (changed) {
            await channelComponent.save(ChannelDataType.CHANNEL, channelList, null)
            let index = 0
            for (let channel of channelList) {
              let deleted = false
              for (let deleteChannel of deleteChannelList) {
                if (channel.channelId === deleteChannel.channelId) {
                  deleted = true
                  channelList.splice(index, 1)
                  delete store.state.channelMap[channel.channelId]
                }
              }
              if (!deleted) {
                store.state.channelMap[channel.channelId] = channel
              }
              index++
            }
          }
          // 同步ChannelArticle
          for (let channel of channelList) {
            let articleList = []
            let ret = await channelComponent.loadArticle({
              ownerPeerId: myself.myselfPeerClient.peerId,
              channelId: channel.channelId,
              updateDate: { $gt: null }
            }, [{ updateDate: 'desc' }])
            if (ret && ret.length > 0) {
              articleList = ret
            }
            // 查询cloud全量ChannelArticle索引信息
            let conditionBean = {}
            conditionBean['parentBusinessNumber'] = channel.channelId
            conditionBean['getAllBlockIndex'] = true
            conditionBean['blockType'] = BlockType.ChannelArticle
            let articleIndexList = []
            if (store.state.networkStatus === 'CONNECTED'){
              let ret = await queryValueAction.queryValue(null, conditionBean)
              if (ret && ret.length > 0) {
                articleIndexList = ret
              }
            }
            console.log('articleIndexList:' + JSON.stringify(articleIndexList))
            for (let articleIndex of articleIndexList) {
              articleIndex.cover = articleIndex.thumbnail
              articleIndex.thumbnail = null
              articleIndex.title = articleIndex.name
              articleIndex.name = null
              articleIndex.abstract = articleIndex.description
              articleIndex.description = null
            }
            let changed = false
            for (let article of articleList) {
              let exists = false
              for (let articleIndex of articleIndexList) {
                if (article.articleId === articleIndex.businessNumber) {
                  exists = true
                  if (articleIndex.createTimestamp > article.updateDate) {
                    changed = true
                    article.state = EntityState.Modified
                    article.cover = articleIndex.cover
                    article.title = articleIndex.title
                    article.abstract = articleIndex.abstract
                    article.updateDate = articleIndex.createTimestamp
                  }
                  break
                }
              }
              if (!exists) {
                changed = true
                article.state = EntityState.Deleted
              }
            }
            for (let articleIndex of articleIndexList) {
              let exists = false
              for (let article of articleList) {
                if (article.articleId === articleIndex.businessNumber) {
                  exists = true
                  break
                }
              }
              if (!exists) {
                changed = true
                let newArticle = {
                  ownerPeerId: myself.myselfPeerClient.peerId,
                  channelId: articleIndex.parentBusinessNumber,
                  articleId: articleIndex.businessNumber,
                  cover: articleIndex.cover,
                  //author: articleIndex.author,
                  title: articleIndex.title,
                  abstract: articleIndex.abstract,
                  //content: content,
                  plainContent: articleIndex.metadata,
                  pyPlainContent: pinyinUtil.getPinyin(articleIndex.metadata),
                  metadata: articleIndex.metadata,
                  businessNumber: articleIndex.businessNumber,
                  blockId: articleIndex.blockId,
                  createDate: articleIndex.createTimestamp,
                  updateDate: articleIndex.createTimestamp,
                  state: EntityState.New
                }
                articleList.push(newArticle)
                let channel = store.state.channelMap[newArticle.channelId]
                if (channel) {
                  channel.newArticleFlag = true
                  if (newArticle.updateDate && (!channel.newArticleUpdateDate || newArticle.updateDate > channel.newArticleUpdateDate)) {
                    channel.newArticleUpdateDate = newArticle.updateDate
                    channel.newArticleTitle = newArticle.title
                  }
                }
              }
            }
            if (changed) {
              await channelComponent.save(ChannelDataType.ARTICLE, articleList, null)
            }
          }
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
            _that.channelSelected(store.state.currentChannel, 0)
          }
        } catch (e) {
          console.error(e)
        } finally {
          if (done && typeof done === 'function') {
            done()
          }
          _that.cloudSyncing = false
          _that.$q.loading.hide()
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
      await _that.getArticleList()
    },
    async getArticleList() {
      let _that = this
      let store = _that.$store
      let currentChannel = store.state.currentChannel
      if (currentChannel) {
        // 查询local
        let articleList = []
        let ret = await channelComponent.loadArticle({
          ownerPeerId: myself.myselfPeerClient.peerId,
          channelId: currentChannel.channelId,
          updateDate: { $gt: null }
        }, [{ updateDate: 'desc' }])
        if (ret && ret.length > 0) {
          articleList = ret
        }
        store.state.articles = articleList
      }
    },
    async articleSelected(article, index) {
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
    store.getArticleList = _that.getArticleList
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  watch: {
  }
}
