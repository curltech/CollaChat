import { statusBarComponent } from '@/libs/base/colla-cordova'

import AccountSecurity from '@/components/accountSecurity'
import Privacy from '@/components/privacy'
import General from '@/components/general'
import AdvanceSetting from '@/components/advanceSetting'
import Faq from '@/components/faq'
import About from '@/components/about'

export default {
  name: 'Setting',
  components: {
    accountSecurity: AccountSecurity,
    privacy: Privacy,
    general: General,
    advanceSetting: AdvanceSetting,
    faq: Faq,
    about: About
  },
  data() {
    return {
      subKind: 'default'
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
  methods: {
    confirmLogout: function () {
      let _that = this
      _that.$q.bottomSheet({
        message: _that.$i18n.t('Logout now?'),
        actions: [
          {},
          {
            label: _that.$i18n.t('Confirm'),
            icon: 'check_circle',
            color: 'primary',
            id: 'confirm'
          },
          {},
          {
            label: _that.$i18n.t('Cancel'),
            icon: 'cancel',
            color: 'primary',
            id: 'cancel'
          }
        ]
      }).onOk(async action => {
        // console.log('Action chosen:', action.id)
        if (action.id === 'confirm') {
          _that.logout()
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    logout: async function () {
      let _that = this
      let store = _that.$store
      await store.logout()
    }
  },
  beforeDestroy() {
  },
  mounted() {
    let _that = this
    let store = this.$store
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeSettingSubKind = function (subKind) {
      _that.subKind = subKind
    }
  },
  watch: {
    /*subKind(val) {
      let _that = this
      let store = _that.$store
      if (store.state.ifMobileStyle) {
        if (val === 'about') {
          statusBarComponent.style(true, '#ffffff')
        } else {
          statusBarComponent.style(true, '#eee')
        }
      }
    }*/
  }
}
