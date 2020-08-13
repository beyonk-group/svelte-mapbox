function createDispatchers (target, dispatch, events) {
  const dispatchers = events.map(name => {
    const dispatcher = data => dispatch(name, data)
    target.on(name, dispatcher)
    return { name, dispatcher }
  })

  return () => {
    dispatchers.forEach(({ name, dispatcher }) => target.off(name, dispatcher))
  }
}

export {
  createDispatchers
}
