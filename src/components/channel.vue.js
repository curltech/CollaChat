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
      /*channelfilter: null,*/
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
    /*ChannelFilteredList() {
      let _that = this
      let store = _that.$store
      let channelFilteredArray = []
      let channelList = store.state.channels
      if (channelList && channelList.length > 0) {
        let channelFilter = _that.channelFilter
        if (channelFilter) {
          channelFilteredArray = channelList.filter((channel) => {
            if (channel) {
              return channel.name.toLowerCase().includes(channelFilter.toLowerCase())
              || pinyinUtil.getPinyin(channel.name).toLowerCase().includes(channelFilter.toLowerCase())
              || channel.description.toLowerCase().includes(channelFilter.toLowerCase())
              || pinyinUtil.getPinyin(channel.description).toLowerCase().includes(channelFilter.toLowerCase())
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
    },*/
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
      return
      if (!_that.cloudSyncing) {
        _that.cloudSyncing = true
        try {
          let currentChannel = store.state.currentChannel
          let clientPeerId = myself.myselfPeerClient.peerId
          // 查询cloud全量DataBlock索引信息
          let conditionBean = {}
          conditionBean['createPeerId'] = clientPeerId
          conditionBean['receiverPeerId'] = clientPeerId
          conditionBean['receiverPeer'] = true
          conditionBean['getAllBlockIndex'] = true
          conditionBean['blockType'] = BlockType.Collection
          let cloudBlockIndices = await queryValueAction.queryValue(null, conditionBean)
          //console.log('cloudBlockIndices:' + JSON.stringify(cloudBlockIndices))
          // 查询local全量collection索引信息
          let condition = {}
          condition['ownerPeerId'] = clientPeerId
          let localBlockIndices = await collectionComponent.loadCollection(condition, null, ['_id', 'updateDate', 'versionFlag'])
          //console.log('localBlockIndices:' + JSON.stringify(localBlockIndices))
          // 查询local失败记录
          let dbLogs = await blockLogComponent.load(condition, null, null)
          console.log("dbLogs-start:" + JSON.stringify(dbLogs))
          // syncUp: 对比local失败与cloud和local，重做未过时操作
          let localFailedBlockIds = []
          if (dbLogs && dbLogs.length > 0) {
            for (let dbLog of dbLogs) {
              localFailedBlockIds.push(dbLog.dataBlock.businessNumber)
              let obsolete = false
              if (localBlockIndices && localBlockIndices.length > 0) {
                for (let localBlockIndex of localBlockIndices) {
                  if (dbLog.dataBlock.businessNumber === localBlockIndex._id
                    && dbLog.dataBlock.createTimestamp < localBlockIndex.updateDate) {
                    obsolete = true
                    console.log('obsolete1')
                    break
                  }
                }
              }
              if (!obsolete && cloudBlockIndices && cloudBlockIndices.length > 0) {
                for (let cloudBlockIndex of cloudBlockIndices) {
                  if (dbLog.dataBlock.businessNumber === cloudBlockIndex.businessNumber
                    && dbLog.dataBlock.createTimestamp < cloudBlockIndex.createTimestamp) {
                    obsolete = true
                    console.log('obsolete2')
                    break
                  }
                }
              }
              if (obsolete) {
                dbLog.state = EntityState.Deleted
              }
            }
            await blockLogComponent.save(dbLogs, null, dbLogs)
            // 云端cloud保存
            if (dbLogs && dbLogs.length > 0) {
              if (store.collectionWorkerEnabler) {
                /*let options = {}
                options.privateKey = myself.privateKey
                openpgp.clonePackets(options)
                let worker = _that.initCollectionUploadWorker()
                worker.postMessage(['all', dbLogs, myself.myselfPeerClient, options.privateKey])*/
              } else {
                dbLogs = await collectionUtil.upload(dbLogs, BlockType.Collection)
                // 刷新syncFailed标志
                let newDbLogMap = CollaUtil.clone(store.state.dbLogMap)
                if (dbLogs && dbLogs.length > 0) {
                  for (let dbLog of dbLogs) {
                    let dl = newDbLogMap[dbLog.blockId]
                    if (!dl) {
                      newDbLogMap[dbLog.blockId] = true
                      console.log('add dbLog, blockId:' + dbLog.blockId)
                    }
                  }
                }
                store.state.dbLogMap = newDbLogMap
              }
            }
          }
          // syncDown: 对比cloud和local，得到需sync列表
          //let uploadList = []
          let downloadList = []
          let deleteList = []
          if (cloudBlockIndices && cloudBlockIndices.length > 0) {
            for (let cloudBlockIndex of cloudBlockIndices) {
              let exists = false
              if (localBlockIndices && localBlockIndices.length > 0) {
                for (let localBlockIndex of localBlockIndices) {
                  if (localBlockIndex._id === cloudBlockIndex.businessNumber) {
                    if (localBlockIndex.updateDate < cloudBlockIndex.createTimestamp) {
                      let download = {}
                      download['blockId'] = cloudBlockIndex.blockId
                      download['businessNumber'] = cloudBlockIndex.businessNumber
                      download['primaryPeerId'] = cloudBlockIndex.primaryPeerId
                      downloadList.push(download)
                    }/* else if (localBlockIndex.updateDate > cloudBlockIndex.createTimestamp) {
                      if (//localBlockIndex.versionFlag === 'local' &&
                          !localFailedBlockIds.includes(localBlockIndex._id)) {
                        uploadList.push(localBlockIndex._id)
                      }
                    }*/
                    exists = true
                    break
                  }
                }
              }
              if (!exists) {
                if (!localFailedBlockIds.includes(cloudBlockIndex.businessNumber)) {
                  let download = {}
                  download['blockId'] = cloudBlockIndex.blockId
                  download['businessNumber'] = cloudBlockIndex.businessNumber
                  download['primaryPeerId'] = cloudBlockIndex.primaryPeerId
                  downloadList.push(download)
                }
              }
            }
          }
          if (localBlockIndices && localBlockIndices.length > 0) {
            for (let localBlockIndex of localBlockIndices) {
              let exists = false
              if (cloudBlockIndices && cloudBlockIndices.length > 0) {
                for (let cloudBlockIndex of cloudBlockIndices) {
                  if (localBlockIndex._id === cloudBlockIndex.businessNumber) {
                    exists = true
                    break
                  }
                }
              }
              if (!exists) {
                if (localBlockIndex.versionFlag === 'sync' || (localBlockIndex.versionFlag === 'local' && !localFailedBlockIds.includes(localBlockIndex._id))) {
                  deleteList.push(localBlockIndex._id)
                }
              }
            }
          }
          //console.log("uploadList:" + JSON.stringify(uploadList))
          console.log("downloadList:" + JSON.stringify(downloadList))
          console.log("deleteList:" + JSON.stringify(deleteList))
          // 上传
          /*for (let collectionId of uploadList) {
            let collection = await collectionComponent.get(CollectionDataType.COLLECTION, collectionId)
            if (collection) {
              await collectionUtil.saveBlock(collection, false, BlockType.Collection)
            }
          }*/
          // 下载
          if (downloadList && downloadList.length > 0) {
            if (store.collectionWorkerEnabler) {
              /*let options = {}
              options.privateKey = myself.privateKey
              openpgp.clonePackets(options)
              let worker = _that.initCollectionDownloadWorker()
              worker.postMessage([downloadList, myself.myselfPeerClient, options.privateKey])*/
            } else {
              let ps = []
              for (let download of downloadList) {
                let promise = dataBlockService.findTxPayload(null, download['blockId'])
                ps.push(promise)
              }
              CollaUtil.asyncPool(10, ps, async function(result) {
                let collections = await result
                if (collections && collections.length > 0) {
                  let collection = collections[0]
                  if (collection) {
                    let collectionId = collection._id
                    let local = await collectionComponent.get(CollectionDataType.COLLECTION, collectionId)
                    if (!(local && current && current._id === collectionId && _that.subKind === 'edit')) {
                      if (!local) {
                        collection.state = EntityState.New
                      } else {
                        collection._rev = local._rev
                        collection.state = EntityState.Modified
                      }
                      collection.versionFlag = 'sync'
                      await collectionComponent.saveCollection(collection, null)
                      if (_that.collectionTypeIndex === 0 || _that.collectionTypes[_that.collectionTypeIndex].value === collection.collectionType) {
                        let index = 0
                        for (let i = 0; i < _that.myCollections.length; i++) {
                          if (_that.myCollections[i].updateDate > collection.updateDate) {
                            index++
                          } else {
                            break
                          }
                        }
                        _that.myCollections.splice(index, (!local ? 0 : 1), collection)
                      }
                    }
                  }
                }
              })
            }
          }
          // 删除
          for (let collectionId of deleteList) {
            let collection = await collectionComponent.get(CollectionDataType.COLLECTION, collectionId)
            if (collection && !(current && current._id === collectionId && _that.subKind === 'edit')) {
              collection.state = EntityState.Deleted
              await collectionComponent.saveCollection(collection, null)
              let index = 0
              for (let i = 0; i < _that.myCollections.length; i++) {
                if (_that.myCollections[i]._id === collectionId) {
                  _that.myCollections.splice(index, 1)
                  if (current && current._id === collectionId && _that.subKind === 'view') {
                    _that.myCollections.c_meta.currentIndex = -1
                    _that.myCollections.c_meta.current = null
                    _that.subKind = 'default'
                  }
                  break
                }
                index++
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
    async getChannelList() {
      let _that = this
      let store = _that.$store
      _that.$q.loading.show()
      // 查询cloud全量DataBlock索引信息
      let conditionBean = {}
      conditionBean['getAllBlockIndex'] = true
      conditionBean['blockType'] = BlockType.Channel
      //let channelList = []
      let indexList = []
      if(store.state.networkStatus === 'CONNECTED'){
        indexList = await queryValueAction.queryValue(null, conditionBean)
      }
      console.log('getChannelList-indexList:' + JSON.stringify(indexList))
      if (indexList && indexList.length > 0) {
        /*let ps = []
        for (let index of indexList) {
          let promise = dataBlockService.findTxPayload(null, index['blockId'])
          ps.push(promise)
        }
        CollaUtil.asyncPool(10, ps, async function(result) {
          let channels = await result
          if (channels && channels.length > 0) {
            let channel = channels[0]
            if (channel) {
              channelList.push(channel)
            }
          }
        })*/
        for (let index of indexList) {
          index.avatar = index.thumbnail
          index.thumbnail = null
        }
      }
      //console.log('getChannelList-channelList:' + JSON.stringify(channelList))
      _that.$q.loading.hide()
      //return channelList
      return indexList
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
