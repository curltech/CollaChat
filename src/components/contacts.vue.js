import { ActiveStatus, RequestStatus, LinkmanStatus } from '@/libs/biz/colla-contact'
import { myself } from 'libcolla'

export default {
  name: "Contacts",
  components: {
  },
  props: [],
  data() {
    return {
      ActiveStatus: ActiveStatus,
      lockContactsSwitchDialog: false,
      password: null,
      contactsfilter: null,
      ifScrollTop: true,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search'),
      subKind: 'default'
    }
  },
  methods: {
    showLockContactsSwitchDialog() {
      let _that = this
      let store = _that.$store
      if (store.state.lockContactsSwitch) {
        _that.password = null
        _that.lockContactsSwitchDialog = true
      } else {
        _that.updateLockContactsSwitch()
      }
    },
    updateLockContactsSwitch() {
      let _that = this
      let store = _that.$store
      if (store.state.lockContactsSwitch && _that.password !== myself.password) {
        _that.$q.notify({
          message: _that.$i18n.t("Wrong password"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        return
      }
      _that.lockContactsSwitchDialog = false
      store.state.lockContactsSwitch = !store.state.lockContactsSwitch
      if (store.state.lockContactsSwitch) {
        if (_that.kind === 'contactsDetails' && store.state.currentLinkman && store.state.currentLinkman.locked) {
          if (_that.ifMobileSize || store.state.ifMobileStyle) {
            $store.toggleDrawer(false)
            store.state.currentLinkman = null
          } else {
            store.changeKind('receivedList')
            store.state.currentLinkman = null
          }
        }
      }
    },
    findContacts() {
      let _that = this
      let store = _that.$store
      store.state.findLinkmanData = {
        peerId: null,
        message: null,
        givenName: null,
        tag: null
      }
      store.state.findLinkmanResult = 0
      store.state.findLinkmanTip = ''
      store.state.findLinkman = null
      store.state.findContactsSubKind = 'default'
      store.changeKind('findContacts')
      store.toggleDrawer(true)
    },
    contactsSelected(linkman, _index) {
      let _that = this
      let store = _that.$store
      let prevCurrentLinkman = store.state.currentLinkman
      store.state.currentLinkman = linkman
      store.contactsDetailsEntry = 'contacts'
      store.changeKind('contactsDetails')
      store.toggleDrawer(true)
      if (!(_that.ifMobileSize || store.state.ifMobileStyle) && prevCurrentLinkman && prevCurrentLinkman._id !== linkman._id) {
        store.changeContactsDetailsSubKind('default')
      }
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    ReceivedList() { // 待我接受的联系人的请求
      let _that = this
      let store = _that.$store
      let ReceivedArray = []
      let myselfPeerClient = myself.myselfPeerClient
      let linkmanRequests = store.state.linkmanRequests
      if (linkmanRequests && linkmanRequests.length > 0) {
        for (let linkmanRequest of linkmanRequests) {
          if (linkmanRequest.receiverPeerId === myselfPeerClient.peerId && linkmanRequest.status === RequestStatus.RECEIVED) {
            ReceivedArray.push(linkmanRequest)
          }
        }
      }
      return ReceivedArray
    },
    LinkmanFilteredList() { // 联系人（含黑名单、上锁联系人显示控制、contactsfilter过滤搜索）
      let _that = this
      let store = _that.$store
      let LinkmanFilteredArray = []
      let linkmans = store.state.linkmans
      if (linkmans && linkmans.length > 0) {
        let contactsfilter = _that.contactsfilter
        if (contactsfilter) {
          LinkmanFilteredArray = linkmans.filter((linkman) => {
            return (linkman.peerId.toLowerCase().includes(contactsfilter.toLowerCase())
              || (linkman.mobile && linkman.mobile.toLowerCase().includes(contactsfilter.toLowerCase()))
              || linkman.name.toLowerCase().includes(contactsfilter.toLowerCase())
              || linkman.pyName.toLowerCase().includes(contactsfilter.toLowerCase())
              || (linkman.givenName && linkman.givenName.toLowerCase().includes(contactsfilter.toLowerCase()))
              || (linkman.pyGivenName && linkman.pyGivenName.toLowerCase().includes(contactsfilter.toLowerCase()))
              || (linkman.tag && linkman.tag.toLowerCase().includes(contactsfilter.toLowerCase()))
              || (linkman.pyTag && linkman.pyTag.toLowerCase().includes(contactsfilter.toLowerCase())))
              && ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
              && linkman.status !== LinkmanStatus.REQUESTED
          })
        } else {
          LinkmanFilteredArray = linkmans.filter((linkman) => {
            return ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
              && linkman.status !== LinkmanStatus.REQUESTED
          })
        }
      }
      return LinkmanFilteredArray
    }
  },
  created() {
    let _that = this
    let store = _that.$store
  },
  mounted() {
    let _that = this
    let store = _that.$store
  },
  watch: {
  }
}
