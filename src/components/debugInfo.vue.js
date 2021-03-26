import { date } from 'quasar'

import { logService } from 'libcolla'

import * as CollaConstant from '@/libs/base/colla-constant'

export default {
  name: 'DebugInfo',
  components: {
  },
  data() {
    return {
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search'),
      searchText: null,
      logLevel: 'error',
      logLevelOptions: CollaConstant.logLevelOptions,
      searchDate: null,
      searching: false,
      logResultList: []
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
    }
  },
  methods: {
    async searchDateInput(value) {
      let _that = this
      let store = _that.$store
      await _that.search()
      _that.$refs.qDateProxy.hide()
    },
    async cleanSearchDate() {
      let _that = this
      let store = _that.$store
      _that.searchDate = null
      await _that.search()
    },
    searchInput(value) {
      let _that = this
      _that.searching = false
    },
    async searchKeyup(e) {
      let _that = this
      _that.searchText = (_that.searchText || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '')
      if (e.keyCode === 13 && _that.searchText) {
        await _that.search()
        let searchTextInputs = document.getElementsByClassName('q-field__native')
        if (searchTextInputs || searchTextInputs[1] || searchTextInputs[1].style.display !== 'none') {
          searchTextInputs[1].blur()
        }
      }
    },
    async search() {
      let _that = this
      let store = _that.$store
      _that.searching = true
      let searchTimestamp = 0
      if (_that.searchDate) {
        searchTimestamp = new Date(new Date(_that.searchDate).toLocaleDateString()).getTime()
      }
      _that.logResultList = await logService.search(_that.searchText, _that.logLevel, searchTimestamp)
      console.log(JSON.stringify(_that.logResultList))
    },
    formate(createTimestamp) {
      return date.formatDate(new Date(createTimestamp), 'YYYY-MM-DD HH:mm')
    }
  },
  watch: {
    async logLevel(val) {
      await this.search()
    }
  }
}
