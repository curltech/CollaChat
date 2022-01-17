import { myself, peerProfileService, peerClientService, queryPeerTransAction } from 'libcolla'
import { CollaUtil } from 'libcolla'
import { TransactionType, transactionComponent } from '@/libs/biz/colla-transaction'
import { date } from 'quasar'

export default {
  data() {
    return {
      TransactionType: TransactionType,
      subKind: 'default',
      loading: false,
      transactionType: TransactionType.All,
      year: this.$i18n.t('Recent-Year'),
      month: (new Date()).getMonth() + 1,
      transactionTypeOptions: [
        {
          label: this.$i18n.t('ALL'),
          value: TransactionType.All
        },
        {
          label: this.$i18n.t('Cloud Store'),
          value: TransactionType.DataBlock
        }
      ],
      yearOptions: [],
      monthOptions: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
      ],
      peerTrans: [],
      paySum: 0,
      receiveSum: 0,
      noMoreRecordsFlag: false,
      balance: 0,
      password: null,
      exportDialog: false,
      transactionTimeStart: null,
      transactionTimeEnd: null
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
    async syncTransactions() {
      let _that = this
      let store = _that.$store
      this.loading = true
      try {
        let myselfPeerClient = myself.myselfPeerClient
        let clientPeerId = myselfPeerClient.peerId
        let lastSyncTime = myselfPeerClient.lastSyncTime
        // 查询balance
        let myselfPC = await peerClientService.findPeerClient(null, peerId, null, null)
        console.log(myselfPC)
        if (myselfPC && myselfPC.balance) {
          _that.balance = myselfPC.balance
        }
        // 同步（得到新的lastSyncTime）
        conditionBean = new Map()
        conditionBean.set('receiverPeerId', clientPeerId)
        conditionBean.set('transactionTimeStart', lastSyncTime)
        console.log(conditionBean)
        let peerTrans = await queryPeerTransAction.queryPeerTrans(null, conditionBean)
        console.log(peerTrans)
        if (peerTrans && peerTrans.length > 0) {
          let i = 0
          peerTrans.forEach((peerTran) => {
            if (peerTran.transactionTime) {
              let transactionTime = peerTran.transactionTime
              if (!lastSyncTime || (Date.parse(transactionTime) - Date.parse(lastSyncTime) > 0)) {
                lastSyncTime = transactionTime
              }
              peerTran._id = new Date(transactionTime).getTime() + '-' + i
              peerTran.ownerPeerId = clientPeerId
              i++
            }
          })
          await transactionComponent.insert(peerTrans)
        }
        // 更新lastSyncTime
        if (lastSyncTime != myselfPeerClient.lastSyncTime) {
          let currentDate = new Date()
          myselfPeerClient.lastSyncTime = lastSyncTime
          store.state.myselfPeerClient = myselfPeerClient

          let peerProfile = myself.peerProfile
          peerProfile.lastSyncTime = lastSyncTime
          peerProfile.updateDate = currentDate
          peerProfile = await peerProfileService.update(peerProfile)
          myself.peerProfile = peerProfile
        }
        // 刷新查询
        _that.peerTrans = []
        _that.paySum = 0
        _that.receiveSum = 0
        _that.noMoreRecordsFlag = false
        await _that.loadTransactions()
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    async loadTransactions(done) {
      let _that = this
      let store = _that.$store
      let transactionType = _that.transactionType
      if (_that.year === _that.$i18n.t('Recent-Year')) {
        let now = new Date()
        let year = now.getFullYear()
        let month = now.getMonth()
        if (month === 11) {
          _that.transactionTimeStart = new Date(year + '/1/1')
          _that.transactionTimeEnd = new Date((year + 1) + '/1/1')
        } else {
          _that.transactionTimeStart = new Date((year - 1) + '/' + (month + 2) + '/1')
          _that.transactionTimeEnd = new Date(year + '/' + (month + 2) + '/1')
        }
      } else {
        let year = _that.year
        let month = _that.month
        _that.transactionTimeStart = new Date(year + '/' + month + '/1')
        if (month === 12) {
          _that.transactionTimeEnd = new Date((year + 1) + '/1/1')
        } else {
          _that.transactionTimeEnd = new Date(year + '/' + (month + 1) + '/1')
        }
      }
      let clientPeerId = myself.myselfPeerClient.peerId
      let condition = {
        ownerPeerId: clientPeerId,
        $and: [{ transactionTime: { $gte: _that.transactionTimeStart } }, { transactionTime: { $lt: _that.transactionTimeEnd } }]
      }
      if (transactionType !== TransactionType.All) {
        condition['transactionType'] = transactionType
      }
      let peerTrans = await transactionComponent.loadPeerTransaction(
        condition,
        [{ _id: 'desc' }],
        CollaUtil.getFrom(_that.peerTrans),
        10
      )
      if (peerTrans && peerTrans.length > 0) {
        peerTrans.forEach((peerTran) => {
          if (peerTran.transactionTime) {
            peerTran.transactionTime = date.formatDate(peerTran.transactionTime, 'YYYY-MM-DD HH:mm:ss')
          }
          if (peerTran.srcPeerId === clientPeerId) {
            peerTran.counterpartPeerId = peerTran.targetPeerId
            _that.paySum = _that.paySum + peerTran.amount
            peerTran.amount = peerTran.amount * -1
          } else if (peerTran.targetPeerId === clientPeerId) {
            peerTran.counterpartPeerId = peerTran.srcPeerId
            _that.receiveSum = _that.receiveSum + peerTran.amount
          }
        })
        _that.peerTrans = _that.peerTrans.concat(peerTrans)
        if (peerTrans.length < 10) {
          _that.noMoreRecordsFlag = true
        }
      } else {
        _that.noMoreRecordsFlag = true
      }
      if (typeof done == 'function') {
        done()
      }
    },
    transactionTypeIcon(peerTran) {
      let icon = 'storage'
      // TODO: 按需扩展
      /*if (peerTran.transactionType === TransactionType.DataBlock) {
        icon = 'storage'
      }*/
      return icon
    },
    showExportDialog() {
      this.password = null
      this.exportDialog = true
    },
    exportBill() {
      let _that = this
      let store = _that.$store
      if (_that.password !== myself.password) {
        _that.$q.notify({
          message: _that.$i18n.t("Wrong password"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        return
      }
      _that.exportDialog = false
      let json = JSON.stringify(_that.peerTrans)
      console.log(json)
      let element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json))
      let filename = _that.$i18n.t('MyCollaCoinBill') + '(' + date.formatDate(_that.transactionTimeStart, 'YYYY-MM-DD') + '-' + date.formatDate(_that.transactionTimeEnd, 'YYYY-MM-DD') + ').db'
      element.setAttribute('download', filename)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  },
  async created() {
    let _that = this
    let store = _that.$store
    _that.yearOptions = []
    _that.yearOptions.push(_that.$i18n.t('Recent-Year'))
    for (let i = 2020; i <= (new Date()).getFullYear(); i++) {
      _that.yearOptions.push(i)
    }
    await _that.syncTransactions()
  },
  watch: {
    async transactionType(val) {
      let _that = this
      // 刷新查询
      _that.peerTrans = []
      _that.paySum = 0
      _that.receiveSum = 0
      _that.noMoreRecordsFlag = false
      await _that.loadTransactions()
    },
    async year(val) {
      let _that = this
      // 刷新查询
      _that.peerTrans = []
      _that.paySum = 0
      _that.receiveSum = 0
      _that.noMoreRecordsFlag = false
      await _that.loadTransactions()
    },
    async month(val) {
      let _that = this
      // 刷新查询
      _that.peerTrans = []
      _that.paySum = 0
      _that.receiveSum = 0
      _that.noMoreRecordsFlag = false
      await _that.loadTransactions()
    }
  }
}
