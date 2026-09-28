
# 19. This is why the Theme has almost no logic

This is one of the architectural rules I would lock in.

A Theme can know:

**how to display**

**how to animate**

**how to arrange**

**how to collect input**

But it should not know:

**what the world means**

**who is allowed to do something**

**what business rule applies**

**what the next world state should be**

**what the hospital constitution says**

That belongs to the Machine and Space-time.

So the Theme becomes replaceable.

You can throw away React.

Use Vue.

Use another renderer.

Use mobile.

Use canvas.

Use 2D.

Use 3D.

Use voice.

The world remains.

