export { default as getBrowerFingerprint } from './fingerprint'
export * from './constants'

export function uid() {
  for (var e, t, n = 10, r = new Array(n), a = Date.now().toString(36).split(""); n-- > 0;)
    t = (e = 36 * Math.random() | 0).toString(36), r[n] = e % 3 ? t : t.toUpperCase();
  for (var i = 0; i < 8; i++) r.splice(3 * i + 2, 0, a[i]);
  return r.join("")
}

/**
 * 根据字符串生成hash值
 * @param {string} str 
 * @returns 
 */
export function hashCode(str) {
  const hash = str.split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0)
  return hash.toString(16).replace(/[\-\+\/\\\~]/g, 'a')
}

export function on (type, handle, options?) {
  window.addEventListener(type, handle, options)
}

export function off (type, handle) {
  window.removeEventListener(type, handle)
}

// 触发自定义自定义事件
export const dispatchCustomEvent = function (eventName, detail?) {
  let evt
  if(window.CustomEvent) {
    evt = new CustomEvent(eventName, {
      detail
    })
  } else {
    evt = window.document.createEvent("HTMLEvents").initEvent(eventName,false,true)
    evt.detail = detail
  }
  window.dispatchEvent(evt)
}

export const parseUrl = function (e: string) {
  return e && "string" == typeof e ? e.replace(/^(https?:)?\/\//, "").replace(/\?.*$/, "") : ""
}

// localStorage
export const storage = {
  setItem (key, value) {
    try {
      localStorage.setItem(key, value)
    }
    catch (ex) { }
  },
  getItem (key) {
    try {
      return localStorage.getItem(key)
    }
    catch (ex) { }
    return
  },
  removeItem (key) {
    try {
      return localStorage.removeItem(key)
    }
    catch (ex) { }
  }
}

// 节流
export function throttle(fn, delay) {
  let timer
  return (...arg) => {
    if (timer) return
    timer = setTimeout(() => {
      // @ts-ignore
      fn.apply(this, arg)
      timer = null
    }, delay)
  }
}

export function numberFixed (num: number, fractionDigits = 2) {
  return Number(num.toFixed(fractionDigits))
}