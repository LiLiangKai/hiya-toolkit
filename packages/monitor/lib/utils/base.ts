export function getPathurl () {
  let url = { search: "", pathname: '', hash: '' }
  if(URL) {
    url = new URL(location.href)
  } else {
    let a = document.createElement('a')
    a.href = location.href
    url = {
      search: a.search,
      pathname: a.pathname,
      hash: a.hash
    }
  }
  return url.pathname + url.search + url.search
}