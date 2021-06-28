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
      backupDialog: false
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
      let json = await _that.exportJson()
      if (json) {
        let filename = 'myCollaChat' + '(' + date.formatDate(new Date(), 'YYYY-MM-DD_HH:mm:ss') + ').db'
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
    initMigrate: function() {
      let _that = this
      let store = _that.$store
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
      let json = await _that.exportJson()
      if (json) {
        let filename = 'myCollaChat-' + new Date().getTime() + '.db'
        console.log('filename:' + filename)
        let dirEntry = await fileComponent.getRootDirEntry('/')
        let dirPath = dirEntry.toInternalURL()
        let fileEntry = await fileComponent.createNewFileEntry(filename, dirPath)
        let blob = new Blob([json], {
          type: "text/plain",
        })
        await fileComponent.writeFile(fileEntry, blob, false)
        let url = _that.startServer()
        if (url) {
          let clientPeerId = myself.myselfPeerClient.peerId
          let newPayload = {}
          newPayload.type = ChatMessageType.BACKUP
          newPayload.srcClientId = myself.myselfPeerClient.clientId
          newPayload.srcPeerId = clientPeerId
          newPayload.url = url
          newPayload.filename = filename
          await chatAction.chat(null, newPayload, clientPeerId)
        }
        _that.backupDialog = true
      }
    },
    cancelBackup: function() {
      let _that = this
      let store = _that.$store
      _that.backupDialog = false
    },
    closeBackup: function() {
      let _that = this
      let store = _that.$store
      _that.backupDialog = false
    },
    initRestore: function() {
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
      let _that = this
      let httpd = ( cordova && cordova.plugins && cordova.plugins.CorHttpd ) ? cordova.plugins.CorHttpd : null
      if (httpd) {
        httpd.getURL(function(url) {
          if (url.length > 0) {
            console.log('server is up:' + url)
            httpd.stopServer(function() {
              console.log('server is stopped.')
              return _that.start(httpd)
            }, function(error) {
              console.error('failed to stop server:' + error)
              return null
            })
          } else {
            return _that.start(httpd)
          }
        })
      } else {
        alert('CorHttpd plugin not available/ready.')
        return null
      }
    },
    start: function(httpd) {
      httpd.startServer({
        'www_root' : '/data/user/0/io.curltech.colla/files/files/',
        'port' : 8090
      }, function(url) {
        if (url.length > 0) {
          console.log('server is started:' + url)
          httpd.getLocalPath(function(path) {
            console.log('localpath:' + path)
          })
          return url
        } else {
          console.log('server is down')
          return null
        }
      }, function(error) {
        console.error('failed to start server:' + error)
        return null
      })
    },
    exportJson: async function() {
      let _that = this
      let store = _that.$store
      let clientPeerId = myself.myselfPeerClient.peerId
      let json = ''
      if (store.inclContactsInfoFlag) {
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
      }
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
      return json
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