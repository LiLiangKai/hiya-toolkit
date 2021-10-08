/**
 * 替换原始方法
 * @param namespace 
 * @param name 
 * @param replacement 
 */
export default function replaceOriginal (
  namespace: any, 
  name: string, 
  replacement: (origin: Function) => void
) {
  if(namespace === null || typeof namespace !== 'object' || !(name in namespace)) return void 0
  const originFn = namespace[name]
  const wrapFn = replacement(originFn)
  if(typeof wrapFn === 'function') {
    namespace[name] = wrapFn
  }
  return void 0
  
}