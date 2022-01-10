<template lang="pug">
  q-card.avatar1-card(flat :style="`width:${avatar_width}px;height:${avatar_width}px`" :class="bgClass ? bgClass : 'bg-c-grey-1'")
    q-card-section(style="padding:0px 0px" align="center" :class="group_members && group_members.length < 5 ? '' : 'hidden'")
      q-avatar(:style="`width:${(avatar_width-2)/2}px;height:${(avatar_width-2)/2}px`" :class="group_members && group_members[3] ? '' : 'hidden'")
        img(:src="group_members && group_members[3] ? groupChatMemeberAvatar(group_members[3]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/2}px;height:${(avatar_width-2)/2}px`" :class="group_members && group_members[2] ? '' : 'hidden'")
        img(:src="group_members && group_members[2] ? groupChatMemeberAvatar(group_members[2]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/2}px;height:${(avatar_width-2)/2}px`" :class="group_members && group_members[1] ? '' : 'hidden'")
        img(:src="group_members && group_members[1] ? groupChatMemeberAvatar(group_members[1]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/2}px;height:${(avatar_width-2)/2}px`" :class="group_members && group_members[0] ? '' : 'hidden'")
        img(:src="group_members && group_members[0] ? groupChatMemeberAvatar(group_members[0]) : ''")
    q-card-section(style="padding:0px 0px" align="center" :class="group_members && group_members.length > 4 ? '' : 'hidden'")
      q-avatar(:style="`width:${(avatar_width-2)/3}px;height:${(avatar_width-2)/3}px`" :class="group_members && group_members[8] ? '' : 'hidden'")
        img(:src="group_members && group_members[8] ? groupChatMemeberAvatar(group_members[8]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/3}px;height:${(avatar_width-2)/3}px`" :class="group_members && group_members[7] ? '' : 'hidden'")
        img(:src="group_members && group_members[7] ? groupChatMemeberAvatar(group_members[7]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/3}px;height:${(avatar_width-2)/3}px`" :class="group_members && group_members[6] ? '' : 'hidden'")
        img(:src="group_members && group_members[6] ? groupChatMemeberAvatar(group_members[6]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/3}px;height:${(avatar_width-2)/3}px`" :class="group_members && group_members[5] ? '' : 'hidden'")
        img(:src="group_members && group_members[5] ? groupChatMemeberAvatar(group_members[5]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/3}px;height:${(avatar_width-2)/3}px`" :class="group_members && group_members[4] ? '' : 'hidden'")
        img(:src="group_members && group_members[4] ? groupChatMemeberAvatar(group_members[4]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/3}px;height:${(avatar_width-2)/3}px`" :class="group_members && group_members[3] ? '' : 'hidden'")
        img(:src="group_members && group_members[3] ? groupChatMemeberAvatar(group_members[3]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/3}px;height:${(avatar_width-2)/3}px`" :class="group_members && group_members[2] ? '' : 'hidden'")
        img(:src="group_members && group_members[2] ? groupChatMemeberAvatar(group_members[2]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/3}px;height:${(avatar_width-2)/3}px`" :class="group_members && group_members[1] ? '' : 'hidden'")
        img(:src="group_members && group_members[1] ? groupChatMemeberAvatar(group_members[1]) : ''")
      q-avatar(:style="`width:${(avatar_width-2)/3}px;height:${(avatar_width-2)/3}px`" :class="group_members && group_members[0] ? '' : 'hidden'")
        img(:src="group_members && group_members[0] ? groupChatMemeberAvatar(group_members[0]) : ''")
    q-badge(v-if="unReadCount" color="red" floating) {{ unReadCount }}
</template>
<script src="./groupAvatar.vue.js" />
<style lang="stylus">
  .avatar1-card{ width:66px;height:66px;line-height :1}
</style>