import { EntityState } from 'libcolla'
import { CollaUtil } from 'libcolla'
import { myself } from 'libcolla'

import pinyinUtil from '@/libs/base/colla-pinyin'
import { statusBarComponent } from '@/libs/base/colla-cordova'
import { ContactDataType, ActiveStatus, contactComponent } from '@/libs/biz/colla-contact'

import ContactsDetails from '@/components/contactsDetails'
import SelectContacts from '@/components/selectContacts'

export default {
  name: "ContactsTagList",
  components: {
    selectContacts: SelectContacts,
    contactsDetails: ContactsDetails
  },
  props: [],
  data() {
    return {
      ActiveStatus: ActiveStatus,
      subKind: 'default',
      linkmanTags: []
    }
  },
  methods: {
    showAddContactsTag() {
      this.$store.state.linkmanTagData = {
        _id: null,
        name: null,
        linkmans: []
      }
      this.subKind = 'editContactsTag'
    },
    showModifyContactsTag(linkmanTag) {
      this.currentLinkmanTag = linkmanTag
      this.$store.state.linkmanTagData = {
        _id: linkmanTag._id,
        name: linkmanTag.name,
        linkmans: CollaUtil.clone(linkmanTag.linkmans)
      }
      this.subKind = 'editContactsTag'
    },
    confirmRemoveLinkmanTag(linkmanTag) {
      let _that = this
      _that.$q.bottomSheet({
        message: _that.$i18n.t('Confirm the deletion?'),
        actions: [
          {},
          {
            label: _that.$i18n.t('Confirm'),
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
          await _that.removeLinkmanTag(linkmanTag)
        }
      }).onCancel(() => {
        // console.log('Dismissed')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    async removeLinkmanTag(linkmanTag) {
      let _that = this
      let store = _that.$store
      let linkmanTagLinkmans = await contactComponent.loadLinkmanTagLinkman({
        ownerPeerId: myself.myselfPeerClient.peerId,
        tagId: linkmanTag._id
      })
      if (linkmanTagLinkmans && linkmanTagLinkmans.length > 0) {
        await contactComponent.remove(ContactDataType.LINKMAN_TAGLINKMAN, linkmanTagLinkmans, null)
      }
      let lt = await contactComponent.get(ContactDataType.LINKMAN_TAG, linkmanTag._id)
      if (lt) {
        await contactComponent.remove(ContactDataType.LINKMAN_TAG, lt, _that.linkmanTags)
        for (let i = 0; i < store.state.linkmanTagNames.length; i++) {
          if (store.state.linkmanTagNames[i] === linkmanTag.name) {
            store.state.linkmanTagNames.splice(i, 1)
            break
          }
        }
        delete store.state.linkmanTagNameMap[linkmanTag.name]
        delete store.state.linkmanTagIdMap[linkmanTag._id]
      }
      await _that.updateRelatedLinkman(linkmanTagLinkmans)
    },
    async saveLinkmanTag() {
      let _that = this
      let store = _that.$store
      let clientPeerId = myself.myselfPeerClient.peerId
      let _id = store.state.linkmanTagData._id
      let name = store.state.linkmanTagData.name.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '')
      let mapId = store.state.linkmanTagNameMap[name]
      if ((!_id && mapId) || (_id && mapId && _id !== mapId)) {
        _that.$q.notify({
          message: _that.$i18n.t("tag name already exists"),
          timeout: 3000,
          type: "warning",
          color: "warning",
        })
        return
      }
      let linkmanTagLinkmans
      if (!_id) {
        let linkmanTag = {}
        linkmanTag.ownerPeerId = clientPeerId
        linkmanTag.name = name
        linkmanTag.createDate = new Date()
        await contactComponent.insert(ContactDataType.LINKMAN_TAG, linkmanTag, null)
        linkmanTag.linkmans = CollaUtil.clone(store.state.linkmanTagData.linkmans)
        let linkmansName = ''
        linkmanTagLinkmans = []
        for (let linkman of linkmanTag.linkmans) {
          let linkmanTagLinkman = {}
          linkmanTagLinkman.ownerPeerId = clientPeerId
          linkmanTagLinkman.tagId = linkmanTag._id
          linkmanTagLinkman.linkmanPeerId = linkman.peerId
          linkmanTagLinkman.createDate = new Date()
          linkmanTagLinkman.state = EntityState.New
          linkmanTagLinkmans.push(linkmanTagLinkman)
          let linkmanName = linkman.givenName ? linkman.givenName : linkman.name
          linkmansName = (linkmansName ? linkmansName + ", " + linkmanName : linkmanName)
          //
        }
        await contactComponent.save(ContactDataType.LINKMAN_TAGLINKMAN, linkmanTagLinkmans, null)
        linkmanTag.linkmanTagLinkmans = linkmanTagLinkmans
        linkmanTag.linkmansName = linkmansName
        _that.linkmanTags.push(linkmanTag)
        store.state.linkmanTagNames.push(name)
        store.state.linkmanTagNameMap[name] = linkmanTag._id
        store.state.linkmanTagIdMap[linkmanTag._id] = name
      } else {
        let linkmanTag = await contactComponent.get(ContactDataType.LINKMAN_TAG, _that.currentLinkmanTag._id)
        if (linkmanTag && linkmanTag.name !== name) {
          for (let i = 0; i < store.state.linkmanTagNames.length; i++) {
            if (store.state.linkmanTagNames[i] === linkmanTag.name) {
              store.state.linkmanTagNames[i] = name
              break
            }
          }
          delete store.state.linkmanTagNameMap[linkmanTag.name]
          store.state.linkmanTagNameMap[name] = _that.currentLinkmanTag._id
          store.state.linkmanTagIdMap[_that.currentLinkmanTag._id] = name
          linkmanTag.name = name
          await contactComponent.update(ContactDataType.LINKMAN_TAG, linkmanTag)
          _that.currentLinkmanTag.name = name
        }
        _that.currentLinkmanTag.linkmans = CollaUtil.clone(store.state.linkmanTagData.linkmans)
        linkmanTagLinkmans = await contactComponent.loadLinkmanTagLinkman(
          {
            ownerPeerId: clientPeerId,
            tagId: _that.currentLinkmanTag._id
          }
        )
        for (let linkmanTagLinkman of linkmanTagLinkmans) {
          let removed = true
          for (let linkman of _that.currentLinkmanTag.linkmans) {
            if (linkmanTagLinkman.linkmanPeerId === linkman.peerId) {
              removed = false
              break
            }
          }
          if (removed) {
            linkmanTagLinkman.state = EntityState.Deleted
          }
        }
        let linkmansName = ''
        for (let linkman of _that.currentLinkmanTag.linkmans) {
          let added = true
          for (let linkmanTagLinkman of _that.currentLinkmanTag.linkmanTagLinkmans) {
            if (linkmanTagLinkman.linkmanPeerId === linkman.peerId) {
              added = false
              break
            }
          }
          if (added) {
            let linkmanTagLinkman = {}
            linkmanTagLinkman.ownerPeerId = clientPeerId
            linkmanTagLinkman.tagId = _that.currentLinkmanTag._id
            linkmanTagLinkman.linkmanPeerId = linkman.peerId
            linkmanTagLinkman.createDate = new Date()
            linkmanTagLinkman.state = EntityState.New
            linkmanTagLinkmans.push(linkmanTagLinkman)
          }
          let linkmanName = linkman.givenName ? linkman.givenName : linkman.name
          linkmansName = (linkmansName ? linkmansName + ", " + linkmanName : linkmanName)
        }
        await contactComponent.save(ContactDataType.LINKMAN_TAGLINKMAN, linkmanTagLinkmans, _that.currentLinkmanTag.linkmanTagLinkmans)
        _that.currentLinkmanTag.linkmansName = linkmansName
      }
      await _that.updateRelatedLinkman(linkmanTagLinkmans)
      _that.subKind = 'default'
    },
    async updateRelatedLinkman(relatedLinkmanTagLinkmans) {
      let _that = this
      let store = _that.$store
      if (relatedLinkmanTagLinkmans && relatedLinkmanTagLinkmans.length > 0) {
        let linkmanMap = {}
        for (let relatedLinkmanTagLinkman of relatedLinkmanTagLinkmans) {
          let peerId = relatedLinkmanTagLinkman.linkmanPeerId
          let linkman = store.state.linkmanMap[peerId]
          if (linkman && !linkmanMap[peerId]) {
            let tagNames = []
            let tag = ''
            let linkmanTagLinkmans = await contactComponent.loadLinkmanTagLinkman({
              ownerPeerId: myself.myselfPeerClient.peerId,
              linkmanPeerId: peerId,
              createDate: { $gt: null }
            }, [{ createDate: 'asc' }])
            if (linkmanTagLinkmans && linkmanTagLinkmans.length > 0) {
              for (let linkmanTagLinkman of linkmanTagLinkmans) {
                let name = store.state.linkmanTagIdMap[linkmanTagLinkman.tagId]
                tagNames.push(name)
                tag = (tag ? tag + ", " + name : name)
              }
            }
            linkman.tagNames = tagNames
            linkman.tag = tag
            linkman.pyTag = pinyinUtil.getPinyin(tag)
            store.state.linkmanMap[peerId] = linkman
            linkmanMap[peerId] = true
          }
        }
      }
    },
    addLinkmanTagLinkman() {
      let _that = this
      let store = _that.$store
      let linkmanTagLinkmans = store.state.linkmanTagData.linkmans
      store.state.includedLinkmans = []
      let linkmans = store.state.linkmans
      for (let linkman of linkmans) {
        let existing = false
        for (let linkmanTagLinkman of linkmanTagLinkmans) {
          if (linkman.peerId === linkmanTagLinkman.peerId) {
            existing = true
            break
          }
        }
        if (existing) {
          linkman.existing = true
          linkman.selected = true
          this.$store.state.includedLinkmans.push(linkman)
        } else {
          linkman.existing = false
          linkman.selected = false
        }
      }
      store.selectContactsEntry = 'contactsTagList'
      _that.subKind = 'selectContacts'
    },
    removeLinkmanTagLinkman(linkman) {
      let index = this.$store.state.linkmanTagData.linkmans.indexOf(linkman)
      this.$store.state.linkmanTagData.linkmans.splice(index, 1)
    },
    showContacts(linkman, index) {
      let _that = this
      let store = _that.$store
      store.state.currentLinkman = linkman
      store.contactsDetailsEntry = 'contactsTagList'
      _that.subKind = 'contactsDetails'
      /*if (store.state.ifMobileStyle) {
        statusBarComponent.style(true, '#ffffff')
      }*/
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
  async created() {
    let _that = this
    let store = _that.$store
    store.state.linkmanTagData = {
      name: null,
      linkmans: []
    }
    store.changeContactsTagListSubKind = function (subKind) {
      _that.subKind = subKind
    }
    let clientPeerId = myself.myselfPeerClient.peerId
    let linkmanTagDBItems = await contactComponent.loadLinkmanTag({
      ownerPeerId: clientPeerId,
      createDate: { $gt: null }
    }, [{ createDate: 'asc' }])
    if (linkmanTagDBItems && linkmanTagDBItems.length > 0) {
      for (let linkmanTagDBItem of linkmanTagDBItems) {
        let linkmanTagLinkmanDBItems = await contactComponent.loadLinkmanTagLinkman(
          {
            ownerPeerId: clientPeerId,
            tagId: linkmanTagDBItem._id,
            createDate: { $gt: null }
          }, [{ createDate: 'asc' }]
        )
        let linkmansName = ''
        linkmanTagDBItem.linkmans = []
        linkmanTagDBItem.linkmanTagLinkmans = []
        if (linkmanTagLinkmanDBItems && linkmanTagLinkmanDBItems.length > 0) {
          linkmanTagDBItem.linkmanTagLinkmans = linkmanTagLinkmanDBItems
          for (let linkmanTagLinkmanDBItem of linkmanTagLinkmanDBItems) {
            let linkman = store.state.linkmanMap[linkmanTagLinkmanDBItem.linkmanPeerId]
            if (linkman) {
              let linkmanName = linkman.givenName ? linkman.givenName : linkman.name
              linkmansName = (linkmansName ? linkmansName + ", " + linkmanName : linkmanName)
              linkmanTagDBItem.linkmans.push(linkman)
            }
          }
        }
        linkmanTagDBItem.linkmansName = linkmansName
      }
    }
    _that.linkmanTags = linkmanTagDBItems
  }
}
