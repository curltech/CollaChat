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
        div(class="row justify-between" style="width: 100%")
          div(class="col-3")
            q-input.c-field(prefix="+" filled dense clearable v-model="$store.state.countryCode" :placeholder="$t('Code')" input-class="text-center" lazy-rules :rules="[val => validate(val) || $t('Invalid')]")
          div(class="col-9 q-pl-xs")
            q-form(@submit="search")
              q-input.c-field(
                autofocus,
                filled,
                dense,
                clearable,
                v-model="$store.state.findLinkmanData.peerId",
                :placeholder="$t('PeerId/Mobile/Name')",
                input-class="text-center",
                lazy-rules :rules="[val => val && val.length > 0 || $t('Please input PeerId/Mobile/Name')]"
              )
                template(v-slot:after)
                  q-btn.text-primary(
                    flat,
                    round,
                    dense,
                    icon="search",
                    @click="search"
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
        q-item(v-if="$store.state.findLinkman && ($store.state.findLinkmanResult === 3 || $store.state.findLinkmanResult === 4)")
          q-item-section(avatar, bolder)
            q-avatar(size="64px")
              img(
                :src="$store.state.findLinkman.avatar ? $store.state.findLinkman.avatar : $store.defaultActiveAvatar"
              )
          q-item-section
            q-item-label {{ $store.state.findLinkman.name ? $store.state.findLinkman.name : '' }}
            //q-item-label(caption lines="1") {{ $t('Mobile: ') + ($store.state.findLinkman.mobile ? $store.state.findLinkman.mobile : '') }}
            q-item-label(caption, lines="3", style="word-break:break-all") {{ $t('PeerId: ') + ($store.state.findLinkman.peerId ? $store.state.findLinkman.peerId : '') }}
        q-separator.c-separator(
          v-if="$store.state.findLinkman && ($store.state.findLinkmanResult === 3 || $store.state.findLinkmanResult === 4)",
          style="height:8px;margin-left:0px;margin-right:0px"
        )
        q-item(
          clickable,
          v-ripple,
          @click="showAcceptContacts(null)",
          v-if="$store.state.findLinkmanResult === 3"
        )
          q-item-section
          q-item-section(side, style="padding-left:0px")
            q-icon(color="primary", name="person_add")
          q-item-section.text-primary(side) {{ $t('Accept Contacts') }}
          q-item-section
        q-item(
          clickable,
          v-ripple,
          @click="showAddContacts(null)",
          v-if="$store.state.findLinkmanResult === 4"
        )
          q-item-section
          q-item-section(side, style="padding-left:0px")
            q-icon(color="primary", name="person_add")
          q-item-section.text-primary(side) {{ $t('Add Contacts') }}
          q-item-section
      div(v-for="(linkman, index) in $store.state.findLinkmans" :key="linkman.peerId")
        q-item
          q-item-section(avatar, bolder)
            q-avatar(size="64px")
              img(
                :src="linkman && linkman.avatar ? linkman.avatar : $store.defaultActiveAvatar"
              )
          q-item-section
            q-item-label {{ linkman ? linkman.name : '' }}
            //q-item-label(caption lines="1") {{ $t('Mobile: ') + (linkman ? linkman.mobile : '') }}
            q-item-label(caption, lines="3", style="word-break:break-all") {{ $t('PeerId: ') + (linkman ? linkman.peerId : '') }}
        q-separator.c-separator(
          style="height:8px;margin-left:0px;margin-right:0px"
        )
        q-item(
          clickable,
          v-ripple,
          @click="showContactsDetails(linkman)",
          v-if="linkman.findLinkmanResult === 2"
        )
          q-item-section
          q-item-section(side, style="padding-left:0px")
            q-icon(color="primary", name="person")
          q-item-section.text-primary(side) {{ $t('Contacts Details') }}
          q-item-section
        q-item(
          clickable,
          v-ripple,
          @click="showAcceptContacts(linkman)",
          v-if="linkman.findLinkmanResult === 3"
        )
          q-item-section
          q-item-section(side, style="padding-left:0px")
            q-icon(color="primary", name="person_add")
          q-item-section.text-primary(side) {{ $t('Accept Contacts') }}
          q-item-section
        q-item(
          clickable,
          v-ripple,
          @click="showAddContacts(linkman)",
          v-if="linkman.findLinkmanResult === 4"
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
        q-btn.text-primary(
          flat,
          round,
          dense,
          icon="check",
          @click="addLinkman"
        )
      q-form(
        ref="formAddContacts",
        @submit="addLinkman"
        class="q-pa-sm"
      )
        q-input.c-field(
          autofocus,
          :label="$t('Invite Message')",
          filled,
          clearable,
          v-model="addFindLinkmanData.message",
          lazy-rules,
          :rules="[]"
        )
        p
        q-input.c-field(
          :label="$t('Given Name')",
          filled,
          clearable,
          v-model="addFindLinkmanData.givenName",
          lazy-rules,
          :rules="[]"
        )
        p
        q-select.c-field(
          :label="$t('Tags') + $t(' (please input Return after input new tags)')",
          filled,
          clearable,
          v-model="addFindLinkmanData.tagNames",
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
        q-btn.text-primary(
          flat,
          round,
          dense,
          icon="check",
          @click="acceptLinkman"
        )
      q-form(
        ref="formAcceptContacts",
        @submit="acceptLinkman"
        class="q-pa-sm"
      )
        q-input.c-field(
          autofocus,
          :label="$t('Given Name')",
          filled,
          clearable,
          v-model="acceptFindLinkmanData.givenName",
          lazy-rules,
          :rules="[]"
        )
        p
        q-select.c-field(
          :label="$t('Tags') + $t(' (please input Return after input new tags)')",
          filled,
          clearable,
          v-model="acceptFindLinkmanData.tagNames",
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
        q-card(flat class="q-pa-sm")
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