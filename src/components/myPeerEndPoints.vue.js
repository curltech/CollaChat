import { date } from 'quasar'
import { PeerEndpoint, peerEndpointService, myself } from 'libcolla'
import { CollaUtil } from 'libcolla'

export default {
  name: "MyPeerEndPoints",
  data() {
    return {
      subKind: 'default',
      date: date,
      columns: [
        {
          name: 'priority',
          label: this.$i18n.t('No'),
          field: 'priority', //row => row.priority,
          //required: true,
          align: 'center',
          sortable: true,
          //format: (val, row) => `${val}%`,
          style: 'padding:0px 0px',
          //classes: 'my-special-class',
          //headerStyle: 'width: 25px',
          //headerClasses: 'my-special-class'
        },
        //{ name: 'peerId', label: this.$i18n.t('Node PeerId'), field: 'peerId', align: 'center', sortable: true },
        { name: 'address', label: this.$i18n.t('Node Address'), field: 'address', align: 'center', sortable: true, style: 'padding:0px 0px; white-space: normal; height: 100%; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 8; word-break: break-all' },
        //{ name: 'publicKey', label: this.$i18n.t('PublicKey'), field: 'publicKey', align: 'center', sortable: true },
        //{ name: 'creditScore', label: this.$i18n.t('Credit'), field: 'creditScore', align: 'center', sortable: true, style: 'padding:0px 0px' },
        { name: 'lastConnectTime', label: this.$i18n.t('LastConnectTime'), field: 'lastConnectTime', align: 'center', sortable: true, style: 'padding:0px 0px' }
      ],
      data: [],
      pagination: {
        sortBy: 'priority',
        descending: false,
        page: 1,
        rowsPerPage: 0,
        rowsNumber: null
      },
      filter: null,
      loading: false,
      mpepData: {
        priority: null,
        address: null
      },
      options: [],
      currentItemOriginalPriority: null,
      placeholder: '\ue672' + ' ' + this.$i18n.t('Search')
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
    onRequest: async function (props) {
      this.loading = true
      let myselfPeerClient = myself.myselfPeerClient
      let clientPeerId = myselfPeerClient.peerId
      let condition = {}
      condition['ownerPeerId'] = clientPeerId
      condition['priority'] = { $gt: null }
      let ret = await peerEndpointService.find(condition, [{ priority: 'asc' }], null, null, null)
      this.myPEPs = ret
      if (!this.myPEPs) {
        console.log("error: 0 myPEPs")
      } else {
        this.count = this.myPEPs.length

        let { page, rowsPerPage, rowsNumber, sortBy, descending } = props.pagination
        let filter = props.filter

        rowsNumber = await this.getRowsNumberCount(filter)
        // get all rows if "All" (0) is selected
        let fetchCount = rowsPerPage === 0 ? rowsNumber : rowsPerPage
        let startRow = (page - 1) * rowsPerPage
        let returnedData = await this.fetchFromDB(startRow, fetchCount, filter, sortBy, descending)
        this.data.splice(0, this.data.length, ...returnedData)

        this.pagination.rowsNumber = rowsNumber
        this.pagination.page = page
        this.pagination.rowsPerPage = rowsPerPage
        this.pagination.sortBy = sortBy
        this.pagination.descending = descending
      }
      this.loading = false
    },
    fetchFromDB: async function (startRow, count, filter, sortBy, descending) {
      let data = []
      let myPEPs = this.myPEPs
      if (myPEPs.length > 0) {
        if (!filter) {
          data = myPEPs.slice(startRow, startRow + count)
          for (let index = 0; index < data.length; ++index) {
            data[index].lastConnectTime = date.formatDate(data[index].lastConnectTime, 'YYYY-MM-DD HH:mm:ss')
          }
        } else {
          let found = 0
          for (let index = startRow, items = 0; index < myPEPs.length && items < count; ++index) {
            let row = myPEPs[index]
            if (!row['address'].includes(filter)) {
              continue
            }
            ++found
            if (found >= startRow) {
              row.lastConnectTime = date.formatDate(row.lastConnectTime, 'YYYY-MM-DD HH:mm:ss')
              data.push(row)
              ++items
            }
          }
        }
      }
      if (sortBy) {
        data.sort((a, b) => {
          let x = descending ? b : a
          let y = descending ? a : b
          if (['priority', 'creditScore'].includes(sortBy)) {
            return x[sortBy] - y[sortBy]
          } else if (['lastConnectTime'].includes(sortBy)) {
            return (x[sortBy] ? Date.parse(x[sortBy]) : 0) - (y[sortBy] ? Date.parse(y[sortBy]) : 0)
          } else if (['peerId', 'address', 'publicKey'].includes(sortBy)) {
            return x[sortBy] > y[sortBy] ? 1 : x[sortBy] < y[sortBy] ? -1 : 0
          }
        })
      }
      return data
    },
    getRowsNumberCount: async function (filter) {
      let count = 0
      let myPEPs = this.myPEPs
      if (!filter) {
        return myPEPs.length
      }
      myPEPs.forEach((myPEP) => {
        if (myPEP['address'].includes(filter)) {
          ++count
        }
      })
      return count
    },
    customSort(rows, sortBy, descending) {
      let data = [...rows]
      if (sortBy) {
        data.sort((a, b) => {
          let x = descending ? b : a
          let y = descending ? a : b
          if (['priority', 'creditScore'].includes(sortBy)) {
            return x[sortBy] - y[sortBy]
          } else if (['lastConnectTime'].includes(sortBy)) {
            return (x[sortBy] ? Date.parse(x[sortBy]) : 0) - (y[sortBy] ? Date.parse(y[sortBy]) : 0)
          } else if (['peerId', 'address', 'publicKey'].includes(sortBy)) {
            return x[sortBy] > y[sortBy] ? 1 : x[sortBy] < y[sortBy] ? -1 : 0
          }
        })
      }
      return data
    },
    showAddItem: function () {
      let count = this.count
      if (count !== this.options.length) {
        this.options = []
        for (let i = 1; i < count + 1; i++) {
          this.options.push(i)
        }
      }
      this.options.push(count + 1)
      this.mpepData = {
        priority: count + 1,
        address: null
      }
      this.subKind = 'addItem'
    },
    add: async function () {
      this.loading = true
      let myselfPeerClient = myself.myselfPeerClient
      let clientPeerId = myselfPeerClient.peerId
      let condition = {}
      condition['ownerPeerId'] = clientPeerId
      condition['address'] = this.mpepData.address
      let ret = await peerEndpointService.find(condition, null, null, null, null)
      if (ret && ret.length > 0) {
        this.$q.notify({
          message: this.$i18n.t("Duplicated address is not allowed!"),
          timeout: 3000,
          type: "info",
          color: "info"
        })
      } else {
        let priority = this.mpepData.priority
        condition = {}
        condition['ownerPeerId'] = clientPeerId
        condition['priority'] = { $gte: priority }
        ret = await peerEndpointService.find(condition, null, null, null, null)
        if (ret) {
          for (let myPeerEndPoint of ret) {
            myPeerEndPoint.priority = myPeerEndPoint.priority + 1
          }
          await peerEndpointService.update(ret)
        }
        let mpep = new PeerEndpoint()
        mpep.priority = priority
        mpep.address = this.mpepData.address
        mpep.ownerPeerId = clientPeerId
        await peerEndpointService.insert(mpep)
        await this.refresh()
        this.subKind = 'default'
      }
      this.loading = false
    },
    showModifyItem(evt, row) {
      if (row) {
        let count = this.count
        if (count !== this.options.length) {
          this.options = []
          for (let i = 1; i < count + 1; i++) {
            this.options.push(i)
          }
        }
        this.currentItemOriginalPriority = row.priority
        this.mpepData = CollaUtil.clone(row)
        this.subKind = 'modifyItem'
      }
    },
    modify: async function () {
      this.loading = true
      let myselfPeerClient = myself.myselfPeerClient
      let clientPeerId = myselfPeerClient.peerId
      let originalPriority = this.currentItemOriginalPriority
      let condition = {}
      condition['ownerPeerId'] = clientPeerId
      condition['address'] = this.mpepData.address
      condition['priority'] = { $ne: originalPriority }
      let ret = await peerEndpointService.find(condition, null, null, null, null)
      if (ret && ret.length > 0) {
        this.$q.notify({
          message: this.$i18n.t("Duplicated address is not allowed!"),
          timeout: 3000,
          type: "info",
          color: "info"
        })
      } else {
        let priority = this.mpepData.priority
        if (priority > originalPriority) {
          condition = {}
          condition['ownerPeerId'] = clientPeerId
          condition['priority'] = { $gt: originalPriority, $lte: priority }
          ret = await peerEndpointService.find(condition, null, null, null, null)
          if (ret) {
            for (let myPeerEndPoint of ret) {
              myPeerEndPoint.priority = myPeerEndPoint.priority - 1
            }
            await peerEndpointService.update(ret)
          }
        } else if (priority < originalPriority) {
          condition = {}
          condition['ownerPeerId'] = clientPeerId
          condition['priority'] = { $gte: priority, $lt: originalPriority }
          ret = await peerEndpointService.find(condition, null, null, null, null)
          if (ret) {
            for (let myPeerEndPoint of ret) {
              myPeerEndPoint.priority = myPeerEndPoint.priority + 1
            }
            await peerEndpointService.update(ret)
          }
        }
        let mpep = await peerEndpointService.get(this.mpepData._id)
        if (mpep) {
          mpep.priority = priority
          mpep.address = this.mpepData.address
          await peerEndpointService.update(mpep)
        }
        await this.refresh()
        this.subKind = 'default'
      }
      this.loading = false
    },
    confirmRemove: function () {
      let _that = this
      if (_that.count === 1) {
        _that.$q.notify({
          message: _that.$i18n.t("There should be at least one Node!"),
          timeout: 3000,
          type: "info",
          color: "info"
        })
      } else {
        _that.$q.bottomSheet({
          message: _that.$i18n.t('Remove selected Node?'),
          actions: [
            {},
            {
              label: _that.$i18n.t('Confirm'),
              classes: 'text-red',
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
            await _that.remove()
          }
        }).onCancel(() => {
          // console.log('Dismissed')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    },
    remove: async function () {
      this.loading = true
      let myselfPeerClient = myself.myselfPeerClient
      let clientPeerId = myselfPeerClient.peerId
      let priority = this.mpepData.priority
      let mpep = await peerEndpointService.get(this.mpepData._id)
      await peerEndpointService.delete(mpep)
      let condition = {}
      condition['ownerPeerId'] = clientPeerId
      condition['priority'] = { $gt: priority }
      let ret = await peerEndpointService.find(condition, null, null, null, null)
      if (ret) {
        for (let myPeerEndPoint of ret) {
          myPeerEndPoint.priority = myPeerEndPoint.priority - 1
        }
        await peerEndpointService.update(ret)
      }
      await this.refresh()
      this.subKind = 'default'
      this.loading = false
    },
    refresh: async function () {
      await this.onRequest({
        pagination: this.pagination,
        filter: this.filter
      })
    }
  },
  async mounted() {
    let _that = this
    let store = _that.$store
    // get initial data from DB (1st page)
    await _that.refresh()
  },
  watch: {
  }
}
