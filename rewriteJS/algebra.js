algebra({
  compose: (actor, action, resource) =>
    sentence(actor, action, resource),

  sequence: (...behaviors) =>
    behavior("sequence", behaviors)
})