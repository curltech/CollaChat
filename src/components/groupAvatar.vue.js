
export default {
  name: "groupAvatar",
  props: ['group_members','unReadCount','avatar_width'],
  data() {
    return {
      messageText: null,
    }
  },
  computed: {
  },
  methods: {
    pasteCapture(evt) {
      debugger
    },
  },
  async mounted() {
    let _that = this
    let store = _that.$store
  }
}
