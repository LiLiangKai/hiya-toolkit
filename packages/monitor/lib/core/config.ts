import { dispatchCustomEvent, EVENT_CHANGE_CONFIG } from '../utils'

/** 系统参数配置 */
export interface ISysConfig {
  /** 设备唯一id */
  deviceId?: string
  /** 开始的时间，记录页面访问开始的时间 */
  startTime?: number
  /** 当前页面 */
  page?: {
    /** 地址 */
    url?: string
    /** 开始访问时间 */
    time?: number
  }
}

/** 资源类型 */
export type TPerfResourceType = 'link' | 'script' | 'img' | 'iframe' | 'xmlhttprequest' | 'css' | 'use'

/** 可选的参数配置 */
export interface IAnalyserConfig {
  /** 地址，默认为xxx(待定) */
  url?: string
  /** 所属模块，如sys-portal */
  module?: string | (() => string)
  /** -----轮询上报相关----- */
  /** 轮询上报 */
  poll?: boolean
  /** 轮询间隔，开启轮询情况下默认为1min，单位s，默认60s */
  pollInterval?: number

  /** -----容量上报相关----- */
  sendOnMax?: boolean
  /** 最大容量，sendOnMax开启后生效 */
  max?: number

  /** ----- 关闭上报相关---- */
  /** 关闭时上报，默认关闭 */
  sendOnClose?: boolean

  /** 功能开关 */
  /** 开启日志 */
  enableLog?: boolean
  /** 开启监听error错误 */
  enableError?: boolean
  /** 开启监听xhr错误 */
  enableXhr?: boolean | {
    /** 记录成功的请求 */
    success?: boolean
    /** 记录失败的请求 */
    failure?: boolean
  }
  /** 开启性能监控 */
  enablePerf?: boolean | {
    enable?: boolean
    /** 设置页面 TTI 超时时间阈值, 默认值10000ms */
    ttiLimit?: number
  }
  /** 开启资源性能监控 */
  enableResource?: boolean | {
    /** 是否开启 */
    enable?: boolean
    /** 忽略链接，如 ['http://xxx.com/web/api/add'] */
    ignoreUrls?: string[],
    /** 忽略接口，如 ['/api/add', '/api/edit'] */
    ignoreApis?: string[]
    /** 忽略文件扩展名，如['js','html','css'] */
    ignoreExts?: string[]
    /** 忽略资源类型 */
    ignoreTypes?: Array<TPerfResourceType>
  }
  /** 开启热力图监控 */
  enableHeatmap?: boolean | {
    /** 是否开启 */
    enable?: boolean
    /** 监控的页面 */
    urls?: string[]
    /** 延迟多少毫秒开始收集热力图信息 */
    timeout?: number
  }
}

export type TEnableConfig = 'enableResource' | 'enableXhr' | 'enablePerf' | 'enableHeatmap'
/** 所有配置 */
export type TAnalyserAllConfig = IAnalyserConfig & ISysConfig

export const MAX_LENGTH = 10
export const Config: TAnalyserAllConfig = {
  deviceId: '',
  page: {},
  startTime: Date.now(),

  url: '',
  poll: false,
  pollInterval: 60,
  
  sendOnMax: false,
  max: MAX_LENGTH,
  sendOnClose: false,

  enableLog: true,
  enableError: true,
  enableXhr: {
    success: false,
    failure: true
  },
  enablePerf: {
    enable: true,
    ttiLimit: 10000
  },
  enableResource: false,
  enableHeatmap: false
}

export function setConfig (key: keyof TAnalyserAllConfig, value)
export function setConfig (options: TAnalyserAllConfig)
export function setConfig (...args) {
  if(!args.length) return
  const [arg1, arg2] = args
  let options: TAnalyserAllConfig = {}
  if(typeof arg1 === 'object') {
    options = arg1
  } else if(typeof arg1 === 'string') {
    options[arg1] = arg2
  }
  if (options.max) {
    options.max = Math.min(options.max, MAX_LENGTH)
  }
  Object.assign(Config, options)
  dispatchCustomEvent(EVENT_CHANGE_CONFIG)
}

type TKeyConfigValue<T extends keyof TAnalyserAllConfig> = T extends TEnableConfig ? Exclude<Required<TAnalyserAllConfig>[T], boolean> : Required<TAnalyserAllConfig>[T]

const handle: {
  [key in keyof TAnalyserAllConfig]: () => TKeyConfigValue<key>
} = {
  pollInterval () {
    const value = Config['pollInterval'] || 60
    return value * 1000
  },
  module () {
    const value = Config['module']
    if (typeof value === 'function') {
      try {
        return value()
      } catch {
        return ''
      }
    }
    return ''
  },
  enableXhr () {
    const value = Config['enableXhr']
    if (!value || typeof value === 'boolean') {
      return {
        success: !!value,
        failure: !!value
      }
    }
    return {
      success: !!value?.success,
      failure: !!value?.failure
    }
  },
  enablePerf () {
    let value = Config['enablePerf']
    return {
      enable: !!value,
      ttiLimit: value && typeof value === 'object' ? value.ttiLimit : 10000
    }
  },
  enableResource () {
    let value = Config['enableResource']
    if(typeof value === 'boolean') {
      value = {enable: !!value}
    }
    return Object.assign({}, {
      enable: false,
      ignoreUrls: [],
      ignoreApis: [],
      ignoreExts: []
    }, value)
  },
  enableHeatmap () {
    let value = Config['enableHeatmap']
    if(typeof value === 'boolean') {
      value = {enable: !!value}
    }
    return {
      enable: false,
      urls: [],
      timeout: 10000,
      ...value
    }
  }
}

export function getConfig<T extends keyof TAnalyserAllConfig>(key: T): TKeyConfigValue<T> {
  return typeof handle[key] === 'function' ? (handle as any)[key]() : Config[key]
}
