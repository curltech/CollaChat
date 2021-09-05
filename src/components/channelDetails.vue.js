import { date } from 'quasar'

import { CollaUtil } from 'libcolla'

export default {
  name: "ChannelDetails",
  components: {
  },
  data() {
    return {
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
      let articleList = store.state.articleList
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
    articleSelected(channel, index) {
      let _that = this
      let store = _that.$store
      let prevCurrentChannel = store.state.currentChannel
      store.state.currentChannel = channel
      store.channelDetailsEntry = 'channel'
      store.changeKind('channelDetails')
      store.toggleDrawer(true)
      if (!(_that.ifMobileSize || store.state.ifMobileStyle) && prevCurrentChannel && prevCurrentChannel._id !== channel._id) {
        store.changeChannelDetailsSubKind('default')
      }
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
