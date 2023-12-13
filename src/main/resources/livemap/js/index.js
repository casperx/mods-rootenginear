import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'

const canvas = document.getElementById('map')
const ctx = canvas.getContext('2d')

let transform = d3.zoomIdentity

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

/* load online players */
const playerResp = await fetch('../players.json')
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

/* minimap data */
let bitmap = new Image

let minBlockX = 0
let minBlockZ = 0

const renderer = new Worker(
  './js/render.js',
  {type: 'module'}
)

const drawCanvas = async () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.drawImage(
    bitmap,
    transform.x,
    transform.y,
    bitmap.width * transform.k,
    bitmap.height * transform.k
  )

  for (const username in playerCache) {
    const player = playerCache[username]

    ctx.drawImage(
      player.image,
      (player.x - minBlockX) * transform.k + transform.x - 8,
      (player.z - minBlockZ) * transform.k + transform.y - 8
    )
  }
}

bitmap.addEventListener('load', drawCanvas)

/* load placeholder image */
bitmap.src = './img/loading.svg'

renderer.addEventListener(
  'message', (e) => {
    const data = e.data

    bitmap = data.bitmap

    minBlockX = data.minBlockX
    minBlockZ = data.minBlockZ

    drawCanvas()
  }
)

/* trigger renderer */
renderer.postMessage(undefined)

const updateCanvasSize = () => {
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  ctx.imageSmoothingEnabled = false

  drawCanvas()
}

window.addEventListener('resize', updateCanvasSize)

/* resize canvas first time */
updateCanvasSize()

/*
How to get Minecraft Skin:

const {id} = fetchJson(`https://api.mojang.com/users/profiles/minecraft/${username}`)
const skinImageUrl = `https://crafatar.com/avatars/${id}?size=16&overlay=hat`
*/
