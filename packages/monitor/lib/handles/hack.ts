import { getConfig } from '../core/config'
import { addTrack, IXhrTrack } from '../core/track'
import { uid, parseUrl, on, dispatchCustomEvent } from '../utils'

/** 改写fetch */
export function hackFetch () {
  const enableXhr = getConfig('enableXhr')
  if (!enableXhr.success && !enableXhr.failure) return

  if(typeof window.fetch !== 'function') return
  const originFetch = window.fetch
  window.fetch = function (input, init) {
    const begin = Date.now()
    const url = (input && typeof input !== 'string' ? input.url : input) || ''
    if (!parseUrl(url)) return originFetch.call(window, input, init)
    return originFetch.call(window, input, init).then(function (e) {
      try {
        const response = e.clone()
        const headers = response.headers
        if(headers && 'function' === typeof headers.get) {
          const ct = headers.get('content-type')
          if (ct && !/(text)|(json)/.test(ct)) return e
        }
        const duration = Date.now() - begin
        response.text().then(res => {
          // 收集fetch结果
          const success = response.ok
          if(success && !enableXhr.success) return // 请求成功，但未开启收集成功的fetch结果
          if(!success && !enableXhr.failure) return  // 请求失败，但未开启收集失败的fetch结果
          trackApi('fetch', url, success, response.status, !success?res.substr(0, 1024):undefined, begin, duration)
        }) 
      } catch {}
      return e
    })
  }
}

/** XMLHttpRequest */
export function hackXhr() {
  const enableXhr = getConfig('enableXhr')
  if (!enableXhr.success && !enableXhr.failure) return

  // 改写XMLHttpRequest，监听 loadstart和loadend 事件
  const originXHR = window.XMLHttpRequest
  function newXHR (capture = true) {
    const xhr = new originXHR()
    // 捕获请求
    if(capture) {
      const id = `xhr_${uid()}`
      xhr.addEventListener('loadstart', function () { 
        this && ((this as any).xhr_id = id)
        dispatchCustomEvent.call(this, 'ajaxLoadStart', this) 
      }, false)
      xhr.addEventListener('loadend', function () { 
        this && ((this as any).xhr_id = id)
        dispatchCustomEvent.call(this, 'ajaxLoadEnd', this) 
      }, false)
    }
    return xhr
  }

  // @ts-ignore
  window.XMLHttpRequest = newXHR

  function handleHttpResponseText (responseText) {
    try {
      const res = JSON.parse(responseText)
      return res.msg || res.message || responseText || ''
    } catch (err) {}
    return responseText || ''
  }

  const xhrRecords = {}

  // 请求开始，记录时间
  on('ajaxLoadStart', function (e) {
    const id = e?.detail?.xhr_id
    if(!id) return
    xhrRecords[id] = {
      begin: new Date().getTime(),
      event: e,
    }
  })

  // 请求结束，收集信息
  on('ajaxLoadEnd', function (e) {
    try {
      const id = e?.detail?.xhr_id
      if(!xhrRecords[id]) return
      const detail: XMLHttpRequest = e.detail
      const begin = xhrRecords[id].begin
      const duration = Date.now() - begin
      const { responseURL, status, response } = detail
      const success = status >= 200 && status < 300 // 状态码 2xx 为请求成功
      let msg = ''
      
      if(!response) return // 空内容不上报
      if (success && !enableXhr.success) return // 请求成功，但未开启收集成功的fetch结果
      if (!success && !enableXhr.failure) return  // 请求失败，但未开启收集失败的fetch结果
  
      if(success) {
        return trackApi('xmlHttpRequest', responseURL, success, status, undefined, begin, duration)
      }
      const responseType = detail.responseType.toLowerCase()
      if (responseType === 'blob') {
        var reader = new FileReader()
        reader.onload = function () {
          var responseText = reader.result
          msg = handleHttpResponseText(responseText)
          trackApi('xmlHttpRequest', responseURL, success, status, msg?.substr(0, 1024), begin, duration)
        }
        try {
          reader.readAsText(response, 'utf-8')
        } catch (e) {
          msg = handleHttpResponseText(response)
          trackApi('xmlHttpRequest', responseURL, success, status, msg?.substr(0, 1024), begin, duration)
        }
      } else {
        msg = handleHttpResponseText(response)
        trackApi('xmlHttpRequest', responseURL, success, status, msg?.substr(0, 1024), begin, duration)
      }
      delete xhrRecords[id]
    } catch {}
  })
}

/**
 * 记录请求
 * @param url 接口地址
 * @param success 是否成功
 * @param code 状态码
 * @param msg 信息
 * @param begin 开始请求时间
 * @param duration 请求耗时
 */
function trackApi (
  event: 'fetch' | 'xmlHttpRequest',
  url: string, 
  success: boolean,
  code: number,
  msg,
  begin: number,
  duration: number,
) {
  const track: IXhrTrack = {
    type: success ? 'xhrSuccess' : 'xhrFailure',
    time: begin,
    event,
    param: {
      url,
      code,
      msg,
      duration
    }
  }
  addTrack(track)
}