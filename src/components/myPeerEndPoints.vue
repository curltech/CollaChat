<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="$store.changeAdvanceSettingSubKind('default')")
          q-toolbar-title(align="center") {{$t('MyNodes') + '(' + data.length + ')'}}
          q-btn.text-primary(flat round icon="add_circle_outline" @click="showAddItem")
        q-toolbar(insert class="q-px-xs")
          q-input.c-field(debounce="100" filled dense v-model="filter" :placeholder="placeholder" input-class="text-center iconfont")
            template(slot="append")
              //q-icon(v-if="!filter" name="search")
              //q-icon(v-else name="cancel" class="cursor-pointer" @click.stop="filter = null")
              q-icon(v-if="filter" name="cancel" class="cursor-pointer" @click.stop="filter = null")
        q-table(hide-bottom dense flat square :data="data" :columns="columns" row-key="peerId"
          :loading="loading" @request="onRequest"
          :pagination.sync="pagination"
          :filter="filter"
          :sort-method="customSort" binary-state-sort
          @row-click="showModifyItem")
      q-tab-panel(:style="heightStyle" name="modifyItem" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          q-toolbar-title(align="center") {{ $t('Edit Node') }}
          q-btn(flat round icon="check" @click="modify" :disable="!mpepData.address" :class="mpepData.address?'text-primary':'c-grey-0'")
        q-form(ref="formModify" @submit="modify" class="q-pa-sm")
          q-select.c-field(filled :label="$t('No')" v-model="mpepData.priority" :options="options")
          p
          q-input.c-field(filled :label="$t('Node Address')" clearable v-model="mpepData.address" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input Node Address')]")
          //p
          //q-input.c-field(readonly filled :label="$t('Node PeerId')" clearable v-model="mpepData.peerId")
          //p
          //q-input.c-field(autogrow readonly filled :label="$t('PublicKey')" clearable v-model="mpepData.publicKey")
        q-list(class="q-pt-sm")
          q-item
            q-item-section(align="center")
              q-btn(:label="$t('Remove')" unelevated color="primary" class="text-c-grey-0" @click="confirmRemove")
      q-tab-panel(:style="heightStyle" name="addItem" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          q-toolbar-title(align="center") {{ $t('Add Node') }}
          q-btn(flat round icon="check" @click="add" :disable="!mpepData.address" :class="mpepData.address?'text-primary':'c-grey-0'")
        q-form(ref="formAdd" @submit="add" class="q-pa-sm")
          q-select.c-field(filled :label="$t('No')" v-model="mpepData.priority" :options="options")
          p
          q-input.c-field(autofocus filled :label="$t('Node Address')" clearable v-model="mpepData.address" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input Node Address')]")
</template>
<script src="./myPeerEndPoints.vue.js" />