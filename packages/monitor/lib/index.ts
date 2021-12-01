import { handleError } from './error'
import { handleLoad, handleHashChange, handleWillUnload, hackFetch, hackXhr } from './handles'
import { handlePerformance, handleResource } from './performance'
import { heatmap } from './heatmap'
import { setConfig, getConfig, IAnalyserConfig } from './core/config'
import { send, post } from './core/send'
import { minfo, merror } from './core/log'
import { addTrack, addActionTrack, addVisitTrack, getAllTracks } from './core/track'
import { getBrowerFingerprint, on, off, EVENT_SEND_TRACK, EVENT_CHANGE_CONFIG } from './utils'
export * from './types'
export { send, addTrack, addActionTrack, addVisitTrack, getConfig }
import './heatmap/draw'

/** 埋点选项 */
export interface IAnalyserOption extends IAnalyserConfig { }

class Analyser {
  // 实例
  static instance: Analyser
  enablePoll = false
  pollTimer

  constructor(options?: IAnalyserOption) {
    this.init(options)
  }

  /** 初始化 */
  private init (options: IAnalyserOption = {}) {
    try {
      setConfig(options)
      setConfig('deviceId', getBrowerFingerprint('MKPaaS Analyser'))
      setConfig('startTime', Date.now())
  
      // 初始化工作，自动类型的埋点注入，主要包括访问类、错误类、性能类等..
      this.listenLoad()
      this.listenPerformance()
      this.listenScriptError()
      this.listenPageChange()
      this.listenXhr()
      this.ListenUnload()
      this.autoSend()
      heatmap()

      on(EVENT_SEND_TRACK, this.send)
      on(EVENT_CHANGE_CONFIG, this.handleChangeConfig)
  
      window.mkAnalyser = this
      minfo('Analyser init finished!')
    } catch(err) {
      merror('Analyser init failure: ', err)
    }
  }

  // 单例模式
  static getInstance(options?: IAnalyserOption) {
    if (!Analyser.instance) {
      Analyser.instance = new Analyser(options)
    }
    return Analyser.instance
  }

  /**
   * 手动埋点
   * @param track 埋点数据
   * @param type 埋点类型，可选。可选值 visit - 访问埋点; action - 行为埋点
   */
  addTrack = (track, type?: 'visit'|'action') => {
    try {
      switch(type) {
        case 'visit':
          addVisitTrack(track)
          break
        case 'action':
          addActionTrack(track)
          break
        default:
          addTrack(track)
          break
      }
    } catch {}
  }
  
  /** 上报 */
  send = send
  /** 设置配置 */
  setConfig = setConfig
  /** 获取配置 */
  getConfig = getConfig
  /** post请求 */
  post = post

  getAllTracks = () => {
    minfo('[all tracks]', getAllTracks())
  }

  /** 配置项改变 */
  private handleChangeConfig = () => {
    this.autoSend()
  }

  /** 自动轮询上报 */
  private autoSend = () => {
    if (!(getConfig('poll') && !this.enablePoll)) {
      // 停止自动上报
      clearTimeout(this.pollTimer)
      this.enablePoll = false
      return
    }

    const interval = getConfig('pollInterval') as number
    const handle = () => {
      this.send()
      this.pollTimer = setTimeout(handle, interval)
    }
    const duration = Date.now() - getConfig('startTime')
    if (duration < 30 * 1000) {
      // 首次上报固定在30s？后
      this.pollTimer = setTimeout(handle, duration)
    } else {
      handle()
    }
    this.enablePoll = true
  }

  /** 监控性能 */
  private listenPerformance () {
    handlePerformance()
    handleResource()
  }

  /** 监听脚本错误 */
  private listenScriptError () {
    on('error', handleError, true)
    on('unhandledrejection', handleError, true)
  }

  /** 监听xhr请求 */
  private listenXhr () {
    hackFetch()
    hackXhr()
  }

  /** 监听页面变化 */
  private listenPageChange () {
    on('hashchange', handleHashChange)
  }

  private listenLoad () {
    on('load', handleLoad)
  }

  private ListenUnload () {
    on('beforeunload', () => {
      handleWillUnload()
      this.destoryAllListen()
    })
  }
  
  private destoryAllListen = () => {
    off('load', handleLoad)
    off('error', handleError)
    off('unhandledrejection', handleError)
    off('hashchange', handleHashChange)
    off(EVENT_SEND_TRACK, this.send)
  }
}

export default Analyser.getInstance