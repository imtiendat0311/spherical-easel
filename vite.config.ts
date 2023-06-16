import { defineConfig } from "vite"
import {resolve} from "path"
import vue from "@vitejs/plugin-vue"
import cesium from "vite-plugin-cesium"
// import {createVuePlugin as vue} from "vite-plugin-vue2"
// import { VuetifyResolver } from "unplugin-vue-components/resolvers"
// import Components from "unplugin-vue-components/vite"

import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite"
import vuetify, {transformAssetUrls} from "vite-plugin-vuetify"
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // vue: "@vue/compat"
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"]
  },
  plugins: [
    cesium({
      rebuildCesium: true
    }),
    vue({
      template: {
        transformAssetUrls,
        compilerOptions: {
          compatConfig: {
            MODE: 3
          }
        }
      }
    }),
    // Components({
    //   resolvers: [VuetifyResolver()]
    // })
    // i18n({
    //   path: resolve(__dirname, "./src")
    // }),
    vuetify({ autoImport: true }),
    VueI18nPlugin({
      bridge: true // Use this option for a transition from vue-i18n v8 to v9
    })
  ],
  server: {
    port: 8080
  }
})
