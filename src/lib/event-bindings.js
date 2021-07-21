function bindEvents (el, handlers, mapbox, node) {
  const unbindings = []

  for (const [ handler, fn ] of Object.entries(handlers)) {
    const cmd = ev => {
      const [ eventName, detail ] = fn(el, ev, mapbox)
      node.dispatchEvent(
        new CustomEvent(eventName, { detail })
      )
    }
    el.on(handler, cmd)
    unbindings.push([ handler, cmd ])
  }

  return () => {
    for (const [ handler, cmd ] of unbindings) {
      el.off(handler, cmd)
    }
  }
}

export {
  bindEvents
}
