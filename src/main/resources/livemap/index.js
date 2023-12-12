import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import {COLORS} from './colors.js'

const canvas = document.getElementById('map')
const ctx = canvas.getContext('2d')

let transform = d3.zoomIdentity

const transform2d = (x, y) => {
  return [
    x * transform.k + transform.x,
    y * transform.k + transform.y,
  ]
}

// install mouse zoom and pan handler on canvas
d3
  .select(canvas)
  .call(
    d3
      .zoom()
      .scaleExtent(
        [1, 8]
      )
      .on('zoom', (t) => {
        transform = t.transform
        drawCanvas()
      }
  )
)

let playerCache = {}

const playerResp = await fetch('./players.json')
const playerList = await playerResp.json()

for (const username in playerList) {
  const {x, z, uuid} = playerList[username]
  const player = playerCache[username]

  if (player) {
    // update position of player in cache
    player.x = x
    player.z = z

    continue
  }

  const image = new Image
  image.src = `https://crafatar.com/avatars/${uuid}?size=16&overlay=hat`

  playerCache[username] = {x, z, image}
}

const chunkResp = await fetch('./chunks.json')
const chunkList = await chunkResp.json()

// find min x and z for offsetting top left corner
let minChunkX = Infinity
let minChunkZ = Infinity

// wait for all chunks loaded
const chunks = await Promise.all(
  chunkList.map(
    async (chunkPairStr) => {
      const [x, z] = chunkPairStr
        .split('.')
        .map(e => +e)

      // while we're here, might as well collect min/max
      if (x < minChunkX) minChunkX = x
      if (z < minChunkZ) minChunkZ = z

      const chunkResp = await fetch(`./chunks/${x}.${z}`)
      const chunkBytes = await chunkResp.arrayBuffer()

      return [
        x,
        z,
        new Uint16Array(chunkBytes)
      ]
    }
  )
)

const minBlockX = minChunkX * 16
const minBlockZ = minChunkZ * 16

const updateCanvasSize = () => {
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
}

const drawCanvas = async () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const [chunkX, chunkZ, chunk] of chunks) {
    for (const [idx, data] of chunk.entries()) {
      if (data === 0) continue

      const blockX = idx % 16
      const blockZ = Math.floor(idx / 16)

      const id = data & 0x3ff, metadata = (data >> 10) & 0xf
      const color = COLORS[id] ?? '#d67fff'

      const [cx, cy] = transform2d(
        chunkX * 16 + blockX - minBlockX,
        chunkZ * 16 + blockZ - minBlockZ
      )

      ctx.fillStyle = color
      ctx.fillRect(cx, cy, transform.k + 0.5, transform.k + 0.5)
    }
  }

  for (const username in playerCache) {
    const player = playerCache[username]

    const [px, py] = transform2d(
      player.x - minBlockX,
      player.z - minBlockZ
    )

    ctx.drawImage(player.image, px - 8, py - 8)
  }
}

window.addEventListener('resize', () => {
  updateCanvasSize()
  drawCanvas()
})

updateCanvasSize()
drawCanvas()


/*
  How to get Minecraft Skin:
  1. get https://api.mojang.com/users/profiles/minecraft/{username} -> .id
  2. https://crafatar.com/avatars/{id}?size=16&overlay=hat
*/
