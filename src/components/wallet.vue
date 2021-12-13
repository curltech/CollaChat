<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" style="padding:0px 0px")
        q-toolbar
          q-btn(:class="ifMobileSize || $store.state.ifMobileStyle ? '' : 'hidden'" flat round icon="keyboard_arrow_left" @click="$store.toggleDrawer(false)")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? '' : 'padding-left:54px'") {{ loading ? $t('Updating...') : $t('Wallet') }}
          q-btn.text-primary(flat round icon="receipt" @click="subKind = 'transaction'" no-caps)
        q-list
          q-item(style="padding-top:30px")
            q-space
            q-img(src="@/assets/colla-o1.png" style="height: 64px; width: 64px")
            q-space
          q-item(align="center")
            q-item-section
              q-item-label {{$t('My CollaCoin')}}
          q-item(align="center")
            q-item-section
              q-item-label(class="text-h4 text-bold") {{ balance }}
          q-item(style="padding-top:300px")
            q-item-section
              q-btn(style="width:200px;height:40px;margin:auto" unelevated color="primary" :label="$t('Deposite')" no-caps @click="")
      q-tab-panel(:style="heightStyle" name="transaction" style="padding:0px 0px")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
          q-toolbar-title(align="center") {{$t('Transactions') + '(' + peerTrans.length + ')'}}
          q-btn.text-primary(flat round icon="save_alt" no-caps :disable="!peerTrans.length" @click="showExportDialog")
        q-list
          q-item(class="q-px-none")
            q-item-section(class="q-px-xs")
              q-select.c-field(dense filled :label="$t('Trans Type')" v-model="transactionType" emit-value map-options :options="transactionTypeOptions")
            q-item-section(class="q-px-xs")
              q-select.c-field(dense filled :label="$t('Year')" v-model="year" :options="yearOptions")
            q-item-section(class="q-px-xs" v-if="year !== $t('Recent-Year')")
              q-select.c-field(dense filled :label="$t('Month')" v-model="month" :options="monthOptions")
          q-item
            q-item-section(side)
              q-item-label {{ $t('Pay: ') + paySum }}
            q-item-section(side)
              q-item-label {{ $t('Receive: ') + receiveSum }}
        q-list
          q-pull-to-refresh(@refresh="syncTransactions")
          q-infinite-scroll(@load="loadTransactions" debounce="100" :offset="50")
            div(v-for="(peerTran, index) in peerTrans" :key="index")
              q-item(clickable v-ripple @click="")
                q-item-section(avatar)
                  q-icon(color="primary" :name="transactionTypeIcon(peerTran)")
                q-item-section
                  q-item-label {{ peerTran.counterpartPeerId }}
                  q-item-label(caption) {{ peerTran.blockId }}
                  q-item-label(caption) {{ peerTran.transactionTime }}
                q-item-section(side)
                  q-item-label(class="text-bold") {{ peerTran.amount }}
              q-separator.c-separator(inset="item" v-if="index < peerTrans.length - 1")
              q-separator.c-separator(v-if="index === peerTrans.length - 1")
            q-item(v-if="noMoreRecordsFlag")
              q-item-section(align="center")
                q-item-label(caption) {{ $t('No more records') }}
    q-dialog(v-model="exportDialog" persistent)
      q-card
        q-bar(class="bg-primary text-c-grey-0")
          q-space
          q-btn(dense flat icon="close" v-close-popup)
        q-card-section
          q-form(ref="formExportBill" @submit="exportBill")
            q-input.c-field(:label="$t('Please input Password')" autofocus dense filled clearable v-model="password" type="password" lazy-rules :rules="[]")
        q-card-actions(align="right")
          q-btn(color="primary" round icon="check" unelevated v-close-popup @click="exportBill")
</template>
<script src="./wallet.vue.js" />