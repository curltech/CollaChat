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
        avatar: this.$store.defaultActiveAvatar,
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
          businessNumber: 'Channel',
          blockId: blockId,
          createDate: currentTime,
          updateDate: currentTime,
          markDate: currentTime,
          top: true
        }
        let blockType = BlockType.Channel
        let _peers = []
        let expireDate = new Date().getTime() + 3600*24*365*100 // 100 years
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
        store.toggleDrawer(false)
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
  },
  created() {
    let _that = this
    let store = _that.$store
  }
}
