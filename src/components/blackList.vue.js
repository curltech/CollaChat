import { date } from 'quasar'

import { myself } from 'libcolla'

import { statusBarComponent } from '@/libs/base/colla-cordova'
import { ContactDataType, LinkmanStatus, contactComponent, ActiveStatus, RequestType, RequestStatus } from '@/libs/biz/colla-contact'
import { SubjectType, P2pChatMessageType } from '@/libs/biz/colla-chat'

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
    },
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
              || (linkman.mobile && linkman.mobile.toLowerCase().includes(filter.toLowerCase()))
              || linkman.name.toLowerCase().includes(filter.toLowerCase())
              || linkman.pyName.toLowerCase().includes(filter.toLowerCase())
              || (linkman.givenName && linkman.givenName.toLowerCase().includes(filter.toLowerCase()))
              || (linkman.pyGivenName && linkman.pyGivenName.toLowerCase().includes(filter.toLowerCase()))
              || (linkman.tag && linkman.tag.toLowerCase().includes(filter.toLowerCase()))
              || (linkman.pyTag && linkman.pyTag.toLowerCase().includes(filter.toLowerCase())))
              && linkman.status === LinkmanStatus.BLACKED && ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
          })
        } else {
          BlackArray = linkmans.filter((linkman) => {
            return linkman.status === LinkmanStatus.BLACKED && ((store.state.lockContactsSwitch && !linkman.locked) || !store.state.lockContactsSwitch)
          })
        }
      }
      return BlackArray
    }
  },
  methods: {
    async unblack(blackedLinkman) {
      let _that = this
      let store = _that.$store
      let currentTime = new Date()
      let linkman = store.state.linkmanMap[blackedLinkman.peerId]
      if (linkman) {
        linkman.status = LinkmanStatus.EFFECTIVE
        linkman.statusDate = currentTime
        store.state.linkmanMap[blackedLinkman.peerId] = linkman
        let linkmanRecord = await contactComponent.get(ContactDataType.LINKMAN, linkman._id)
        if (linkmanRecord) {
          linkmanRecord.status = LinkmanStatus.EFFECTIVE
          linkmanRecord.statusDate = currentTime
          await contactComponent.update(ContactDataType.LINKMAN, linkmanRecord)
        }

        // 新增Sent请求
        let linkmanRequest = {}
        linkmanRequest.requestType = RequestType.UNBLACK_LINKMAN
        linkmanRequest.ownerPeerId = myself.myselfPeerClient.peerId
        linkmanRequest.senderPeerId = myself.myselfPeerClient.peerId
        linkmanRequest.createDate = currentTime
        linkmanRequest.status = RequestStatus.SENT
        await contactComponent.insert(ContactDataType.LINKMAN_REQUEST, linkmanRequest, null)

        // 保存/发送Sent请求
        let message = {
          subjectType: SubjectType.LINKMAN_REQUEST,
          messageType: P2pChatMessageType.UNBLACK_LINKMAN,
          content: linkmanRequest
        }
        await store.saveAndSendMessage(message, linkman.peerId)
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
    }
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
