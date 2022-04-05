import Vue from 'vue'
import { date } from 'quasar'
//import hljs from 'highlight.js'
import pdf from 'vue-pdf'
//import { saveAs } from 'file-saver'

import { CollaUtil, TypeUtil, BlobUtil, UUID } from 'libcolla'
import { EntityState } from 'libcolla'
//import { openpgp } from 'libcolla'
import { myself, BlockType, queryValueAction, dataBlockService, MsgType } from 'libcolla'

import E from '@/libs/base/colla-wangEditor'
import pinyinUtil from '@/libs/base/colla-pinyin'
import { fileComponent, photoLibraryComponent, statusBarComponent, inAppBrowserComponent } from '@/libs/base/colla-cordova'
import { mediaCaptureComponent, alloyFingerComponent, mediaPickerComponent, mediaComponent } from '@/libs/base/colla-media'
import { collectionComponent, SrcChannelType, SrcEntityType, CollectionDataType, CollectionType } from '@/libs/biz/colla-collection'
import { collectionUtil, blockLogComponent } from '@/libs/biz/colla-collection-util'
import SelectChat from '@/components/selectChat'
import CaptureMedia from '@/components/captureMedia'
import MessageContent from '@/components/messageContent'
import NotePreview from '@/components/notePreview'
import MobileAudio from '@/components/mobileAudio'
//import CollectionUploadWorker from '@/worker/collectionUpload.worker.js'
//import CollectionDownloadWorker from '@/worker/collectionDownload.worker.js'

let editor

export default {
  name: "Collection",
  components: {
    pdf,
    selectChat: SelectChat,
    captureMedia: CaptureMedia,
    notePreview: NotePreview,
    mobileAudio: MobileAudio,
    messageContent: MessageContent
  },
  data() {
    return {
      CollectionType: CollectionType,
      ifScrollTop: true,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search'),
      placeholder2: '\ue672' + ' ' + (myself.myselfPeerClient.localDataCryptoSwitch === true ? this.$i18n.t('Local Data Crypto mode only search by Tag') : this.$i18n.t('Search')),
      collectionLoading: false,
      source: 'local', // 数据来源：local, cloud
      searchText: null,
      collectionTypeIndex: 0,
      collectionType: CollectionType.ALL,
      tag: [],
      subKind: 'default',
      collectionTypes: [
        { label: this.$i18n.t(CollectionType.ALL), value: CollectionType.ALL },
        { label: this.$i18n.t(CollectionType.NOTE), value: CollectionType.NOTE },
        { label: this.$i18n.t(CollectionType.CHAT), value: CollectionType.CHAT },
        { label: this.$i18n.t(CollectionType.TEXT), value: CollectionType.TEXT },
        { label: this.$i18n.t(CollectionType.IMAGE), value: CollectionType.IMAGE },
        { label: this.$i18n.t(CollectionType.VIDEO), value: CollectionType.VIDEO },
        { label: this.$i18n.t(CollectionType.AUDIO), value: CollectionType.AUDIO },
        { label: this.$i18n.t(CollectionType.FILE), value: CollectionType.FILE },
        { label: this.$i18n.t(CollectionType.VOICE), value: CollectionType.VOICE },
        //{ label: this.$i18n.t(CollectionType.LINK), value: CollectionType.LINK },
        //{ label: this.$i18n.t(CollectionType.POSITION), value: CollectionType.POSITION },
        { label: this.$i18n.t(CollectionType.CARD), value: CollectionType.CARD }
      ],
      collectionTypeOptions: {
        activeColor: myself.myselfPeerClient.primaryColor
      },
      entity: 'myCollections',
      myCollections: [],
      captureType: null,
      imageUrl: null,
      audioUrl: null,
      videoUrl: null,
      tagEntry: null,
      fullscreenEntry: null,
      backupContent: null,
      selected: null,
      collectionData: {
        ctcs: null,
        tags: null
      },
      filterOptions: this.$store.state.collectionTags,
      search: false,
      searchTag: null,
      touchTag: null,
      tagName: null,
      collectionDone: false,
      cloudSyncing: false
    }
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    },
    fullscreenStyle() {
      return 'max-width: 100%;max-height: ' + (this.$q.screen.height - 50) + 'px;'
    },
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    current: function () {
      let current = this.myCollections.c_meta.current
      if (!current) {
        current = {}
      }
      return current
    },
    Outline() {
      let _that = this
      let store = _that.$store
      return function (item) {
        let outline = ''
        let collectionType = item.collectionType
        if (collectionType === CollectionType.NOTE) {
          let srcEntityName = _that.getSrcEntityName(item)
          outline = _that.$i18n.t(CollectionType.NOTE) + ' | ' + srcEntityName
        } else {
          let srcChannelType = item.srcChannelType
          let srcChannelName = item.srcChannelName
          if (srcChannelType === SrcChannelType.CHAT || srcChannelType === SrcChannelType.GROUP_CHAT) {
            srcChannelName = store.getChatName(item.srcChannelType, item.srcChannelId)
          }
          let srcEntityName = _that.getSrcEntityName(item)
          outline = _that.$i18n.t('Source: ') + (srcChannelName ? srcChannelName : (item.srcChannelName ? item.srcChannelName : '')) + ' | ' + srcEntityName
        }
        return outline
      }
    },
    UpdateDate() {
      let _that = this
      return function (item) {
        let updateDate = ''
        if (item.updateDate) {
          let now = new Date(new Date().toLocaleDateString()).getTime()
          let dayInterval = Math.ceil((now - item.updateDate) / (1 * 24 * 60 * 60 * 1000))
          if (dayInterval === 0) {
            updateDate = _that.$i18n.t('Today') + ' ' + date.formatDate(item.updateDate, 'HH:mm:ss')
          } else if (dayInterval > 0 && dayInterval <= 29) {
            updateDate = dayInterval + _that.$i18n.t(' days ago') + ' ' + date.formatDate(item.updateDate, 'HH:mm:ss')
          } else if (dayInterval > 29) {
            updateDate = date.formatDate(item.updateDate, 'YYYY-MM-DD') + ' ' + date.formatDate(item.updateDate, 'HH:mm:ss')
          } else {
            console.error('Wrong updateDate:' + item.updateDate)
          }
        }
        return updateDate
      }
    },
    SearchTag() {
      let _that = this
      return function (tag) {
        return _that.searchTag === tag
      }
    },
    TouchTag() {
      let _that = this
      return function (tag) {
        return _that.touchTag === tag
      }
    }
  },
  methods: {
    filterFn(val, update) {
      update(() => {
        if (val === '') {
          this.filterOptions = this.$store.state.collectionTags
        }
        else {
          const needle = val.toLowerCase()
          this.filterOptions = this.$store.state.collectionTags.filter(
            v => v.toLowerCase().indexOf(needle) > -1
          )
        }
      })
    },
    createNewTag(val, done) {
      let _that = this
      if (CollaUtil.lengthWithChinese(val) > 20) {
        _that.$q.notify({
          message: _that.$i18n.t('Tag name exceeds length limit'),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        return
      }
      done(val)
    },
    tagExceedsLengthLimit(val) {
      let _that = this
      return CollaUtil.lengthWithChinese(val) > 20
    },
    tagAlreadyExists(val) {
      let _that = this
      let store = _that.$store
      return store.state.collectionTags.includes(val.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, ''))
    },
    async back() {
      let _that = this
      let store = _that.$store
      if (store.collectionEntry === 'message') {
        store.changeKind('message')
      } else {
        //if (_that.collectionTypeIndex === 0) {
        store.toggleDrawer(false)
        /*} else {
          _that.collectionTypeIndex = 0
          _that.collectionType = _that.collectionTypes[_that.collectionTypeIndex].value
          await _that.refresh()
        }*/
      }
    },
    searchFocus(e) {
      let _that = this
      _that.subKind = 'search'
    },
    searchTextFocus(e) {
      let _that = this
      _that.search = false
      _that.touchTag = null
    },
    tagTouched(tag, index) {
      let _that = this
      _that.touchTag = tag
    },
    async tagSelected(tag, index) {
      let _that = this
      if (!_that.searchTag) {
        _that.searchTag = tag
        let tagChipHTML = '<div id="tagChipDiv" class="q-chip row inline no-wrap items-center q-chip--dense" style="height: 40px; margin: 0"><div class="q-chip__content col row no-wrap items-center q-anchor--skip"><span id="tagChipSpan" class="ellipsis">'
          + tag
          + '</span></div><svg aria-hidden="true" role="presentation" focusable="false" viewBox="0 0 24 24" class="q-chip__icon q-chip__icon--remove cursor-pointer q-icon notranslate" tabindex="-1"><path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"></path></svg></div>'
        let prefixDivs = document.getElementsByClassName('q-field__prefix')
        if (prefixDivs && prefixDivs[0]) {
          prefixDivs[0].insertAdjacentHTML('afterend', tagChipHTML)
        }
        let tagChipDiv = document.getElementById('tagChipDiv')
        if (tagChipDiv) {
          let removeSearchTag = function () {
            _that.searchTag = null
            tagChipDiv.remove()
          }
          tagChipDiv.addEventListener('click', removeSearchTag, false)
        }
        _that.search = true
        await _that.refresh()
      } else if (_that.searchTag === tag) {
        _that.searchTag = null
        let tagChipDiv = document.getElementById('tagChipDiv')
        if (tagChipDiv) {
          tagChipDiv.remove()
        }
      } else {
        _that.searchTag = tag
        let tagChipSpan = document.getElementById('tagChipSpan')
        if (tagChipSpan) {
          tagChipSpan.innerHTML = tag
        }
        _that.search = true
        await _that.refresh()
      }
    },
    showEditTag(tag, index) {
      let _that = this
      _that.subKind = 'tagName'
      _that.tagName = tag
    },
    async saveTagName() {
      let _that = this
      let store = _that.$store
      _that.tagName = _that.tagName.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '')
      let collectionTagCollections = await collectionComponent.loadCollectionTagCollection({
        ownerPeerId: myself.myselfPeerClient.peerId,
        tag: _that.touchTag
      })
      if (collectionTagCollections && collectionTagCollections.length > 0) {
        for (let collectionTagCollection of collectionTagCollections) {
          collectionTagCollection.tag = _that.tagName
          collectionTagCollection.pyTag = pinyinUtil.getPinyin(_that.tagName)
        }
        await collectionComponent.updateCollectionTagCollection(collectionTagCollections)
      }
      for (let i = 0; i < store.state.collectionTags.length; i++) {
        if (store.state.collectionTags[i] === _that.touchTag) {
          store.state.collectionTags[i] = _that.tagName
          break
        }
      }
      _that.touchTag = _that.tagName
      _that.subKind = 'search'
    },
    confirmRemoveTag(tag, index) {
      let _that = this
      _that.$q.bottomSheet({
        message: _that.$i18n.t('Confirm the deletion?'),
        actions: [
          {},
          {
            label: _that.$i18n.t('Confirm'),
            classes: 'text-red',
            icon: 'check_circle',
            id: 'confirm'
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
        if (action.id === 'confirm') {
          await _that.removeTag()
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    async removeTag() {
      let _that = this
      let store = _that.$store
      let collectionTagCollections = await collectionComponent.loadCollectionTagCollection({
        ownerPeerId: myself.myselfPeerClient.peerId,
        tag: _that.touchTag
      })
      if (collectionTagCollections && collectionTagCollections.length > 0) {
        await collectionComponent.removeCollectionTagCollection(collectionTagCollections, null)
      }
      let collectionTags = store.state.collectionTags
      collectionTags.splice(collectionTags.indexOf(_that.touchTag), 1)
      _that.touchTag = null
    },
    async searchKeyup(e) {
      let _that = this
      _that.searchText = (_that.searchText || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '')
      if (e.keyCode === 13 && _that.searchText) {
        _that.search = true
        await _that.refresh()
        let searchTextInputs = document.getElementsByClassName('q-field__native')
        if (searchTextInputs || searchTextInputs[0] || searchTextInputs[0].style.display !== 'none') {
          searchTextInputs[0].blur()
        }
      }
    },
    async searchBack() {
      let _that = this
      _that.searchText = null
      _that.searchTag = null
      _that.touchTag = null
      _that.search = false
      _that.subKind = 'default'
      await _that.refresh()
    },
    async changeCollectionType(item, index) {
      let _that = this
      console.log('index:' + index + ',item.value:' + item.value)
      _that.collectionType = _that.collectionTypes[_that.collectionTypeIndex].value
      await _that.refresh()
    },
    getSrcEntityName(item) {
      let _that = this
      let store = _that.$store
      let srcEntityType = item.srcEntityType
      let srcEntityId = item.srcEntityId
      let srcEntityName = item.srcEntityName
      let name = ''
      if (srcEntityId) {
        let linkman = store.state.linkmanMap[srcEntityId]
        if (srcEntityType === SrcEntityType.MYSELF || srcEntityId === myself.myselfPeerClient.peerId) {
          name = _that.$i18n.t('Me')
        } else if (srcEntityType === SrcEntityType.LINKMAN || linkman) {
          name = (linkman.givenName ? linkman.givenName : linkman.name)
        } else {
          name = srcEntityName ? srcEntityName : ''
        }
      } else {
        name = srcEntityName ? srcEntityName : ''
        console.error('blank srcEntityId, srcEntityName:' + srcEntityName)
      }
      return name
    },
    getIndex() {
      let index = null
      let current = this.myCollections.c_meta.current
      if (current) {
        index = 0
        for (let collection of this.myCollections) {
          if (current === collection) {
            break
          }
          index++
        }
      }

      return index
    },
    // 保存
    async save(type, current) {
      let _that = this
      let store = _that.$store
      if (!type || type === 'attach' || type === 'collection') {
        _that.$q.loading.show()
        if (!current) {
          current = _that.myCollections.c_meta.current
        }
        try {
          let dbLogs
          let blockType = BlockType.Collection
          if (current.state === EntityState.Modified) {
            // 云端删除old
            if (store.collectionWorkerEnabler) {
              /*let dbLogs = await collectionUtil.saveBlock(current, false, BlockType.Collection)
              let options = {}
              options.privateKey = myself.privateKey
              openpgp.clonePackets(options)
              let worker = _that.initCollectionUploadWorker()
              worker.postMessage(['one', dbLogs, myself.myselfPeerClient, options.privateKey])*/
            } else {
              let old = CollaUtil.clone(current)
              //let start = new Date().getTime()
              dbLogs = await collectionUtil.deleteBlock(old, true, blockType)
              //let end = new Date().getTime()
              //console.log('collection deleteBlock time:' + (end - start))
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
            // current
            current.blockId = UUID.string(null, null)
          }
          // 本地保存
          //let start = new Date().getTime()
          await collectionUtil.save(type, current, _that.myCollections)
          //let end = new Date().getTime()
          //console.log('collection save time:' + (end - start))
          _that.backupContent = current['blockId'] + ':' + current['content']
          // 云端保存
          if (store.collectionWorkerEnabler) {
            /*let dbLogs = await collectionUtil.saveBlock(current, false, BlockType.Collection)
            let options = {}
            options.privateKey = myself.privateKey
            openpgp.clonePackets(options)
            let worker = _that.initCollectionUploadWorker()
            worker.postMessage(['one', dbLogs, myself.myselfPeerClient, options.privateKey])*/
          } else {
            //let start = new Date().getTime()
            dbLogs = await collectionUtil.saveBlock(current, true, blockType)
            //let end = new Date().getTime()
            //console.log('collection saveBlock time:' + (end - start))
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
      }
    },
    async fileCollectionDownload() {
      let collection = this.myCollections.c_meta.current
      let filename = collection.firstFileInfo.slice(collection.firstFileInfo.indexOf(' ') + 1)
      if (store.ios === true || store.android === true) {
        let dirPath
        if (store.android === true) {
          dirPath = cordova.file.externalDataDirectory
        } else if (store.ios === true) {
          let storageLocation = cordova.file.documentsDirectory //cordova.file.applicationStorageDirectory, dataDirectory
          console.log('storageLocation:' + storageLocation)
          let dirEntry = await fileComponent.getDirEntry(storageLocation)
          await fileComponent.createDirectory(dirEntry, 'File')
          dirPath = storageLocation + 'File/'
        }
        let fileEntry = await fileComponent.createNewFileEntry(filename, dirPath)
        let message = _that.$i18n.t("Save successfully")
        if (store.android === true) {
          message = message + ' (/Android/data/io.curltech.colla/files)'
        } else if (store.ios === true) {
          message = message + ' (' + _that.$i18n.t("File") + ': ' + _that.$i18n.t("My ") + 'iPhone[iPad]/Colla/File)'
        }
        fileComponent.writeFile(fileEntry, BlobUtil.base64ToBlob(collection.content), false).then(function () {
          _that.$q.notify({
            message: message,
            timeout: 3000,
            type: "info",
            color: "info",
          })
        }).catch(function (err) {
          console.error(err)
          _that.$q.notify({
            message: _that.$i18n.t("Save failed") + ' (' + err + ')',
            timeout: 3000,
            type: "warning",
            color: "warning",
          })
        })
      } else {
        let hyperlink = document.createElement("a"),
          mouseEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          })
        hyperlink.href = collection.content
        hyperlink.target = '_blank'
        hyperlink.download = filename
        hyperlink.dispatchEvent(mouseEvent)
          (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href)
      }
    },
    async refresh() {
      this.myCollections.splice(0)
      let meta = this.myCollections.c_meta
      meta['rowsNumber'] = -1
      meta['from'] = null
      meta['lock'] = null
      console.info('refresh clean myCollections')
      await this.load(0, (stop) => void 0)
    },
    getFrom: function (data, type) {
      let from = null
      if (data) {
        if (TypeUtil.isArray(data)) {
          if (data.length > 0) {
            from = (type === 'collection' ? data[data.length - 1].updateDate : data[data.length - 1].createDate)
          }
        } else {
          from = (type === 'collection' ? data.updateDate : data.createDate)
        }
      }
      return from
    },
    async load(index, done) {
      this.collectionLoading = true
      let ownerPeerId = myself.myselfPeerClient.peerId
      let meta = this.myCollections.c_meta
      let lock = meta['lock']
      if (lock) {
        done()
        this.collectionLoading = false
        return
      }
      this.collectionDone = false
      try {
        meta['lock'] = true
        let data = null
        this.searchText = (this.searchText || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '')
        if (this.source === 'local') {
          if (!meta['from']) {
            meta['from'] = new Date().getTime()
            console.log('first from:' + meta['from'])
          }
          //let start = new Date().getTime()
          data = await collectionComponent.load(ownerPeerId, this.collectionType, this.searchTag, this.searchText, meta['from'], meta['rowsPerPage'])
          //let end = new Date().getTime()
          //console.log('collection load time:' + (end - start))
        } else if (this.source === 'cloud') {
          let metadata = this.searchText // TODO
          if (!meta['from']) {
            if (metadata) {
              meta['from'] = this.myCollections.length
            } else {
              meta['from'] = new Date().getTime()
            }
          }
          data = await dataBlockService.find({
            metadata: metadata
          }, meta['from'], meta['rowsPerPage'])
        }
        if (data) {
          console.log('data length:' + data.length)
          for (let d of data) {
            d.selected = false
            this.myCollections.push(d)
            console.log(d)
          }
        }
        if (this.source === 'local') {
          let from = this.getFrom(data, 'collection')
          if (from) {
            meta['from'] = from
            console.log('from:' + meta['from'])
          }
        } else if (this.source === 'cloud') {
          // TODO
          /*if (metadata) {
            meta['from'] = this.myCollections.length
          } else {
            let from = this.getFrom(data, 'collection')
            if (from) {
              meta['from'] = from
            }
          }*/
        }
        if (!data || data.length === 0) {
          done(true)
          this.collectionDone = true
          console.log('no more data')
        }
      } catch (err) {
        console.error(err)
        done(true)
      } finally {
        meta['lock'] = false
        if (!this.collectionDone) {
          done()
        }
        this.collectionLoading = false
      }
    },
    async collectionSelected(item, index) {
      let _that = this
      let store = _that.$store
      if (!item) {
        return
      }
      // put content into attach
      if (!item.content) {
        let attachs = await collectionComponent.loadAttach(item, null, null)
        if (attachs && attachs.length > 0) {
          item.attachs = attachs
          item.content = attachs[0].content
        }
        if (!item.content) {
          item.content = ''
        }
      }
      store.state.currentCollection = item
      _that.myCollections.c_meta.current = item
      _that.myCollections.c_meta.currentIndex = index
      let collectionType = item.collectionType
      /*if (store.collectionEntry !== 'message') {
        // if (item.collectionType !== CollectionType.CHAT) {
          if (collectionType === CollectionType.NOTE) {
            _that.backupContent = _that.myCollections.c_meta.current.blockId + ':' + _that.myCollections.c_meta.current.content
            _that.subKind = 'edit'
          } else {
            _that.subKind = 'view'
          }
        // } else {
        //   let message = {
        //     mergeMessages : JSON.parse(item.plainContent)
        //   }
        //   store.state.currentMergeMessage = message
        // }
      } else {*/
      _that.subKind = 'view'
      //}
    },
    async doneSelectCollectionItem() {
      let _that = this
      let store = _that.$store
      if (store.state.selectedCollectionItems && store.state.selectedCollectionItems.length > 0) {
        await store.collectionPicked(store.state.selectedCollectionItems)
      }
    },
    // 新增
    insert() {
      let attachs = []
      let inserted = {
        blockId: UUID.string(null, null),
        state: EntityState.New,
        ownerPeerId: myself.myselfPeerClient.peerId,
        srcEntityType: SrcEntityType.MYSELF,
        srcEntityId: myself.myselfPeerClient.peerId,
        srcEntityName: myself.myselfPeerClient.name,
        collectionType: CollectionType.NOTE,
        content: '',
        attachs: attachs,
        contentTitle: '',
        contentBody: '',
        firstFileInfo: '',
        firstAudioDuration: '',
        contentIVAmount: 0,
        contentAAmount: 0,
        attachIVAmount: 0,
        attachAAmount: 0,
        attachOAmount: 0,
        attachAmount: 0
      }
      this.myCollections.unshift(inserted)
      this.myCollections.c_meta.currentIndex = 0
      this.myCollections.c_meta.current = inserted
      this.$store.state.currentCollection = inserted
      this.subKind = 'edit'
    },
    // 删除
    async del(current) {
      let _that = this
      let store = _that.$store
      if (!current) {
        current = _that.myCollections.c_meta.current
      } else {
        _that.myCollections.c_meta.current = current
      }
      _that.$q.bottomSheet({
        message: _that.$i18n.t('Confirm the deletion?'),
        actions: [
          {},
          {
            label: _that.$i18n.t('Confirm'),
            classes: 'text-red',
            icon: 'check_circle',
            id: 'confirm'
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
        if (action.id === 'confirm') {
          await collectionComponent.delete(current, _that.myCollections)
          _that.myCollections.c_meta.currentIndex = -1
          _that.myCollections.c_meta.current = null
          _that.subKind = 'default'
          // 云端cloud保存
          if (this.$store.collectionWorkerEnabler) {
            /*let dbLogs = await collectionUtil.deleteBlock(current, false, BlockType.Collection)
            let options = {}
            options.privateKey = myself.privateKey
            openpgp.clonePackets(options)
            let worker = _that.initCollectionUploadWorker()
            worker.postMessage(['one', dbLogs, myself.myselfPeerClient, options.privateKey])*/
          } else {
            let dbLogs = await collectionUtil.deleteBlock(current, true, BlockType.Collection)
            // 刷新syncFailed标志
            /*let newDbLogMap = CollaUtil.clone(store.state.dbLogMap)
            if (dbLogs && dbLogs.length > 0) {
              for (let dbLog of dbLogs) {
                let dl = newDbLogMap[dbLog.blockId]
                if (!dl) {
                  newDbLogMap[dbLog.blockId] = true
                  console.log('add dbLog, blockId:' + dbLog.blockId)
                }
              }
            }
            store.state.dbLogMap = newDbLogMap*/
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
      let current = _that.myCollections.c_meta.current
      if (current) {
        let insertHtml = await collectionUtil.getInsertHtml(files, store.imageMaxWidth, store.videoMaxWidth, store.audioMaxWidth)
        let html = _that.myCollections.c_meta.current.content
        html = html.replace('([{PHFI}])', insertHtml)
        _that.myCollections.c_meta.current.content = html
        editor.txt.html(html)
      }
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
          _that.collectionSaveMedia()
        } catch (e) {
          console.log(e)
          _that.cancelSelectCollectionCaptureMedia()
        }
      } else if (store.chrome === true) {
        store.captureMediaEntry = 'collection'
        store.captureType = type
        _that.subKind = 'captureMedia'
      } else if (store.safari === true) {
        //if (type === 'image') {
        store.captureMediaEntry = 'collection'
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
            let current = this.myCollections.c_meta.current
            if (current) {
              let insertHtml = ''
              let html = this.myCollections.c_meta.current.content
              html = html.replace('([{PHFI}])', insertHtml)
              this.myCollections.c_meta.current.content = html
              editor.txt.html(html)
            }
            return
          }
          this.collectionSaveMedia()
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
        this.cancelSelectCollectionCaptureMedia()
      }
    },
    async collectionSaveMedia() {
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
            console.log('screenHeight:' + (store.ifMobile() ? store.screenHeight : _that.$q.screen.height) + ',canvasWidth:' + canvasWidth + ',canvasHeight:' + canvasHeight + ',marginTop:' + marginTop)
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
        let selectedVideo = document.querySelector('#selectedContainer')
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
    saveAsNote() {
      let current = this.myCollections.c_meta.current
      if (current) {
        let inserted = {
          blockId: UUID.string(null, null),
          state: EntityState.New,
          ownerPeerId: myself.myselfPeerClient.peerId,
          srcEntityType: SrcEntityType.MYSELF,
          srcEntityId: myself.myselfPeerClient.peerId,
          srcEntityName: myself.myselfPeerClient.name,
          collectionType: CollectionType.NOTE,
          content: current.content,
          attachs: current.attachs,
          contentTitle: current.contentTitle,
          contentBody: current.contentBody,
          firstFileInfo: current.firstFileInfo,
          firstAudioDuration: current.firstAudioDuration,
          contentIVAmount: current.contentIVAmount,
          contentAAmount: current.contentAAmount,
          attachIVAmount: current.attachIVAmount,
          attachAAmount: current.attachAAmount,
          attachOAmount: current.attachOAmount,
          attachAmount: current.attachAmount
        }
        this.myCollections.unshift(inserted)
        this.myCollections.c_meta.currentIndex = 0
        this.myCollections.c_meta.current = inserted
        this.subKind = 'edit'
      }
    },
    openInOtherApp() {

    },
    async showEditTags() {
      let _that = this
      let store = _that.$store
      let current = _that.myCollections.c_meta.current
      if (current) {
        let tagArr = []
        let originCondition = {}
        originCondition.ownerPeerId = myself.myselfPeerClient.peerId
        originCondition.collectionId = current._id
        originCondition.pyTag = { $gt: null }
        let ctcs = await collectionComponent.loadCollectionTagCollection(originCondition, [{ pyTag: 'asc' }], null, null)
        if (!ctcs) {
          ctcs = []
        }
        for (let ctc of ctcs) {
          tagArr.push(ctc.tag)
        }
        _that.collectionData.ctcs = ctcs // 为saveTag参照删除数据做准备
        _that.collectionData.tags = tagArr
        _that.tagEntry = _that.subKind
        _that.subKind = 'tag'
      }
    },
    async saveTag() {
      let _that = this
      let store = _that.$store
      let current = _that.myCollections.c_meta.current
      if (current) {
        let collectionId = current._id
        let clientPeerId = myself.myselfPeerClient.peerId
        let ctcs = _that.collectionData.ctcs
        for (let ctc of ctcs) {
          let removed = true
          for (let tag of _that.collectionData.tags) {
            if (ctc.tag === tag) {
              removed = false
              break
            }
          }
          if (removed) {
            ctc.state = EntityState.Deleted
          }
        }
        for (let tag of _that.collectionData.tags) {
          let added = true
          for (let ctc of ctcs) {
            if (tag === ctc.tag) {
              added = false
              break
            }
          }
          if (added) {
            let ctc = {}
            ctc.ownerPeerId = clientPeerId
            ctc.tag = tag
            ctc.pyTag = pinyinUtil.getPinyin(tag)
            ctc.collectionId = collectionId
            ctc.createDate = new Date()
            ctc.state = EntityState.New
            ctcs.push(ctc)
          }
        }
        await collectionComponent.saveCollectionTagCollection(ctcs, null)
        store.state.collectionTags = await collectionComponent.getAllCollectionTags()
        _that.subKind = 'default'
      }
    },
    editCommand() {
      let _that = this
      let store = _that.$store
      _that.$q.bottomSheet({
        actions: [
          {
            label: _that.$i18n.t('Forward'),
            icon: 'forward',
            id: 'forward'
          },
          {},
          {
            label: _that.$i18n.t('Edit Tags'),
            icon: 'label',
            id: 'editTags'
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
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        if (action.id === 'forward') {
          store.selectChatEntry = 'collectionForward'
          _that.subKind = 'selectChat'
        } else if (action.id === 'editTags') {
          _that.showEditTags()
        } else if (action.id === 'delete') {
          _that.del()
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    viewCommand() {
      let _that = this
      let store = _that.$store
      let collection = _that.myCollections.c_meta.current
      let actions = [
        {
          label: _that.$i18n.t('Edit Tags'),
          icon: 'label',
          id: 'editTags'
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
      if (collection.collectionType === CollectionType.NOTE) {
        actions.unshift({
          label: _that.$i18n.t('Edit'),
          icon: 'edit',
          id: 'edit'
        }, {})
      }
      if (collection.collectionType !== CollectionType.NOTE && collection.collectionType !== CollectionType.VOICE && collection.collectionType !== CollectionType.FILE) {
        actions.unshift({
          label: _that.$i18n.t('Save as Note'),
          icon: 'notes',
          id: 'saveAsNote'
        }, {})
      }
      if (collection.collectionType !== CollectionType.VOICE) {
        actions.unshift({
          label: _that.$i18n.t('Forward'),
          icon: 'forward',
          id: 'forward'
        }, {})
      }
      _that.$q.bottomSheet({
        actions: actions
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        if (action.id === 'edit') {
          _that.backupContent = _that.myCollections.c_meta.current.blockId + ':' + _that.myCollections.c_meta.current.content
          _that.subKind = 'edit'
        } else if (action.id === 'forward') {
          store.selectChatEntry = 'collectionForward'
          _that.subKind = 'selectChat'
        } else if (action.id === 'openInOtherApp') {

        } else if (action.id === 'saveAsNote') {
          _that.saveAsNote()
        } else if (action.id === 'editTags') {
          _that.showEditTags()
        } else if (action.id === 'delete') {
          _that.del()
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
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
          store.selectChatEntry = 'collectionImg'
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
            a.download = _that.$i18n.t('Collection') + '-' + new Date().getTime() + '.' + extension
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
    async editBack() {
      let _that = this
      let current = _that.myCollections.c_meta.current
      if (current) {
        if (_that.backupContent !== current.blockId + ':' + current.content) {
          if (current._id) {
            current.state = EntityState.Modified
          }
          await _that.save('collection')
        }
      }
      _that.subKind = 'default'
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
          _that.myCollections.c_meta.current.content = html
        }
        editor.customConfig.setMaxWidth = (type, width) => {
          _that.setMaxWidth(type, width)
        }
        editor.create()
        editor.txt.html(_that.myCollections.c_meta.current.content)
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
    cancelSelectCollectionCaptureMedia() {
      let _that = this
      let html = _that.myCollections.c_meta.current.content
      html = html.replace('<p>\(\[\{PHFI\}\]\)<br></p>', '')
      html = html.replace('\(\[\{PHFI\}\]\)', '')
      _that.myCollections.c_meta.current.content = html
      editor.txt.html(html)
    },
    async cloudSync(done) {
      let _that = this
      let store = _that.$store
      if (!_that.cloudSyncing && !_that.collectionLoading) {
        _that.$q.loading.show()
        _that.cloudSyncing = true
        try {
          let current = _that.myCollections.c_meta.current
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
              CollaUtil.asyncPool(10, ps, async function (result) {
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
          if (done && typeof done === 'function') {
            done()
          }
          _that.cloudSyncing = false
          _that.$q.loading.hide()
        }
      }
    },
    clickContentHTML(event) {
      if (event.target.className === "collectionLink") {
        let inAppBrowser = inAppBrowserComponent.open(event.target.target, '_blank', 'location=no,footer=yes')
      }
    },
    /*initCollectionUploadWorker() {
      let _that = this
      let store = _that.$store
      let worker = new CollectionUploadWorker()
      worker.onerror = function (event) {
        console.log('collectionUpload worker error:' + event.data)
      }
      worker.onmessageerror = function (event) {
        console.log('collectionUpload worker message error:' + event.data)
      }
      worker.onmessage = async function (event) {
        console.log('receive collectionUpload worker return message:' + JSON.stringify(event.data))
        let flag = event.data[0]
        let responses = event.data[1]
        let dbLogs = event.data[2]
        // 如果返回错误，需要保留blockLog在以后继续处理，否则删除
        if (responses && responses.length > 0) {
          for (let i = 0; i < responses.length; ++i) {
            let response = responses[i]
            console.log("response:" + JSON.stringify(response))
            if (response &&
              response.MessageType === MsgType[MsgType.CONSENSUS_REPLY] &&
              response.Payload === MsgType[MsgType.OK]) {
              // 如果上传不成功，需要保留blockLog在以后继续处理，否则删除
              dbLogs[i].state = EntityState.Deleted
              console.log('delete dbLog, blockId:' + dbLogs[i].blockId + ';sliceNumber:' + dbLogs[i].sliceNumber)
            }
          }
          await blockLogComponent.save(dbLogs, null, dbLogs)
        }
        // 刷新syncFailed标志
        //if (flag === 'one') {
        //  if (dbLogs && dbLogs.length > 0) {
        //    for (let dbLog of dbLogs) {
        //      for (let myCollection of _that.myCollections) {
        //        if (myCollection.blockId === dbLog.blockId) {
        //          myCollection.syncFailed = true
        //          break
        //        }
        //      }
        //   }
        //  }
        //} else if (flag === 'all') {
        //  for (let myCollection of _that.myCollections) {
        //    let syncFailed = false
        //    if (dbLogs && dbLogs.length > 0) {
        //      for (let dbLog of dbLogs) {
        //        if (myCollection.blockId === dbLog.blockId) {
        //          syncFailed = true
        //          break
        //        }
        //      }
        //    }
        //    myCollection.syncFailed = syncFailed
        //  }
        //}
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
      return worker
    },*/
    /*initCollectionDownloadWorker() {
      let _that = this
      let store = _that.$store
      let worker = new CollectionDownloadWorker()
      worker.onerror = function (event) {
        console.log('collectionDownload worker error:' + event.data)
      }
      worker.onmessageerror = function (event) {
        console.log('collectionDownload worker message error:' + event.data)
      }
      worker.onmessage = async function (event) {
        console.log('receive collectionDownload worker return message:' + JSON.stringify(event.data))
        let current = _that.myCollections.c_meta.current
        let responses = event.data
        if (responses && responses.length > 0) {
          for (let i = 0; i < responses.length; ++i) {
            let collections = responses[i]
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
          }
        }
      }
      return worker
    }*/
  },
  created: async function () {
    let _that = this
    let store = _that.$store
    store.changeCollectionSubKind = function (subKind) {
      _that.subKind = subKind
    }
    store.cancelSelectCollectionCaptureMedia = _that.cancelSelectCollectionCaptureMedia
    store.collectionSaveMedia = _that.collectionSaveMedia
    Vue.set(this.myCollections, 'c_meta', {
      dataType: 'MyCollection',
      page: 0,
      rowsPerPage: 5,
      rowsNumber: -1,
      currentIndex: -1,
      current: {},
      state: EntityState.None,
      shadow: null,
      selected: []
    })
    Object.defineProperty(this.myCollections, 'c_meta', { enumerable: false })
    let collectionTags = await collectionComponent.getAllCollectionTags()
    if (!collectionTags) {
      collectionTags = []
    }
    store.state.collectionTags = collectionTags
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
      if (val === 'edit') {
        _that.setEditor()
      }
    }
  }
}
