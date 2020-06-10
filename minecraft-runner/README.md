# node-minecraft-runner

An API for running minecraft server instances. It also monitors the server for
particular events and emits them in ways that you can use in your application.
For example, it will emit a `joined` event when a player joins the server.

    npm install minecraft-runner

Include in your project, the export is a single constructor function

```javascript
var Game = require("minecraft-runner");
```

## Usage

### Game(dir, jar, [options])

The constructor will create an object representing a file on disk.

**Arguments**

 * dir - The path to the root folder for the server (the dir with server.properties)
 * jar - The path to `minecraft_server.jar`
 * options - A hash of additional properties for the object (just extended to this)
    * java - The path to the `java` executable (default: `"java"`)
    * ram - The java command arguments: `-Xms{ram} -Xmx{ram}` (default: `"1G"`)

```javascript
var game = new Game("/path/to/server", "/path/to/jar");
```

### Game#start(callback)

Startup the server instance. The callback is executed once the server reports
it has finished starting.

**Arguments**

 * callback - Arguments provided:
    * err - Error object (if relevent)
    * proc - The object returned by `child_process.spawn()`

```javascript
game.start(function (err, proc) {
    // err => null or Error()
    // proc => spawned process object, same as this.process
});
```

### Game#stop(callback)

Stops the server instance. The callback is executed once the process exits.
(ie: when the server finishes shutting down)

**Arguments**

 * callback - Arguments provided:
    * err - Error object (if relevent)

```javascript
game.stop(function (err) {
    // err => null or Error()
});
```

### Game#restart(callback)

Restarts the server instance. (ie. calls `stop()`, then `start()` in succession)

**Arguments**

 * callback - Arguments provided:
    * err - Error object (if relevent)
    * proc - The object returned by `child_process.spawn()`

```javascript
game.restart(function (err, proc) {
    // err => null or Error()
    // proc => spawned process object, same as this.process
});
```

### Game#command(...cmd)

Issues a [command](http://www.minecraftwiki.net/wiki/Command) to the server.
All the arguments to the function are joined with a space.

**Arguments**

 * ...cmd All the parts of the command to be made of the server

```javascript
// broadcast "Hello World" to all players on the server
game.command("say", "Hello World");

// say "Hello" to only player testuser
game.command("tell", "testuser", "Hello");
```

### Game#say(msg)

Short-hand for `game.command("say", msg);`

**Arguments**

 * msg Message to be broadcast to all players on server

```javascript
game.say("Hello World!");
```

## Events

 - **start** - emitted before a server has started
 - **started** - emitted after a server has finished starting
 - **stop** - emitted before stopping the server
 - **stopped** - emitted after the server has finished stopping
 - **error (err)** - triggered by an error in the server (via log) or from a java exception
 - **java (msg)** - a java exception (usually outside the minecraft game itself)
 - **log (meta)** - emitted any time a log is detected from the server
 - **version (name)** - emitted when the server reports the version of the jar being used
 - **joined (name, details)** - emitted after a player joins the server
 - **left (name, reason)** - emitted after a player leaves the server
 - **saveoff** - emitted after the server reports it has stopped auto-saving (in response to `save-off` command)
 - **saveon** - emitted after the server reports it has resumed auto-saving (in response to `save-on` command)
 - **saved** - emitted after the server reports it has finished saving (in response to `save-all` command)
