import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { WebSocketServer, type WebSocket } from 'ws'

import siteConfiguration from './.figma/make/site.json'

// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .figma/make/deploy-preview passes `--mode development` for cached-preview builds.
  const emitSourcemaps = mode === 'development'

  return {
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
    build: {
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },
    plugins: [
      react(),
      tailwindcss(),
      figmaSiteConfiguration(siteConfiguration),
      figmaErrorOverlayReplay(),
      figmaReactRefreshBoundaryFallback(),
      figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' }),
      baiChoiRealtimePlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      strictPort: true,
      watch: { ignored: ['**/.figma/**'] },
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
    },
  }
})

type RoomPlayer = { id: string; name: string; ready: boolean; hand: string[]; claimed: string[] }
type GameRoom = { id: string; hostId: string; players: Map<string, RoomPlayer>; status: 'waiting' | 'playing'; deck: string[]; drawIndex: number; currentCard: string | null }

function baiChoiRealtimePlugin(): Plugin {
  const rooms = new Map<string, GameRoom>()
  const sockets = new Map<string, WebSocket>()
  const cardIds = ['nhat-tro', 'nhi-bi', 'tam-quan', 'tu-huong', 'ngu-truot', 'luc-xo', 'that-nhon', 'bat-bong', 'cuu-thay', 'thai-tu']
  const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)
  const publicRoom = (room: GameRoom) => ({
    roomId: room.id,
    hostId: room.hostId,
    status: room.status,
    players: [...room.players.values()].map(({ id, name, ready, claimed }) => ({ id, name, ready, flags: claimed.length })),
  })
  const send = (socket: WebSocket | undefined, data: object) => socket?.readyState === socket.OPEN && socket.send(JSON.stringify(data))
  const broadcast = (room: GameRoom, data: object) => room.players.forEach((player) => send(sockets.get(player.id), data))

  return {
    name: 'bai-choi-realtime',
    apply: 'serve',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true })
      server.httpServer?.on('upgrade', (request, socket, head) => {
        if (request.url?.split('?')[0] !== '/bai-choi-ws') return
        wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request))
      })

      wss.on('connection', (socket) => {
        let playerId = ''
        let roomId = ''
        socket.on('message', (raw) => {
          let message: any
          try { message = JSON.parse(raw.toString()) } catch { return }
          const name = String(message.name || '').normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 16)

          if (message.type === 'createRoom') {
            roomId = String(Math.floor(100000 + Math.random() * 900000))
            while (rooms.has(roomId)) roomId = String(Math.floor(100000 + Math.random() * 900000))
            playerId = crypto.randomUUID()
            const player: RoomPlayer = { id: playerId, name, ready: true, hand: [], claimed: [] }
            const room: GameRoom = { id: roomId, hostId: playerId, players: new Map([[playerId, player]]), status: 'waiting', deck: [], drawIndex: -1, currentCard: null }
            rooms.set(roomId, room); sockets.set(playerId, socket)
            send(socket, { type: 'roomJoined', playerId, ...publicRoom(room) })
          }

          if (message.type === 'joinRoom') {
            roomId = String(message.roomId || '').toUpperCase().trim()
            const room = rooms.get(roomId)
            if (!room) return send(socket, { type: 'error', message: 'Mã hội không tồn tại hoặc đã kết thúc.' })
            if (room.status !== 'waiting') return send(socket, { type: 'error', message: 'Hội này đã bắt đầu.' })
            if (room.players.size >= 5) return send(socket, { type: 'error', message: 'Hội đã đủ 5 chòi.' })
            const normalized = name.toLocaleLowerCase('vi-VN')
            if ([...room.players.values()].some((player) => player.name.toLocaleLowerCase('vi-VN') === normalized)) return send(socket, { type: 'error', message: `Tên “${name}” đã có trong hội.` })
            playerId = crypto.randomUUID()
            room.players.set(playerId, { id: playerId, name, ready: false, hand: [], claimed: [] }); sockets.set(playerId, socket)
            send(socket, { type: 'roomJoined', playerId, ...publicRoom(room) }); broadcast(room, { type: 'roomState', ...publicRoom(room) })
          }

          const room = rooms.get(roomId)
          if (!room || !playerId) return
          if (message.type === 'ready') {
            const player = room.players.get(playerId); if (player) player.ready = Boolean(message.ready)
            broadcast(room, { type: 'roomState', ...publicRoom(room) })
          }
          if (message.type === 'startGame' && room.hostId === playerId && room.players.size >= 2 && [...room.players.values()].every((p) => p.ready)) {
            room.status = 'playing'; room.deck = shuffle(cardIds); room.drawIndex = -1; room.currentCard = null
            room.players.forEach((player) => { player.hand = shuffle(cardIds).slice(0, 3); player.claimed = []; send(sockets.get(player.id), { type: 'gameStarted', hand: player.hand, ...publicRoom(room) }) })
          }
          if (message.type === 'draw' && room.hostId === playerId && room.status === 'playing' && room.drawIndex < room.deck.length - 1) {
            room.drawIndex += 1; room.currentCard = room.deck[room.drawIndex]
            broadcast(room, { type: 'cardDrawn', cardId: room.currentCard, drawIndex: room.drawIndex })
          }
          if (message.type === 'claim' && room.currentCard) {
            const player = room.players.get(playerId)
            if (!player || !player.hand.includes(room.currentCard) || player.claimed.includes(room.currentCard)) return send(socket, { type: 'claimRejected' })
            player.claimed.push(room.currentCard)
            broadcast(room, { type: 'flagsUpdated', playerId, flags: player.claimed.length })
            if (player.claimed.length === 3) broadcast(room, { type: 'winner', playerId, name: player.name })
          }
        })

        socket.on('close', () => {
          sockets.delete(playerId)
          const room = rooms.get(roomId); if (!room || !playerId) return
          room.players.delete(playerId)
          if (!room.players.size) return void rooms.delete(roomId)
          if (room.hostId === playerId) room.hostId = room.players.keys().next().value || ''
          broadcast(room, { type: 'roomState', ...publicRoom(room) })
        })
      })
    },
  }
}

type FigmaSiteConfiguration = {
  title?: string
  description?: string
  language?: string
  robots?: {
    index?: boolean
  }
  icons?: {
    icon?: string
  }
  openGraph?: {
    image?: string
  }
  analytics?: {
    googleAnalyticsId?: string
  }
  customScripts?: {
    headStart?: string
    headEnd?: string
    bodyStart?: string
    bodyEnd?: string
  }
  accessibility?: {
    addBypassLinks?: boolean
  }
}

/** Applies /.figma/make/site.json to the generated document shell. */
function figmaSiteConfiguration(config: FigmaSiteConfiguration): Plugin {
  function sanitizeHtmlValue(value: string | undefined): string {
    return value?.replace(/[^a-zA-Z0-9_-]/g, '') || ''
  }
  function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  function replaceHtmlCommentSlot(html: string, slotName: string, content: string): string {
    return html.replace(`<!-- ${slotName} -->`, content)
  }

  const title = config.title ?? 'Bài Chòi'
  const description = config.description ?? ''
  const favicon = config.icons?.icon ?? ''
  const socialImage = config.openGraph?.image ?? ''
  const language = sanitizeHtmlValue(config.language) || 'en'
  const googleAnalyticsId = sanitizeHtmlValue(config.analytics?.googleAnalyticsId)
  const headStart = config.customScripts?.headStart ?? ''
  const headEnd = config.customScripts?.headEnd ?? ''
  const bodyStart = config.customScripts?.bodyStart ?? ''
  const bodyEnd = config.customScripts?.bodyEnd ?? ''
  const robotsTxt = config.robots?.index === false ? 'User-agent: *\nDisallow: /\n' : ''

  return {
    name: 'figma-site-configuration',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!robotsTxt || req.url?.split('?')[0] !== '/robots.txt') return next()

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(robotsTxt)
      })
    },
    generateBundle() {
      if (!robotsTxt) return

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt,
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let result = html
        result = replaceHtmlCommentSlot(result, 'figma:lang', language)
        result = replaceHtmlCommentSlot(result, 'figma:title', escapeHtmlText(title))
        result = replaceHtmlCommentSlot(result, 'figma:head-start', headStart)
        result = replaceHtmlCommentSlot(result, 'figma:head-end', headEnd)
        result = replaceHtmlCommentSlot(result, 'figma:body-start', bodyStart)
        result = replaceHtmlCommentSlot(result, 'figma:body-end', bodyEnd)

        const tags: HtmlTagDescriptor[] = []
        if (description) {
          tags.push({ tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' })
        }
        if (config.robots?.index === false) {
          tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' })
        }
        if (favicon) {
          tags.push({ tag: 'link', attrs: { rel: 'icon', href: favicon }, injectTo: 'head' })
        }
        if (title) {
          tags.push({ tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' })
        }
        if (description) {
          tags.push({ tag: 'meta', attrs: { property: 'og:description', content: description }, injectTo: 'head' })
        }
        if (socialImage) {
          tags.push(
            { tag: 'meta', attrs: { property: 'og:image', content: socialImage }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:image', content: socialImage }, injectTo: 'head' },
          )
        }

        if (googleAnalyticsId) {
          tags.push(
            {
              tag: 'script',
              attrs: {
                async: true,
                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
              },
              injectTo: 'head',
            },
            {
              tag: 'script',
              children: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ${JSON.stringify(googleAnalyticsId)});
`,
              injectTo: 'head',
            },
          )
        }

        if (config.accessibility?.addBypassLinks) {
          tags.push(
            {
              tag: 'style',
              children: `
  .figma-bypass-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 2147483647;
    transform: translateY(-150%);
    border-radius: 6px;
    background: #111827;
    color: #fff;
    padding: 8px 12px;
    font: 600 14px/1.2 system-ui, sans-serif;
    text-decoration: none;
  }
  .figma-bypass-link:focus {
    transform: translateY(0);
  }
`,
              injectTo: 'head',
            },
            {
              tag: 'a',
              attrs: { class: 'figma-bypass-link', href: '#root' },
              children: 'Skip to content',
              injectTo: 'body-prepend',
            },
          )
        }

        return {
          html: result,
          tags,
        }
      },
    },
  }
}

/**
 * Replay the most recent build error to clients that connect after
 * it was first broadcast. Vite buffers an error payload only while
 * no clients are connected and clears the buffer on the first
 * reconnect (see `bufferedMessage` in `createWebSocketServer`), so
 * if the preview iframe reloads after Vite already delivered an
 * error to a live socket, the new socket misses the payload and
 * the overlay stays hidden even though the build is still broken.
 * We intercept `ws.send` to remember the latest error and replay
 * it on every new connection; the cache clears on a successful
 * `update` or `full-reload` so a stale overlay can't survive a
 * fixed build.
 */
function figmaErrorOverlayReplay(): Plugin {
  return {
    name: 'figma-error-overlay-replay',
    apply: 'serve',
    configureServer(server) {
      let lastError: object | null = null

      const origSend = server.ws.send.bind(server.ws) as (...args: any[]) => void
      server.ws.send = ((...args: any[]) => {
        const payload = args[0]
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const type = (payload as { type?: string }).type
          if (type === 'error') {
            lastError = payload as object
          } else if (type === 'update' || type === 'full-reload') {
            lastError = null
          }
        }
        return origSend(...args)
      }) as typeof server.ws.send

      server.ws.on('connection', (socket) => {
        if (lastError !== null) {
          socket.send(JSON.stringify(lastError))
        }
      })
    },
  }
}

/**
 * Reload when a module that previously defined a React Refresh boundary stops
 * defining one. This happens when an agent moves a component into a new file
 * and replaces the old module with a re-export:
 *
 *   export { default } from './app/App'
 *
 * Vite otherwise accepts the update using the previous module's HMR boundary,
 * but the re-export-only transform no longer registers a replacement for the
 * mounted component family. React reports a successful refresh while leaving
 * the old tree mounted until the page is reloaded.
 */
function figmaReactRefreshBoundaryFallback(): Plugin {
  const hadRefreshBoundary = new Map<string, boolean>()
  let sendFullReload: (() => void) | null = null

  return {
    name: 'figma-react-refresh-boundary-fallback',
    apply: 'serve',
    enforce: 'post',
    configureServer(server) {
      sendFullReload = () => server.ws.send({ type: 'full-reload', path: '*' })
    },
    transform(code, id) {
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes('/node_modules/')) return null

      const moduleId = id.split('?')[0] ?? id
      const hasRefreshBoundary = code.includes('registerExportsForReactRefresh')
      const previousHadRefreshBoundary = hadRefreshBoundary.get(moduleId)
      hadRefreshBoundary.set(moduleId, hasRefreshBoundary)

      if (previousHadRefreshBoundary && !hasRefreshBoundary) {
        queueMicrotask(() => sendFullReload?.())
      }

      return null
    },
  }
}

/**
 * Serves a blank render-target page at /.figma/make/kit.html that
 * the Figma preview script drives directly. The page exposes a
 * registry of every file matching `storiesGlob` on
 * window.__FIGMA__.stories so the design surface can dynamically
 * import + mount each entry into its own grid view.
 *
 * Dev-only: `apply: 'serve'` gates the plugin to `vite dev`. Prod
 * builds (`vite build`) skip it entirely so the route doesn't leak
 * into shipped bundles.
 */
function figmaMakeKitPlugin(options: { storiesGlob: string | string[] }): Plugin {
  const storiesGlob = Array.isArray(options.storiesGlob) ? options.storiesGlob : [options.storiesGlob]
  const ROUTE = '/.figma/make/kit.html'
  const VIRTUAL_ID = 'virtual:figma-stories'
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  const STORIES_MODULE = `export const stories = import.meta.glob(${JSON.stringify(storiesGlob)})`
  const HTML_BOOTSTRAP = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
<div id="figma-make-kit-root"></div>
<script type="module">
  import { stories } from 'virtual:figma-stories'
  window.__FIGMA__ = Object.assign(window.__FIGMA__ ?? {}, { stories })
  window.dispatchEvent(new CustomEvent('figma.ready'))
</script>
</body>
</html>`

  return {
    name: 'figma-make-kit',
    apply: 'serve',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      return STORIES_MODULE
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (url.split('?')[0] !== ROUTE) return next()

        try {
          res.setHeader('Content-Type', 'text/html')
          res.end(await server.transformIndexHtml(url, HTML_BOOTSTRAP))
        } catch (err) {
          next(err as Error)
        }
      })
    },
  }
}
