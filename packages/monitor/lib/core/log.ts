import { getConfig } from './config'

const logStyle = {
  info: 'color:#fff;background:#4285f4;padding:0px 5px;',
  warn: 'color:#fff;background:#ff943e;padding:0px 5px;',
  error: 'color:#fff;background:#f53f3f;padding:0px 5px;',
}

function log(type: 'info'|'warn'|'error', ...arg) {
  if (!console[type]) return
  const enableLog = getConfig('enableLog')
  enableLog && console[type](`%c${type}`, logStyle[type], ...arg)
}

export function minfo(...arg) {
  log('info', ...arg)
}

export function mwarn(...arg) {
  log('warn', ...arg)
}

export function merror(...arg) {
  log('error', ...arg)
}