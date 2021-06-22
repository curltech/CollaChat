
export default {
  name: "List",
  components: {
  },
  data() {
    return {
      url: "https://192.168.0.101:8090/"
    }
  },
  methods: {
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height - 50}px`
      }
    }
  },
  async mounted() {
  }
}
