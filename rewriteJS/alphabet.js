alphabet({
  actor: [
    "user",
    "system",
    "app",
    "plugin"
  ],

  action: [
    "create",
    "read",
    "update",
    "delete",
    "open",
    "close",
    "load",
    "save",
    "validate"
  ],

  resource: [
    "file",
    "folder",
    "workspace",
    "editor",
    "document"
  ],

  response: {
    syntax: "resource.on.action(user)"
  }
})