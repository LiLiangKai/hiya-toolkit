function bin2hex(s) {
  let i, l, o = '',
    n;

  s += ''

  for (i = 0, l = s.length; i < l; i++) {
    n = s.charCodeAt(i).toString(16)
    o += n.length < 2 ? '0' + n : n;
  }
  return o
}

/**
 * 使用canvas生成指纹信息
 * @returns 
 */
function generateBrowerFingerprint () {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
  ctx.font = "18px 'Arial'"
  ctx.textBaseline = "middle"
  ctx.fillStyle = "#f60"
  ctx.fillRect(125, 1, 62, 20)
  ctx.fillStyle = "#069"
  ctx.fillText('Hiya Monitor', 2, 15)
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
  ctx.fillText('Hiya Monitor', 4, 17)

  const b64 = canvas.toDataURL().replace("data:image/png;base64,", "")
  const bin = atob(b64)
  return bin2hex(bin.slice(-16, -12))
}

let fingerprint = ''

/**
 * 获取浏览器指纹
 * @returns 
 */
export default function getBrowerFingerprint () {
  if(!fingerprint) fingerprint = generateBrowerFingerprint()
  return fingerprint
}