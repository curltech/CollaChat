import { date } from 'quasar'
import { ContactDataType, RequestStatus, contactComponent } from '@/libs/biz/colla-contact'

export default {
  name: "SentList",
  components: {
  },
  props: [],
  data() {
    return {
      date: date,
      RequestStatus: RequestStatus
    }
  },
  methods: {
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
  },
  mounted() {
    let _that = this
    let store = _that.$store
  },
  watch: {
  }
}
