<template lang="pug">
  div.bg-c-grey-0#videoContainer(:style="heightStyle" align="center")
    q-toolbar(v-if="$store.captureType === 'image' || $store.captureType === 'video'")
      q-space
      q-btn.text-primary(v-if="!imageUrl && !videoUrl && captureStatus===false" flat round icon="flip_camera_ios" @click="reverseCamera")
    q-carousel#videoCarousel(v-if="$store.captureType === 'image' || $store.captureType === 'video'" v-model="captureSlide")
      q-carousel-slide(name="1" class="q-pa-none")
        video(ref="srcVideo" id="srcVideo" :srcObject="srcStream" muted webkit-playsinline playsinline x5-playsinline x-webkit-airplay="allow")
      template(v-slot:control)
        q-carousel-control(v-if="imageUrl || videoUrl" position="bottom" :offset="imageUrl?[0, 0]:[0, -6]")
          img(v-if="imageUrl" :src="imageUrl")
          video(v-if="videoUrl" ref="videoReplayer" id="videoReplayer" :src="videoUrl" controls autoplay webkit-playsinline playsinline x5-playsinline x-webkit-airplay="allow")
    div(v-if="$store.captureType === 'audio'" class="pd recpower" align="center")
      //div(style="height:40px; width:100%; position:relative;")
        div(class="recpowerx" style="height:40px; background:#0B1; position:absolute;")
      div(class="recpowert" style="height:140px; width:100%; line-height:140px; color:#fff;")
    div(v-if="$store.captureType === 'audio'" class="pd waveBox")
      //div(style="border:1px solid #ccc; display:inline-block;")
      div(class="recwave" style="width:100%; verticle-align:middle;" :style="recwaveHeightStyle")
    div(v-if="$store.captureType === 'audio'" style="height:60px; width:100%;")
      audio(v-if="audioUrl" ref="audioReplayer" id="audioReplayer" :src="audioUrl" controls style="width:100%;")
    q-toolbar
      q-space
      q-btn(round unelevated color="primary" icon="keyboard_arrow_left" @click="closeStream()")
      q-space
      q-btn(v-if="!imageUrl && !videoUrl && !audioUrl" size="xl" unelevated round :class="captureStatus===false?'bg-primary':'bg-red'" :color="captureStatus===false?'red':'c-white'" :icon="captureStatus===false?'lens':'stop'" style="margin-right:30px" @click="captureMedia()")
      q-btn(v-if="imageUrl || videoUrl || audioUrl" unelevated round color="primary" icon="check" @click="saveMedia()")
      q-space
      q-btn(v-if="imageUrl || videoUrl || audioUrl" round unelevated color="primary" icon="close" @click="cancel()")
      q-space
    audio#takePhoto-audio(src="@/assets/media/takePhoto.mp3")
</template>
<script src="./captureMedia.vue.js" />