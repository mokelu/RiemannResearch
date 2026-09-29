grammar({
  sentence:
    actor + action + resource,

  behavior:
    atomic | composed,

  composed:
    behavior + behavior
})