/**
 * 聊天的定义
 */
import { pounchDb, EntityState } from 'libcolla'
import { CollaUtil, TypeUtil } from 'libcolla'
import { myself, BlockType, SecurityPayload,logService } from 'libcolla'

import { collectionUtil } from '@/libs/biz/colla-collection-util'

let period = 300 //5m

export let ChatDataType = {
  'MESSAGE': 'MESSAGE',
  'RECEIVE': 'RECEIVE',
  'ATTACH': 'ATTACH',
  'CHAT': 'CHAT',
  'MERGEMESSAGE': 'MERGEMESSAGE'
}

let tables = {
  'MESSAGE': 'message',
  'RECEIVE': 'receive',
  'ATTACH': 'chatAttach',
  'CHAT': 'chat',
  'MERGEMESSAGE': 'mergeMessage'
}
let indexFields = {
  'MESSAGE': ['title', 'content'],
  'RECEIVE': [],
  'ATTACH': [],
  'CHAT': [],
  'MERGEMESSAGE': []
}

export let ChatContentType = {
  'ALL': 'All', // 根据场景包含类型不同，如非系统类型、可搜索类型等
  'IMAGE': 'Image',
  'TEXT': 'Text',
  'FILE': 'File',
  'AUDIO': 'Audio',
  'VIDEO': 'Video',
  'CARD': 'Card',
  'NOTE': 'Note',
  'CHANNEL': 'Channel',
  'ARTICLE': 'Article',
  'CHAT': 'Chat',
  'LINK': 'Link',
  'VOICE': 'Voice',
  'POSITION': 'Position',
  'AUDIO_INVITATION': 'AUDIO_INVITATION',
  'AUDIO_HISTORY': 'AUDIO_HISTORY',
  'VIDEO_HISTORY': 'VIDEO_HISTORY',
  'VIDEO_INVITATION': 'VIDEO_INVITATION',
  'CALL_JOIN_REQUEST': 'CALL_JOIN_REQUEST',
  'EVENT': 'EVENT',
  'TIME': 'TIME',
  'MEDIA_REJECT': 'MEDIA_REJECT',
  'MEDIA_CLOSE': 'MEDIA_CLOSE',
  'MEDIA_BUSY': 'MEDIA_BUSY'
}

// 消息类型（messageType）
export let P2pChatMessageType = {
  'ADD_LINKMAN': 'ADD_LINKMAN', // 新增联系人请求
  'ADD_LINKMAN_REPLY': 'ADD_LINKMAN_REPLY', // 新增联系人请求的回复
  'SYNC_LINKMAN_INFO': 'SYNC_LINKMAN_INFO', // 联系人基本信息同步
  'DROP_LINKMAN': 'DROP_LINKMAN', // 从好友中删除
  'DROP_LINKMAN_RECEIPT': 'DROP_LINKMAN_RECEIPT', // 删除好友通知回复
  'BLACK_LINKMAN': 'BLACK_LINKMAN', // 加入黑名单
  'BLACK_LINKMAN_RECEIPT': 'BLACK_LINKMAN_RECEIPT', // 加入黑名单通知回复
  'UNBLACK_LINKMAN': 'UNBLACK_LINKMAN', // 从黑名单中移除
  'UNBLACK_LINKMAN_RECEIPT': 'UNBLACK_LINKMAN_RECEIPT', // 移除黑名单通知回复
  // 联系人请求
  'ADD_GROUPCHAT': 'ADD_GROUPCHAT', // 新增群聊请求
  'ADD_GROUPCHAT_RECEIPT': 'ADD_GROUPCHAT_RECEIPT', // 新增群聊请求接收回复
  'DISBAND_GROUPCHAT': 'DISBAND_GROUPCHAT', // 解散群聊请求
  'DISBAND_GROUPCHAT_RECEIPT': 'DISBAND_GROUPCHAT_RECEIPT', // 解散群聊请求接收回复
  'MODIFY_GROUPCHAT': 'MODIFY_GROUPCHAT', // 修改群聊请求
  'MODIFY_GROUPCHAT_RECEIPT': 'MODIFY_GROUPCHAT_RECEIPT', // 修改群聊请求接收回复
  'MODIFY_GROUPCHAT_OWNER': 'MODIFY_GROUPCHAT_OWNER', // 修改群主请求
  'MODIFY_GROUPCHAT_OWNER_RECEIPT': 'MODIFY_GROUPCHAT_OWNER_RECEIPT', // 修改群主请求接收回复
  'ADD_GROUPCHAT_MEMBER': 'ADD_GROUPCHAT_MEMBER', // 新增群聊成员请求
  'ADD_GROUPCHAT_MEMBER_RECEIPT': 'ADD_GROUPCHAT_MEMBER_RECEIPT', // 新增群聊成员请求接收回复
  'REMOVE_GROUPCHAT_MEMBER': 'REMOVE_GROUPCHAT_MEMBER', // 删除群聊成员请求
  'REMOVE_GROUPCHAT_MEMBER_RECEIPT': 'REMOVE_GROUPCHAT_MEMBER_RECEIPT', // 删除群聊成员请求接收回复
  // 聊天
  'CHAT_SYS': 'CHAT_SYS', // 系统预定义聊天消息，如群聊动态通知
  'CHAT_LINKMAN': 'CHAT_LINKMAN', // 联系人发送聊天消息
  'CHAT_RECEIVE_RECEIPT': 'CHAT_RECEIVE_RECEIPT', // 接收回复
  'CALL_CLOSE': 'CALL_CLOSE',
  'CALL_REQUEST': 'CALL_REQUEST', // 通话请求
  'RECALL': 'RECALL',
  'GROUP_FILE': 'GROUP_FILE'
}
export let ChatMessageStatus = {
  'NORMAL': 'NORMAL',
  'RECALL': 'RECALL',
  'DELETE': 'DELETE',
}
export let SubjectType = {
  'CHAT': 'CHAT',
  'LINKMAN_REQUEST': 'LINKMAN_REQUEST',
  'GROUP_CHAT': 'GROUP_CHAT',
}

// 消息（单聊/群聊）
export class Message {
  constructor() {
    this._id = null
    this.ownerPeerId = null // 区分本地不同peerClient属主
    this.subjectType = null // 包括：Chat（单聊）, GroupChat（群聊）
    this.subjectId = null // 主题的唯一id标识（单聊对应linkman-peerId，群聊对应group-groupId）
    this.messageId = null // 消息的唯一id标识
    this.messageType = null // 消息类型（对应channel消息类型）
    this.senderPeerId = null // 消息发送方（作者）peerId
    this.createDate = null // 创建时间
    this.receiveTime = null // 接收时间
    this.actualReceiveTime = null // 实际接收时间 1.发送端发送消息时receiveTime=createDate，actualReceiveTime=null；2.根据actualReceiveTime是否为null判断是否需要重发，收到接受回执时更新actualReceiveTime；3.聊天区按receiveTime排序，查找聊天内容按createDate排序
    this.readTime = null // 阅读时间
    this.title = null // 消息标题
    this.thumbBody = null // 预览内容（适用需预览的content，如笔记、转发聊天）
    this.thumbnail = null // 预览缩略图（base64图片，适用需预览的content，如笔记、联系人名片）
    this.content = null // 消息内容
    this.contentType = null
    this.destroyTime = null
    this.messageType = null

    this.payloadHash = null
    this.signature = null
    this.status = null
    this.statusReason = null
    this.statusDate = null
    this.primaryPeerId = null
    /**
     * primary peer的publicKey
     */
    this.primaryPublicKey = null
    this.primaryAddress = null
    this.payloadKey = null
    this.ephemeralPublicKey = null
    // 其它: 加密相关字段，自动销毁相关字段


  }
}

// 附件（单聊/群聊/频道/收藏）
export class Attach {
  constructor() {
    this._id = null
    this.ownerPeerId = null // 区分本地不同peerClient属主
    this.messageId = null // 消息的唯一id标识
    this.subjectId = null // 外键（对应subject-subjectId）
    this.createDate = null // 创建时间
    this.content = null // 消息内容（基于mime+自定义标识区分内容类型，如：application/audio/image/message/text/video/x-word, contact联系人名片, groupChat群聊, channel频道）
  }
}

// 发送接收记录（群聊联系人请求/群聊/频道）
export class Receive {
  constructor() {
    this._id = null
    this.ownerPeerId = null // 区分本地不同peerClient属主
    this.subjectType = null // 外键（对应message-subjectType、对群聊联系人请求为LinkmanRequest）
    this.subjectId = null // 外键（对应message-subjectId、对群聊联系人请求为空）
    this.messageType = null // 外键（对应message-messageType、linkmanRequest-requestType）
    this.messageId = null // 外键（对应message-messageId、linkmanRequest-_id）
    this.createDate = null // 创建时间（同message-createDate、linkmanRequest-createDate）
    this.receiverPeerId = null // 消息接收方peerId
    this.receiveTime = null // 接收时间

    // 其它: 如：自动销毁相关字段...
  }
}

export class ChatComponent {
  constructor() {
    this.localFileDataMap = {}
    pounchDb.create('chat', ['ownerPeerId', 'subjectId', 'createDate', 'updateTime'], indexFields[ChatDataType.CHAT])
    pounchDb.create('message', ['ownerPeerId', 'subjectId', 'createDate', 'receiveTime', 'actualReceiveTime', 'blockId', 'messageType', 'attachBlockId'], indexFields[ChatDataType.MESSAGE])
    pounchDb.create('receive', ['ownerPeerId', 'subjectId', 'createDate', 'subjectType', 'receiverPeerId', 'blockId'], indexFields[ChatDataType.RECEIVE])
    pounchDb.create('chatAttach', ['ownerPeerId', 'subjectId', 'createDate', 'messageId'], indexFields[ChatDataType.ATTACH])
    pounchDb.create('mergeMessage', ['ownerPeerId', 'mergeMessageId', 'createDate'], indexFields[ChatDataType.MERGEMESSAGE])
  }
  getDB(dataType) {
    return pounchDb.create(tables[dataType])
  }
  async loadChat(originCondition, sort, from, limit, includeMessage) {
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
    if (originCondition.subjectId) {
      let q = {}
      if (Array.isArray(originCondition.subjectId)) {
        q['subjectId'] = { $in: originCondition.subjectId }
      } else {
        q['subjectId'] = originCondition.subjectId
      }
      qs.push(q)
    }
    if (originCondition.searchText) {
      let tags = originCondition.searchText.split(' ')
      if (tags && tags.length > 0) {
        for (let key in tags) {
          let tag = tags[key]
          let q = {}
          q['content'] = { $regex: tag }
          qs.push(q)
        }
      }
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }
    let data
    if (limit) {
      let result = await pounchDb.findPage('chat', condition, sort, null, null, limit)
      data = result.result
    } else {
      data = await pounchDb.find('chat', condition, sort)
    }
    if (includeMessage) {
      if (data && data.length > 0) {
        for (let chat of data) {
          let messages = []
          messages = await this.loadMessage({
            ownerPeerId: myself.myselfPeerClient.peerId,
            subjectId: chat.subjectId
          }, [{ _id: 'desc' }], null, 10)
          CollaUtil.sortByKey(messages, 'receiveTime', 'asc')
          chat.messages = messages
        }
      }
    }
    return data
  }
  async loadMessage(originCondition, sort, from, limit, notDecrypt) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ receiveTime: { $lt: from } })
    } else {
      //qs.push({ _id: { $lt: null } })
    }
    if (originCondition.ownerPeerId) {
      let q = {}
      q['ownerPeerId'] = originCondition.ownerPeerId
      qs.push(q)
    }
    if (originCondition.messageId) {
      let q = {}
      q['messageId'] = originCondition.messageId
      qs.push(q)
    }
    if (originCondition.subjectId) {
      let q = {}
      if (Array.isArray(originCondition.subjectId)) {
        q['subjectId'] = { $in: originCondition.subjectId }
      } else {
        q['subjectId'] = originCondition.subjectId
      }
      qs.push(q)
    }
    if (originCondition.countDown === 0) {
      let q = {}
      q['countDown'] = 0
      qs.push(q)
    }
    if (originCondition.receiveTime != undefined) {
      let q = {}
      q['receiveTime'] = originCondition.receiveTime
      qs.push(q)
    }
    if (originCondition.actualReceiveTime != undefined) {
      let q = {}
      q['actualReceiveTime'] = originCondition.actualReceiveTime
      qs.push(q)
    }
    if (originCondition.messageType) {
      let q = {}
      q['messageType'] = originCondition.messageType
      qs.push(q)
    }
    if (originCondition.blockId) {
      let q = {}
      q['blockId'] = originCondition.blockId
      qs.push(q)
    }
    if (originCondition.contentType && originCondition.contentType !== ChatContentType.ALL) {
      let q = {}
      q['contentType'] = originCondition.contentType
      qs.push(q)
    }
    if (originCondition.createDate) {
      let q = {}
      q['createDate'] = originCondition.createDate
      qs.push(q)
    }
    if (originCondition.createDateStart) {
      let q = {}
      q['createDate'] = originCondition.createDateStart
      qs.push(q)
    }
    if (originCondition.createDateEnd) {
      let q = {}
      q['createDate'] = originCondition.createDateEnd
      qs.push(q)
    }
    if (originCondition.senderPeerId) {
      let q = {}
      q['senderPeerId'] = originCondition.senderPeerId
      qs.push(q)
    }
    if (originCondition.attachBlockId) {
      let q = {}
      q['attachBlockId'] = originCondition.attachBlockId
      qs.push(q)
    }
    if (originCondition.searchText) {
      let tags = originCondition.searchText.split(' ')
      if (tags && tags.length > 0) {
        for (let key in tags) {
          let tag = tags[key]
          let q = {}
          q['content'] = { $regex: tag }
          qs.push(q)
        }
      }
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }
    let data
    if (limit) {
      let result = await pounchDb.findPage('message', condition, sort, null, null, limit)
      data = result.result
    } else {
      data = await pounchDb.find('message', condition, sort)
    }
    if (notDecrypt) {
      return data
    } else {
      if (myself.myselfPeerClient.localDataCryptoSwitch) {
        if (data && data.length > 0) {
          let dataMap = new Map()
          let encryptPayloadMap = new Map()
          for (let d of data) {
            let _id = d._id
            dataMap.set(_id, d)
            let payloadKey = d.payloadKey
            let encryptPayloads = encryptPayloadMap.get(payloadKey)
            if (!encryptPayloadMap.has(payloadKey)) {
              encryptPayloads = []
              encryptPayloadMap.set(payloadKey, encryptPayloads)
            }
            let encryptPayload = null
            if (d.content) {
              encryptPayload =
              {
                _id: d._id,
                type: 'content',
                needCompress: d.needCompress,
                encryptData: d.content,
                signature: d.signature,
                payloadKey: payloadKey,
                ephemeralPublicKey: d.ephemeralPublicKey
              }
              encryptPayloads.push(encryptPayload)
            }
            if (d.thumbnail) {
              encryptPayload =
              {
                _id: d._id,
                type: 'thumbnail',
                needCompress: false,
                encryptData: d.thumbnail,
                payloadKey: payloadKey,
                ephemeralPublicKey: d.ephemeralPublicKey
              }
              encryptPayloads.push(encryptPayload)
            }
          }
        }
        let securityParams = {}
        securityParams.NeedCompress = true
        securityParams.NeedEncrypt = true
        for (let payloadKey of encryptPayloadMap.keys()) {
          let encryptPayloads = encryptPayloadMap.get(payloadKey)
          securityParams.PayloadKey = payloadKey
          let payloads = await SecurityPayload.decrypt(encryptPayloads, securityParams)
          if (payloads && payloads.length > 0) {
            for (let payload of payloads) {
              let _id = payload._id
              let type = payload.type
              if (dataMap.has(_id)) {
                let d = dataMap.get(_id)
                if (type === 'content') {
                  d.content = payload.data
                } else {
                  if (type === 'thumbnail') {
                    d.thumbnail = payload.data
                  }
                }
              }
            }
          }
        }
      }
      return data
    }
  }
  async loadReceive(originCondition, sort, from, limit) {
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
    if (originCondition.messageId) {
      let q = {}
      q['messageId'] = originCondition.messageId
      qs.push(q)
    }
    if (originCondition.receiveTime != undefined) {
      let q = {}
      q['receiveTime'] = originCondition.receiveTime
      qs.push(q)
    }
    if (originCondition.receiverPeerId) {
      let q = {}
      q['receiverPeerId'] = originCondition.receiverPeerId
      qs.push(q)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }
    let data = await pounchDb.find('receive', condition, sort)
    return data
  }
  async loadMergeMessage(originCondition, sort, from, limit) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $gt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }

    let q1 = {}
    q1['ownerPeerId'] = myself.myselfPeerClient.peerId
    qs.push(q1)
    if (originCondition.topMergeMessageId) {
      let q2 = {}
      if (Array.isArray(originCondition.topMergeMessageId)) {
        q2['topMergeMessageId'] = { $in: originCondition.topMergeMessageId }
      } else {
        q2['topMergeMessageId'] = originCondition.topMergeMessageId
      }
      qs.push(q2)
    }
    if (originCondition.mergeMessageId) {
      let q2 = {}
      q2['mergeMessageId'] = originCondition.mergeMessageId
      qs.push(q2)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }
    let data = await pounchDb.find('mergeMessage', condition, sort)
    return data
  }
  async save(dataType, entities, parent) {
    if (!entities) {
      return
    }
    if (!TypeUtil.isArray(entities)) {
      entities = [entities]
    }
    if (ChatDataType.MESSAGE == dataType) {
      if (myself.myselfPeerClient.localDataCryptoSwitch) {
        if (entities.length > 0) {
          let securityParams = {}
          securityParams.NeedCompress = true
          securityParams.NeedEncrypt = true
          for (let current of entities) {
            let state = current.state
            if (EntityState.Deleted !== state) {
              securityParams.PayloadKey = current.payloadKey
              let content = current.content
              if (content) {
                let result = await SecurityPayload.encrypt(payload, securityParams)
                if (result) {
                  payloadKey = result.payloadKey
                  current.payloadKey = payloadKey
                  let encryptPayloads = result.payloads
                  if (encryptPayloads && encryptPayloads.length > 0) {
                    let encryptPayload = encryptPayloads[0]
                    let needCompress = encryptPayload.needCompress
                    let signature = encryptPayload.signature
                    let encryptData = encryptPayload.encryptData
                    let payloadHash = encryptPayload.payloadHash
                    current.needCompress = needCompress
                    current.signature = signature
                    current.content = encryptData
                    current.payloadHash = payloadHash
                  }
                }
              }
            }
          }
        }
      }
      await this._save('message', entities, ['mediaProperty', 'mergeMessages'], parent)
    } else if (ChatDataType.CHAT == dataType) {
      await this._save('chat', entities, ['messages', 'stream', 'streamMap', 'audio', 'focusedMessage', 'tempText'], parent)
    } else if (ChatDataType.RECEIVE == dataType) {
      await this._save('receive', entities, null, parent)
    } else if (ChatDataType.ATTACH == dataType) {
      await this._save('chatAttach', entities, null, parent)
    } else if (ChatDataType.MERGEMESSAGE == dataType) {
      await this._save('mergeMessage', entities, null, null)
    }
  }
  async _save(table, entities, ignore, parent) {
    try {
      if (entities.length > 0 && entities.length === 1) {
        await pounchDb.run(table, entities[0], ignore, parent)
      } else if (entities.length > 0 && entities.length > 1) {
        await pounchDb.execute(table, entities, ignore, parent)
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
    await this.save(dataType, entities, parent)
  }
  calcTime(current, messages) {
    let currentTime = current.createDate
    let preTime = currentTime.setTime(d.getTime() - 1000 * period)
    let isNeedInsert = true
    if (messages && messages.length > 0) {
      for (let i = messages.length; i > -1; i--) {
        let _message = messages[i]
        if (_message.messageType === P2pChatMessageType.CHAT_SYS && _message.contentType === ChatContentType.TIME) {
          let _time = _message.createDate
          if (_time <= preTime) {
            isNeedInsert = false
          }
        }
      }
    }
    if (isNeedInsert) {
      let message = {
        messageType: P2pChatMessageType.CHAT_SYS,
        contentType: ChatContentType.TIME,
        content: currentTime
      }
    }
  }
  async update(dataType, entities, parent) {
    if (!TypeUtil.isArray(entities)) {
      entities.state = EntityState.Modified
    } else {
      for (let item of entities) {
        item.state = EntityState.Modified
      }
    }
    await this.save(dataType, entities, parent)
  }
  async remove(dataType, entities, parent) {
    if (!TypeUtil.isArray(entities)) {
      entities.state = EntityState.Deleted
    } else {
      for (let item of entities) {
        item.state = EntityState.Deleted
      }
    }
    await this.save(dataType, entities, parent)
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
export let chatComponent = new ChatComponent()

export class ChatBlockComponent {
  constructor() {
  }
  async save(current, _peers) {
    let _that = this
    let blockType = BlockType.ChatAttach
    let expireDate = new Date().getTime() + 1000 * 3600 * 24 * 10 // 10 days
    if (current.messageType === P2pChatMessageType.GROUP_FILE) {
      blockType = BlockType.GroupFile
      expireDate = new Date().getTime() + 1000 * 3600 * 24 * 365 * 100 // 100 years
    }
    let blockResult = await collectionUtil.saveBlock(current, true, blockType, _peers, expireDate)
    let result = true
    if (blockResult) {
      current.state = EntityState.New
      await _that.saveLocalAttach(current)
    } else {
      result = false
    }
    return result
  }
  async saveLocalAttach(current) {
    let attachs = current.attachs
    if (myself.myselfPeerClient.localDataCryptoSwitch) {
      let securityParams = {}
      securityParams.NeedCompress = true
      securityParams.NeedEncrypt = true
      for (let key in attachs) {
        let attach = attachs[key]
        if (EntityState.Deleted === current.state) {
          attach.state = EntityState.Deleted
          continue
        }
        if (attach.content) {
          securityParams.PayloadKey = attach.payloadKey
          let payload = attach.content
          let result = await SecurityPayload.encrypt(payload, securityParams)
          if (result) {
            attach.securityContext = current.SecurityContext
            attach.payloadKey = result.PayloadKey
            attach.needCompress = result.NeedCompress
            attach.content_ = result.TransportPayload
            attach.payloadHash = result.PayloadHash
          }
        }
      }
      await pounchDb.execute('chatAttach', attachs, ['content'], current.attachs)
      for (let attach of current.attachs) {
        delete attach['content_']
      }
    } else {
      await pounchDb.execute('chatAttach', attachs, [], current.attachs)
    }
  }
  async loadLocalAttach(attachBlockId, from) {
    let condition = {}
    let qs = []
    if (from) {
      qs.push({ _id: { $gt: from } })
    } else {
      qs.push({ _id: { $gt: null } })
    }
    let q1 = {}
    q1['ownerPeerId'] = myself.myselfPeerClient.peerId
    qs.push(q1)
    if (attachBlockId) {
      let q2 = {}
      if (Array.isArray(attachBlockId)) {
        q2['attachBlockId'] = { $in: attachBlockId }
      } else {
        q2['attachBlockId'] = attachBlockId
      }
      qs.push(q2)
    }
    if (qs.length > 0) {
      condition['$and'] = qs
    }
    let data = await pounchDb.find('chatAttach', condition, null)
    if (data && data.length > 0) {
      let securityParams = {}
      securityParams.NeedCompress = true
      securityParams.NeedEncrypt = true
      for (let d of data) {
        let payloadKey = d.payloadKey
        if (payloadKey) {
          securityParams.PayloadKey = payloadKey
          let content_ = d.content_
          if (content_) {
            let payload = await SecurityPayload.decrypt(content_, securityParams)
            //d.content = StringUtil.decodeURI(payload)
            d.content = payload
          }
        }
      }
    }
    return data
  }
}
export let chatBlockComponent = new ChatBlockComponent()
