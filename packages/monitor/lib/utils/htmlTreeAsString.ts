/**
 * html元素转为字符串
 * @param html 
 * @returns 
 */
export default function htmlTreeAsString (html: HTMLElement) {
  if(!html) return ''
  const tag = html.nodeName.toLowerCase()
  const id = html.id
  const classList = html.className.trim().replace(/\s+/g, '.')
  const text = html.innerText
  let result = tag
  id ? (result += `#${id}`) : (classList && (result += `.${classList}`))
  text && (result = `${result}(${text})`)
  return result
}