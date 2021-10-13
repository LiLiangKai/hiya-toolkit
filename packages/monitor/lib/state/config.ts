
export interface IConfig {
  version: string
  reportInterval: number
}

const config: IConfig = {
  version: 'process.env.PKG_VERSION',
  reportInterval: 5000
}

export function setConfig (key, value) {
  config[key] = value
}

export function getConfig (key: keyof IConfig) {
  return config[key] 
}