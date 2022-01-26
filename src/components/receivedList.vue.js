import { date } from 'quasar'
import { ContactDataType, RequestStatus, contactComponent } from '@/libs/biz/colla-contact'
import SentList from '@/components/sentList'
import FindContacts from '@/components/findContacts'

export default {
  name: "ReceivedList",
  components: {
    sentList: SentList,
    findContacts: FindContacts
  },
  props: [],
  data() {
    return {
      subKind: 'default',
      RequestStatus: RequestStatus,
      date: date
    }
  },
  methods: {
    acceptRequest(linkmanRequest) {
      let _that = this
      let store = _that.$store
      store.state.findLinkmanResult = 3
      store.state.findLinkmanTip = ''
      store.state.findLinkman = linkmanRequest
      store.state.findLinkman.peerId = linkmanRequest.senderPeerId
      if (store.state.findLinkmans) {
        store.state.findLinkmans.splice(0)
      }
      store.state.findContactsSubKind = 'result'
      store.findContactsEntry = 'receivedList'
      _that.subKind = 'findContacts'
    },
    async ignoreRequest(linkmanRequest) {
      let _that = this
      let store = _that.$store
      let currentTime = new Date()
      linkmanRequest.status = RequestStatus.IGNORED
      linkmanRequest.statusDate = currentTime
      let linkmanRequestRecord = await contactComponent.get(ContactDataType.LINKMAN_REQUEST, linkmanRequest._id)
      if (linkmanRequestRecord) {
        linkmanRequestRecord.status = RequestStatus.IGNORED
        linkmanRequestRecord.statusDate = currentTime
        await contactComponent.update(ContactDataType.LINKMAN_REQUEST, linkmanRequestRecord, null)
      }
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
  created() {
    let _that = this
    let store = _that.$store
    store.changeReceivedListSubKind = function (subKind) {
      _that.subKind = subKind
    }
  }
}
