<template lang="pug">
  div(:class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1 heightMobileStyle' : 'bg-c-grey-1 heightStyle'")
    q-toolbar.header-toolbar(:class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'")
      q-btn.btnIcon(flat round dense :icon="$store.state.lockContactsSwitch ? 'visibility_off' : 'visibility'" @click="")
      q-toolbar-title(align="center") {{$t('Channel')}}
      q-btn.btnIcon(flat round dense icon="add_circle_outline" @click="newChannel")
    q-toolbar.header-mar-top(insert :class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'" class="q-px-xs")
      q-input.c-field(debounce="100" filled dense v-model="channelfilter" :placeholder="placeholder" input-class="text-center iconfont")
        template(slot="append")
          //q-icon(v-if="!channelfilter" name="search")
          //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="channelfilter = null")
          q-icon(v-if="channelfilter" name="cancel" class="cursor-pointer" @click.stop="channelfilter = null")
    q-list
      div(v-for="(channel, index) in ChannelFilteredList" :key="channel.channelId")
        q-item(clickable v-ripple :active-class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-2'" class="text-c-grey-10" :active="$store.getKind() === 'channelDetails' && channel === $store.state.currentChannel" @click="channelSelected(channel, index)")
          q-item-section(avatar)
            q-avatar(size="32px")
              img(:src="channel.avatar ? channel.avatar : $store.defaultActiveAvatar")
              q-badge(color="red" floating)
          q-item-section
            q-item-label {{ channel.name }}
            q-item-label last article's title
          q-item-section(side)
            q-item-label {{ detailDateFormat(channel.updateDate) }}
</template>
<script src="./channel.vue.js" />
