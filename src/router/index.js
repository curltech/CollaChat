import Vue from 'vue'
import VueRouter from 'vue-router'
//import MenuUtil from 'libcolla'
import {routes} from './routes'
import store from '@/store'

Vue.use(VueRouter)

const Router = new VueRouter({
  /*
   * NOTE! Change Vue Router mode from quasar.conf.js -> build -> vueRouterMode
   *
   * If you decide to go with "history" mode, please also set "build.publicPath"
   * to something other than an empty string.
   * Example: '/' instead of ''
   */

  // Leave as is and change from quasar.conf.js instead!
  mode: process.env.VUE_ROUTER_MODE,
  base: process.env.VUE_ROUTER_BASE,
  scrollBehavior: () => ({
    y: 0
  }),
  routes
})

const whiteList = ['/403', '/p2p', '/'] // 设置白名单，避免死循环

// 地址栏改变，比$route(to)先触发
Router.beforeEach(async (to, from, next) => {
  if (to.name === 'rootRouter' && store.peers) {
    console.log('***ignore***')
    return
  } else {
    if (whiteList.indexOf(to.path) !== -1) { // 在免登录白名单，直接进入
      next()
      return
    }
    let token = store.state.myselfPeerClient
    // 已经登录连接成功
    if (token) {
      next()
    } else { // 没有登录连接成功
      next('/')
    }
  }
  /*let token = store.state.authToken.token
  // 已经登录
  if (token && token.username) {
    let currentUser = store.state.user.currentUser
    // 存在当前用户
    if (currentUser && currentUser.loginName) {
      next()
    } else {
      next('/login')
    }
  } else { // 没有登录
    next('/login')
  }
  //let menu = MenuUtil.getMenuByName(to.name, store.getters.accessMenu)
  MenuUtil.title(to.name)*/
})

Router.afterEach((to) => {
  window.scrollTo(0, 0)
})

export default Router
