import { getConfig, TPerfResourceType } from './config'
import { mwarn } from './log'
import { uid, dispatchCustomEvent, EVENT_SEND_TRACK } from '../utils'

/**
 * 埋点类型
 *    visit-xx：用户访问，包括访问页面、访问时长等
 *    error-xx：错误，包括请求错误、脚本错误等
 *    xhr-xx：请求类型
 *    performance-xx：性能，包括页面加载、资源请求时长等
 *    action-xx：用户行为
 */
interface IExternal {
  [key: string]: any
}

/** 埋点描述 */
export interface ITrackBase<T extends IExternal = IExternal> {
  /** id */
  uid?: string
  /** 来源id */
  refererId?: string
  /** 设备唯一id */
  deviceId?: string
  /** 创建时间 */
  time?: number
  /** 所属模块，如sys-portal */
  module?: string
  /** 埋点类型 */
  type?: string
  /** 页面地址 */
  href?: string
  /** 埋点事件，如click */
  event?: keyof WindowEventMap | keyof DocumentEventMap | 'fetch' | 'xmlHttpRequest'
  /** 拓展字段 */
  param?: T
}

/** 访问埋点 */
export interface IVisitTrack extends ITrackBase<IVisitTrackExternal> {
  /**
   * 可选类型
   *    visit-open: 访问页面
   *    visit-view: 访问时长
   *    visit-end: 访问结束
   */
  type?: 'visitOpen' | 'visitView' | 'visitEnd' 
}

export interface IVisitTrackExternal {
  /** 前往的地址 */
  to?: string
  /** 分辨率大小 */
  screen?: string
  /** 视窗大小 */
  window?: string
  /** 停留时间，单位ms */
  duration?: number
}

/** 错误埋点 */
export interface IErrorTrack extends ITrackBase<IErrorTrackExternal> {
  /**
   * 可选类型
   *    error-script: 脚本错误
   *    error-resource: 资源错误
   *    error-promise: promise错误
   */
  type?: 'errorScript' | 'errorResource' | 'errorPromise'
}

export interface IErrorTrackExternal extends IExternal {
  /** 错误信息 */
  msg?: string
  /** 错误栈 */
  stack?: string
  /** 错误文件 */
  file?: string
  /** 行号 */
  lineno?: number
  /** 列号 */
  colno?: number
}

/** xhr请求埋点 */
export interface IXhrTrack extends ITrackBase<IXhrTrackExternal> {
  type: 'xhrSuccess' | 'xhrFailure'
}

export interface IXhrTrackExternal extends IExternal {
  /** 接口 */
  url?: string,
  /** 状态码 */
  code?: number
  /** 信息 */
  msg?: string
  /** 耗时 */
  duration?: number
}

/** 性能埋点 */
export interface IPerformanceTrack extends ITrackBase<IPerformanceTrackExternal> {
  /**
   * 可选类型
   *    perf-page：页面加载
   *    perf-resource：资源加载
   */
  type?: 'perfPage' | 'perfResource'
}

export interface IPerformanceTrackExternal extends IExternal {
  /** 页面性能 */
  /** FCP: 首次内容绘制时间 */
  fcp?: number
  /** FMP：首次有效绘制时间 */
  fmp?: number
  /** TTI：首次可交互时间 */
  tti?: number
  /** 分辨率大小 */
  screen?: string
  /** 视窗大小 */
  window?: string

  /** 资源性能 */
  /** 资源链接 */
  url?: string
  /** 资源类型 */
  rtype?: TPerfResourceType
  /** DNS查询耗时 */
  dns?: number
  /** TCP链接耗时 */
  tcp?: number
  /** 请求耗时 */
  req?: number
  /** 响应链接耗时 */
  res?: number
}

export interface IHeatmapTrack extends ITrackBase {
  type: 'heatmap'
  param: {
    /** 视窗宽度 */
    vw: number
    /** 视窗高度 */
    vh: number
    /** 页面滚动高宽度，scrollWidth*/
    sw: number
    /** 页面滚动高度，scrollHeight */
    sh: number
    /** 相对整个页面的x坐标，page X */
    px: number
    /** 相对整个页面的y坐标，page Y */
    py: number
    /** 相对视窗的x坐标，client X */
    cx: number
    /** 相对视窗的y坐标，client X */
    cy: number
    /** 相对窗口中心点的横向偏移量，offset width */
    ow: number
    /** 相对窗口中心点的纵向偏移量，offset height */
    oh: number
  }
}

/** 行为埋点 */
export interface IActionTrack extends ITrackBase {
  /** 业务决定，规范建议： `action-${actionCategory}` */
  type?: string
}

let TrackQueue: ITrackBase[] = []
let lastTrackId = ''

export function getTrackQueue () {
  const max = getConfig('max') as number
  return {
    tracks: TrackQueue.slice(0, max),
    clear: () => {
      TrackQueue.splice(0, max)
    }
  }
}

export function getAllTracks () {
  return TrackQueue
}

export function getTrackQueueSize () {
  return TrackQueue.length
}

/**
 * 添加记录
 * @param track 
 * @returns 
 */
export function addTrack<T extends ITrackBase = ITrackBase>(track: T) {
  if (!window.mkAnalyser) {
    mwarn('Analyser is not initialized!')
    return
  }
  if(!track) return
  TrackQueue.push(fill(track))
  shouldSendTracks()
}

/**
 * 添加访问埋点记录
 * @param track 
 */
export function addVisitTrack(track: IVisitTrack) {
  const { param = {} } = track
  track.param = {
    screen: `${screen.width}x${screen.height}`,
    window: `${window.innerWidth}x${window.innerHeight}`,
    ...param
  }
  addTrack(track)
}

/**
 * 添加行为埋点记录
 * @param track 
 */
export function addActionTrack(track: IActionTrack) {
  const { param = {} } = track
  track.param = {
    ...param
  }
  addTrack(track)
}

/** 补充track信息 */
function fill (track: ITrackBase) {
  track.uid = track.uid || uid()
  track.time = track.time || Date.now()
  track.deviceId = getConfig('deviceId') as string
  track.href = location.href
  track.module = track.module || getConfig('module') as string
  lastTrackId && (track.refererId = lastTrackId)
  lastTrackId = track.uid
  return track
}

let timer
/** 是否发生tracks */
function shouldSendTracks () {
  if(!getConfig('sendOnMax')) return
  const max = getConfig('max') as number
  if (TrackQueue.length < max) return
  const duration = Date.now() - getConfig('startTime')

  // 首次上报固定在30s？后
  const d = 30 * 1000 - duration 
  if (d > 0) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      shouldSendTracks()
    }, d)
    return
  }

  dispatchCustomEvent(EVENT_SEND_TRACK)
}