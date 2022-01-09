import VueMarkdown from 'vue-markdown'
import { myself } from 'libcolla'
import { HttpClient } from 'libcolla'

export default {
  name: "Faq",
  components: {
    VueMarkdown
  },
  data() {
    return {
      source: "",
      show: true,
      html: true,
      breaks: true,
      linkify: true,
      emoji: true,
      typographer: true,
      toc: false
    }
  },
  methods: {
    allRight: function (htmlStr) {
      console.log("markdown is parsed!")
    },
    tocAllRight: function (tocHtmlStr) {
      console.log("toc is parsed: ", tocHtmlStr)
    }
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    }
  },
  async mounted() {
    this.toc = true
    let language = myself.myselfPeerClient && myself.myselfPeerClient.language ? myself.myselfPeerClient.language : this.$i18n.locale
    try {
      let httpClient = new HttpClient()
			if (httpClient) {
        let serviceData = await httpClient.get("https://curltech.io/md/" + "faq-" + language + ".md?time=" + new Date().getTime())
        if (serviceData) {
          this.source = serviceData.data
        }
			}
    } catch (e) {
      console.error(e)
      this.source = this.$i18n.t("Network error")
    }
  }
}
