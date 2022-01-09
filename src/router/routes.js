//不作为Main组件的子页面展示的页面单独写，如下
const page403 = {
  path: '/403',
  name: '403',
  component: () => import('@/pages/403')
}
// 作为workspace组件的子页面展示但是不在左侧菜单显示的路由写在rootRouter里(children至少包含一个子路由)
const rootRouter = {
  path: '/',
  name: 'rootRouter',
  component: () => import('@/pages/login'),
  children: [{
    path: 'index',
    name: 'index',
    component: () => import('@/pages/index')
  }]
}
// 作为layout组件的子页面展示并且在左侧菜单显示的路由写在menuRouter里(children至少包含一个子路由)
const blockChainRouter = {
  path: '/blockChain',
  name: 'blockChain',
  component: () => import('@/pages/login'),
}
const blockChainChatRouter = {
  path: '/blockChain/chat',
  name: 'blockChainChat',
  component: () => import('@/pages/index'),
}
// 所有上面定义的路由都要写在下面的routers里
export const routes = [
  blockChainRouter,
  blockChainChatRouter,
  page403,
  rootRouter
]
