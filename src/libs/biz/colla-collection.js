/**
 * 我的收藏的定义
 */
import { EntityState } from 'libcolla'
import { pounchDb } from 'libcolla'
import { myself, SecurityPayload } from 'libcolla'
import { StringUtil, TypeUtil } from 'libcolla'

export let CollectionDataType = {
	'COLLECTION': 'COLLECTION',
	'ATTACH': 'ATTACH',
	'COLLECTION_TAGCOLLECTION': 'COLLECTION_TAGCOLLECTION',
	'BLOCKLOG': 'BLOCKLOG'
}

let tables = {
    'COLLECTION': 'myCollection',
    'ATTACH': 'myAttach',
    'COLLECTION_TAGCOLLECTION': 'collectionTagCollection',
	'BLOCKLOG': 'blockLog'
}

export let SrcChannelType = {
	'CHAT': 'CHAT',
	'GROUP_CHAT': 'GROUP_CHAT'
}

export let SrcEntityType = {
	'MYSELF': 'MYSELF',
	'LINKMAN': 'LINKMAN'
}

export let CollectionType = {
	'ALL': 'All',
	'IMAGE': 'Image',
	'TEXT': 'Text',
	'FILE': 'File',
	'AUDIO': 'Audio',
	'VIDEO': 'Video',
	'CARD': 'Card',
	'NOTE': 'Note',
	'CHAT': 'Chat',
	'LINK': 'Link',
	'VOICE': 'Voice',
	'POSITION': 'Position'
}

export class Collection {
	constructor() {
		this._id = null
		this.ownerPeerId = null // 区分本地不同peerClient属主
		/**
		 * 收藏的类型, note, image, link, file, video, audio, voice, chat, position, card, text
		 */
		this.collectionType = null
		/**
		 * 内容，作者，标题
		 */
		this.content = null
		this.plainContent = null
		this.pyPlainContent = null
		this.title = null
		/**
		 * 收藏来源渠道类型，来源渠道ID，来源渠道名称，来源对象类型，来源对象ID，来源对象名称
		 */
		this.srcChannelType = null
		this.srcChannelId = null
		this.srcChannelName = null
		this.srcEntityType = null
		this.srcEntityId = null
		this.srcEntityName = null
		/**
		 * 收藏创建日期，修改日期
		 */
		this.createDate = null
		this.updateDate = null
		/**
		 * 收藏的数据块的编号和数据交易编号
		 */
		this.blockId = null
		/**
		 * 缩略图
		 */
		this.thumbnail = null
		this.thumbType = null
		this.contentTitle = null
		this.contentBody = null
		this.firstFileInfo = null
		this.firstAudioDuration = null
		this.contentIVAmount = null
		this.contentAAmount = null
		this.attachIVAmount = null
		this.attachAAmount = null
		this.attachOAmount = null
		this.attachAmount = null
		/**
		 * 其它信息
		 */
		this.attachs = null
		this.payloadKey = null
		this.payloadHash = null
		this.signature = null
		this.versionFlag = null
		this.primaryPeerId = null
	}
}

export class Attach {
	constructor() {
		this._id = null
		this.ownerPeerId = null // 区分本地不同peerClient属主
		this.collectionId = null
		this.mimeType = null
		this.content = null
		this.size = null
		this.createDate = null
		this.thumbnail = null
	}
}

export class CollectionTagCollection {
	constructor() {
		this._id = null
		this.ownerPeerId = null // 区分本地不同peerClient属主
		this.collectionId = null
		this.tag = null
		this.pyTag = null
		this.createDate = null
	}
}

export class CollectionComponent {
	constructor() {
		pounchDb.create('myCollection', ['ownerPeerId', 'updateDate', 'collectionType'])
		pounchDb.create('myAttach', ['createDate', 'collectionId'])
		pounchDb.create('collectionTagCollection', ['ownerPeerId', 'createDate', 'tag', 'pyTag', 'collectionId'])
		pounchDb.create('blockLog', ['businessNumber'])
	}
	async load(ownerPeerId, collectionType, searchTag, searchText, from, limit) {
		let condition = {}
		let qs = []
		console.log('from:' + from)
		if (from) {
			qs.push({ updateDate: { $lt: from } })
		} else {
			qs.push({ updateDate: { $gt: null } })
		}
		if (ownerPeerId) {
			let q = {}
			q['ownerPeerId'] = ownerPeerId
			qs.push(q)
		}
		if (collectionType && collectionType !== CollectionType.ALL) {
			let q = {}
			q['collectionType'] = collectionType
			qs.push(q)
		}
		if (searchTag) {
			let originCondition = {}
			originCondition.ownerPeerId = ownerPeerId
			originCondition.tag = searchTag
			let ctcs = await this.loadCollectionTagCollection(originCondition, null, null, null)
			if (ctcs && ctcs.length > 0) {
				let q = {}
				let collectionIdArr = []
				for (let ctc of ctcs) {
					collectionIdArr.push(ctc.collectionId)
				}
				q['_id'] = { $in: collectionIdArr }
				qs.push(q)
			}
		}
		if (searchText) {
			let subcondition = {}
			let subqs = []
			let q1 = {}
			let originCondition = {}
			originCondition.ownerPeerId = ownerPeerId
			originCondition.searchText = searchText
			let ctcs = await this.loadCollectionTagCollection(originCondition, null, null, null)
			if (ctcs && ctcs.length > 0) {
				let collectionIdArr = []
				for (let ctc of ctcs) {
					collectionIdArr.push(ctc.collectionId)
				}
				q1['_id'] = { $in: collectionIdArr }
				subqs.push(q1)
			}
			let q2 = {}
			q2['plainContent'] = { $regex: searchText }
			subqs.push(q2)
			let q3 = {}
			q3['pyPlainContent'] = { $regex: searchText }
			subqs.push(q3)
			subcondition['$or'] = subqs
			qs.push(subcondition)
		}
		qs.push({ updateDate: { $gt: null } })
		if (qs.length > 0) {
			condition['$and'] = qs
		}
		console.log('will load more data, collectionType:' + collectionType + ', searchText:' + searchText)
		//let start = new Date().getTime()
		let page = await pounchDb.findPage('myCollection', condition, [{ updateDate: 'desc' }], null, null, limit)
		//let end = new Date().getTime()
		//console.log('collection findPage time:' + (end - start))
		let data = page.result
		if (data && data.length > 0) {
			let securityParams = {}
			securityParams.NeedCompress = true
			securityParams.NeedEncrypt = true
			for (let d of data) {
				let payloadKey = d.payloadKey
				if (payloadKey) {
					start = new Date().getTime()
					securityParams.PayloadKey = payloadKey
					let content_ = d.content_
					if (content_) {
						let payload = await SecurityPayload.decrypt(content_, securityParams)
						//d.content = StringUtil.decodeURI(payload)
						d.content = payload
					}
					let thumbnail_ = d.thumbnail_
					if (thumbnail_) {
						let payload = await SecurityPayload.decrypt(thumbnail_, securityParams)
						d.thumbnail = payload
					}
					end = new Date().getTime()
          			console.log('collection decrypt time:' + (end - start))
				}
			}
		}

		return data
	}
	async loadCollection(condition, sort, fields, from, limit) {
		let data
		if (limit) {
			let page = await pounchDb.findPage('myCollection', condition, sort, fields, from, limit)
			data = page.result
		} else {
			data = await pounchDb.find('myCollection', condition, sort, fields)
		}

		return data
	}
	async loadAttach(currentCollection, from, limit) {
		let condition = {}
		let qs = []
		if (from) {
			qs.push({ createDate: { $lt: from } })
		} else {
			qs.push({ createDate: { $gt: null } })
		}
		let collectionId = currentCollection._id
		if (collectionId) {
			qs.push({ collectionId: collectionId })
		} else {
			qs.push({ collectionId: '' })
		}
		// put content into attach
		if (qs.length > 0) {
			condition['$and'] = qs
		}
		console.log('will load more attachs, collectionId:' + collectionId + ',from:' + from)
		// put content into attach
		let page = await pounchDb.findPage('myAttach', condition, [{ createDate: 'desc' }], null, null, limit)
		let data = page.result
		if (data && data.length > 0) {
			let payloadKey = currentCollection.payloadKey
			if (payloadKey) {
				let securityParams = {}
				securityParams.PayloadKey = payloadKey
				securityParams.NeedCompress = true
				securityParams.NeedEncrypt = true
				for (let d of data) {
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
	/**
	 * 保存本地产生的文档的摘要部分，并且异步地上传到网络
	 * 
	 * 摘要部分有两个属性需要加密处理，内容和缩略
	 * @param {*} current 
	 * @param {*} parent 
	 */
	async saveCollection(current, parent) {
		if (!current) {
			return
		}
		let state = current.state
		let content = current.content
		let thumbnail = current.thumbnail
		let payloadKey = current.payloadKey
		let now = new Date().getTime()
		if (EntityState.New === state) {
			if (!current.createDate) {
				current.createDate = now
			}
			if (!current.updateDate) {
				current.updateDate = now
			}
		} else if (EntityState.Modified=== state) {
			if (current.versionFlag !== 'sync') {
				current.updateDate = now
			}
		}
		/*let ignore = ['attachs']
		if (myself.myselfPeerClient.localDataCryptoSwitch === true) {
			if (EntityState.Deleted !== state) {
				current.securityContext = myself.myselfPeer.securityContext
				let securityParams = {}
				securityParams.PayloadKey = payloadKey
				securityParams.NeedCompress = true
				securityParams.NeedEncrypt = true
				let result = null
				let start = new Date().getTime()
				if (content) {
					result = await SecurityPayload.encrypt(content, securityParams)
					if (result) {
						current.payloadKey = result.PayloadKey
						current.needCompress = result.NeedCompress
						current.content_ = result.TransportPayload
						current.payloadHash = result.PayloadHash
						securityParams.PayloadKey = result.PayloadKey
					}
				}
				let thumbnailResult = null
				if (thumbnail) {
					thumbnailResult = await SecurityPayload.encrypt(thumbnail, securityParams)
					if (thumbnailResult) {
						if (!result) {
							current.payloadKey = thumbnailResult.PayloadKey
						}
						current.thumbnail_ = thumbnailResult.TransportPayload
					}
				}
				let end = new Date().getTime()
				console.log('collection encrypt time:' + (end - start))
				console.log('collection after encrypt length:' + JSON.stringify(current).length)
			}
			ignore = ['plainContent', 'pyPlainContent', 'content', 'thumbnail', 'attachs']
		}*/
		// put content into attach
		if (current.attachs && current.attachs.length > 0) {
			current.attachs[0].content = content
			current.attachs[0].state = state
		} else {
			current.attachs = [{
				content: content,
				state: state
			}]
		}
		let ignore = ['attachs', 'content']
		//let start = new Date().getTime()
		await pounchDb.run('myCollection', current, ignore, parent)
		//let end = new Date().getTime()
        //console.log('collection save run time:' + (end - start))
		await this.saveAttach(current)
		delete current['content_']
		delete current['thumbnail_']
	}
	/**
	 * 保存本地产生的文档的附件部分，并且异步地上传到网络
	 * 
	 * 附件部分有两个属性需要加密处理，缩略（可以没有）和附件内容
	 * @param {*} current 
	 */
	async saveAttach(current) {
		if (current._id && current.attachs) {
			let securityParams = {}
			securityParams.PayloadKey = current.payloadKey
			securityParams.NeedCompress = true
			securityParams.NeedEncrypt = true
			for (let key in current.attachs) {
				let attach = current.attachs[key]
				// put content into attach
				/*if (EntityState.Deleted === current.state) {
					attach.state = EntityState.Deleted
					continue
				} else {
					attach.collectionId = current._id
				}
				attach.state = current.state*/
				if (EntityState.Deleted !== current.state) {
					attach.collectionId = current._id
					attach.ownerPeerId = myself.myselfPeerClient.peerId
					attach.createDate = current.updateDate
					if (myself.myselfPeerClient.localDataCryptoSwitch === true) {
						if (attach.content) {
							let result = await SecurityPayload.encrypt(attach.content, securityParams)
							if (result) {
								attach.securityContext = current.SecurityContext
								attach.payloadKey = result.PayloadKey
								attach.needCompress = result.NeedCompress
								attach.content_ = result.TransportPayload
								attach.payloadHash = result.PayloadHash
							}
						}
					}
				}
			}
			let ignore = []
			if (myself.myselfPeerClient.localDataCryptoSwitch === true) {
				ignore = ['content']
			}
			//let start = new Date().getTime()
			await pounchDb.execute('myAttach', current.attachs, ignore, null)
			//let end = new Date().getTime()
        	//console.log('collection attachs save run time:' + (end - start))
			for (let attach of current.attachs) {
				delete attach['content_']
			}
		}
	}
	// 删除
	async delete(current, parent) {
		let state = current.state
		if (state === EntityState.New) {
			if (parent) {
				parent.splice(parent.indexOf(current), 1)
			}
		} else {
			current['state'] = EntityState.Deleted
			let attachs = current['attachs']
			if (attachs && attachs.length > 0) {
				for (let attach of attachs) {
					attach['state'] = EntityState.Deleted
				}
			}
			await this.saveCollection(current, parent)
			// put content into attach
			//await this.saveAttach(current)
		}
	}
	async deleteAttach(attach, parent) {
		let state = attach.state
		if (state === EntityState.New) {
			if (parent) {
				parent.splice(parent.indexOf(attach), 1)
			}
		} else {
			attach['state'] = EntityState.Deleted
			await pounchDb.run('myAttach', attach, null, parent)
		}
	}

	async getAllCollectionTags() {
		let condition = {}
		let qs = []
		qs.push({ pyTag: { $gt: null } })
		let q = {}
		q['ownerPeerId'] = myself.myselfPeerClient.peerId
		qs.push(q)
		condition['$and'] = qs
		let data = await pounchDb.find('collectionTagCollection', condition, [{ pyTag: 'asc' }])
		if (data && data.length > 0) {
			let arr = []
			for (let ctc of data) {
				arr.push(ctc.tag)
			}
			let uniqueArr = Array.from(new Set(arr))
			return uniqueArr
		}
		return []
	}

	async loadCollectionTagCollection(originCondition, sort, from, limit) {
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
		if (originCondition.tag) {
			let q = {}
			q['tag'] = originCondition.tag
			qs.push(q)
		}
		if (originCondition.pyTag) {
			let q = {}
			q['pyTag'] = originCondition.pyTag
			qs.push(q)
		}
		if (originCondition.searchText) {
			//let tags = originCondition.searchText.split(' ')
			//if (tags && tags.length > 0) {
			//	for (let key in tags) {
			//		let tag = tags[key]
			let subcondition = {}
			let subqs = []
			let q1 = {}
			q1['tag'] = { $regex: originCondition.searchText }
			subqs.push(q1)
			let q2 = {}
			q2['pyTag'] = { $regex: originCondition.searchText }
			subqs.push(q2)
			subcondition['$or'] = subqs
			qs.push(subcondition)
			//	}
			//}
		}
		if (originCondition.collectionId) {
			let q = {}
			q['collectionId'] = originCondition.collectionId
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
			let page = await pounchDb.findPage('collectionTagCollection', condition, sort, null, null, limit)
			data = page.result
		} else {
			data = await pounchDb.find('collectionTagCollection', condition, sort)
		}

		return data
	}

	async saveCollectionTagCollection(entities, parent) {
		if (!entities) {
			return
		}
		if (!TypeUtil.isArray(entities)) {
			return await pounchDb.run('collectionTagCollection', entities, null, parent)
		} else {
			return await pounchDb.execute('collectionTagCollection', entities, null, parent)
		}
	}
	async insertCollectionTagCollection(entities, parent) {
		if (entities) {
			if (!TypeUtil.isArray(entities)) {
				entities.state = EntityState.New
			} else {
				for (let item of entities) {
					item.state = EntityState.New
				}
			}
			return await this.saveCollectionTagCollection(entities, parent)
		}
	}
	async updateCollectionTagCollection(entities, parent) {
		if (entities) {
			if (!TypeUtil.isArray(entities)) {
				entities.state = EntityState.Modified
			} else {
				for (let item of entities) {
					item.state = EntityState.Modified
				}
			}
			return await this.saveCollectionTagCollection(entities, parent)
		}
	}
	async removeCollectionTagCollection(entities, parent) {
		if (entities) {
			if (!TypeUtil.isArray(entities)) {
				entities.state = EntityState.Deleted
			} else {
				for (let item of entities) {
					item.state = EntityState.Deleted
				}
			}
			return await this.saveCollectionTagCollection(entities, parent)
		}
	}
	async get(dataType, id) {
		if (dataType) {
			return await pounchDb.get(tables[dataType], id)
		} else {
			return null
		}
	}
}
export let collectionComponent = new CollectionComponent()
