function load (assets, cb) {
  for (const { type, value, id } of assets) {
    const existing = document.getElementById(id)

    if (existing) {
      if (type === 'script') {
        cb()
      }
      return
    }

    const tag = document.createElement(type)
    tag.id = id
    if (type === 'script') {
      tag.async = true
      tag.defer = true
      tag.src = value
      tag.onload = () => cb()
    } else {
      tag.rel = 'stylesheet'
      tag.href = value
    }
    document.body.appendChild(tag)
  }
}

export {
  load
}
