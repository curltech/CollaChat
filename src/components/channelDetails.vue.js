import { date } from 'quasar'

import { CollaUtil } from 'libcolla'
import { myself } from 'libcolla'

import NewArticle from '@/components/newArticle'

export default {
  name: "ChannelDetails",
  components: {
    newArticle: NewArticle,
  },
  data() {
    return {
      subKind: 'default',
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
    articleSelected(article, index) {
      let _that = this
      let store = _that.$store
      let prevCurrentArticle = store.state.currentArticle
      store.state.currentArticle = article
      _that.subKind = 'view'
    },
    viewCommand() {
      let _that = this
      let store = _that.$store
      let actions = [
        {
          label: _that.$i18n.t('Forward'),
          icon: 'forward',
          id: 'forward'
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
      let channel = store.state.currentChannel
      if (channel.creator === myself.myselfPeerClient.peerId) {
        actions.unshift({
          label: _that.$i18n.t('Edit'),
          icon: 'edit',
          id: 'edit'
        },{})
      }
      _that.$q.bottomSheet({
        actions: actions
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        if (action.id === 'edit') {
          _that.subKind = 'edit'
        } else if (action.id === 'forward') {
          store.selectChatEntry = 'articleForward'
          _that.subKind = 'selectChat'
        } else if (action.id === 'delete') {
          _that.del()
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    channelCommand() {
      let _that = this
      let store = _that.$store
      let channel = store.state.currentChannel
      let actions = [
        {
          label: channel.top ? _that.$i18n.t('Untop') : _that.$i18n.t('Top'),
          icon: 'star',
          id: 'top'
        },
        {},
        {
          label: _that.$i18n.t('Forward'),
          icon: 'forward',
          id: 'forward'
        },
        {},
        {
          label: _that.$i18n.t('Cancel'),
          icon: 'cancel',
          id: 'cancel'
        }
      ]
      if (channel.creator === myself.myselfPeerClient.peerId) {
        actions.unshift({
          label: _that.$i18n.t('New Article'),
          icon: 'article',
          id: 'newArticle'
        },{})
      }
      _that.$q.bottomSheet({
        actions: actions
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        if (action.id === 'newArticle') {
          _that.subKind = 'newArticle'
        } else if (action.id === 'top') {
          _that.top()
        } else if (action.id === 'forward') {
          store.selectChatEntry = 'channelForward'
          _that.subKind = 'selectChat'
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    async follow() {
      let _that = this
      let store = _that.$store
      let channel = store.state.currentChannel
      let markDate = channel.markDate
    },
    async top() {
      let _that = this
      let store = _that.$store
      let channel = store.state.currentChannel
      let top = channel.top
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
    store.changeChannelDetailsSubKind = function (subKind) {
      _that.subKind = subKind
    }
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  watch: {
  }
}
