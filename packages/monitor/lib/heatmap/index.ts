import {getConfig} from '../core/config'
import { addTrack, IHeatmapTrack } from '../core/track'

export function heatmap () {
  const config = getConfig('enableHeatmap')
  if(!config?.enable) return
  const { urls = [], timeout = 10000 } = config
  const startTime = getConfig('startTime')
  const duration = Date.now()  - startTime
  duration < timeout ? setTimeout(listen, timeout - duration) : listen()

  function handle (e) {
    if (urls.length > 0 && urls.indexOf(location.href) === -1) return
    if (e.type === 'click' && e.pointerType === 'touch') return
    const info = {
      px: e.pageX,
      py: e.pageY,
      cx: e.clientX,
      cy: e.clientY,
    }
    if ((e as TouchEvent).touches && e.touches[0]) {
      const touch: TouchEvent['touches'][0] = e.touches[0]
      info.px = touch.pageX >> 0
      info.py = touch.pageY >> 0
      info.cx = touch.clientX >> 0
      info.cy = touch.clientY >> 0
    }
    const offset = computeOffsetFromCenter(info.cx, info.cy)
    addTrack({
      type: 'heatmap',
      param: {
        vw: innerWidth,
        vh: innerHeight,
        sw: document.body.scrollWidth,
        sh: document.body.scrollHeight,
        ow: offset.offsetWidth,
        oh: offset.offsetHeight,
        ...info
      }
    } as IHeatmapTrack)
  }

  function listen () {
    window.addEventListener('click', handle)
    window.addEventListener('touchstart', handle)
  }
}

/**
 * 计算坐标位置距离中心点的偏移量
 * @param x 横坐标值
 * @param y 纵坐标值
 */
function computeOffsetFromCenter (x: number, y: number) {
  return {
    offsetWidth: x - (innerWidth >> 1),
    offsetHeight: y - (innerHeight >> 1)
  }
}