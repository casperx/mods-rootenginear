import {COLORS} from './colors.js'

const chunkCache = {}

const getChunk = async (chunkPair) => {
  if (chunkPair in chunkCache)
    return chunkCache[chunkPair]

  const chunkResp = await fetch(`../chunks/${chunkPair}`)
  const chunkBytes = await chunkResp.arrayBuffer()

  return chunkCache[chunkPair] = new Uint16Array(chunkBytes)
}

const onMessage = async () => {
  const chunkResp = await fetch('../chunks.json')
  const chunkList = await chunkResp.json()

  // find min and max of x and z
  let minChunkX = undefined
  let minChunkZ = undefined
  let maxChunkX = undefined
  let maxChunkZ = undefined

  // wait for all chunks loaded
  const chunks = await Promise.all(
    chunkList.map(
      async (chunkPair) => {
        const [x, z] = chunkPair
          .split('.')
          .map(e => +e)

        // while we're here, might as well collect min/max
        if (x < minChunkX || minChunkX === undefined) minChunkX = x
        if (z < minChunkZ || minChunkZ === undefined) minChunkZ = z
        if (x > maxChunkX || maxChunkX === undefined) maxChunkX = x
        if (z > maxChunkZ || maxChunkZ === undefined) maxChunkZ = z

        const chunk = await getChunk(chunkPair)

        return [x, z, chunk]
      }
    )
  )

  const minBlockX = minChunkX * 16
  const minBlockZ = minChunkZ * 16
  const maxBlockX = maxChunkX * 16
  const maxBlockZ = maxChunkZ * 16

  const buffer = new OffscreenCanvas(
    maxBlockX - minBlockX,
    maxBlockZ - minBlockZ
  )

  const bufferCtx = buffer.getContext('2d')

  for (const [chunkX, chunkZ, chunk] of chunks) {
    for (const [idx, data] of chunk.entries()) {
      if (data === 0) continue

      const blockX = idx % 16
      const blockZ = Math.floor(idx / 16)

      const id = data & 0x3ff, metadata = (data >> 10) & 0xf
      const color = COLORS[id] ?? '#d67fff'

      bufferCtx.fillStyle = color
      bufferCtx.fillRect(
        chunkX * 16 + blockX - minBlockX,
        chunkZ * 16 + blockZ - minBlockZ,
        1,
        1
      )
    }
  }

  const bitmap = await createImageBitmap(buffer)

  postMessage(
    {
      bitmap,
      minBlockX,
      minBlockZ
    },
    [bitmap]
  )
}

addEventListener('message', onMessage)
