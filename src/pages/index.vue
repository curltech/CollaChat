<template lang="pug">
q-layout
  div(v-if="$store.state.ifScan")
    q-toolbar
      q-btn(flat, round, icon="close", color="white", @click="scanBack")
    .scan-container
      //div(class="scan-none-1")
      .scan-box-container
        .scan-none-2
        .scan-box
          .scan-box-area
            .top-left
            .top-right
            .bottom-left
            .bottom-right
        .scan-none-2
      //div(class="scan-none-1") {{ '放入框内，自动扫描' }}
      .scanbox
        //.area
        .line
      .scanicon
        q-btn.warp-icon-off(@click="scanPhoto")
          q-icon(name="photo")
        q-btn(
          :class="light ? 'warp-icon-on' : 'warp-icon-off'",
          @click="toggleLight"
        )
          q-icon(name="highlight")
  q-page-container(v-if="!$store.state.ifScan")
    q-page(
      v-if="!(ifMobileSize || $store.state.ifMobileStyle)",
      style="width: 420px"
    )
      .row
        .col-2.bg-c-grey-pc
          .text-center(style="padding:15px 0px")
            q-avatar(size="48px")
              img(:src="avatar")
          q-space
          q-tabs.navigatorTabStyle.text-c-grey-pc(
            v-model="tab",
            vertical,
            indicator-color="transparent",
            active-color="primary",
            :style="menuHeight"
          )
            q-tab(
              name="chat",
              icon="chat",
              @click="$store.changeTab('chat')",
              :label="$t('Chat')",
              no-caps,
              :ripple="false"
            )
              q-badge(v-if="ChatUnReadCount > 0", color="red", floating) {{ ChatUnReadCount }}
            q-tab(
              name="contacts",
              icon="account_box",
              @click="$store.changeTab('contacts')",
              :label="$t('Contacts')",
              no-caps,
              :ripple="false"
            )
              q-badge(v-if="ReceivedList.length > 0", color="red", floating) {{ ReceivedList.length }}
            q-tab(
              name="channel",
              icon="settings_input_antenna",
              @click="$store.changeTab('channel')",
              :label="$t('Channel')",
              no-caps,
              :ripple="false"
            )
            //q-tab(name="collection" icon="bookmarks" :label="$t('Collection')" no-caps :ripple="false")
            q-tab(
              name="me",
              icon="person_outline",
              @click="$store.changeTab('me')",
              :label="$t('Me')",
              no-caps,
              :ripple="false"
            )
              q-badge(v-if="$store.macos !== true && $store.latestVersion !== $store.currentVersion" color="red" floating rounded) New
        .col-10
          q-tab-panels(
            v-model="tab",
            animated,
            transition-prev="jump-up",
            transition-next="jump-up"
          )
            q-tab-panel(name="chat", style="padding:0px 0px")
              chat.drawcontent
            q-tab-panel(name="contacts", style="padding:0px 0px")
              contacts.drawcontent
            q-tab-panel(name="channel", style="padding:0px 0px")
              channel.drawcontent
            //q-tab-panel(name="collection" style="padding:0px 0px")
              collection.drawcontent
            q-tab-panel(name="me", style="padding:0px 0px")
              me.drawcontent
    q-page(v-if="ifMobileSize || $store.state.ifMobileStyle")
      //.top
      q-tab-panels(v-model="tab")
        q-tab-panel(name="chat", style="padding:0px 0px")
          chat.drawcontent
        q-tab-panel(name="contacts", style="padding:0px 0px")
          contacts.drawcontent
        q-tab-panel(name="channel", style="padding:0px 0px")
          channel.drawcontent
        //q-tab-panel(name="collection" style="padding:0px 0px")
          collection.drawcontent
        q-tab-panel(name="me", style="padding:0px 0px")
          me.drawcontent
      q-tabs.navigatorTabMobileStyle.bg-c-grey-mobile.text-c-grey-mobile(
        v-if="chatLoadingDone",
        v-model="tab",
        align="justify",
        indicator-color="transparent",
        active-color="primary"
      )
        q-tab(
          name="chat",
          icon="chat",
          @click="$store.changeTab('chat')",
          :label="$t('Chat')",
          no-caps,
          :ripple="false"
        )
          q-badge(v-if="ChatUnReadCount > 0", color="red", floating) {{ ChatUnReadCount }}
        q-tab(
          name="contacts",
          icon="account_box",
          @click="$store.changeTab('contacts')",
          :label="$t('Contacts')",
          no-caps,
          :ripple="false"
        )
          q-badge(v-if="ReceivedList.length > 0", color="red", floating) {{ ReceivedList.length }}
        q-tab(
          name="channel",
          icon="settings_input_antenna",
          @click="$store.changeTab('channel')",
          :label="$t('Channel')",
          no-caps,
          :ripple="false"
        )
        //q-tab(name="collection" icon="bookmarks" :label="$t('Collection')" no-caps :ripple="false")
        q-tab(
          name="me",
          icon="person_outline",
          @click="$store.changeTab('me')",
          :label="$t('Me')",
          no-caps,
          :ripple="false"
        )
          q-badge(v-if="$store.macos !== true && $store.latestVersion !== $store.currentVersion" color="red" floating rounded) New
  q-drawer.mainDrawer(
    v-if="!$store.state.ifScan",
    :no-swipe-close="noSwipeClose",
    v-model="drawer",ref='mainDrawer',
    side="right",
    :overlay="ifMobileSize || $store.state.ifMobileStyle",
    :width="width",
    bordered
  )
    //q-page
    q-tab-panels(
      v-model="kind",
      animated,
      transition-prev="slide-left",
      transition-next="slide-left"
    )
      q-tab-panel(name="message", style="padding:0px 0px")
        message.drawcontent
      q-tab-panel(name="receivedList", style="padding:0px 0px")
        receivedList.drawcontent
      q-tab-panel(name="groupChatList", style="padding:0px 0px")
        groupChatList.drawcontent
      q-tab-panel(name="phoneContactsList", style="padding:0px 0px")
        phoneContactsList.drawcontent
      q-tab-panel(name="contactsTagList", style="padding:0px 0px")
        contactsTagList.drawcontent
      q-tab-panel(name="contactsDetails", style="padding:0px 0px")
        contactsDetails.drawcontent
      q-tab-panel(name="accountInformation", style="padding:0px 0px")
        accountInformation.drawcontent
      q-tab-panel(name="collection", style="padding:0px 0px")
        collection.drawcontent
      q-tab-panel(name="wallet", style="padding:0px 0px")
        wallet.drawcontent
      q-tab-panel(name="setting", style="padding:0px 0px")
        setting.drawcontent
      q-tab-panel(name="findContacts", style="padding:0px 0px")
        findContacts.drawcontent
      q-tab-panel(name="selectContacts", style="padding:0px 0px")
        selectContacts.drawcontent
      q-tab-panel(name="selectConference", style="padding:0px 0px")
        selectConference.drawcontent
      q-tab-panel(name="newChannel", style="padding:0px 0px")
        newChannel.drawcontent
      q-tab-panel(name="newArticle", style="padding:0px 0px")
        newArticle.drawcontent
      q-tab-panel(name="channelDetails", style="padding:0px 0px")
        channelDetails.drawcontent
  videoChat
  q-page-sticky.expend-video-sticky(
    position="bottom-right",
     :offset="fabPos",
    v-if="$store.state.miniVideoDialog"
  )
    q-btn(fab, :disable="draggingFab", v-touch-pan.prevent.mouse="moveFab", icon="settings_phone", color="red", @click="changeMiniVideoDialog")
  q-dialog(v-model="initMigrateDialog" persistent maximized)
    q-card(flat class="fixed-center q-pa-none")
      q-bar(class="bg-primary text-c-grey-0")
        q-item-label {{$t('Migrate (to another Mobile)')}}
        //q-space
        //q-btn(dense flat icon="close" v-close-popup)
      q-card-section#qrCodeCard(class="q-pa-xs")
        q-card(flat class="q-pa-sm")
          q-card-section(align="center" class="q-pt-md")
            canvas#qrCode
          q-card-section(class="q-pt-none")
            div(class="text-center text-c-grey-10 text-caption") {{$t('Please scan the QR code using another mobile to start the migration')}}
      q-card-actions(align="center")
        q-btn.text-primary(unelevated :label="$t('Cancel')" no-caps v-close-popup @click="cancelInitMigrate")
  q-dialog(v-model="migrateDialog" persistent)
    q-card(style="width: 250px")
      q-bar(class="bg-primary text-c-grey-0")
        q-item-label {{$t('Migrate (to another Mobile)')}}
        //q-space
        //q-btn(dense flat icon="close" v-close-popup)
      q-card-section(class="q-pa-lg")
        q-item-label {{$t('Please confirm to receive the migration from another mobile')}}
      q-card-actions(align="around")
        q-btn.text-primary(unelevated :label="$t('Confirm')" no-caps @click="acceptMigrate")
        q-btn.text-primary(unelevated :label="$t('Cancel')" no-caps @click="closeMigrate('Cancel')")
  q-dialog(v-model="initBackupDialog" persistent)
    q-card(style="width: 250px")
      q-bar(class="bg-primary text-c-grey-0")
        q-item-label {{$t('Backup (Mobile to PC)')}}
        //q-space
        //q-btn(dense flat icon="close" v-close-popup)
      q-card-section(class="q-pa-lg")
        q-item-label {{$t('Please login on your computer first, then confirm to initiate the backup')}}
      q-card-actions(align="center")
        q-btn.text-primary(unelevated :label="$t('Confirm')" no-caps @click="initBackup")
        q-btn.text-primary(unelevated :label="$t('Cancel')" no-caps v-close-popup @click="closeInitBackup")
  q-dialog(v-model="backupDialog" persistent)
    q-card(style="width: 250px")
      q-bar(class="bg-primary text-c-grey-0")
        q-item-label {{$t('Backup (Mobile to PC)')}}
        //q-space
        //q-btn(dense flat icon="close" v-close-popup)
      q-card-section(class="q-pt-lg")
        q-item-label {{$t('Please confirm to receive the backup from your mobile')}}
      q-card-section(class="q-pb-lg")
        q-item-label(class="text-primary") {{$t('TIP: ') + $t('This function uses self-signed ssl certificate, when you first time use it, a Not secure error page will be prompted, please click Advanced button and Proceed to ... link.')}}
      q-card-actions(align="around")
        q-btn.text-primary(unelevated :label="$t('Confirm')" no-caps @click="acceptBackup")
        q-btn.text-primary(unelevated :label="$t('Cancel')" no-caps @click="closeBackup('Cancel')")
  q-dialog(v-model="initRestoreDialog" persistent)
    q-card(style="width: 250px")
      q-bar(class="bg-primary text-c-grey-0")
        q-item-label {{$t('Restore (PC to Mobile)')}}
        //q-space
        //q-btn(dense flat icon="close" v-close-popup)
      q-card-section(class="q-pa-lg")
        q-item-label {{$t('Please login on your mobile first, then confirm to initiate the restore')}}
      q-card-actions(align="center")
        q-btn.text-primary(unelevated :label="$t('Confirm')" no-caps @click="initRestore")
        q-btn.text-primary(unelevated :label="$t('Cancel')" no-caps v-close-popup @click="closeInitRestore")
  q-dialog(v-model="restoreDialog" persistent)
    q-card(style="width: 250px")
      q-bar(class="bg-primary text-c-grey-0")
        q-item-label {{$t('Restore (PC to Mobile)')}}
        //q-space
        //q-btn(dense flat icon="close" v-close-popup)
      q-card-section(class="q-pa-lg")
        q-item-label {{$t('Please confirm to restore using the backup from your PC')}}
      q-card-actions(align="around")
        q-btn.text-primary(unelevated :label="$t('Confirm')" no-caps @click="acceptRestore")
        q-btn.text-primary(unelevated :label="$t('Cancel')" no-caps @click="closeRestore('Cancel')")
</template>
<script src="./index.vue.js" />
<style lang="stylus" src="../css/index.styl"/>
