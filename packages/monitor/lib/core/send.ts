import { getConfig } from './config'
import { getTrackQueue } from './track'
import { mwarn, minfo } from './log'

/** 
 * 发送数据
 */
export function send (isBeacon = false) {
  if (!window.mkAnalyser) {
    mwarn('Analyser is not initialized!')
    return 
  }

  const url = getConfig('url')
  const {tracks, clear} = getTrackQueue()
  if(!url || !tracks.length) return
  minfo('[send tracks]', tracks)
  clear()
  if(!isBeacon) {
    post(url, JSON.stringify(tracks), {
      capture: false
    })
  } else {
    localStorage.setItem('Mk_TrackQueue', JSON.stringify(tracks))
    sendBeacon(url, JSON.stringify(tracks))
  }
}

/**
 * post方法
 * @param url 接口地址
 * @param data post数据
 */
export function post (url, data, options?: {
  onSuccess? 
  onFailure?
  capture?: boolean
}) {
  const { onSuccess, onFailure, capture = true } = options || {}
  if(typeof XMLHttpRequest === 'function') {
    try {
      // @ts-ignore
      const xmlHttp = new XMLHttpRequest(capture)
      xmlHttp.open('POST', url, true)
      xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
      xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
          let res = xmlHttp.responseText
          try {
            res = JSON.parse(xmlHttp.responseText)
          } catch {}
          if (xmlHttp.status == 200) {
            typeof onSuccess == 'function' && onSuccess(res)
          } else {
            typeof onFailure == 'function' && onFailure(res)
          }
        }
      }
      xmlHttp.send(data)
    } catch(err) {
      mwarn('[Analyser post failure]', err)
    }
  }
}

export function sendBeacon (url, data) {
  if(typeof navigator.sendBeacon !== 'function') return
  // const query = btoa(encodeURIComponent(data))
  navigator.sendBeacon(`${url}`, data)
}