import { date } from 'quasar'

import { myself } from 'libcolla'
import { ChatMessageType, chatAction } from 'libcolla'
import { SecurityPayload } from 'libcolla'

import { chatComponent, chatBlockComponent } from '@/libs/biz/colla-chat'
import { contactComponent } from '@/libs/biz/colla-contact'
import { fileComponent } from '@/libs/base/colla-cordova'

import SelectChatRecord from '@/components/selectChatRecord'

export default {
  name: "BackupMigration",
  components: {
    selectChatRecord: SelectChatRecord
  },
  data() {
    return {
      subKind: 'default'
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
      let _that = this
      let store = _that.$store
      let json = await _that.exportJson()
      if (json) {
        let filename = 'collaBackup-' + myself.myselfPeerClient.clientId + '-' + new Date().getTime() + '.db' //'(' + date.formatDate(new Date(), 'YYYY-MM-DD_HH:mm:ss') + ').db'
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
      let _that = this
      let store = _that.$store
      _that.$refs.localRestoreUpload.pickFiles()
    },
    localRestoreUpload: function(files) {
      let _that = this
      let store = _that.$store
      let file = files[0]
      let reader = new FileReader()
      reader.onload = async function () {
        if (reader.result) {
          let json = reader.result
          await store.restoreChatRecord(json)
        }
        _that.$q.notify({
          message: _that.$i18n.t("Restore successfully"),
          timeout: 3000,
          type: "info",
          color: "info",
        })
      }
      reader.readAsText(file)
      _that.$refs.localRestoreUpload.reset()
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
    migrate: async function () {
      let _that = this
      let store = _that.$store
      let json = await _that.exportJson()
      if (json) {
        let filename = 'collaBackup-' + myself.myselfPeerClient.clientId + '-' + new Date().getTime() + '.db'
        console.log('filename:' + filename)
        let dirEntry = await fileComponent.getRootDirEntry('/')
        let dirPath = dirEntry.toInternalURL()
        let fileEntry = await fileComponent.createNewFileEntry(filename, dirPath)
        let blob = new Blob([json], {
          type: "text/plain",
        })
        await fileComponent.writeFile(fileEntry, blob, false)
        store.startServer('migrate', filename)
      }
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
    },
    backup: async function() {
      let _that = this
      let store = _that.$store
      let json = await _that.exportJson()
      if (json) {
        let filename = 'collaBackup-' + myself.myselfPeerClient.clientId + '-' + new Date().getTime() + '.db'
        console.log('filename:' + filename)
        let dirEntry = await fileComponent.getRootDirEntry('/')
        let dirPath = dirEntry.toInternalURL()
        let fileEntry = await fileComponent.createNewFileEntry(filename, dirPath)
        let blob = new Blob([json], {
          type: "text/plain",
        })
        await fileComponent.writeFile(fileEntry, blob, false)
        store.startServer('backup', filename)
      }
    },
    initRestore: function() {
      let _that = this
      let store = _that.$store
      _that.$refs.restoreUpload.pickFiles()
    },
    restoreUpload: function(files) {
      let _that = this
      let store = _that.$store
      store.restoreFile = files[0]
      _that.$refs.restoreUpload.reset()
      store.showInitRestoreDialog()
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
      if (json) {
        let securityParams = {}
				securityParams.NeedCompress = false
				securityParams.NeedEncrypt = true
				let result = await SecurityPayload.encrypt(json, securityParams)
        if (result) {
          return '[payloadKey:]' + result.PayloadKey + '[:payloadKey]' + result.TransportPayload
        }
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