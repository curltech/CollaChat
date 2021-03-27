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
    async clean() {
      let _that = this
      _that.$q.bottomSheet({
        message: _that.$i18n.t('Confirm the deletion?'),
        actions: [
          {},
          {
            label: _that.$i18n.t('Confirm'),
            classes: 'text-red',
            icon: 'check_circle',
            id: 'confirm'
          },
          {},
          {
            label: _that.$i18n.t('Cancel'),
            icon: 'cancel',
            id: 'cancel'
          }
        ]
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        if (action.id === 'confirm') {
          await logService.clean()
          _that.logResultList = []
          _that.searching = false
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
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
