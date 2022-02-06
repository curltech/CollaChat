<template lang="pug">
  q-layout#layout(':style'="layoutStyle")
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
    canvas#qr-canvas(class="hidden" style="width: 256;height: 256")
    q-page-container(:class="$store.state.ifScan ? 'hidden' : ''")
      //q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
        q-tab-panel(name="default" style="padding:0px 0px")
      q-card.grad(flat v-if="subKind==='default'" class="full-height fixed-center q-pa-none" ':style'="cardStyle")
        q-toolbar.loginToolbar(class="q-pa-none" style="margin-top: auto; margin-bottom: auto")
          q-btn(color="primary" flat icon="photo" @click="changeBackground")
          q-space
          q-btn(color="primary" flat icon="settings" no-caps @click="subKind='setting'")
        q-card-section(align="center" class="q-py-none")
          q-card(flat class="fixed-center background-color: transparent")
            q-card-section(align="center")
              q-img(src="@/assets/colla.png" style="height: 120px; width: 137px")
              div(class="text-center text-h6") {{$t('Secure Your Collaboration')}}
            q-card-section(align="center")
              q-form(ref="frmLogin" @submit="login" class="q-pa-none")
                q-input.c-field(style="width:280px" filled dense clearable v-model="loginData.name_" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input Name')]" :label="$t('UserName')")
                //q-select.c-field(style="width:280px;padding-bottom:5px" filled dense v-model="loginData.countryRegion_" :options="options" :label="$t('Country/Region')"
                  clearable
                  use-input
                  hide-selected
                  fill-input
                  input-debounce="0"
                  @filter="filterFnAutoselect"
                  @filter-abort="abortFilterFn")
                  template(v-slot:no-option)
                    q-item
                      q-item-section {{$t('No results')}}
                //div(style="width:280px" class="row justify-between")
                  div(class="col-4")
                    q-input.c-field(prefix="+" filled dense clearable v-model="loginData.code_" lazy-rules :rules="[val => val && val.length > 0 || $t('Code')]")
                      //template(v-slot:prepend)
                        q-icon(name="add" size="10px")
                  div(class="col-8 q-pl-md")
                    q-input.c-field(filled dense clearable v-model="loginData.mobile_" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input Mobile')]" :label="$t('Mobile')")
                q-input.c-field(style="width:280px" type="password" filled dense clearable v-model="loginData.password_" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input Password')]" :label="$t('Password')")
                q-btn(style="width:280px;height:40px" type="submit" color="primary" unelevated :label="$t('Login')" no-caps)
            q-card-section(align="center")
              q-btn(:label="$t('Register')" @click="subKind = 'register'" flat no-caps)
              q-btn(:label="$t('Import')" @click="enterScan" flat no-caps)
              //q-uploader(style="display:none" ref="upload" @added="files => upload(files)" accept=".db")
              q-uploader(style="display:none" ref="upload" @added="(files) => upload(files)" accept=".jpg, image/*")
      q-card.grad(flat v-if="subKind==='register'" class="full-height fixed-center q-pa-none" :style="cardStyle")
        q-toolbar(class="q-pa-none" style="margin-top: auto; margin-bottom: auto")
          q-btn(flat round icon="keyboard_arrow_left"  @click="subKind = 'default'")
          q-space
          q-btn(color="primary" flat icon="settings" no-caps @click="subKind='setting'")
        q-card-section(align="center")
          q-card(flat class="fixed-center background-color: transparent")
            q-card-section
              q-form(ref="frmRegister" @submit="register" class="q-pa-none")
                q-input.c-field(style="width:280px" filled dense clearable v-model="registerData.name_" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input Name')]" :label="$t('UserName')")
                q-input.c-field(style="width:280px" type="password" filled dense clearable v-model="registerData.password_" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input Password')]" :label="$t('Password')")
                q-input.c-field(style="width:280px" type="password" filled dense clearable v-model="registerData.repeatPassword_" lazy-rules :rules="[val => val && val.length > 0 || $t('Please input RepeatPassword')]" :label="$t('RepeatPassword')")
                q-item-label.text-primary(caption align="left") {{$t("It's recommended to attach your mobile number so that your friends can reach you easier, of cause, you may do this later in Profile, and you may switch it off at any time in Privacy-Visibility Setting.")}}
                q-select.c-field(style="width:280px;padding-top:15px;padding-bottom:5px" filled dense v-model="registerData.countryRegion_" :options="options" :label="$t('Country/Region')"
                  clearable
                  use-input
                  hide-selected
                  fill-input
                  input-debounce="0"
                  @filter="filterFnAutoselect"
                  @filter-abort="abortFilterFn")
                  template(v-slot:no-option)
                    q-item
                      q-item-section {{$t('No results')}}
                div(style="width:280px" class="row justify-between")
                  div(class="col-4")
                    q-input.c-field(prefix="+" filled dense clearable v-model="registerData.code_" lazy-rules :rules="[val => val && val.length > 0 || $t('Code')]")
                      //template(v-slot:prepend)
                        q-icon(name="add" size="12px")
                  div(class="col-8 q-pl-md")
                    q-input.c-field(filled dense clearable v-model="registerData.mobile_" lazy-rules :rules="[]" :label="$t('Mobile')")
                q-btn(style="width:280px;height:40px" type="submit" unelevated color="primary" :label="$t('Register')" no-caps)
      q-card.grad(flat v-if="subKind==='setting'" class="full-height fixed-center" :style="cardStyle")
        q-card-section
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'default'")
        q-card-section(align="center")
          q-card(flat class="fixed-center background-color: transparent")
            q-card-section
              q-form(ref="frmSetting")
                q-select.c-field(style="width:280px;padding-bottom:20px" :label="$t('Language')" filled dense v-model="language" emit-value map-options :options="languageOptions")
                //div(style="width:280px" align="left" class="q-pa-sm")
                  q-toggle(v-model="connectAddressType" false-value="default" true-value="custom" left-label :label="$t('Custom Node')")
                //q-input.c-field(style="width:280px" :disable="connectAddressType !== 'custom'?true:false" filled dense clearable v-model="connectAddress" lazy-rules :rules="[val => (connectAddressType === 'default' || (connectAddressType === 'custom' && val && val.length > 0)) || $t('Please input Node Address')]" :label="$t('Node Address')")
                q-select.c-field(style="width: 280px !important;padding-bottom:5px" :label="$t('MyNodes')" filled dense clearable v-model="connectAddress" emit-value map-options :options="connectAddressOptions")
                p
                div(:class="connectAddress === 'custom' ? '' : 'hidden'")
                  q-input.c-field(style="width:280px !important"
                    filled dense clearable v-model="customConnectAddress"
                    lazy-rules :rules="[val => (connectAddress !== 'custom' || (connectAddress === 'custom' && val && val.length > 0)) || $t('Please input Node Address')]"
                    :label="$t('Node Address')")
</template>
<script src="./login.vue.js" />
<style lang="stylus" src="../css/login.styl"/>