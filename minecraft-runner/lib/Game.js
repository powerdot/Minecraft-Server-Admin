var events   = require("events"),
    path     = require("path"),
    spawn    = require("child_process").spawn,
    util     = require("util"),
    _        = require("lodash"),
    patterns = require("./patterns"),
    os = require("os");

/**
 * Create an instance of a minecraft server. Each instance can spawn a process
 * of the game, monitor it's stdout/err, write to it's stdin and emit events
 * as certain events happen within the game itself.
 *
 * @constructor
 * @param {String} dir
 * @param {String} jar
 * @param {Object} options
 */
function Game(dir, jar, options) {
    _.extend(this, options);
    this.dir = dir;
    this.jar = jar;
    this.players = [];

    events.EventEmitter.call(this);
    //this.setMaxListeners(20);
}

// this is an EventEmitter object
util.inherits(Game, events.EventEmitter);

// default properties
Game.prototype.ram = (parseInt(os.totalmem()/1024/1024) - 100)+"M"//"1G";
Game.prototype.java = "java";
Game.prototype.status = "Stopped";

// automatically generate the command arguments based on the object's state
Object.defineProperty(Game.prototype, "args", {
    get: function () {
        return [
            "-jar",
            "-Xms" + this.ram,
            "-Xmx" + this.ram,
            this.jar,
            "nogui"
        ];
    }
});

/**
 * Start up a server instance, begin monitoring the process
 *
 * @param {Function} callback  Will run after the server has finished starting
 */
Game.prototype.start = function (callback) {
    var game = this;
    callback = _.once(callback.bind(this));

    if (this.running) {
        return callback(null);
    }

    this.emit("start");
    this.status = "Starting";
    //console.log(this.java, this.args, this.dir);
    this.log = "";
    this.process = spawn(this.java, this.args, { cwd: this.dir });

    this.process.stdout.setEncoding("utf8");
    this.process.stdout.on("data", function (data) {
        var java = "";
        game.log += data;
        if (game.debug) {
            console.log(data.trim());
        }

        if (/^Error/.test(data) || /^Exception/.test(data)) {
            game.emit("error", new Error(data));
        } else if (/^java/.test(data) || /^\s+/.test(data)) {
            java += data;

            _.debounce(function () {
                java = "";
                //console.warn(java);
                game.emit("java", java);
            }, 500);
        } else {
            Game.emitLog(game, data);
        }
    });

    this.process.once("exit", function (code) {
        game.status = "Stopped";
        game.process = null;

        game.emit("stopped");
    });

    function started() {
        game.status = "Running";
        game.removeListener("started", started);
        game.removeListener("error", error);

        callback(null, game.process);
    }

    function error(err) {
        if (game.process) {
            game.process.kill();
        }

        if (game.status !== "Running") {
            callback(err);
        }
    }

    game.once("started", started);
    game.once("error", error);
};

Game.prototype.stop = function (callback) {
    var game = this,
        done = function () {
            game.removeListener("stopped", done);
            game.removeListener("error", done);
            callback.apply(game, arguments);
        };

    if (!this.process) {
        return callback(null);
    }

    this.emit("stop");
    this.status = "Stopping";
    this.say("Server is being stopped");
    this.command("stop");
    this.players = [];
    this.once("stopped", done);
    this.once("error", done);
};

Game.prototype.restart = function (callback) {
    this.stop(function (err) {
        this.start(callback.bind(this));
    });
};

Game.prototype.command = function () {
    if (!this.process) {
        return false;
    }

    return this.process.stdin.write([].join.call(arguments, " ") + "\n");
};

Game.prototype.say = function (msg) {
    return this.command("say", msg);
};

Game.parseLog = function (line) {
    var data = line.trim().split(" "),
        meta;

    meta = {
        datetime: (data.shift()||"") + " " + data.shift(),
        level:    (data.shift()||"").replace(/\W/g, ""),
        text:     data.join(" ")
    };

    return meta;
};

Game.emitLog = function (game, log) {
    var meta = Game.parseLog(log);

    game.emit("log", meta);

    _.each(patterns, function (fn) {
        fn(game, meta);
    });
};

module.exports = Game;
