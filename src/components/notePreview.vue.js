import { date } from 'quasar'

import { CollaUtil } from 'libcolla'
import { myself } from 'libcolla'

import { SrcChannelType, SrcEntityType, CollectionType } from '@/libs/biz/colla-collection'

export default {
  name: 'NotePreview',
  props: ['entry', 'item'],
  data() {
    return {
      CollaUtil: CollaUtil,
      date: date,
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    Outline() {
      let _that = this
      let store = _that.$store
      return function (item) {
        let outline = ''
        let collectionType = _that.entry !=='message' ? item.collectionType : item.contentType
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
    SyncFailed() {
      let _that = this
      let store = _that.$store
      return function (blockId) {
        if (store.state.dbLogMap[blockId]) {
          return true
        } else {
          return false
        }
      }
    }
  },
  methods: {
    getSrcEntityName(item) {
      let _that = this
      let store = _that.$store
      let srcEntityType = item.srcEntityType
      let srcEntityId = item.srcEntityId
      let srcEntityName = item.srcEntityName
      let name = ''
      if (srcEntityId) {
        let linkman = store.state.linkmanMap[srcEntityId]
        if ((srcEntityType === SrcEntityType.MYSELF && _that.entry !== 'message') || srcEntityId === myself.myselfPeerClient.peerId) {
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
    selectItem(item) {
      let _that = this
      let store = _that.$store
      if (item.selected) {
        store.state.selectedCollectionItems.push(item)
      } else {
        let index = 0
        for (let selectedCollectionItem of store.state.selectedCollectionItems) {
          if (selectedCollectionItem.blockId === item.blockId) {
            store.state.selectedCollectionItems.splice(index, 1)
            return
          }
          index++
        }
      }
    }
  },
  mounted() {
    let _that = this
    let store = _that.$store
  },
  created() {
    let _that = this
    let store = _that.$store
  }
}
