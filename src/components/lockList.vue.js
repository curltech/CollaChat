import { statusBarComponent } from '@/libs/base/colla-cordova'
import { ContactDataType, contactComponent, ActiveStatus } from '@/libs/biz/colla-contact'

import ContactsDetails from '@/components/contactsDetails'

export default {
  name: "LockList",
  components: {
    contactsDetails: ContactsDetails
  },
  props: [],
  data() {
    return {
      ActiveStatus: ActiveStatus,
      subKind: 'default',
      filter: null,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search')
    }
  },
  methods: {
    async unlock(lockedLinkman) {
      let _that = this
      let store = _that.$store
      let linkman = store.state.linkmanMap[lockedLinkman.peerId]
      if (linkman) {
        linkman.locked = false
        store.state.linkmanMap[lockedLinkman.peerId] = linkman
        let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
        if (linkmanRecord) {
          linkmanRecord.locked = false
          await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
        }
      }
    },
    showContacts(linkman, index) {
      let _that = this
      let store = _that.$store
      store.state.currentLinkman = linkman
      store.contactsDetailsEntry = 'lockList'
      _that.subKind = 'contactsDetails'
      /*if (store.state.ifMobileStyle) {
        statusBarComponent.style(true, '#ffffff')
      }*/
    }
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    },
    LockList() {
      let _that = this
      let store = _that.$store
      let LockArray = []
      let linkmans = store.state.linkmans
      if (linkmans && linkmans.length > 0) {
        let filter = _that.filter
        if (filter) {
          LockArray = linkmans.filter((linkman) => {
            return (linkman.peerId.toLowerCase().includes(filter.toLowerCase())
              || (linkman.mobile && linkman.mobile.toLowerCase().includes(filter.toLowerCase()))
              || linkman.name.toLowerCase().includes(filter.toLowerCase())
              || linkman.pyName.toLowerCase().includes(filter.toLowerCase())
              || (linkman.givenName && linkman.givenName.toLowerCase().includes(filter.toLowerCase()))
              || (linkman.pyGivenName && linkman.pyGivenName.toLowerCase().includes(filter.toLowerCase()))
              || (linkman.tag && linkman.tag.toLowerCase().includes(filter.toLowerCase()))
              || (linkman.pyTag && linkman.pyTag.toLowerCase().includes(filter.toLowerCase())))
              && linkman.locked
          })
        } else {
          LockArray = linkmans.filter((linkman) => {
            return linkman.locked
          })
        }
      }
      return LockArray
    }
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeLockListSubKind = function (subKind) {
      _that.subKind = subKind
    }
  }
}
