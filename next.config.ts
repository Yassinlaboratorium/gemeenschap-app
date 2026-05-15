import withPWAInit from '@ducanh2912/next-pwa'
import type { NextConfig } from 'next'
import type { Configuration } from 'webpack'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
})

// pptxgenjs, html2canvas e.a. gebruiken node:-imports in hun ES module builds.
// Turbopack negeert deze stil; Webpack faalt met UnhandledSchemeError.
// Oplossing: strip de node:-prefix zodat resolve.fallback = false kan gelden.
const nextConfig: NextConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: Configuration, { isServer, webpack }: { isServer: boolean; webpack: any }) {
    if (!isServer) {
      config.plugins = config.plugins ?? []
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, '')
        })
      )
      config.resolve = config.resolve ?? {}
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, https: false, http: false, os: false, path: false,
        crypto: false, stream: false, zlib: false, net: false, tls: false,
        util: false, events: false, assert: false, url: false, buffer: false,
        string_decoder: false, querystring: false, child_process: false,
      }
    }
    return config
  },
}

export default withPWA(nextConfig)
