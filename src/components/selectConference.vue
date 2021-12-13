<template lang="pug">
div
  q-tab-panels.bg-c-grey-0.text-c-grey-10(
    v-model="subKind",
    animated,
    transition-prev="slide-right",
    transition-next="slide-left"
  )
    q-tab-panel(:style="heightStyle", name="default", style="padding:0px 0px")
      q-toolbar
        q-btn(flat, round, icon="keyboard_arrow_left", @click="back")
        q-toolbar-title(align="center", style="padding-left:84px") {{ $t('Conference') }}
        q-btn.text-primary(flat, round, icon="alarm_add", @click="add")
        q-btn.text-primary(
          flat,
          round,
          icon="addchart",
          @click="showJoinDialog"
        )
        q-btn.text-primary(
          flat,
          round,
          icon="history",
          @click="subKind = 'history'"
        )
      q-form(class="q-pa-sm")
        q-input.c-field(
          v-model="conference.peerId",
          :label="$t('Your peerId')",
          clearable,
          filled,
          borderless,
          lazy-rules,
          :rules="[(val) => (val && val.length > 0) || 'Cannot be null']"
        )
        q-input.c-field(
          v-model="conference.conferenceId",
          :label="$t('Your conferenceId')",
          clearable,
          filled,
          lazy-rules,
          :rules="[(val) => (val && val.length > 0) || 'Cannot be null']"
        )
        q-input.c-field(
          v-model="conference.password",
          clearable,
          filled,
          :label="$t('Your password')"
        )
        q-toggle(v-model="conference.linkman", label="If only linkman")
        q-toggle(v-model="conference.contact", label="If only contact")
        q-toggle(
          v-model="conference.notification",
          :label="$t('If open notification')"
        )
        q-toggle(v-model="conference.mute", label="If mute")
        q-toggle(v-model="conference.video", label="If open video")
        q-toggle(v-model="conference.wait", label="If can wait")
        q-toggle(v-model="conference.advance", label="If can advance")
        q-input.c-field(
          v-model="conference.startDate",
          clearable,
          filled,
          :label="$t('Your startDate')"
        )
          template(v-slot:prepend) 
            q-icon.cursor-pointer(name="event", color="primary")
              q-popup-proxy(transition-show="scale", transition-hide="scale")
                q-date(v-model="conference.startDate", mask="YYYY-MM-DD HH:mm")
                  q-toolbar
                    q-space
                    q-btn(
                      icon="close",
                      unelevated,
                      dense,
                      round,
                      color="primary",
                      v-close-popup
                    )
          template(v-slot:append)
            q-icon.cursor-pointer(name="access_time", color="primary")
              q-popup-proxy(transition-show="scale", transition-hide="scale")
                q-time(
                  v-model="conference.startDate",
                  mask="YYYY-MM-DD HH:mm",
                  format24h
                )
                  q-toolbar
                    q-space
                    q-btn(
                      icon="close",
                      unelevated,
                      dense,
                      round,
                      color="primary",
                      v-close-popup
                    )
        p
        q-input.c-field(
          v-model="conference.endDate",
          clearable,
          filled,
          :label="$t('Your endDate')"
        )
          template(v-slot:prepend) 
            q-icon.cursor-pointer(name="event", color="primary")
              q-popup-proxy(transition-show="scale", transition-hide="scale")
                q-date(v-model="conference.endDate", mask="YYYY-MM-DD HH:mm")
                  q-toolbar
                    q-space
                    q-btn(
                      icon="close",
                      unelevated,
                      round,
                      color="primary",
                      v-close-popup
                    )
          template(v-slot:append)
            q-icon.cursor-pointer(name="access_time", color="primary")
              q-popup-proxy(transition-show="scale", transition-hide="scale")
                q-time(
                  v-model="conference.endDate",
                  mask="YYYY-MM-DD HH:mm",
                  format24h
                )
                  q-toolbar
                    q-space
                    q-btn(
                      icon="close",
                      unelevated,
                      round,
                      color="primary",
                      v-close-popup
                    )
        p
        q-input.c-field(
          type="number",
          clearable,
          filled,
          v-model="conference.number",
          :label="$t('Max number')",
          lazy-rules
        )
        q-toolbar
          q-btn.q-ml-sm(
            type="reset",
            flat,
            round,
            icon="clear",
            @click="reset"
          )
          q-space
          q-btn.text-primary(
            flat,
            round,
            icon="schedule",
            @click="schedule"
          )
    q-tab-panel(:style="heightStyle", name="history", style="padding:0px 0px")
      q-toolbar
        q-btn(
          flat,
          round,
          icon="keyboard_arrow_left",
          @click="subKind = 'default'"
        )
        q-toolbar-title(align="center", style="padding-right:54px") {{ $t('Conference history') }}
      q-list
        q-item
          q-item-section
            q-item-label {{ $t('Peer Id') }}
          q-item-section(side)
        q-separator.c-separator(
          style="margin-left:16px;width:calc(100% - 16px)"
        )
  q-dialog(v-model="joinDialog", persistent)
    q-card(style="width: 300px")
      q-bar.bg-primary.text-c-grey-0
        q-space
        q-btn(dense, flat, icon="close", v-close-popup)
      q-card-section
        q-form(ref="formJoin",
          @submit="join",
          class="q-pa-sm")
          q-input.c-field(
            :label="$t('Please input PeerId')",
            autofocus,
            clearable,
            filled,
            v-model="joinData.peerId",
            lazy-rules,
            :rules="[]"
          )
          q-input.c-field(
            :label="$t('Please input ConferenceId')",
            clearable,
            filled,
            v-model="joinData.conferenceId",
            lazy-rules,
            :rules="[]"
          )
          q-input.c-field(
            :label="$t('Please input Password')",
            clearable,
            filled,
            v-model="joinData.password",
            lazy-rules,
            :rules="[]"
          )
      q-card-actions(align="right")
        q-btn(
          color="primary",
          icon="group_add",
          round,
          unelevated,
          v-close-popup,
          no-caps,
          @click="join"
        )
</template>
<script src="./selectConference.vue.js" />