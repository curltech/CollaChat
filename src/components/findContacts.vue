<template lang="pug">
.bg-c-grey-0
  q-tab-panels(
    v-model="$store.state.findContactsSubKind",
    animated,
    transition-prev="slide-right",
    transition-next="slide-left"
  )
    q-tab-panel(:style="heightStyle", name="default", style="padding:0px 0px")
      q-toolbar
        q-btn(
          :class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'",
          flat,
          round,
          icon="keyboard_arrow_left",
          @click="defaultBack"
        )
        q-toolbar-title(
          align="center",
          :style="ifMobileSize || $store.state.ifMobileStyle ? 'padding-right:54px' : ''"
        ) {{ $t('Find Contacts') }}
      q-toolbar(insert)
        q-input.c-field(
          filled,
          dense,
          clearable,
          v-model="$store.state.findLinkmanData.peerId",
          :placeholder="$t('Peer Id')",
          input-class="text-center"
        )
          template(v-slot:after)
            q-btn.btnIcon(
              flat,
              round,
              dense,
              icon="search",
              @click="$store.findContacts(null, null)"
            )
      q-list
        q-item(
          v-if="$store.state.findLinkmanData.peerId && $store.state.findLinkmanResult === 1",
          align="center"
        )
          q-item-section
            q-item-label.text-primary {{ $store.state.findLinkmanTip }}
        q-item(
          v-if="!$store.state.findLinkmanData.peerId",
          clickable,
          v-ripple,
          @click="showQRCodeDialog",
          align="center"
        )
          q-item-section
            q-item-label {{ $t('My Account Information') }}
              q-item-label(caption, lines="1") {{ $store.state.myselfPeerClient.peerId }}
              q-icon(name="qr_code", color="primary")
        //q-item(v-if="!$store.state.findLinkmanData.peerId && $store.ifMobile()" clickable v-ripple @click="$store.phoneContactsEntry = 'findContacts';$store.state.findContactsSubKind='phoneContactsList'")
          q-item-section(avatar)
              q-icon(name="contacts")
          q-item-section {{$t('Phone Contacts')}}
          q-item-section(avatar)
            q-icon(name="keyboard_arrow_right" color="c-grey-5")
        //q-separator(inset="item" v-if="!$store.state.findLinkmanData.peerId && $store.ifMobile()")
        q-item(
          v-if="!$store.state.findLinkmanData.peerId",
          clickable,
          v-ripple,
          @click="enterScan"
        )
          q-item-section(avatar)
            q-icon(name="fullscreen", color="primary")
          q-item-section {{ $t('Scan') }}
          q-item-section(avatar)
            q-icon(name="keyboard_arrow_right", color="c-grey-10")
    q-tab-panel(:style="heightStyle", name="result", style="padding:0px 0px")
      q-toolbar
        q-btn(flat, round, icon="keyboard_arrow_left", @click="resultBack")
      q-list.bg-c-grey-0
        q-item
          q-item-section(avatar, bolder)
            q-avatar(size="64px")
              img(
                :src="$store.findLinkman && $store.findLinkman.avatar ? $store.findLinkman.avatar : $store.defaultActiveAvatar"
              )
          q-item-section
            q-item-label {{ $store.findLinkman ? $store.findLinkman.name : '' }}
            //q-item-label(caption lines="1") {{ $t('Mobile: ') + ($store.findLinkman ? $store.findLinkman.mobile : '') }}
            q-item-label(caption, lines="2") {{ $t('PeerId: ') + ($store.findLinkman ? $store.findLinkman.peerId : '') }}
        q-separator.c-separator(
          style="height:8px;margin-left:0px;margin-right:0px"
        )
        q-item(
          clickable,
          v-ripple,
          @click="showFindAcceptContacts",
          v-if="$store.state.findLinkmanResult === 3"
        )
          q-item-section
          q-item-section(side, style="padding-left:0px")
            q-icon(color="primary", name="person_add")
          q-item-section.text-primary(side) {{ $t('Accept Contacts') }}
          q-item-section
        q-separator.c-separator(v-if="$store.state.findLinkmanResult === 3")
        q-item(
          clickable,
          v-ripple,
          @click="showAddContacts",
          v-if="$store.state.findLinkmanResult === 4"
        )
          q-item-section
          q-item-section(side, style="padding-left:0px")
            q-icon(color="primary", name="person_add")
          q-item-section.text-primary(side) {{ $t('Add Contacts') }}
          q-item-section
    q-tab-panel(
      name="contactsDetails",
      style="padding:0px 0px"
    )
      contactsDetails.drawcontent
    //q-tab-panel(name="phoneContactsList" style="padding:0px 0px")
      phoneContactsList.drawcontent
    q-tab-panel(
      :style="heightStyle",
      name="addContacts",
      style="padding:0px 0px"
    )
      q-toolbar
        q-btn(
          flat,
          round,
          icon="keyboard_arrow_left",
          @click="addContactsBack"
        )
        q-toolbar-title(align="center") {{ $t('Add Contacts') }}
        q-btn(
          flat,
          round,
          dense,
          icon="check",
          color="primary",
          @click="addLinkman"
        )
      q-form.q-gutter-sm.q-pa-sm(ref="formAddContacts", @submit="addLinkman")
        q-input.c-field(
          :label="$t('Invite Message')",
          filled,
          clearable,
          v-model="$store.state.findLinkmanData.message",
          lazy-rules,
          :rules="[]"
        )
        q-input.c-field(
          :label="$t('Given Name')",
          filled,
          clearable,
          v-model="$store.state.findLinkmanData.givenName",
          lazy-rules,
          :rules="[]"
        )
        q-select.c-field(
          :label="$t('Tags') + $t(' (please input Return after input new tags)')",
          filled,
          clearable,
          v-model="$store.state.findLinkmanData.tagNames",
          use-input,
          use-chips,
          multiple,
          input-debounce="0",
          new-value-mode="add-unique",
          :options="filterOptions",
          @filter="filterFn",
          lazy-rules,
          :rules="[]"
        )
    q-tab-panel(
      :style="heightStyle",
      name="acceptContacts",
      style="padding:0px 0px"
    )
      q-toolbar
        q-btn(
          flat,
          round,
          icon="keyboard_arrow_left",
          @click="$store.state.findContactsSubKind = 'result'"
        )
        q-toolbar-title(align="center") {{ $t('Accept Contacts') }}
        q-btn.btnIcon(
          flat,
          round,
          dense,
          icon="check",
          color="primary",
          @click="acceptLinkman"
        )
      q-form.q-gutter-sm.q-pa-sm(
        ref="formAcceptContacts",
        @submit="acceptLinkman"
      )
        q-input.c-field(
          :label="$t('Given Name')",
          filled,
          clearable,
          v-model="$store.state.findLinkmanData.givenName",
          lazy-rules,
          :rules="[]"
        )
        q-select.c-field(
          :label="$t('Tags') + $t(' (please input Return after input new tags)')",
          filled,
          clearable,
          v-model="$store.state.findLinkmanData.tagNames",
          use-input,
          use-chips,
          multiple,
          input-debounce="0",
          new-value-mode="add-unique",
          :options="filterOptions",
          @filter="filterFn",
          lazy-rules,
          :rules="[]"
        )
  q-dialog(v-model="qrCodeDialog")
    q-card.fixed-center.q-pa-none(flat)
      q-card-section.q-pa-xs#qrCodeCard
        q-card.q-pa-sm(flat)
          q-card-section.q-pb-none
            q-avatar
              img(
                :src="$store.state.myselfPeerClient.avatar ? $store.state.myselfPeerClient.avatar : $store.defaultActiveAvatar"
              )
            span.text-h6.q-pl-sm {{ $store.state.myselfPeerClient && $store.state.myselfPeerClient.name ? $store.state.myselfPeerClient.name : '' }}
          q-card-section.q-pa-none(align="center")
            canvas#qrCode
          q-card-section.q-pt-none
            .text-center.text-c-grey-10.text-caption {{ $t('Scan QR code to add me into your contacts') }}
  q-uploader(
    style="display:none",
    ref="upload",
    @added="(files) => upload(files)",
    accept=".jpg, image/*"
  )
</template>
<script src="./findContacts.vue.js" />