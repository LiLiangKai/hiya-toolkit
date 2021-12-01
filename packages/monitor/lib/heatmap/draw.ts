import { IHeatmapTrack } from '../core/track'

function drawHeatmap (data: Array<IHeatmapTrack['param']>, options = {}) {
  const defaultconfig = {
    radius: 40,
    renderer: 'canvas2d',
    gradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)" },
    maxOpacity: 1,
    minOpacity: 0,
    opacity: 0,
    useGradientOpacity: false,
    blur: .85,
    xField: 'x',
    yField: 'y',
    valueField: 'value',
    backgroundColor: 'rgba(0, 0, 58, 0.26)',
    min: 1,
    max: 5
  }

  const config = Object.assign({}, defaultconfig, options) as typeof defaultconfig


  const shadowCanvas = document.createElement('canvas')
  const canvas = document.createElement('canvas')
  const shadowCtx = shadowCanvas.getContext('2d') as CanvasRenderingContext2D
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const canvasWidth = shadowCanvas.width = canvas.width = innerWidth
  const canvasHeight = shadowCanvas.height = canvas.height = innerHeight
  const templates = {}
  let renderBoundaries = [10000, 10000, 0, 0]

  canvas.className = 'heatmap-canvas'
  canvas.style.cssText = 'position:fixed;left:0;top:0;'
  canvas.style.backgroundColor = config.backgroundColor
  document.body.appendChild(canvas)

  renderer()

  function renderer () {
    clear()
    drawAlpha(handleData())
    colorize()
  }

  function clear () {
    shadowCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  function handleData () {
    const points: any[] = []
    for(let i=0; i<data.length; i++) {
      const {/*vh, vw, ow, oh,*/ cx, cy} = data[i]
      const point = {
        // x: (canvasWidth>>1) + (canvasWidth * ow / vw),
        // y: (canvasHeight >> 1) + (canvasHeight * oh / vh),
        x: cx,
        y: cy,
        value: 2
      }
      points.push(point)
    }
    return points
  }

  function drawAlpha (data) {
    const min = config.min
    const max = config.max
    let dataLen = data.length
    const blur = 1 - config.blur
    while (dataLen--) {
      let point = data[dataLen]
      let x = point.x
      let y = point.y
      let radius = point.radius || config.radius
      // if value is bigger than max
      // use max as value
      let value = Math.min(point.value, max)
      let rectX = x - radius
      let rectY = y - radius

      let tpl
      if (!templates[radius]) {
        templates[radius] = tpl = getPointTemplate(radius, blur)
      } else {
        tpl = templates[radius]
      }
      // value from minimum / value range
      // => [0, 1]
      let templateAlpha = (value - min) / (max - min)
      // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
      shadowCtx.globalAlpha = templateAlpha < .01 ? .01 : templateAlpha
      shadowCtx.drawImage(tpl, rectX, rectY)

      // update renderBoundaries
      if (rectX < renderBoundaries[0]) {
        renderBoundaries[0] = rectX
      }
      if (rectY < renderBoundaries[1]) {
        renderBoundaries[1] = rectY
      }
      if (rectX + 2 * radius > renderBoundaries[2]) {
        renderBoundaries[2] = rectX + 2 * radius
      }
      if (rectY + 2 * radius > renderBoundaries[3]) {
        renderBoundaries[3] = rectY + 2 * radius
      }
    }
  }

  function colorize() {
    let x = renderBoundaries[0]
    let y = renderBoundaries[1]
    let width = renderBoundaries[2] - x
    let height = renderBoundaries[3] - y
    let maxWidth = canvasWidth
    let maxHeight = canvasHeight
    let opacity = config.opacity
    let maxOpacity = config.maxOpacity * 255
    let minOpacity = config.minOpacity * 255
    let useGradientOpacity = !!config.useGradientOpacity

    if (x < 0) {
      x = 0
    }
    if (y < 0) {
      y = 0
    }
    if (x + width > maxWidth) {
      width = maxWidth - x
    }
    if (y + height > maxHeight) {
      height = maxHeight - y
    }

    let img = shadowCtx.getImageData(x, y, width, height)
    let imgData = img.data
    let len = imgData.length
    let palette = getColorPalette()
    for (let i = 3; i < len; i += 4) {
      let alpha = imgData[i]
      let offset = alpha * 4


      if (!offset) {
        continue
      }

      let finalAlpha
      if (opacity > 0) {
        finalAlpha = opacity
      } else {
        if (alpha < maxOpacity) {
          if (alpha < minOpacity) {
            finalAlpha = minOpacity
          } else {
            finalAlpha = alpha
          }
        } else {
          finalAlpha = maxOpacity
        }
      }

      imgData[i - 3] = palette[offset]
      imgData[i - 2] = palette[offset + 1]
      imgData[i - 1] = palette[offset + 2]
      imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha
    }
    // img.data = imgData
    ctx.putImageData(img, x, y)

    renderBoundaries = [1000, 1000, 0, 0]
  }

  function getColorPalette () {
    const gradientConfig = config.gradient
    const paletteCanvas = document.createElement('canvas')
    const paletteCtx = paletteCanvas.getContext('2d') as CanvasRenderingContext2D

    paletteCanvas.width = 256
    paletteCanvas.height = 1

    const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1)
    for (const key in gradientConfig) {
      gradient.addColorStop(Number(key), gradientConfig[key])
    }

    paletteCtx.fillStyle = gradient
    paletteCtx.fillRect(0, 0, 256, 1)

    return paletteCtx.getImageData(0, 0, 256, 1).data
  }

  function getPointTemplate (radius, blurFactor) {
    var tplCanvas = document.createElement('canvas')
    var tplCtx = tplCanvas.getContext('2d') as CanvasRenderingContext2D
    var x = radius
    var y = radius
    tplCanvas.width = tplCanvas.height = radius * 2

    if (blurFactor == 1) {
      tplCtx.beginPath()
      tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false)
      tplCtx.fillStyle = 'rgba(0,0,0,1)'
      tplCtx.fill()
    } else {
      var gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius)
      gradient.addColorStop(0, 'rgba(0,0,0,1)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      tplCtx.fillStyle = gradient
      tplCtx.fillRect(0, 0, 2 * radius, 2 * radius)
    }

    return tplCanvas
  }
}

// @ts-ignore
window.drawHeatmap = drawHeatmap