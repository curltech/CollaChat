import { date } from 'quasar'

import { myself } from 'libcolla'

import { statusBarComponent } from '@/libs/base/colla-cordova'
import { ContactDataType, LinkmanStatus, contactComponent, ActiveStatus } from '@/libs/biz/colla-contact'

import ContactsDetails from '@/components/contactsDetails'

export default {
  name: "BlackList",
  components: {
    contactsDetails: ContactsDetails
  },
  props: [],
  data() {
    return {
      ActiveStatus: ActiveStatus,
      subKind: 'default',
      date: date,
      filter: null,
      lockContactsSwitchDialog: false,
      password: null,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search')
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
    async unblock(blockedLinkman) {
      let _that = this
      let store = _that.$store
      let currentTime = new Date()
      let linkman = store.state.linkmanMap[blockedLinkman.peerId]
      linkman.status = LinkmanStatus.EFFECTIVE
      linkman.statusDate = currentTime
      let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
      if (linkmanRecord) {
        linkmanRecord.status = LinkmanStatus.EFFECTIVE
        linkmanRecord.statusDate = currentTime
        await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
      }
    },
    showContacts(linkman, index) {
      let _that = this
      let store = _that.$store
      store.state.currentLinkman = linkman
      store.contactsDetailsEntry = 'blackList'
      _that.subKind = 'contactsDetails'
      /*if (store.state.ifMobileStyle) {
        statusBarComponent.style(true, '#ffffff')
      }*/
    },
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
          message: "wrong password",
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
    }
  },
  computed: {
    ifMobileSize() {
      return (!window.device && this.$q.screen.width < 481)
    },
    BlackList() {
      let _that = this
      let store = _that.$store
      let BlackArray = []
      let linkmans = store.state.linkmans
      if (linkmans && linkmans.length > 0) {
        let filter = _that.filter
        if (filter) {
          BlackArray = linkmans.filter((linkman) => {
            return (linkman.peerId.toLowerCase().includes(filter.toLowerCase())
              || linkman.mobile.toLowerCase().includes(filter.toLowerCase())
              || linkman.name.toLowerCase().includes(filter.toLowerCase())
              || linkman.pyName.toLowerCase().includes(filter.toLowerCase())
              || (linkman.givenName && linkman.givenName.toLowerCase().includes(filter.toLowerCase()))
              || (linkman.pyGivenName && linkman.pyGivenName.toLowerCase().includes(filter.toLowerCase()))
              || (linkman.tag && linkman.tag.toLowerCase().includes(filter.toLowerCase()))
              || (linkman.pyTag && linkman.pyTag.toLowerCase().includes(filter.toLowerCase())))
              && linkman.status === 'BLOCKED' && ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
          })
        } else {
          BlackArray = linkmans.filter((linkman) => {
            return linkman.status === 'BLOCKED' && ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
          })
        }
      }
      return BlackArray
    }
  },
  mounted() {
    let _that = this
    let store = _that.$store
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeBlackListSubKind = function (subKind) {
      _that.subKind = subKind
    }
  },
  watch: {
  }
}
