var events  = require("events"),
    fs      = require("fs"),
    https   = require("https"),
    path    = require("path"),
    mkdirp  = require("mkdirp"),
    should  = require("should"),
    rimraf  = require("rimraf"),
    Game    = require("../lib/Game"),
    support = path.join(__dirname, "support");

before(function (done) {
    mkdirp(support, done);
});

describe("Game", function () {
    var dir  = path.join(support, "server"),
        jar  = path.join(support, "minecraft_server.jar"),
        url  = "https://s3.amazonaws.com/MinecraftDownload/launcher/minecraft_server.jar",
        game = new Game(dir, jar);

    before(function (done) {
        var context = this;

        mkdirp(dir, function (err) {
            if (err) return done(err);

            fs.exists(jar, function (exists) {
                if (exists) return done();

                context.timeout("5s");
                https.get(url, function (res) {
                    res.pipe(fs.createWriteStream(jar));
                    res.once("end", done);
                });
            });
        });
    });

    after(function (done) {
        rimraf(dir, done);
    });

    describe(".constructor", function () {
        it("should be an instance of EventEmitter", function () {
            game.should.be.instanceof(events.EventEmitter);
        });
    });

    describe(".parseLog()", function () {
        it("should return a hash of details about the log", function () {
            Game.parseLog("2012-09-29 23:56:07 [INFO] Test Log Entry")
                .should.eql({
                    datetime: "2012-09-29 23:56:07",
                    level:    "INFO",
                    text:     "Test Log Entry"
                });
        });
    });

    describe(".emitLog()", function () {
        afterEach(function () {
            game.removeAllListeners();
        });

        it("should emit 'version' and set the version property", function () {
            var version = "1.4.7";

            game.once("version", function (ver) {
                ver.should.equal(version);
            });

            Game.emitLog(game, "2013-01-20 12:46:56 [INFO] Starting minecraft server version " + version);

            game.version.should.equal(version);
        });

        it("should emit 'log'", function (done) {
            game.once("log", function (meta) {
                should.exist(meta);
                done();
            });

            Game.emitLog(game, "2012-09-29 23:56:07 [INFO] Test Log Entry");
        });

        it("should emit 'error'", function (done) {
            game.once("error", function (meta) {
                should.exist(meta);
                done();
            });

            Game.emitLog(game, "2012-09-30 12:01:00 [ERROR] Something really bad happened");
        });

        it("should emit 'joined'", function (done) {
            game.once("joined", function (player, meta) {
                player.should.equal("testuser");

                meta.should.eql({
                    source: "/192.168.1.136:50884",
                    entity: 94,
                    location: {
                        x: -7.9431711874409,
                        y: 39.0,
                        z: 834.0122034190467
                    }
                });

                game.players.should.have.length(1);

                done();
            });

            Game.emitLog(game, "2012-09-29 14:29:23 [INFO] testuser[/192.168.1.136:50884] logged in with entity id 94 at (-7.9431711874409, 39.0, 834.0122034190467)");
        });

        it("should emit 'left'", function (done) {
            game.once("left", function (user, reason) {
                user.should.equal("testuser");
                reason.should.equal("disconnect.quitting");
                done();
            });

            Game.emitLog(game, "2012-09-29 15:32:20 [INFO] testuser lost connection: disconnect.quitting");
        });

        it("should emit 'started'", function (done) {
            game.once("started", done);
            Game.emitLog(game, '2012-09-29 14:29:20 [INFO] Done (3.256s)! For help, type "help" or "?"');
        });

        it("should emit 'saveoff'", function (done) {
            game.once("saveoff", done);
            Game.emitLog(game, "2012-09-29 15:32:20 [INFO] Turned off world auto-saving");
        });

        it("should emit 'saved'", function (done) {
            game.once("saved", done);
            Game.emitLog(game, "2012-09-29 15:32:20 [INFO] Saved the world");
        });

        it("should emit 'saveon'", function (done) {
            game.once("saveon", done);
            Game.emitLog(game, "2012-09-29 15:32:20 [INFO] Turned on world auto-saving");
        });
    });

    describe("#start()", function () {
        this.timeout("15s");

        afterEach(function (done) {
            game.stop(function () {
                done();
            });
        });

        it("should spawn a new process", function (done) {
            game.start(function (err, proc) {
                if (err) return done(err);

                proc.should.equal(game.process);
                done();
            });

            should.exist(game.process);
        });

        it("should change the status property", function (done) {
            game.status.should.equal("Stopped");

            game.start(function (err) {
                if (err) return done(err);

                game.status.should.equal("Running");
                done();
            });

            game.status.should.equal("Starting");
        });

        it("should emit version, start and started", function (done) {
            var count = 0;
            function incr() { count += 1; }

            game.once("version", incr);
            game.once("start", incr);
            game.once("started", incr);
            game.once("error", done);

            game.start(function () {
                count.should.equal(3);
                done();
            });
        });
    });

    describe("#stop()", function () {
        this.timeout("3s");

        beforeEach(function (done) {
            this.timeout("10s");

            game.start(done);
        });

        it("should change the status property", function (done) {
            game.status.should.equal("Running");

            game.stop(function (err) {
                if (err) return done(err);
                game.status.should.equal("Stopped");
                done();
            });

            game.status.should.equal("Stopping");
        });

        it("should remove the process property", function (done) {
            should.exist(game.process);

            game.stop(function (err) {
                if (err) return done(err);

                should.not.exist(game.process);
                done();
            });
        });

        it("should emit stop and stopped", function (done) {
            var count = 0;
            function incr() { count += 1; }

            game.once("stop", incr);
            game.once("stopped", incr);
            game.once("error", done);

            game.stop(function () {
                count.should.equal(2);
                done();
            });
        });
    });

    describe("#restart()", function () {
        this.timeout("10s");

        beforeEach(function (done) {
            game.start(done);
        });

        afterEach(function (done) {
            game.stop(done);
        });

        it("should emit version, stop, stopped, start, and started", function (done) {
            var events = 0;
            function incr() { events += 1; }

            game.once("version", incr);
            game.once("stop",    incr);
            game.once("stopped", incr);
            game.once("start",   incr);
            game.once("started", incr);

            game.restart(function (err) {
                if (err) return done(err);
                events.should.equal(5);
                done();
            });
        });
    });

    describe("#log", function () {
        this.timeout("15s");

        beforeEach(function (done) {
            game.start(done);
        });

        afterEach(function (done) {
            game.stop(done);
        });

        it("should append the output of the server console to the log property", function () {
            game.log.should.be.ok;
        });
    });
});
