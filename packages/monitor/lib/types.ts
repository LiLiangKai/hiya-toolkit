export interface IMonitorOption {
  enableLog?: string | Array<string|boolean|number> | {
    log?: boolean
    warn?: boolean
    error?: boolean
  }
}