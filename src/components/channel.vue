<template lang="pug">
  div(:class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1 heightMobileStyle' : 'bg-c-grey-1 heightStyle'")
    q-toolbar.header-toolbar(:class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'")
      //q-btn.btnIcon(flat round dense :icon="$store.state.lockContactsSwitch ? 'visibility_off' : 'visibility'" @click="")
      q-toolbar-title(align="center") {{$t('Channel')}}
      //q-btn.btnIcon(flat round dense icon="add_circle_outline" @click="")
    q-toolbar.header-mar-top(insert :class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'" class="q-px-xs")
      q-input.c-field(debounce="100" filled dense v-model="channelfilter" :placeholder="placeholder" input-class="text-center iconfont")
        template(slot="append")
          //q-icon(v-if="!channelfilter" name="search")
          //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="channelfilter = null")
          q-icon(v-if="channelfilter" name="cancel" class="cursor-pointer" @click.stop="channelfilter = null")
    q-card(flat :class="ifMobileSize || $store.state.ifMobileStyle ? 'bg-c-grey-1' : 'bg-c-grey-1'")
      q-card-section(align="center")
        q-icon(name="help" color="warning" size="128px")
      q-card-section(align="center") {{ $t('Coming Soon...') }}
</template>
<script src="./channel.vue.js" />
