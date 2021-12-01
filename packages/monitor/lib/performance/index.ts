import FT from './fmp-tti'
import { getConfig } from '../core/config'
import { addTrack, IPerformanceTrack } from '../core/track'
import { numberFixed } from '../utils'

/** 页面性能 */
export function handlePerformance () {
  const config = getConfig('enablePerf')
  if(!config?.enable) return

  window.TTI_LIMIT = config.ttiLimit as number
  FT.then(({ fcp, fmp, tti }) => {
    addTrack({
      type: 'perfPage',
      time: Date.now(),
      param: {
        fcp,
        fmp,
        tti,
        screen: `${screen.width}x${screen.height}`,
        window: `${window.innerWidth}x${window.innerHeight}`,
      }
    } as IPerformanceTrack)
  })
}

/** 资源性能 */
export function handleResource() {
  const performance = window.performance
  if (!performance || typeof performance !== 'object' || typeof performance.getEntriesByType !== 'function') return
  const config = getConfig('enableResource')
  if(!config.enable) return

  setTimeout(() => {
    requestIdleCallback ? requestIdleCallback(watch) : watch()
  }, 30*1000)

  function watch () {
    const { ignoreUrls = [], ignoreApis = [], ignoreExts = [], ignoreTypes = [] } = config
    const resources = (performance.getEntriesByType("resource") || []) as Array<PerformanceResourceTiming>
    const regStr = ignoreApis.concat(ignoreExts).join('$|')
    const reg = new RegExp(`${regStr}$`)
    resources.map(r => {
      const {name: url, initiatorType} = r
      // 过滤忽略的链接
      if(ignoreUrls.indexOf(url) > -1) return 
      // 过滤忽略的资源类型
      if(ignoreTypes.length>0 && ignoreTypes.indexOf(initiatorType as any) > -1) return
      // 过滤忽略的文件或接口
      if(regStr && reg.test(url)) return
      addTrack({
        type: 'perfResource',
        param: {
          url,
          rtype: initiatorType,
          dns: numberFixed(r.domainLookupEnd - r.domainLookupStart),
          tcp: numberFixed(r.connectEnd - r.connectStart),
          req: numberFixed(r.responseStart - r.requestStart),
          res: numberFixed(r.responseEnd - r.responseStart)
        }
      } as IPerformanceTrack)
    })
  }
}