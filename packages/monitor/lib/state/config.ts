import getFingerprint from '../utils/fingerprint'

export interface ISysConfig {
  /** sdk版本信息 */
  version?: string
  /** 唯一标识ID */
  UID?: string
}

export interface IConfig {
  /** 自动上报 */
  autoReport?: boolean
  /** 上报间隔 */
  reportInterval?: number
  /** 上报地址 */
  reportUrl?: string
  /** 应用ID */
  appID?: string
  /** console行为 */
  console?: {
    /** 普调打印，为false禁用 */
    info?: boolean
    /** 警告打印，为false禁用 */
    warn?: boolean
    /** 错误打印，为false禁用 */
    error?: boolean
  }
  /** 自定上报内容 */
  content?: string | (() => string)
}

export type TAllConfig = ISysConfig & IConfig

const config: TAllConfig = {
  UID: '',
  version: 'process.env.PKG_VERSION',
  autoReport: false,
  reportInterval: 5000,
  reportUrl: '',
  appID: '',
  console: {
    info: true,
    warn: true,
    error: true
  }
}

export function initConfig (option: IConfig) {
  const newConfig = Object.assign({}, config, {
    ...option,
    console: Object.assign({}, config.console, option.console)
  })
  Object.assign(config, newConfig)
  setConfig('UID', getFingerprint())
}

export function setConfig(key: keyof TAllConfig, value) {
  config[key] = value
}

export function getConfig<T = any>(key: keyof TAllConfig) {
  return config[key] as T
}

export function allConfig () {
  return {
    ...config
  }
}