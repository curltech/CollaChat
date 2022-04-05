<template lang="pug">
  div.bg-c-grey-0
    q-tab-panels(v-model="subKind" animated transition-prev="slide-right" transition-next="slide-left")
      q-tab-panel(:style="heightStyle" name="default" class="q-pa-none")
        q-toolbar.header-toolbar
          q-btn(v-if="ifMobileSize || $store.state.ifMobileStyle || $store.collectionEntry === 'message'" flat round icon="keyboard_arrow_left" @click="back()")
          q-toolbar-title(align="center" :style="ifMobileSize || $store.state.ifMobileStyle ? ($store.collectionEntry === 'message' ? '' : (collectionTypeIndex === 0 || collectionTypeIndex === 1 ? 'padding-left:54px' : '')) : ($store.collectionEntry === 'message' ? 'padding-right:54px' : (collectionTypeIndex === 0 || collectionTypeIndex === 1 ? 'padding-left:96px' : 'padding-left:54px'))") {{ cloudSyncing ? $t('Updating...') : $t('Collection') + '-' + $t(collectionTypes[collectionTypeIndex].value) + '(' + myCollections.length + ')' }}
          q-btn.text-primary(v-if="$store.collectionEntry !== 'message'" flat round icon="sync" @click="cloudSync()")
          q-btn.text-primary(v-if="$store.collectionEntry !== 'message' && (collectionTypeIndex === 0 || collectionTypeIndex === 1)" flat round icon="add_circle_outline" @click="insert")
          q-btn(v-if="$store.collectionEntry === 'message'" flat round icon="check" :disable="$store.state.selectedCollectionItems.length < 1" :label="($store.state.selectedCollectionItems.length > 0 ? '(' + $store.state.selectedCollectionItems.length + ')' : '')" :class="$store.state.selectedCollectionItems.length > 0 ? 'text-primary' : 'c-grey-0'" @click="doneSelectCollectionItem")
        div.scroll.header-mar-top(id="scroll-target-default" :class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-editor' : 'scrollHeightMobileStyle-editor') : 'scrollHeightStyle'")
          q-pull-to-refresh(@refresh="cloudSync" color="primary" bg-color="c-grey-0" icon="sync")
            q-infinite-scroll(@load="load" debounce="100" :offset="150" scroll-target="#scroll-target-default")
              q-toolbar(insert class="q-px-xs")
                q-input.c-field(debounce="100" filled dense v-model="searchText" :placeholder="placeholder" input-class="text-center iconfont" @focus="searchFocus")
                  template(slot="append")
                    q-icon(v-if="searchText" name="cancel" class="cursor-pointer" @click.stop="searchText = null")
              ly-tab.cursor-pointer(v-model="collectionTypeIndex" :items="collectionTypes" :options="collectionTypeOptions" @change="changeCollectionType")
              q-list
                div(v-for="(item, index) in myCollections" :key="index")
                  div(clickable v-ripple @click="collectionSelected(item, index)")
                    notePreview(v-bind:item = "item" entry = "collection")
                  q-separator.c-separator
                q-item(v-if="collectionDone===true")
                  q-item-section(align="center")
                    q-item-label(caption) {{ $t('No more records') }}
              template(slot="collectionLoading")
                div(class="row justify-center q-my-md")
                  q-spinner(name="dots" size="40px")
      q-tab-panel(:style="heightStyle" name="search" class="q-pa-none")
        q-toolbar.header-toolbar
          q-input.c-field(:disable="$store.state.myselfPeerClient.localDataCryptoSwitch===true" debounce="100" filled dense v-model="searchText" :placeholder="placeholder2" input-class="iconfont" style="width: 86%" autofocus :prefix="collectionType && collectionType !== CollectionType.ALL ? $t(collectionType) : ''" @keyup="searchKeyup" @focus="searchTextFocus")
            template(slot="append")
              q-icon(v-if="searchText" name="cancel" class="cursor-pointer" @click.stop="searchText = null")
          q-btn.text-primary(flat round icon="close" @click="searchBack()")
        div.scroll.header-mar-top(v-if="search===false")
          q-list
            q-item
              q-item-section(side)
                q-item-label(caption) {{$t('All Tags') + '(' + $store.state.collectionTags.length + ')'}}
            //div(class="q-pl-md q-py-xs") {{$t('All Tags') + '(' + $store.state.collectionTags.length + ')'}}
            div(v-for="(tag, index) in $store.state.collectionTags" :key="index")
              q-item(clickable v-ripple :class="SearchTag(tag) ? 'text-primary' : ''" active-class="bg-c-grey-2" :active="TouchTag(tag)" @click="tagSelected(tag, index)" @touchstart="tagTouched(tag, index)")
                q-item-section
                  q-item-label {{ tag }}
                q-menu(touch-position context-menu)
                  q-list.bg-black.text-c-white(dense)
                    q-item(style="width: 100px;padding: 0px 0px")
                      q-item-section(class="cursor-pointer" align="center" @click="showEditTag(tag, index)" v-close-popup) {{$t('Edit')}}
                      q-separator.c-separator(vertical)
                      q-item-section(class="cursor-pointer" align="center" @click="confirmRemoveTag(tag, index)" v-close-popup) {{$t('Delete')}}
              q-separator.c-separator
        div.scroll.header-mar-top(v-if="search===true" id="scroll-target-search" :class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-editor' : 'scrollHeightMobileStyle-editor') : 'scrollHeightStyle'")
          q-infinite-scroll(@load="load" debounce="100" :offset="150" scroll-target="#scroll-target-search")
            q-list
              div(v-for="(item, index) in myCollections" :key="index")
                div( clickable v-ripple @click="collectionSelected(item, index)")
                  notePreview(v-bind:item = "item" entry = "collectionSearch")
                q-separator.c-separator
              q-item(v-if="collectionDone===true")
                q-item-section(align="center")
                  q-item-label(caption) {{ $t('No more records') }}
            template(slot="collectionLoading")
              div(class="row justify-center q-my-md")
                q-spinner(name="dots" size="40px")
      q-tab-panel(:style="heightStyle" name="view" class="q-pa-none")
        q-toolbar.header-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind='default'")
          q-space
          q-btn.text-primary(v-if="$store.collectionEntry !== 'message'" flat round icon="more_horiz" @click="viewCommand()")
        div.scroll.header-mar-top.bg-c-white(id="scroll-target-view" :class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-editor' : 'scrollHeightMobileStyle-editor') : 'scrollHeightStyle'" style="padding-left:10px;padding-right:10px;")
          iframe(v-if="myCollections.c_meta.current && myCollections.c_meta.current.content && myCollections.c_meta.current.content.substr(0,4)==='http'" id="iframeContent"
            :src="myCollections.c_meta.current.content" frameborder="no" border="0" marginwidth="0" marginheight="0" allowtransparency="yes" scrolling="yes")
          div(v-if="myCollections.c_meta.current && myCollections.c_meta.current.content && myCollections.c_meta.current.content.substr(0,4)!=='http' && myCollections.c_meta.current.collectionType !== CollectionType.VOICE && myCollections.c_meta.current.collectionType !== CollectionType.FILE && myCollections.c_meta.current.collectionType !== CollectionType.CHAT && myCollections.c_meta.current.collectionType !== CollectionType.CARD" v-html="myCollections.c_meta.current.content" @click="clickContentHTML")
          mobileAudio(style='margin-left:20px' v-if="myCollections.c_meta.current && myCollections.c_meta.current.content && myCollections.c_meta.current.collectionType === CollectionType.VOICE" :src="myCollections.c_meta.current.content" )
          q-btn(style='margin-left:20px' v-if="myCollections.c_meta.current && myCollections.c_meta.current.content && myCollections.c_meta.current.collectionType === CollectionType.FILE" dark-percentage unelevated color="secondary" text-color="grey-1" @click="fileCollectionDownload" icon="cloud_download")
            span {{myCollections.c_meta.current.firstFileInfo}}
          q-card-section(v-if="myCollections.c_meta.current && myCollections.c_meta.current.content && (myCollections.c_meta.current.collectionType === CollectionType.CHAT || myCollections.c_meta.current.collectionType === CollectionType.CARD)")
            template(v-for="(message,index) in JSON.parse(myCollections.c_meta.current.plainContent)")
                messageContent(v-bind:message = "message" entry = "mergeMessage")
      q-tab-panel(:style="heightStyle" name="edit" class="q-pa-none")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="editBack()")
          q-space
          //q-toolbar-title(align="center") {{ $t('Note') }}
          //q-btn.text-primary(flat round icon="attach_file" @click="subKind='attachment'")
            q-badge(v-if="myCollections.c_meta.current && myCollections.c_meta.current.attachAmount > 0" floating) {{ myCollections.c_meta.current.attachAmount }}
          q-btn.text-primary(flat round icon="more_horiz" @click="editCommand()")
        div.wangEditorToolbarMobileStyle(ref="editorToolbar")
        div.bg-c-white(ref="editorContainer" :class="ifMobileSize || $store.state.ifMobileStyle ? (ifMobileSize ? 'scrollHeightMobileSize-wangEditor' : 'scrollHeightMobileStyle-wangEditor') : 'scrollHeightStyle'")
      q-tab-panel(:style="heightStyle" name="tag" class="q-pa-none")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind=tagEntry")
          q-toolbar-title(align="center") {{ $t('Edit Tags') }}
          q-btn(flat round icon="check" :disable="!collectionData.tags || collectionData.tags.length === 0" :class="collectionData.tags && collectionData.tags.length > 0 ? 'text-primary' : 'c-grey-0'" @click="saveTag()")
        q-form(ref="formEditTags" @submit="saveTag()")
          div(style="margin-left:12px" class="text-c-grey-10 q-my-sm") {{ $t('Tags') + $t(' (please input Return after input new tags)') }}
          q-select.c-field(v-if="myCollections.c_meta.current" color="c-grey-7" square standout hide-bottom-space clearable v-model="collectionData.tags"
            use-input use-chips multiple input-debounce="0" new-value-mode="add-unique" @new-value="createNewTag" :options="filterOptions" @filter="filterFn" lazy-rules :rules="[]")
      q-tab-panel(:style="heightStyle" name="tagName" class="q-pa-none")
        q-toolbar
          q-btn(flat round icon="keyboard_arrow_left" @click="subKind = 'search'")
          q-toolbar-title(align="center") {{ $t('Tag Name') }}
          q-btn(flat round icon="check" ':disable'="!tagName" :class="tagName ? 'text-primary' : 'c-grey-0'" @click="saveTagName")
        q-form(ref="formTagName")
          div(style="margin-left:12px" class="text-c-grey-10 q-my-sm") {{ $t('Name') }}
          q-input.c-field(bg-color="c-white" color="c-grey-3" square outlined hide-bottom-space clearable autofocus v-model="tagName" lazy-rules :rules="[ val => val && val.length > 0 || $t('Please input Name'), val => !tagExceedsLengthLimit(val) || $t('Tag name exceeds length limit'), val=> !tagAlreadyExists(val) || $t('Tag name already exists') ]")
      q-tab-panel.bg-black#selectedContainer(:style="heightStyle" name="fullscreen" class="q-pa-none" align="center")
        q-toolbar(v-if="selected && selected.nodeName === 'VIDEO'" style="z-index: 999")
          q-btn.text-primary(flat round icon="close" @click="fullscreenBack")
          q-space
          q-btn.text-primary(flat round icon="more_horiz" @click="videoCommand()")
        q-toolbar(v-if="selected && selected.nodeName === 'IMG'" style="z-index: 999")
          q-btn.text-primary(flat round icon="close" @click="fullscreenBack")
          q-space
          q-btn.text-primary(flat round icon="more_horiz" @click="imageCommand()")
        img#selectedImg(v-if="selected && selected.nodeName === 'IMG'" :src="selected.src" :style="fullscreenStyle")
        canvas#selectedCanvas(v-if="selected && selected.nodeName === 'IMG'" class="hidden")
        video#selectedVideo(v-if="selected && selected.nodeName === 'VIDEO'" @canplay="canPlay" :src="selected.src" :style="fullscreenStyle" controls webkit-playsinline playsinline x5-playsinline x-webkit-airplay="allow" autoplay)
      q-tab-panel(name="selectChat" style="padding:0px 0px")
        selectChat.drawcontent
      q-tab-panel(name="captureMedia" style="padding:0px 0px")
        captureMedia.drawcontent
</template>
<script src="./collection.vue.js" />
