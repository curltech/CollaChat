/**
 * 我的频道的定义
 */
import { EntityState } from 'libcolla'
import { pounchDb } from 'libcolla'
import { myself, SecurityPayload } from 'libcolla'
import { TypeUtil } from 'libcolla'

export let ChannelDataType = {
    'CHANNEL': 'CHANNEL',
    'ARTICLE': 'ARTICLE',
    'ATTACH': 'ATTACH',
}

let tables = {
    'CHANNEL': 'myChannel',
    'ARTICLE': 'myChannelArticle',
    'ATTACH': 'myArticleAttach'
}
let indexFields = {
    'CHANNEL': ['name'],
    'ARTICLE': ['title', 'plainContent'],
    'ATTACH': []
}

export let ChannelType = {
    'PUBLIC': 'PUBLIC',
    'PRIVATE': 'PRIVATE'
}

export let EntityType = {
    'INDIVIDUAL': 'INDIVIDUAL',
    'ENTERPRISE': 'ENTERPRISE'
}

export class Channel {
    constructor() {
        this._id = null
        this.ownerPeerId = null // 区分本地不同peerClient属主
        this.creator = null
        /**
         * 基本信息：类型，ID，头像，名称，描述
         */
        this.channelType = null
        this.channelId = null
        this.avatar = null
        this.name = null
        this.description = null
        /**
         * 主体信息：类型，ID，名称
         */
        this.entityType = null
        this.entityName = null
        /**
         * 创建日期，修改日期
         */
        this.createDate = null
        this.updateDate = null
        /**
         * 关注日期
         */
        this.markDate = null
        this.top = null // 是否置顶，包括：true（置顶）, false（不置顶）
    }
}

export class Article {
    constructor() {
        this._id = null
        this.ownerPeerId = null // 区分本地不同peerClient属主
        this.channelId = null // 所属渠道ID
        /**
         * 基本信息：ID，作者，标题，封面，摘要
         */
        this.articleId = null
        this.author = null
        this.title = null
        this.cover = null
        this.abstract = null
        /**
         * 正文内容
         */
        this.content = null
        this.plainContent = null
        this.pyPlainContent = null
        /**
         * 是否原创
         */
        this.ifOriginal = null
        /**
         * 来源渠道ID，来源渠道名称，来源文章ID，来源文章作者名称
         */
        this.srcChannelId = null
        this.srcChannelName = null
        this.srcArticleId = null
        this.srcArticleAuthor = null
        /**
         * 创建日期，修改日期
         */
        this.createDate = null
        this.updateDate = null
        /**
         * 其它信息
         */
        this.attachs = null
        this.payloadKey = null
        this.payloadHash = null
        this.signature = null
    }
}

export class Attach {
	constructor() {
		this._id = null
        this.ownerPeerId = null // 区分本地不同peerClient属主
		this.articleId = null
		this.content = null
		this.createDate = null
	}
}

export class ChannelComponent {
    constructor() {
        pounchDb.create('myChannel', ['ownerPeerId', 'channelId', 'updateDate'], indexFields[ChannelDataType.CHANNEL])
        pounchDb.create('myChannelArticle', ['ownerPeerId', 'channelId', 'articleId', 'updateDate'], indexFields[ChannelDataType.ARTICLE])
        pounchDb.create('myArticleAttach', ['ownerPeerId', 'articleId'], indexFields[ChannelDataType.ATTACH])
    }
    async loadChannel(originCondition, sort, from, limit) {
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
        if (originCondition.channelId) {
          let q = {}
          q['channelId'] = originCondition.channelId
          qs.push(q)
        }
        if (originCondition.creator) {
          let q = {}
          q['creator'] = originCondition.creator
          qs.push(q)
        }
        if (originCondition.updateDate) {
          let q = {}
          q['updateDate'] = originCondition.updateDate
          qs.push(q)
        }
        if (qs.length > 0) {
          condition['$and'] = qs
        }
    
        let data
        if (limit) {
          let page = await pounchDb.findPage('myChannel', condition, sort, null, null, limit)
          data = page.result
        } else {
          data = await pounchDb.find('myChannel', condition, sort)
        }
        return data
    }
    async loadArticle(condition, sort, fields, from, limit) {
        let data
        if (limit) {
            let page = await pounchDb.findPage('myChannelArticle', condition, sort, fields, from, limit)
            data = page.result
        } else {
            data = await pounchDb.find('myChannelArticle', condition, sort, fields)
        }

        return data
    }
    async loadAttach(currentArticle, from, limit) {
        let condition = {}
        let qs = []
        if (from) {
            qs.push({ createDate: { $lt: from } })
        } else {
            qs.push({ createDate: { $gt: null } })
        }
        let articleId = currentArticle.articleId
        if (articleId) {
            qs.push({ articleId: articleId })
        } else {
            qs.push({ articleId: '' })
        }
        // put content into attach
        if (qs.length > 0) {
            condition['$and'] = qs
        }
        console.log('will load more attachs, articleId:' + articleId + 'from:' + from)
        // put content into attach
        let page = await pounchDb.findPage('myArticleAttach', condition, [{ createDate: 'desc' }], null, null, limit)
        let data = page.result
        if (data && data.length > 0) {
            let payloadKey = currentArticle.payloadKey
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
    async saveArticle(current, parent) {
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
        // put content into attach
        if (EntityState.Deleted === state) {
            await this.saveAttach(current)
        }
        let ignore = ['attachs', 'content']
        //let start = new Date().getTime()
        await pounchDb.run('myChannelArticle', current, ignore, parent)
        //let end = new Date().getTime()
        //console.log('channelArticle save run time:' + (end - start))
        if (EntityState.Deleted !== state) {
            current.attachs = [{content: content}]
            await this.saveAttach(current)
        }
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
                    attach.channelId = current.channelId
                }*/
                attach.state = current.state
                attach.channelId = current.channelId
                if (EntityState.Deleted !== current.state) {
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
            await pounchDb.execute('myArticleAttach', current.attachs, ignore, current.attachs)
            //let end = new Date().getTime()
            //console.log('channelArticle attachs save run time:' + (end - start))
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
            await this.saveArticle(current, parent)
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
            await pounchDb.run('myArticleAttach', attach, null, parent)
        }
    }
    async get(dataType, id) {
        if (dataType) {
            return await pounchDb.get(tables[dataType], id)
        } else {
            return null
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
    async save(dataType, entities, parent) {
        if (!entities) {
          return
        }
        if (!TypeUtil.isArray(entities)) {
          entities = [entities]
        }
        if (dataType) {
            await this._save(tables[dataType], entities, null, parent)
        }
    }
    async _save(table, entities, ignore, parent) {
        if (entities.length > 0 && entities.length === 1) {
          await pounchDb.run(table, entities[0], ignore, parent)
        } else if (entities.length > 0 && entities.length > 1) {
          await pounchDb.execute(table, entities, ignore, parent)
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
export let channelComponent = new ChannelComponent()
