/**
 * 联系人的定义
 */
import { pounchDb, EntityState } from 'libcolla'
import { myself, peerClientService } from 'libcolla'
import { TypeUtil, MobileNumberUtil ,logService } from 'libcolla'

import { phoneContactComponent } from '@/libs/base/colla-cordova'
import pinyinUtil from '@/libs/base/colla-pinyin'

export let ContactDataType = {
  'LINKMAN': 'LINKMAN',
  'PEER_CONTACT': 'PEER_CONTACT',
  'LINKMAN_REQUEST': 'LINKMAN_REQUEST',
  'GROUP': 'GROUP',
  'GROUP_MEMBER': 'GROUP_MEMBER',
  'LINKMAN_TAG': 'LINKMAN_TAG',
  'LINKMAN_TAGLINKMAN': 'LINKMAN_TAGLINKMAN'
}

let tables = {
  'LINKMAN': 'linkman',
  'PEER_CONTACT': 'peerContact',
  'LINKMAN_REQUEST': 'linkmanRequest',
  'GROUP': 'group',
  'GROUP_MEMBER': 'groupMember',
  'LINKMAN_TAG': 'linkmanTag',
  'LINKMAN_TAGLINKMAN': 'linkmanTagLinkman'
}
let indexFields = {
  'LINKMAN': ['givenName', 'name', 'mobile'],
  'PEER_CONTACT': [],
  'LINKMAN_REQUEST': [],
  'GROUP': ['givenName', 'name', 'description'/*, 'tag'*/],
  'GROUP_MEMBER': ['memberAlias'],
  'LINKMAN_TAG': ['name'],
  'LINKMAN_TAGLINKMAN': []
}

export let RequestType = {
  'ADD_LINKMAN': 'ADD_LINKMAN',
  'DROP_LINKMAN': 'DROP_LINKMAN',
  'BLACK_LINKMAN': 'BLACK_LINKMAN',
  'UNBLACK_LINKMAN': 'UNBLACK_LINKMAN',
  'ADD_GROUPCHAT': 'ADD_GROUPCHAT',
  'DISBAND_GROUPCHAT': 'DISBAND_GROUPCHAT',
  'MODIFY_GROUPCHAT': 'MODIFY_GROUPCHAT',
  'MODIFY_GROUPCHAT_OWNER': 'MODIFY_GROUPCHAT_OWNER',
  'ADD_GROUPCHAT_MEMBER': 'ADD_GROUPCHAT_MEMBER',
  'REMOVE_GROUPCHAT_MEMBER': 'REMOVE_GROUPCHAT_MEMBER'
}
export let RequestStatus = {
  'SENT': 'SENT',
  'RECEIVED': 'RECEIVED',
  'ACCEPTED': 'ACCEPTED',
  'EXPIRED': 'EXPIRED',
  'IGNORED': 'IGNORED'
}
export let LinkmanStatus = {
  'BLACKED': 'BLACKED', // 已加入黑名单
  'EFFECTIVE': 'EFFECTIVE', // 已成为好友
  'REQUESTED': 'REQUESTED' // 已发送好友请求
}
export let GroupStatus = {
  'EFFECTIVE': 'EFFECTIVE', // 有效
  'DISBANDED': 'DISBANDED' // 已解散
}
export let MemberType = {
  'MEMBER': 'MEMBER',
  'OWNER': 'OWNER'
}
export let ActiveStatus = {
  'DOWN': 'DOWN',
  'UP': 'UP'
}

// 联系人
export class Linkman {
  constructor() {
    this._id = null
    this.ownerPeerId = null // 区分本地不同peerClient属主
    this.peerId = null // peerId
    this.name = null // 用户名
    this.pyName = null // 用户名拼音
    this.mobile = null // 手机号
    this.avatar = null // 头像
    this.publicKey = null // 公钥
    this.givenName = null // 备注名
    this.pyGivenName = null // 备注名拼音
    this.sourceType = null // 来源，包括：Search&Add（搜索添加）, AcceptRequest（接受请求）…
    this.createDate = null // 创建时间（添加时间）
    this.statusDate = null // 状态变更时间
    this.status = null // 状态，见LinkmanStatus
    this.lastConnectTime = null // 最近连接时间
    this.locked = null // 是否锁定，包括：true（锁定）, false（未锁定）
    this.notAlert = null // 消息免打扰，包括：true（提醒）, false（免打扰）
    this.top = null // 是否置顶，包括：true（置顶）, false（不置顶）
    this.blackedMe = null // true-对方已将你加入黑名单
    this.droppedMe = null // true-对方已将你从好友中删除

    // 非持久化属性
    //activeStatus: 活动状态，包括：Up（连接）, Down（未连接）
    //downloadSwitch: 自动下载文件开关
    //udpSwitch: 启用UDP开关
    //groupChats: 关联群聊列表
    //tag: 标签
    //pyTag: 标签拼音
  }
}

// 联系人标签
export class LinkmanTag {
  constructor() {
    this._id = null
    this.ownerPeerId = null // 区分本地不同peerClient属主
    this.name = null // 标签名称
    this.createDate = null // 创建时间
  }
}

// 联系人标签关系
export class LinkmanTagLinkman {
  constructor() {
    this._id = null
    this.ownerPeerId = null // 区分本地不同peerClient属主
    this.tagId = null // 标签主键_id
    this.linkmanPeerId = null // 联系人peerId
    this.createDate = null // 创建时间
  }
}

// 联系人请求
export class LinkmanRequest {
  constructor() {
    this._id = null
    this.ownerPeerId = null // 区分本地不同peerClient属主
    this.senderPeerId = null // 发送者peerId
    this.name = null // 用户名
    this.mobile = null // 手机号
    this.avatar = null // 头像
    this.publicKey = null // 公钥
    this.receiverPeerId = null // 接收者peerId
    this.requestType = null // 请求类型
    this.createDate = null // 创建时间
    this.receiveTime = null // 接收时间
    this.statusDate = null // 状态变更时间（限于终止状态：同意/过期/忽略）
    this.status = null // 状态，包括：Sent/Received/Accepted/Expired/Ignored（已发送/已接收/已同意/已过期/已忽略）
    this.message = null // 邀请信息
    this.groupId = null // 群Id
    this.groupCreateDate = null // 群创建时间
    this.groupName = null // 群名称
    this.groupDescription = null // 群公告
    this.myAlias = null // 发送人在本群的昵称
    this.data = null // 消息数据（群成员列表）
    this.blackedMe = null
  }
}

// 组（群聊/频道）
export class Group {
  constructor() {
    this._id = null
    this.ownerPeerId = null // 区分本地不同peerClient属主
    this.groupId = null // 组的唯一id标识
    this.groupCategory = null // 组类别，包括：Chat（群聊）, Channel（频道）
    this.groupType = null // 组类型，包括：Private（私有，群聊群主才能添加成员，频道外部不可见）, Public（公有，群聊非群主也能添加成员，频道外部可见）
    this.name = null // 组名称
    this.description = null // 组描述
    this.givenName = null // 备注名
    this.pyGivenName = null // 备注名拼音
    this.tag = null // 搜索标签
    this.pyName = null // 组名称拼音
    this.pyDescription = null // 组描述拼音
    this.pyTag = null // 标签拼音
    this.createDate = null // 创建时间（添加时间）
    this.statusDate = null // 状态变更时间
    this.status = null // 状态
    this.locked = null // 是否锁定（群聊不使用，频道使用），包括：true（锁定）, false（未锁定）
    this.alert = null // 是否提醒，包括：true（提醒）, false（免打扰）
    this.top = null // 是否置顶，包括：true（置顶）, false（不置顶）
    this.myAlias = null // 我在本群的昵称

    //this.avatar = null // 头像（保留，适用于频道）
    //this.shareLink = null // 分享链接（保留，适用于频道）

    // 非持久化属性（群聊groupChat）
    //activeStatus: 活动状态（除自己以外至少一个成员activeStatus为Up，则为Up，否则为Down），包括：Up（有连接）, Down（无连接）
    //groupOwnerPeerId: 群主peerId
  }
}

// 组成员
export class GroupMember {
  constructor() {
    this._id = null
    this.ownerPeerId = null // 区分本地不同peerClient属主
    this.groupId = null // 外键（对应group-groupId）
    this.memberPeerId = null // 外键（对应linkman-peerId）
    this.memberAlias = null // 成员别名
    this.memberType = null // 成员类型，包括：Owner（创建者/群主，默认管理员）, Member（一般成员）,…可能的扩充：Admin（管理员）, Subscriber（订阅者）
    this.createDate = null // 创建时间（添加时间）
    this.statusDate = null // 状态变更时间
    this.status = null // 状态
  }
}

class ContactComponent {
  constructor() {
    pounchDb.create('linkman', ['ownerPeerId', 'peerId', 'mobile', 'collectionType'], indexFields[ContactDataType.LINKMAN])
    pounchDb.create('linkmanRequest', ['ownerPeerId', 'createDate', 'receiverPeerId', 'senderPeerId', 'status'], indexFields[ContactDataType.LINKMAN_REQUEST])
    pounchDb.create('group', ['ownerPeerId', 'createDate', 'groupId', 'groupCategory', 'groupType'], indexFields[ContactDataType.GROUP])
    pounchDb.create('groupMember', ['ownerPeerId', 'createDate', 'groupId', 'memberPeerId', 'memberType'], indexFields[ContactDataType.GROUP_MEMBER])
    pounchDb.create('linkmanTag', ['ownerPeerId', 'createDate', 'name'], indexFields[ContactDataType.LINKMAN_TAG])
    pounchDb.create('linkmanTagLinkman', ['ownerPeerId', 'createDate', 'tagId', 'linkmanPeerId'], indexFields[ContactDataType.LINKMAN_TAGLINKMAN])
    pounchDb.create('peerContact', ['peerId', 'mobile', 'formattedName', 'name'], indexFields[ContactDataType.PEER_CONTACT])
  }
  async loadLinkman(originCondition, sort, from, limit) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $gt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }
    if (originCondition.ownerPeerId) {
      let q = {}
      q['ownerPeerId'] = originCondition.ownerPeerId
      qs.push(q)
    }
    if (originCondition.mobile) {
      let q = {}
      q['mobile'] = originCondition.mobile
      qs.push(q)
    }
    if (originCondition.peerId) {
      let q = {}
      q['peerId'] = originCondition.peerId
      qs.push(q)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }
    let data
    if (limit) {
      let page = await pounchDb.findPage('linkman', condition, sort, null, null, limit)
      data = page.result
    } else {
      data = await pounchDb.find('linkman', condition, sort)
    }
    return data
  }

  loadPeerContact(originCondition, sort, from, limit) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $gt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }
    if (originCondition.mobile) {
      let q = {}
      if (Array.isArray(originCondition.mobile)) {
        q['mobile'] = { $in: originCondition.mobile }
      } else {
        q['mobile'] = originCondition.mobile
      }
      qs.push(q)
    }
    if (originCondition.peerId) {
      let q = {}
      if (Array.isArray(originCondition.peerId)) {
        q['peerId'] = { $in: originCondition.peerId }
      } else {
        q['peerId'] = originCondition.peerId
      }
      qs.push(q)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }
    let data
    if (limit) {
      return pounchDb.findPage('peerContact', condition, sort, null, null, limit)
      data = page.result
    } else {
      return pounchDb.find('peerContact', condition, sort)
    }
  }
  formatMobile(mobile) {
    let countryCode = null
    try {
      countryCode = MobileNumberUtil.parse(mobile).getCountryCode()
    } catch (e) {
      console.log(e)
    }
    if (!countryCode) {
      let myMobileCountryCode = MobileNumberUtil.parse(myself.myselfPeerClient.mobile).getCountryCode()
      console.log('myMobileCountryCode:' + myMobileCountryCode)
      if (myMobileCountryCode) {
        countryCode = myMobileCountryCode
      }
    }
    if (countryCode) {
      let isPhoneNumberValid = false
      try {
        isPhoneNumberValid = MobileNumberUtil.isPhoneNumberValid(mobile, MobileNumberUtil.getRegionCodeForCountryCode(countryCode))
      } catch (e) {
        console.log(e)
      }
      if (isPhoneNumberValid) {
        mobile = MobileNumberUtil.formatE164(mobile, MobileNumberUtil.getRegionCodeForCountryCode(countryCode))
        console.log('formatE164:' + mobile)
      }
    }

    return mobile
  }

  /**
   * 获取手机电话本的数据填充peerContacts数组，校验是否好友，是否存在peerId
   * @param {*} peerContacts
   * @param {*} linkmans
   */
  fillPeerContact(peerContacts, linkmans) {
    let filter = ''
    let fields = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name, navigator.contacts.fieldType.phoneNumbers]
    let options = {
      multiple: true,
      hasPhoneNumber: true
    }

    phoneContactComponent.find(filter, fields, options).then(async (contacts) => {
      // 把通讯录的数据规整化，包含手机号和名称，然后根据手机号建立索引
      let peerContactMap = new Map()
      if (contacts && contacts.length > 0) {
        for (let contact of contacts) {
          let peerContact = {}
          if (contact.name.formatted) {
            peerContact.formattedName = contact.name.formatted.trim()
            peerContact.pyFormattedName = pinyinUtil.getPinyin(peerContact.formattedName)
          }
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            for (let phoneNumber of contact.phoneNumbers) {
              if (phoneNumber.type === 'mobile') {
                peerContact.mobile = this.formatMobile(phoneNumber.value)
                break
              }
            }
            if (!peerContact.mobile) {
              peerContact.mobile = this.formatMobile(contact.phoneNumbers[0].value)
            }
          }
          peerContactMap.set(peerContact.mobile, peerContact)
        }
      }
      // 遍历本地库的记录，根据手机号检查索引
      let pContacts = await this.loadPeerContact({})
      if (pContacts && pContacts.length > 0) {
        for (let pContact of pContacts) {
          // 如果通讯录中存在，将本地匹配记录放入结果集
          let peerContact = peerContactMap.get(pContact.mobile)
          if (peerContact) {
            peerContacts.push(pContact)
            peerContactMap.delete(pContact.mobile)
          } else { // 如果通讯录不存在，则本地库删除
            this.remove(ContactDataType.PEER_CONTACT, pContact)
          }
        }
      }
      // 通讯录中剩余的记录，新增的记录将被检查好友记录和服务器记录，然后插入本地库并加入结果集
      let leftPeerContacts = peerContactMap.values()
      if (leftPeerContacts) {
        for (let leftPeerContact of leftPeerContacts) {
          let pc = this.refreshByLinkman(leftPeerContact, linkmans)
          if (!pc) {
            pc = await this.refreshPeerContact(leftPeerContact)
          }
          if (pc) {
            this.insert(ContactDataType.PEER_CONTACT, leftPeerContact)
          }
          peerContacts.push(leftPeerContact)
        }
      }
    }).catch((err) => {
      console.error(err)
    })
  }
  refreshByLinkman(peerContact, linkmans) {
    if (linkmans && linkmans.length > 0) {
      for (let linkman of linkmans) {
        if (linkman.mobile === peerContact.mobile) {
          peerContact.peerId = linkman.peerId
          peerContact.name = linkman.name
          peerContact.pyName = linkman.pyName
          peerContact.givenName = linkman.givenName
          peerContact.pyGivenName = linkman.pyGivenName
          peerContact.locked = linkman.locked
          peerContact.status = linkman.status
          peerContact.publicKey = linkman.publicKey
          peerContact.avatar = linkman.avatar
          peerContact.isLinkman = true

          return peerContact
        }
      }
    }

    return null
  }
  // 从服务器端获取是否有peerClient
  async refreshPeerContact(peerContact) {
    if (peerContact) {
      let mobileNumber = this.formatMobile(peerContact.mobile)
      if (mobileNumber) {
        let peerClient = await peerClientService.findPeerClient(null, null, mobileNumber, null)
        if (peerClient) {
          console.info('find peerclient:' + peerClient)
          peerContact.peerId = peerClient.peerId
          peerContact.name = peerClient.name
          peerContact.trustLevel = peerClient.trustLevel
          peerContact.status = peerClient.status
          peerContact.publicKey = peerClient.publicKey
          peerContact.avatar = peerClient.avatar

          return peerContact
        }
      }
    }

    return null
  }

  async loadLinkmanRequest(originCondition, sort, from, limit) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $gt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }
    if (originCondition.ownerPeerId) {
      let q = {}
      q['ownerPeerId'] = originCondition.ownerPeerId
      qs.push(q)
    }
    if (originCondition.senderPeerId) {
      let q = {}
      q['senderPeerId'] = originCondition.senderPeerId
      qs.push(q)
    }
    if (originCondition.receiverPeerId) {
      let q = {}
      q['receiverPeerId'] = originCondition.receiverPeerId
      qs.push(q)
    }
    if (originCondition.status) {
      let q = {}
      q['status'] = originCondition.status
      qs.push(q)
    }
    if (originCondition.requestType) {
      let q = {}
      q['requestType'] = originCondition.requestType
      qs.push(q)
    }
    if (originCondition.createDate) {
      let q = {}
      q['createDate'] = originCondition.createDate
      qs.push(q)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }

    let data
    if (limit) {
      let page = await pounchDb.findPage('linkmanRequest', condition, sort, null, null, limit)
      data = page.result
    } else {
      data = await pounchDb.find('linkmanRequest', condition, sort)
    }

    return data
  }

  async loadGroup(originCondition, sort, from, limit) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $gt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }
    if (originCondition.ownerPeerId) {
      let q = {}
      q['ownerPeerId'] = originCondition.ownerPeerId
      qs.push(q)
    }
    if (originCondition.groupId) {
      let q = {}
      q['groupId'] = originCondition.groupId
      qs.push(q)
    }
    if (originCondition.createDate) {
      let q = {}
      q['createDate'] = originCondition.createDate
      qs.push(q)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }

    let data
    if (limit) {
      let page = await pounchDb.findPage('group', condition, sort, null, null, limit)
      data = page.result
    } else {
      data = await pounchDb.find('group', condition, sort)
    }
    return data
  }

  async loadGroupMember(originCondition, sort, from, limit) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $gt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }
    if (originCondition.ownerPeerId) {
      let q = {}
      q['ownerPeerId'] = originCondition.ownerPeerId
      qs.push(q)
    }
    if (originCondition.groupId) {
      let q = {}
      q['groupId'] = originCondition.groupId
      qs.push(q)
    }
    if (originCondition.memberPeerId) {
      let q = {}
      q['memberPeerId'] = originCondition.memberPeerId
      qs.push(q)
    }
    if (originCondition.createDate) {
      let q = {}
      q['createDate'] = originCondition.createDate
      qs.push(q)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }

    let data
    if (limit) {
      let page = await pounchDb.findPage('groupMember', condition, sort, null, null, limit)
      data = page.result
    } else {
      data = await pounchDb.find('groupMember', condition, sort)
    }
    return data
  }

  async loadLinkmanTag(originCondition, sort, from, limit) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $gt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }
    if (originCondition.ownerPeerId) {
      let q = {}
      q['ownerPeerId'] = originCondition.ownerPeerId
      qs.push(q)
    }
    if (originCondition.name) {
      let q = {}
      q['name'] = originCondition.name
      qs.push(q)
    }
    if (originCondition.createDate) {
      let q = {}
      q['createDate'] = originCondition.createDate
      qs.push(q)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }

    let data
    if (limit) {
      let page = await pounchDb.findPage('linkmanTag', condition, sort, null, null, limit)
      data = page.result
    } else {
      data = await pounchDb.find('linkmanTag', condition, sort)
    }

    return data
  }

  async loadLinkmanTagLinkman(originCondition, sort, from, limit) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $gt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }
    if (originCondition.ownerPeerId) {
      let q = {}
      q['ownerPeerId'] = originCondition.ownerPeerId
      qs.push(q)
    }
    if (originCondition.tagId) {
      let q = {}
      q['tagId'] = originCondition.tagId
      qs.push(q)
    }
    if (originCondition.linkmanPeerId) {
      let q = {}
      q['linkmanPeerId'] = originCondition.linkmanPeerId
      qs.push(q)
    }
    if (originCondition.createDate) {
      let q = {}
      q['createDate'] = originCondition.createDate
      qs.push(q)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }

    let data
    if (limit) {
      let page = await pounchDb.findPage('linkmanTagLinkman', condition, sort, null, null, limit)
      data = page.result
    } else {
      data = await pounchDb.find('linkmanTagLinkman', condition, sort)
    }

    return data
  }
  async save(dataType, entities, parent) {
    if (!entities) {
      return
    }
    try {
      if (!TypeUtil.isArray(entities)) {
        return await pounchDb.run(tables[dataType], entities, null, parent)
      } else {
        return await pounchDb.execute(tables[dataType], entities, null, parent)
      }
    } catch (error) {
      console.log(entities)
			logService.log(JSON.stringify(entities), 'DBError', 'error')
    }
    
  }
  async insert(dataType, entities, parent) {
    if (!TypeUtil.isArray(entities)) {
      entities.state = EntityState.New
    } else {
      for (let item of entities) {
        item.state = EntityState.New
      }
    }
    return await this.save(dataType, entities, parent)
  }
  async update(dataType, entities, parent) {
    if (!TypeUtil.isArray(entities)) {
      entities.state = EntityState.Modified
    } else {
      for (let item of entities) {
        item.state = EntityState.Modified
      }
    }
    return await this.save(dataType, entities, parent)
  }
  async remove(dataType, entities, parent) {
    if (!TypeUtil.isArray(entities)) {
      entities.state = EntityState.Deleted
    } else {
      for (let item of entities) {
        item.state = EntityState.Deleted
      }
    }
    return await this.save(dataType, entities, parent)
  }
  async get(dataType, id) {
    if (dataType) {
      return await pounchDb.get(tables[dataType], id)
    } else {
      return null
    }
  }
  searchPhase(dataType, phase, filter) {
    if (dataType) {
      let options = {
        highlighting_pre: '<font color="' + myself.myselfPeerClient.primaryColor + '">',
        highlighting_post: '</font>'
      }
      /*if (!filter) {
        filter = function (doc) {
          return doc.ownerPeerId === myself.myselfPeerClient.peerId
        }
      }*/
      return pounchDb.searchPhase(tables[dataType], phase, indexFields[dataType], options, filter)
    }
  }
}
export let contactComponent = new ContactComponent()
