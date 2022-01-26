import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

function deepClone(obj) {
  var newObj = obj instanceof Array ? [] : {}
  for (var i in obj) {
    newObj[i] = (!(obj instanceof Array) && obj[i] !== null && typeof obj[i] === 'object') ? deepClone(obj[i]) : obj[i]
  }
  return newObj
}
let stateObj = {
  myselfPeerClient: null,
  chats: [],
  chatMap: {},
  linkmans: [],
  linkmanMap: {},
  linkmanRequests: [],
  groupChats: [],
  groupChatMap: {},
  currentChat: null,
  currentLinkman: null,
  lockContactsSwitch: true,
  // selectContacts
  includedLinkmans: [],
  // selectChatRecord
  includedChatRecords: [],
  // findContacts
  findContactsSubKind: 'default',
  countryCode: null,
  findLinkmanData: {
    peerId: null,
    message: null,
    givenName: null,
    tag: null
  },
  findLinkmanResult: 0, // 0 - 待查询，1 - 未查询到（含查询到自己），2 - 查询到本地好友，3 - 查询到本地未接受好友请求，4 - 查询到线上好友
  findLinkmanTip: '',
  findLinkman: null,
  findLinkmans: [],
  linkmanTagData: null,
  linkmanTagNames: [],
  linkmanTagNameMap: {},
  linkmanTagIdMap: {},
  networkStatus: '',
  ifScan: false,
  ifMobileStyle: false,
  collectionTags: [],
  currentCallChat: null,
  videoDialog: false,
  miniVideoDialog: false,
  mergeMessageDialog: false,
  noteMessageDialog: false,
  noteMessageSrc: null,
  currentMergeMessage: null,
  imageMessageViewDialog: false,
  imageMessageSrc: null,
  videoRecordMessageViewDialog: false,
  videoRecordMessageSrc: null,
  currentPhoneContact: null,
  currentCollection: null,
  dbLogMap: {},
  selectedCollectionItems: [],
  channels: [],
  channelMap: {},
  currentChannel: null,
  articles: [],
  currentArticle: null,
  articleData: {
    cover: null,
    author: null,
    title: null,
    abstract: null,
    content: null
  }
}
const store = new Vuex.Store({
  state: deepClone(stateObj),
  mutations: {
    updateObj(state, properties) {
      //properties.obj[properties.p] = properties.val
      //state.linkmans[0][properties.p] = properties.val
    },
    resetState(state) {
      store.replaceState(deepClone(stateObj))
    }
  },
  actions: {
  },
  modules: {
  },
  getters: {
  }
})

export default store
