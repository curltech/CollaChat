import { PeerEndpoint, peerEndpointService, myself, peerProfileService } from 'libcolla'
import MyPeerEndPoints from '@/components/myPeerEndPoints'
import DeveloperOptions from '@/components/developerOptions'

export default {
  name: "AdvanceSetting",
  components: {
    myPeerEndPoints: MyPeerEndPoints,
    developerOptions: DeveloperOptions
  },
  data() {
    return {
      subKind: 'default',
      developerOptionSelected: true,
      udpSwitchSelected: true,
      myPEPSelected: true,
      udpSwitch: myself.myselfPeerClient.udpSwitch,
      developerOption: myself.myselfPeerClient.developerOption,
      password: null,
      restoreDialog: false,
      developerOptionDialog: false
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
    showRestoreDialog: function () {
      this.restoreDialog = true
    },
    restore: async function () {
      if (this.developerOptionSelected) {
        this.developerOption = false
        await this.changeDeveloperOption(true)
      }
      if (this.udpSwitchSelected) {
        this.udpSwitch = false
        await this.changeUdpSwitch(this.udpSwitch)
      }
      if (this.myPEPSelected) {
        await this.restoreMyPEP()
      }
      this.restoreDialog = false
    },
    applyDeveloperOption() {
      if (this.developerOption === true) {
        this.developerOptionDialog = true
      } else {
        this.changeDeveloperOption(true)
      }
    },
    changeDeveloperOption: async function (op) {
      if (op === false) {
        this.developerOption = (this.developerOption === true ? false : true)
        return
      }
      if (this.developerOption === false || (this.developerOption === true && this.password === 'iamdeveloper')) {
        let currentDate = new Date()
        let myselfPeerClient = myself.myselfPeerClient
        myselfPeerClient.developerOption = this.developerOption
        this.$store.state.myselfPeerClient = myselfPeerClient

        let peerProfile = myself.peerProfile
        peerProfile.developerOption = this.developerOption
        peerProfile.updateDate = currentDate
        peerProfile = await peerProfileService.update(peerProfile)
        myself.peerProfile = peerProfile
      } else {
        if (this.developerOption === true && this.password !== 'iamdeveloper' && this.password !== 'iamprogrammer') {
          this.$q.notify({
            message: this.$i18n.t("Wrong password"),
            timeout: 3000,
            type: "warning",
            color: "warning",
          })
        }
        this.developerOption = (this.developerOption === true ? false : true)
        return
      }
      this.password = null
    },
    changeUdpSwitch: async function (value) {
      let currentDate = new Date()
      let myselfPeerClient = myself.myselfPeerClient
      myselfPeerClient.udpSwitch = value
      this.$store.state.myselfPeerClient = myselfPeerClient

      let peerProfile = myself.peerProfile
      peerProfile.udpSwitch = value
      peerProfile.updateDate = currentDate
      peerProfile = await peerProfileService.update(peerProfile)
      myself.peerProfile = peerProfile
    },
    restoreMyPEP: async function () {
      let myselfPeerClient = myself.myselfPeerClient
      let clientPeerId = myselfPeerClient.peerId
      let condition = {}
      condition['ownerPeerId'] = clientPeerId
      let ret = await peerEndpointService.find(condition, null, null, null, null)
      if (ret) {
        await peerEndpointService.delete(ret)
      }
      let newPeer = new PeerEndpoint()
      newPeer.ownerPeerId = clientPeerId
      newPeer.address = '120.79.254.124:8082'
      newPeer.priority = 1
      await peerEndpointService.insert(newPeer)
      condition = {}
      condition['ownerPeerId'] = clientPeerId
      condition['priority'] = {
        $gt: null
      }
      ret = await peerEndpointService.find(condition, [{priority: 'asc'}], null, null, null)
    }
  },
  async mounted() {
    let _that = this
    let store = _that.$store
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeAdvanceSettingSubKind = function (subKind) {
      _that.subKind = subKind
    }
  },
  watch: {}
}
