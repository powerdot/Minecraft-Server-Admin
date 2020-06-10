var _ = require("lodash"),
patterns = {
    version: /^Starting minecraft server version ([.0-9a-zA-Z]+)$/,
    done:    /^Done \([.0-9a-zA-Z]+\)!/,
    join:    /^(\w+) ?(\[(.+)\] )?logged in with entity id (\d+) at \(([\d\s\-\.,]+)\)$/,
    leave:   /^(\w+) lost connection: (.+)$/,
    bind:    /^\*+ FAILED TO BIND TO PORT\!$/
};


// modify game info/state
exports.version = function (game, meta) {
    var match = meta.text.match(patterns.version);

    if (match) {
        game.version = match[1];
        game.emit("version", match[1]);
    }
};

exports.joined = function (game, meta) {
    var match = meta.text.match(patterns.join),
        player, coord;

    if (match) {
        player = match[1];
        coord = match[5].split(", ");

        game.players.push(player);

        game.emit("joined", player, {
            source: match[3],
            entity: +match[4],
            location: {
                x: parseFloat(coord[0]),
                y: parseFloat(coord[1]),
                z: parseFloat(coord[2])
            }
        });
    }
};

exports.left = function (game, meta) {
    var match = meta.text.match(patterns.leave);

    if (match) {
        console.log(game.players);
        game.players = _.without(game.players, match[1]);
        game.emit("left", match[1], match[2]);
    }
};

// informational
exports.error = function (game, meta) {
    if (meta.level === "ERROR") {
        game.emit("error", new Error(meta));
    }
};

exports.fail2bind = function (game, meta) {
    if (meta.level === "WARNING" && patterns.bind.test(meta.text)) {
        game.emit("error", new Error(meta));
    }
};

// start/stop
exports.started = function (game, meta) {
    if (patterns.done.test(meta.text)) {
        game.emit("started");
    }
};

// save status
exports.saveoff = function (game, meta) {
    if (meta.text === "Turned off world auto-saving") {
        game.emit("saveoff");
    }
};

exports.saveon = function (game, meta) {
    if (meta.text === "Turned on world auto-saving") {
        game.emit("saveon");
    }
};

exports.saved = function (game, meta) {
    if (meta.text === "Saved the world") {
        game.emit("saved");
    }
};
