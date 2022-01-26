import { myself } from 'libcolla'

import { statusBarComponent } from '@/libs/base/colla-cordova'
import { contactComponent, ContactDataType } from '@/libs/biz/colla-contact'

import ContactsDetails from '@/components/contactsDetails'
import FindContacts from '@/components/findContacts'

export default {
  name: "PeerContactsList",
  components: {
    contactsDetails: ContactsDetails,
    findContacts: FindContacts
  },
  props: [],
  data() {
    return {
      subKind: 'default',
      peerContactsFilter: '',
      peerContacts: [],
      currentPeerContact: {},
      linkmanFilter: false,
      peerFilter: false,
      loading: false,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search')
    }
  },
  methods: {
    init() {
      let _that = this
      let store = _that.$store
      _that.peerContacts = []
      contactComponent.fillPeerContact(_that.peerContacts, store.state.linkmans)
    },
    async refresh() {
      let _that = this
      let store = _that.$store
      let pc = await contactComponent.refreshPeerContact(this.currentPeerContact)
      let conditionBean = {
        mobile: this.currentPeerContact.mobile
      }
      // 在本地库搜索，删除，插入新的
      contactComponent.loadPeerContact(conditionBean).then((pContacts) => {
        // 搜到
        if (pContacts && pContacts.length > 0) {
          for (let pContact of pContacts) {
            contactComponent.remove(ContactDataType.PEER_CONTACT, pContact)
          }
          if (pc) {
            _that.currentPeerContact._id = undefined
            _that.currentPeerContact._rev = undefined
            contactComponent.insert(ContactDataType.PEER_CONTACT, _that.currentPeerContact)
          }
        }
      })
    },
    back() {
      let _that = this
      let store = _that.$store
      if (store.phoneContactsEntry === 'contacts') {
        store.toggleDrawer(false)
      } else if (store.phoneContactsEntry === 'findContacts') {
        store.state.findContactsSubKind = 'default'
      }
    },
    showPeerContact(peerContact, index) {
      let _that = this
      let store = _that.$store
      this.currentPeerContact = peerContact
      this.subKind = 'phoneContactDetail'
    },
    showContacts(peerContact, index) {
      let _that = this
      let store = _that.$store
      if (peerContact.isLinkman === true) {
        store.state.currentLinkman = peerContact.linkman
        store.contactsDetailsEntry = 'phoneContactsList'
        _that.subKind = 'contactsDetails'
      } else {
        store.state.findLinkmanResult = 4
        store.state.findLinkmanTip = ''
        store.state.findLinkman = peerContact.linkman
        store.state.findLinkmanData = {
          peerId: peerContact.linkman.peerId,
          message: null,
          givenName: null,
          tag: null
        }
        if (store.state.findLinkmans) {
          store.state.findLinkmans.splice(0)
        }
        store.state.findContactsSubKind = 'result'
        store.findContactsEntry = 'phoneContactsList'
        _that.subKind = 'findContacts'
      }
    },
    async mediaRequest(type, peerContact) {
      let _that = this
      let store = _that.$store
      store.state.currentPhoneContact = peerContact
      _that.initiateCallRequest(type, 'phoneContacts')
    },
    showAddContacts() {
      let _that = this
      let store = _that.$store
      store.state.findLinkman = _that.currentPeerContact
      store.state.findLinkmanData = {
        peerId: _that.currentPeerContact.peerId,
        message: _that.$i18n.t("I'm ") + myself.myselfPeerClient.name,
        givenName: null,
        tag: null,
        tagNames: []
      }
      store.state.findContactsSubKind = 'addContacts'
      store.findContactsEntry = 'phoneContactsList'
      _that.subKind = 'findContacts'
    },
    onCopySuccess: function (e) {
      this.$q.notify({
        message: this.$i18n.t("Copy successfully"),
        timeout: 3000,
        type: "info",
        color: "info",
      })
    },
    onCopyFailure: function (e) {
      this.$q.notify({
        message: this.$i18n.t("Copy failed"),
        timeout: 3000,
        type: "warning",
        color: "warning",
      })
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
    peerContactsFilteredList() { // 联系人（含黑名单、上锁联系人显示控制、phoneContactsfilter过滤搜索）
      let _that = this
      let store = _that.$store
      let peerContactFilteredArray = []
      let peerContacts = _that.peerContacts
      if (peerContacts && peerContacts.length > 0) {
        let peerContactsFilter = _that.peerContactsFilter
        for (let peerContact of peerContacts) {
          let isInclude = true
          if (peerContactsFilter) {
            isInclude = ((peerContact.formattedName && peerContact.formattedName.toLowerCase().includes(peerContactsFilter.toLowerCase())) ||
              (peerContact.pyFormattedName && peerContact.pyFormattedName.toLowerCase().includes(peerContactsFilter.toLowerCase())) ||
              (peerContact.mobile && peerContact.mobile.toLowerCase().includes(peerContactsFilter.toLowerCase())))
            if (this.linkmanFilter === true) {
              isInclude = isInclude && (peerContact.isLinkman === true)
            }
            if (this.peerFilter === true) {
              isInclude = isInclude && (peerContact.peerId)
            }
          } else {
            if (this.linkmanFilter === true) {
              isInclude = isInclude && (peerContact.isLinkman === true)
            }
            if (this.peerFilter === true) {
              isInclude = isInclude && (peerContact.peerId ? true : false)
            }
          }
          if (isInclude === true) {
            peerContactFilteredArray.push(peerContact)
          }
        }
      }
      return peerContactFilteredArray
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
    store.changePhoneContactsListSubKind = function (subKind) {
      _that.subKind = subKind
    }
    /*if (store.state.ifMobileStyle) {
      statusBarComponent.style(true, '#ffffff')
    }*/
    _that.init()
  }
}
