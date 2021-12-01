import { merror } from '../core/log'
import { getConfig } from '../core/config'
import { addTrack, IErrorTrack, IErrorTrackExternal } from '../core/track'
import { hashCode, uid } from '../utils'

const cache = {}

export function handleError (event) {
  if(!getConfig('enableError')) return // 未开启错误，不做收集
  try {
    switch (event.type) {
      case 'error':
        event instanceof ErrorEvent ? captureCaughtError(event) : captureResourceError(event)
        break
      case 'unhandledrejection':
        capturePromiseError(event)
        break
    }
  } catch (err) {
    merror('hanlde error: ', err)
  }
}

/** 捕获js异常 */
function captureCaughtError (event: ErrorEvent) {
  const track: IErrorTrack = {
    type: 'errorScript',
    event: 'error',
    param: {
      msg: event.message,
      stack: event.error?.stack || '',
      file: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  }
  capture(track)
}

/** 捕获资源异常 */
function captureResourceError (event) {
  const track: IErrorTrack = {
    type: 'errorResource',
    event: 'error',
    param: {
      href: location.href,
      msg: event.target.outerHTML,
      stack: event.target.localName,
      file: event.target.src || event.target.href
    }
  }
  capture(track)
}

/** 捕获promise异常 */
function capturePromiseError (event) {
  const reason = event.reason
  const track: IErrorTrack = {
    type: 'errorPromise',
    event: 'unhandledrejection',
    param: {
      msg: typeof reason === 'string' ? reason : reason.message,
      stack: typeof reason === 'object' ? reason.stack : undefined
    }
  }
  capture(track)
}

function capture (track: IErrorTrack) {
  track.uid = generateID(track.param)
  if(cache[track.uid]) return
  cache[track.uid] = true
  addTrack(track)
}

/** 生成错误记录ID */
function generateID (detail?: IErrorTrackExternal) {
  let id = ''
  if(!detail) id = uid()
  else {
    const { message, filename, lineno, colno } = detail
    if(filename) {
      id = hashCode(`${filename}:${lineno}:${colno}`)
    }
    id = message ? hashCode(message) : uid()
  }
  return `err_${id}`
}