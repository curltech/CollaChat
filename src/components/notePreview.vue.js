import { CollaUtil } from 'libcolla'
import { Attach, Collection, collectionComponent, SrcChannelType, SrcEntityType, CollectionDataType, CollectionType } from '@/libs/biz/colla-collection'
import { myself } from 'libcolla'
import { date } from 'quasar'

export default {
  name: 'NotePreview',
  props: ['entry','item'],
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
        if (srcEntityType === SrcEntityType.MYSELF || srcEntityId === myself.myselfPeerClient.peerId) {
          name = _that.$i18n.t('Me')
        } else if (srcEntityType === SrcEntityType.LINKMAN || store.state.linkmanMap[srcEntityId]) {
          let givenName = store.state.linkmanMap[srcEntityId].givenName
          name = (givenName ? givenName : store.state.linkmanMap[srcEntityId].name)
        } else {
          name = srcEntityName ? srcEntityName : ''
        }
      } else {
        name = srcEntityName ? srcEntityName : ''
        console.error('blank srcEntityId, srcEntityName:' + srcEntityName)
      }
      return name
    },
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  created() {
    let _that = this
    let store = _that.$store
  }
}
