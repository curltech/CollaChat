import { conferenceComponent } from '@/libs/biz/colla-conference'

export default {
  data() {
    return {
      subKind: 'default',
      conference: null,
      joinData: {},
      joinDialog: false
    }
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    }
  },
  methods: {
    back() {
      let _that = this
      let store = _that.$store
      if (store.selectContactsEntry === 'addGroupChat' || store.selectContactsEntry === 'linkmanCard') {
        if (_that.ifMobileSize || store.state.ifMobileStyle) {
          store.toggleDrawer(false)
        } else {
          store.changeKind('message')
        }
      } else if (store.selectContactsEntry === 'CHATDetails' || store.selectContactsEntry === 'GROUP_CHATDetails') {
        store.changeMessageSubKind(store.selectContactsEntry)
      } else if (store.selectContactsEntry === 'contactsTagList') {
        store.changeContactsTagListSubKind('editContactsTag')
      }
    },
    add() {
      // 加一条会议记录到数据库，所有的会议参数为缺省设置并设置时间为当前马上开始
      this.conference = conferenceComponent.create()
    },
    reset() {
      // 清除会议属性
      this.conference = conferenceComponent.getDefaultConference()
    },
    schedule: async function () {
      // 加一条会议记录到数据库，并根据时间进行触发调度会议
    },
    showJoinDialog() {
      this.joinData.peerId = null
      this.joinData.conferenceId = null
      this.joinData.password = null
      this.joinDialog = true
    },
    join() {
      /**
       * 输入peerId，conferenceId，可选密码，发起加入会议
       */
    }
  },
  mounted() {
  },
  created() {
    this.conference = conferenceComponent.getDefaultConference()
  },
  watch: {
  }
}
