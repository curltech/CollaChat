import { date } from 'quasar'
import axios from 'axios'

import { myself } from 'libcolla'
import { BlobUtil } from 'libcolla'
import { ChatMessageType, chatAction } from 'libcolla'

import { chatComponent, chatBlockComponent, ChatDataType } from '@/libs/biz/colla-chat'
import { ContactDataType, contactComponent } from '@/libs/biz/colla-contact'
import { fileComponent } from '@/libs/base/colla-cordova'

import SelectChatRecord from '@/components/selectChatRecord'
import Tip from '@/components/tip'
import List from '@/components/list'

//let fs = require('fs')

export default {
  name: "BackupMigration",
  components: {
    selectChatRecord: SelectChatRecord,
    tip: Tip,
    list: List
  },
  data() {
    return {
      subKind: 'default',
    }
  },
  computed: {
    heightStyle() {
      return {
        height: `${this.$q.screen.height}px`
      }
    },
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
    initLocalBackup: function() {
      let _that = this
      let store = _that.$store
      for (let chat of store.state.chats) {
        chat.selected = false
      }
      store.state.includedChatRecords = []
      store.selectChatRecordEntry = 'backupMigrationLocalBackup'
      _that.subKind = 'selectChatRecord'
    },
    localBackup: async function () {
      /*let ws = fs.createWriteStream('backup.db');
      let db = chatComponent.getDB(ChatDataType.MESSAGE)
      db.dump(ws).then(function (res) {
        console.log(res)
        // res should be {ok: true}
        if (res && res.ok) {
          
        }
      })*/
      let _that = this
      let store = _that.$store
      let clientPeerId = myself.myselfPeerClient.peerId
      if (store.ifMobile()) {
        
      } else {
        let json = ''
        // 联系人同步：跨实例云端同步功能提供前临时使用 - start
        let linkmans = await contactComponent.loadLinkman({
          ownerPeerId: clientPeerId,
        })
        if (linkmans && linkmans.length > 0) {
          let linkmansJson = JSON.stringify(linkmans)
          console.log(linkmansJson)
          json = json + '[linkmansJson:]' + linkmansJson + '[:linkmansJson]'
        }
        let groups = await contactComponent.loadGroup({
          ownerPeerId: clientPeerId,
        })
        if (groups && groups.length > 0) {
          let groupsJson = JSON.stringify(groups)
          console.log(groupsJson)
          json = json + '[groupsJson:]' + groupsJson + '[:groupsJson]'
        }
        let groupMembers = await contactComponent.loadGroupMember({
          ownerPeerId: clientPeerId,
        })
        if (groupMembers && groupMembers.length > 0) {
          let groupMembersJson = JSON.stringify(groupMembers)
          console.log(groupMembersJson)
          json = json + '[groupMembersJson:]' + groupMembersJson + '[:groupMembersJson]'
        }
        let linkmanTags = await contactComponent.loadLinkmanTag({
          ownerPeerId: clientPeerId,
        })
        if (linkmanTags && linkmanTags.length > 0) {
          let linkmanTagsJson = JSON.stringify(linkmanTags)
          console.log(linkmanTagsJson)
          json = json + '[linkmanTagsJson:]' + linkmanTagsJson + '[:linkmanTagsJson]'
        }
        let linkmanTagLinkmans = await contactComponent.loadLinkmanTagLinkman({
          ownerPeerId: clientPeerId,
        })
        if (linkmanTagLinkmans && linkmanTagLinkmans.length > 0) {
          let linkmanTagLinkmansJson = JSON.stringify(linkmanTagLinkmans)
          console.log(linkmanTagLinkmansJson)
          json = json + '[linkmanTagLinkmansJson:]' + linkmanTagLinkmansJson + '[:linkmanTagLinkmansJson]'
        }
        // 联系人同步：跨实例云端同步功能提供前临时使用 - end
        let chats = store.state.includedChatRecords
        let subjectIds = []
        if (chats && chats.length > 0) {
          for (let chat of chats) {
            subjectIds.push(chat.subjectId)
          }
        }
        if (subjectIds.length > 0) {
          let chats = await chatComponent.loadChat({
            ownerPeerId: clientPeerId,
            subjectId: subjectIds
          })
          if (chats && chats.length > 0) {
            let chatsJson = JSON.stringify(chats)
            console.log(chatsJson)
            json = json + '[chatsJson:]' + chatsJson + '[:chatsJson]'
            let messages = await chatComponent.loadMessage({
              ownerPeerId: clientPeerId,
              subjectId: subjectIds,
              countDown: 0
            }, null, null, null, true)
            if (messages && messages.length > 0) {
              let messagesJson = JSON.stringify(messages)
              console.log(messagesJson)
              json = json + '[messagesJson:]' + messagesJson + '[:messagesJson]'
              let messageIds = []
              for (let message of messages) {
                messageIds.push(message.messageId)
              }
              let mergeMessages = await chatComponent.loadMergeMessage({
                ownerPeerId: clientPeerId,
                topMergeMessageId: messageIds
              })
              if (mergeMessages && mergeMessages.length > 0) {
                let mergeMessagesJson = JSON.stringify(mergeMessages)
                console.log(mergeMessagesJson)
                json = json + '[mergeMessagesJson:]' + mergeMessagesJson + '[:mergeMessagesJson]'
              }
              if (!store.textOnlyFlag) {
                let chatAttachs = await chatBlockComponent.loadLocalAttach(messageIds, null, true)
                if (chatAttachs && chatAttachs.length > 0) {
                  let chatAttachsJson = JSON.stringify(chatAttachs)
                  console.log(chatAttachsJson)
                  json = json + '[chatAttachsJson:]' + chatAttachsJson + '[:chatAttachsJson]'
                }
              }
            }
          }
        }
        let filename = _that.$i18n.t('myCollaChat') + '(' + date.formatDate(new Date(), 'YYYY-MM-DD_HH:mm:ss') + ').db'
        let element = document.createElement('a')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json))
        element.setAttribute('download', filename)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        _that.subKind = 'default'
      }
    },
    localRestore: function () {
      /*let rs = fs.createReadStream('backup.db');
      db.load(rs).then(function (res) {
        console.log(res)
        // res should be {ok: true}
        if (res && res.ok) {
          
        }
      })*/
      let _that = this
      let store = _that.$store
      _that.$refs.upload.pickFiles()
    },
    upload: function(files) {
      let _that = this
      let store = _that.$store
      let file = files[0]
      let reader = new FileReader()
      reader.onload = async function () {
        if (reader.result) {
          let json = reader.result
          // 联系人同步：跨实例云端同步功能提供前临时使用 - start
          let changeFlag = false
          let linkmansJson = null
          if (json.indexOf('[linkmansJson:]') > -1 && json.indexOf('[:linkmansJson]') > -1) {
            linkmansJson = json.substring(json.indexOf('[linkmansJson:]') + 15, json.indexOf('[:linkmansJson]'))
            console.log(linkmansJson)
            let linkmans = JSON.parse(linkmansJson)
            if (linkmans && linkmans.length > 0) {
              for (let i = linkmans.length - 1; i >= 0; i--) {
                if (linkmans[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                  let localLinkmans = await contactComponent.loadLinkman({
                    ownerPeerId: myself.myselfPeerClient.peerId,
                    peerId: linkmans[i].peerId
                  })
                  if (localLinkmans && localLinkmans.length > 0) {
                    linkmans.splice(i, 1)
                  }
                } else {
                  linkmans.splice(i, 1)
                }
              }
              if (linkmans.length > 0) {
                changeFlag = true
                await contactComponent.insert(ContactDataType.LINKMAN, linkmans, null)
              }
            }
          }
          let groupsJson = null
          if (json.indexOf('[groupsJson:]') > -1 && json.indexOf('[:groupsJson]') > -1) {
            groupsJson = json.substring(json.indexOf('[groupsJson:]') + 13, json.indexOf('[:groupsJson]'))
            console.log(groupsJson)
            let groups = JSON.parse(groupsJson)
            if (groups && groups.length > 0) {
              for (let i = groups.length - 1; i >= 0; i--) {
                if (groups[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                  let localGroups = await contactComponent.loadGroup({
                    ownerPeerId: myself.myselfPeerClient.peerId,
                    groupId: groups[i].groupId
                  })
                  if (localGroups && localGroups.length > 0) {
                    groups.splice(i, 1)
                  }
                } else {
                  groups.splice(i, 1)
                }
              }
              if (groups.length > 0) {
                changeFlag = true
                await contactComponent.insert(ContactDataType.GROUP, groups, null)
                let groupMembersJson = null
                if (json.indexOf('[groupMembersJson:]') > -1 && json.indexOf('[:groupMembersJson]') > -1) {
                  groupMembersJson = json.substring(json.indexOf('[groupMembersJson:]') + 19, json.indexOf('[:groupMembersJson]'))
                  console.log(groupMembersJson)
                  let groupMembers = JSON.parse(groupMembersJson)
                  if (groupMembers && groupMembers.length > 0) {
                    for (let i = groupMembers.length - 1; i >= 0; i--) {
                      if (groupMembers[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                        let newFlag = false
                        for (let group of groups) {
                          if (group.groupId === groupMembers[i].groupId) {
                            newFlag = true
                            break
                          }
                        }
                        if (newFlag) {
                          // 保守的做法，一般groupId为new，不会存在其下memberPeerId的记录
                          let localGroupMembers = await contactComponent.loadGroupMember({
                            ownerPeerId: myself.myselfPeerClient.peerId,
                            groupId: groupMembers[i].groupId,
                            memberPeerId: groupMembers[i].memberPeerId
                          })
                          if (localGroupMembers && localGroupMembers.length > 0) {
                            groupMembers.splice(i, 1)
                          }
                        } else {
                          groupMembers.splice(i, 1)
                        }
                      } else {
                        groupMembers.splice(i, 1)
                      }
                    }
                    if (groupMembers.length > 0) {
                      await contactComponent.insert(ContactDataType.GROUP_MEMBER, groupMembers, null)
                    }
                  }
                }
              }
            }
          }
          let linkmanTagsJson = null
          if (json.indexOf('[linkmanTagsJson:]') > -1 && json.indexOf('[:linkmanTagsJson]') > -1) {
            linkmanTagsJson = json.substring(json.indexOf('[linkmanTagsJson:]') + 18, json.indexOf('[:linkmanTagsJson]'))
            console.log(linkmanTagsJson)
            let linkmanTags = JSON.parse(linkmanTagsJson)
            if (linkmanTags && linkmanTags.length > 0) {
              for (let i = linkmanTags.length - 1; i >= 0; i--) {
                if (linkmanTags[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                  let localLinkmanTag = await contactComponent.get(ContactDataType.LINKMAN_TAG, linkmanTags[i]._id)
                  if (localLinkmanTag) {
                    linkmanTags.splice(i, 1)
                  }
                } else {
                  linkmanTags.splice(i, 1)
                }
              }
              if (linkmanTags.length > 0) {
                changeFlag = true
                await contactComponent.insert(ContactDataType.LINKMAN_TAG, linkmanTags, null)
                let linkmanTagLinkmansJson = null
                if (json.indexOf('[linkmanTagLinkmansJson:]') > -1 && json.indexOf('[:linkmanTagLinkmansJson]') > -1) {
                  linkmanTagLinkmansJson = json.substring(json.indexOf('[linkmanTagLinkmansJson:]') + 25, json.indexOf('[:linkmanTagLinkmansJson]'))
                  console.log(linkmanTagLinkmansJson)
                  let linkmanTagLinkmans = JSON.parse(linkmanTagLinkmansJson)
                  if (linkmanTagLinkmans && linkmanTagLinkmans.length > 0) {
                    for (let i = linkmanTagLinkmans.length - 1; i >= 0; i--) {
                      if (linkmanTagLinkmans[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                        let newFlag = false
                        for (let linkmanTag of linkmanTags) {
                          if (linkmanTag.tagId === linkmanTagLinkmans[i].tagId) {
                            newFlag = true
                            break
                          }
                        }
                        if (newFlag) {
                          // 保守的做法，一般tagId为new，不会存在其下linkmanPeerId的记录
                          let localLinkmanTagLinkmans = await contactComponent.loadLinkmanTagLinkman({
                            ownerPeerId: myself.myselfPeerClient.peerId,
                            tagId: linkmanTagLinkmans[i].tagId,
                            linkmanPeerId: linkmanTagLinkmans[i].linkmanPeerId
                          })
                          if (localLinkmanTagLinkmans && localLinkmanTagLinkmans.length > 0) {
                            linkmanTagLinkmans.splice(i, 1)
                          }
                        } else {
                          linkmanTagLinkmans.splice(i, 1)
                        }
                      } else {
                        linkmanTagLinkmans.splice(i, 1)
                      }
                    }
                    if (linkmanTagLinkmans.length > 0) {
                      await contactComponent.insert(ContactDataType.LINKMAN_TAGLINKMAN, linkmanTagLinkmans, null)
                    }
                  }
                }
              }
            }
          }
          if (changeFlag) {
            await store.refreshContactsData()
          }
          // 联系人同步：跨实例云端同步功能提供前临时使用 - end
          let chatsJson = null
          if (json.indexOf('[chatsJson:]') > -1 && json.indexOf('[:chatsJson]') > -1) {
            chatsJson = json.substring(json.indexOf('[chatsJson:]') + 12, json.indexOf('[:chatsJson]'))
            console.log(chatsJson)
            let chats = JSON.parse(chatsJson)
            if (chats && chats.length > 0) {
              for (let i = chats.length - 1; i >= 0; i--) {
                if (chats[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                  let localChats = await chatComponent.loadMessage({
                    ownerPeerId: myself.myselfPeerClient.peerId,
                    subjectId: chats[i].subjectId
                  })
                  if (localChats && localChats.length > 0) {
                    chats.splice(i, 1)
                  }
                } else {
                  chats.splice(i, 1)
                }
              }
              if (chats.length > 0) {
                await chatComponent.insert(ChatDataType.CHAT, chats, null)
              }
            }
          }
          let messagesJson = null
          if (json.indexOf('[messagesJson:]') > -1 && json.indexOf('[:messagesJson]') > -1) {
            messagesJson = json.substring(json.indexOf('[messagesJson:]') + 15, json.indexOf('[:messagesJson]'))
            console.log(messagesJson)
            let messages = JSON.parse(messagesJson)
            if (messages && messages.length > 0) {
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                  let localMessages = await chatComponent.loadMessage({
                    ownerPeerId: myself.myselfPeerClient.peerId,
                    messageId: messages[i].messageId
                  }, null, null, null, true)
                  if (localMessages && localMessages.length > 0) {
                    messages.splice(i, 1)
                  }
                } else {
                  messages.splice(i, 1)
                }
              }
              if (messages.length > 0) {
                await chatComponent.insert(ChatDataType.MESSAGE, messages, null)
                let mergeMessagesJson = null
                if (json.indexOf('[mergeMessagesJson:]') > -1 && json.indexOf('[:mergeMessagesJson]') > -1) {
                  mergeMessagesJson = json.substring(json.indexOf('[mergeMessagesJson:]') + 20, json.indexOf('[:mergeMessagesJson]'))
                  console.log(mergeMessagesJson)
                  let mergeMessages = JSON.parse(mergeMessagesJson)
                  if (mergeMessages && mergeMessages.length > 0) {
                    for (let i = mergeMessages.length - 1; i >= 0; i--) {
                      if (mergeMessages[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                        let newFlag = false
                        for (let message of messages) {
                          if (message.messageId === mergeMessages[i].topMergeMessageId) {
                            newFlag = true
                            break
                          }
                        }
                        if (newFlag) {
                          // 保守的做法，一般topMergeMessageId为new，不会存在其下mergeMessageId的记录
                          let localMergeMessages = await chatComponent.loadMergeMessage({
                            ownerPeerId: myself.myselfPeerClient.peerId,
                            topMergeMessageId: mergeMessages[i].topMergeMessageId,
                            mergeMessageId: mergeMessages[i].mergeMessageId
                          })
                          if (localMergeMessages && localMergeMessages.length > 0) {
                            mergeMessages.splice(i, 1)
                          }
                        } else {
                          mergeMessages.splice(i, 1)
                        }
                      } else {
                        mergeMessages.splice(i, 1)
                      }
                    }
                    if (mergeMessages.length > 0) {
                      await chatComponent.insert(ChatDataType.MERGEMESSAGE, mergeMessages, null)
                    }
                  }
                }
                let chatAttachsJson = null
                if (json.indexOf('[chatAttachsJson:]') > -1 && json.indexOf('[:chatAttachsJson]') > -1) {
                  chatAttachsJson = json.substring(json.indexOf('[chatAttachsJson:]') + 18, json.indexOf('[:chatAttachsJson]'))
                  console.log(chatAttachsJson)
                  let chatAttachs = JSON.parse(chatAttachsJson)
                  if (chatAttachs && chatAttachs.length > 0) {
                    for (let i = chatAttachs.length - 1; i >= 0; i--) {
                      if (chatAttachs[i].ownerPeerId === myself.myselfPeerClient.peerId) {
                        let newFlag = false
                        for (let message of messages) {
                          if (message.messageId === chatAttachs[i].messageId) {
                            newFlag = true
                            break
                          }
                        }
                        if (newFlag) {
                          // 保守的做法，一般messageId为new，不会存在其下的记录
                          let localChatAttachs = await chatBlockComponent.loadLocalAttach(chatAttachs[i].messageId, null, true)
                          if (localChatAttachs && localChatAttachs.length > 0) {
                            chatAttachs.splice(i, 1)
                          }
                        } else {
                          chatAttachs.splice(i, 1)
                        }
                      } else {
                        chatAttachs.splice(i, 1)
                      }
                    }
                    if (chatAttachs.length > 0) {
                      await chatComponent.insert(ChatDataType.ATTACH, chatAttachs, null)
                    }
                  }
                }
              }
            }
          }
        }
        _that.$q.notify({
          message: _that.$i18n.t("Restore successfully"),
          timeout: 3000,
          type: "info",
          color: "info",
        })
      }
      reader.readAsText(file)
      _that.$refs.upload.reset()
    },
    initMigrate: async function() {
      let _that = this
      let store = _that.$store
      //////////////////////////////////
      let dirEntry = await fileComponent.getRootDirEntry('/')
      let dirPath = dirEntry.toInternalURL()
      let fileName = 'test.db'
      let fileEntry = await fileComponent.createNewFileEntry(fileName, dirPath)
      let blob = BlobUtil.base64ToBlob('data:image/png;base64,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')
      await fileComponent.writeFile(fileEntry, blob, false)
      //////////////////////////////////
      for (let chat of store.state.chats) {
        chat.selected = false
      }
      store.state.includedChatRecords = []
      store.selectChatRecordEntry = 'backupMigrationMigrate'
      _that.subKind = 'selectChatRecord'
    },
    migrate: function () {
      let _that = this
      let store = _that.$store
      let url = _that.startServer()
    },
    initBackup: function() {
      let _that = this
      let store = _that.$store
      for (let chat of store.state.chats) {
        chat.selected = false
      }
      store.state.includedChatRecords = []
      store.selectChatRecordEntry = 'backupMigrationBackup'
      _that.subKind = 'selectChatRecord'
      /*if (!store.ifMobile()) {
        const io = require('socket.io')(8090),
        Server = require('../dist/src').Server,
        { createWriteStream } = require('fs')
        io.on('connection', socket => {
          console.log('hurrey')
          const server = new Server(socket)
          server.on('file-upload', (stream, data) => {
            console.log('stream')
            const writable = createWriteStream(data.name, {
              autoClose: true
            })
            stream.pipe(writable)
            stream.on('close', () => {
              console.log('done')
            })
            stream.on('end', () => {
              console.log('end')
            })
            stream.on('error', err => {
              console.log(err)
            })
          })
        })
      }*/
    },
    backup: async function() {
      let _that = this
      let store = _that.$store
      let url = _that.startServer()
      if (url) {
        let clientPeerId = myself.myselfPeerClient.peerId
        let newPayload = {}
        newPayload.type = ChatMessageType.BACKUP
        newPayload.srcClientId = myself.myselfPeerClient.clientId
        newPayload.srcPeerId = clientPeerId
        newPayload.url = url
        await chatAction.chat(null, newPayload, clientPeerId)
      }
    },
    initRestore: async function() {
      let _that = this
      let store = _that.$store
      let inAppBrowser = window.open('https://192.168.0.101:8090/', '_blank', 'location=no')
      /*let fileName = 'test.db'
      let fileContent
      try {
        let _client = axios.create()
        if (_client) {
          let serviceData = await _client.get("http://192.168.0.103:8090/" + fileName)
          if (serviceData) {
            fileContent = serviceData.data
          }
        }
      } catch (e) {
        console.error(e)
      }
      console.log(fileContent)*/
    },
    restore: function () {
      let _that = this
      let store = _that.$store
      _that.$refs.upload.pickFiles()
    },
    startServer: function() {
      let httpd = ( cordova && cordova.plugins && cordova.plugins.CorHttpd ) ? cordova.plugins.CorHttpd : null
      if (httpd) {
        httpd.getURL(async function(url) {
          if (url.length > 0) {
            //console.log('server is up:' + url)
            httpd.stopServer(function() {
              console.log('server is stopped.')
            }, function(error) {
              console.error('failed to stop server:' + error)
            })
          } else {
            httpd.startServer({
              'www_root' : '', //'/data/user/0/io.curltech.colla/files/files/',
              'port' : 8090
            }, function(url) {
              httpd.getURL(function(url) {
                if (url.length > 0) {
                  console.log('server is started:' + url)
                  return url
                } else {
                  console.log('server is down.')
                }
              })
              httpd.getLocalPath(function(path) {
                console.log('localpath:' + path)
              })
            }, function(error) {
              console.error('failed to start server:' + error)
            })
          }
        }, function(){})
      } else {
        alert('CorHttpd plugin not available/ready.')
      }
      return null
    }
  },
  created() {
    let _that = this
    let store = _that.$store
    store.changeBackupMigrationSubKind = function (subKind) {
      _that.subKind = subKind
    }
    store.localBackup = _that.localBackup
    store.migrate = _that.migrate
    store.backup = _that.backup
  }
}