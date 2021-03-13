import { TypeUtil } from 'libcolla'

/**
 * 可币交易的定义
 */
import { pounchDb } from 'libcolla'

export let TransactionDataType = {
  'PEERTRANSACTION': null
}

export let TransactionType = {
  'All': "All",
  'DataBlock': 'DataBlock'
}

export let TransactionStatus = {
  'Effective': 'Effective'
}

export let TargetPeerType = {
}

class PeerTransaction {
  constructor() {
    this.sequenceId = null
    this.ownerPeerId = null
    this.createDate = null
    this.amount = null
    this.blockId = null
    this.currency = null
    this.srcPeerBeginBalance = null
    this.srcPeerEndBalance = null
    this.srcPeerId = null
    this.srcPeerType = null
    this.status = null
    this.statusDate = null
    this.statusReason = null
    this.targetPeerBeginBalance = null
    this.targetPeerEndBalance = null
    this.targetPeerId = null
    this.targetPeerType = null
    this.transactionTime = null
    this.transactionType = null
  }
}

class TransactionComponent {
  constructor() {
    pounchDb.create('peerTransaction', ['ownerPeerId', 'srcPeerId', 'targetPeerId', 'transactionTime', 'transactionType'])
  }
  async get(id) {
    return await pounchDb.get('peerTransaction', id)
  }
  async loadPeerTransaction(originCondition, sort, from, limit) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $lt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }
    if (originCondition.ownerPeerId) {
      let q = {}
      q['ownerPeerId'] = originCondition.ownerPeerId
      qs.push(q)
    }
    if (originCondition.srcPeerId) {
      let q = {}
      q['srcPeerId'] = originCondition.srcPeerId
      qs.push(q)
    }
    if (originCondition.targetPeerId) {
      let q = {}
      q['targetPeerId'] = originCondition.targetPeerId
      qs.push(q)
    }
    /*if (originCondition.targetPeerType) {
      let q = {}
      q['targetPeerType'] = originCondition.targetPeerType
      qs.push(q)
    }*/
    if (originCondition.transactionTime) {
      let q = {}
      q['transactionTime'] = originCondition.transactionTime
      qs.push(q)
    }
    if (originCondition.transactionType) {
      let q = {}
      q['transactionType'] = originCondition.transactionType
      qs.push(q)
    }
    if (originCondition.$and) {
      let q = {}
      q['$and'] = originCondition.$and
      qs.push(q)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }
    let data
    if (limit) {
      let page = await pounchDb.findPage('peerTransaction', condition, sort, null, null, limit)
      data = page.result
    } else {
      data = await pounchDb.find('peerTransaction', condition, sort)
    }
    return data
  }
  async load(condition, sort, fields, from, limit) {
    let data
    if (limit) {
      let page = await pounchDb.findPage('peerTransaction', condition, sort, fields, from, limit)
      data = page.result
    } else {
      data = await pounchDb.find('peerTransaction', condition, sort, fields)
    }

    return data
  }
  async save(entities, ignore, parent) {
    if (!entities) {
      return
    }
    if (!TypeUtil.isArray(entities)) {
      return await pounchDb.run('peerTransaction', entities, ignore, parent)
    } else {
      return await pounchDb.execute('peerTransaction', entities, ignore, parent)
    }
  }
  async insert(entities, ignore, parent) {
    if (!TypeUtil.isArray(entities)) {
      entities.state = EntityState.New
    } else {
      for (let item of entities) {
        item.state = EntityState.New
      }
    }
    return await this.save(entities, ignore, parent)
  }
  async update(entities, ignore, parent) {
    if (!TypeUtil.isArray(entities)) {
      entities.state = EntityState.Modified
    } else {
      for (let item of entities) {
        item.state = EntityState.Modified
      }
    }
    return await this.save(entities, ignore, parent)
  }
  async remove(entities, ignore, parent) {
    if (!TypeUtil.isArray(entities)) {
      entities.state = EntityState.Deleted
    } else {
      for (let item of entities) {
        item.state = EntityState.Deleted
      }
    }
    return await this.save(entities, ignore, parent)
  }
}
export let transactionComponent = new TransactionComponent()