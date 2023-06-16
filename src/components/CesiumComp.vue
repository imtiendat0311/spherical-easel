<template>
    <div id="cesiumContainer"></div>
</template>
<style>
 #cesiumContainer{
    /* position: absolute; */
 }
</style>
<script setup lang="ts">
import { useSEStore } from '@/stores/se';
import * as Cesium from 'cesium';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
// import "cesium/Build/Cesium/Widgets/widgets.css";
import { onMounted } from 'vue';
const store = useSEStore();
const {zoomMagnificationFactor,zoomTranslation, inverseTotalRotationMatrix} = storeToRefs(store);

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

const prop = defineProps({
    canvasSize: {
        type: Number,
        default: 240
    }
})
onMounted(() => {
    const cesiumContainer = document.getElementById('cesiumContainer');
    if (cesiumContainer) {
        cesiumContainer.style.width = `${prop.canvasSize}px`;
        cesiumContainer.style.height = `${prop.canvasSize}px`;

    }
    initCesium();
})
async function initCesium(){
    // window.CESIUM_BASE_URL = '/static/Cesium/';
    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_APP_CESIUM_TOKEN;
    const viewer = new Cesium.Viewer('cesiumContainer', {
        timeline: false,
        animation: false,
        imageryProvider: false,
        baseLayerPicker: false,
        requestRenderMode: true,
        geocoder: false,
    })
    const googleMapApiKey = import.meta.env.VITE_APP_GOOGLE_MAP_API_KEY;
    const tileset = await Cesium.Cesium3DTileset.fromUrl(`https://tile.googleapis.com/v1/3dtiles/root.json?key=${googleMapApiKey}`);
    viewer.scene.primitives.add(tileset);
    viewer.scene.globe.show = true;
    watch(()=>prop.canvasSize, (newVal, oldVal) => {
        const cesiumContainer = document.getElementById('cesiumContainer');
        if (cesiumContainer) {
            cesiumContainer.style.width = `${newVal}px`;
            cesiumContainer.style.height = `${newVal}px`;
        }
    })
    // watch(()=>zoomMagnificationFactor.value,(newVal,oldVal)=>{
    //     const zoom = viewer.camera.defaultZoomAmount;
    //     console.log(newVal,oldVal);
    //     if(newVal-oldVal>0){
    //         viewer.camera.zoomIn(zoom*newVal);
    //     }else{
    //         viewer.camera.zoomOut(zoom*newVal);
    //     }
    // })

}
</script>