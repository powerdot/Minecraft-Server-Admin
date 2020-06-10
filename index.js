var Game = require("./minecraft-runner");
let path = require("path");
let fs = require("fs");
let express = require("express");
let app = express();
let axios = require("axios").default;
var download = require('download-file');
const fileUpload = require('express-fileupload');
const decompress = require('decompress');
var rimraf = require("rimraf");
const readline = require("readline");
const child_process = require('child_process');

let public_ip_data;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let configProto = {
    server_version: '',
    map: '',
    password: ''
};

app.use(fileUpload());

let servers_path = path.resolve(__dirname, 'servers');
let jars_path = path.resolve(__dirname, 'jars');
let config_path = path.resolve(__dirname, 'config.json');

if(!fs.existsSync(servers_path)) fs.mkdirSync(servers_path);
if(!fs.existsSync(jars_path)) fs.mkdirSync(jars_path);

if(!getConfig("password")){
    rl.question("You need set password on server:", function(password) {
        setConfig("password", password);
        console.log("Thank you and welcome to NodeJS Minecraft Admin!");
        runExpressServer()
        rl.close();
    });
}else{
    runExpressServer()
}

async function runExpressServer(){
    let ip_req = await axios.get("https://api.ipify.org");
    let ip = ip_req.data;
    public_ip_data = {
        ip
    };
    console.log(`Login at http://${public_ip_data.ip}:2020 or http://localhost:2020`);
    app.listen(2020);
}

let game;

function getConfig(key){
    if(!fs.existsSync(config_path)) fs.writeFileSync(config_path, JSON.stringify(configProto), {encoding: 'utf-8'});
    let config = JSON.parse( fs.readFileSync(config_path, {encoding: 'utf-8'}) );
    return config[key];
}
function setConfig(key, value){
    if(!fs.existsSync(config_path)) fs.writeFileSync(config_path, JSON.stringify(configProto), {encoding: 'utf-8'});
    let config = JSON.parse( fs.readFileSync(config_path, {encoding: 'utf-8'}) );
    config[key] = value;
    fs.writeFileSync(config_path, JSON.stringify(config), {encoding: 'utf-8'});
    return true;
}

app.use(express.static(path.resolve(__dirname, 'public')));

app.use((req,res, next)=>{
    if(req.query.password != getConfig("password")) return res.status(403).send("password?");
    return next();
});

app.get("/verifyPassword", (req,res)=>{
    res.send("ok");
});

app.get("/stop", (req, res)=>{
    try{
        game.stop((x)=>res.send("stoped!"));
    }catch(e){
        res.status(400).send("error while stoping");
    }
});

app.get("/restart", (req, res)=>{
    try{
        game.restart(x=>console.log("restarted!"));
    }catch(e){
        res.status(400).send("error while restarting");
    }
});

app.get("/start", (req, res)=>{
    if( !getConfig('server_version') ) return res.status(400).send("set /setServerVersion?version=<>");
    if( !getConfig('level-name') ) updateServerProperty("level-name", "world");
    game = new Game(
        path.resolve(servers_path, `server-${getConfig('server_version')}`), 
        path.resolve(jars_path, `server-${getConfig('server_version')}.jar`), 
        {debug: true}
    );
    game.start((err, process)=>{
        console.log("started!");
        res.send(getServerProperties());
    });
    
});

app.get("/logs", (req,res)=>{
    if(!game) return res.status(400).send("start game");
    if(game.status != "Running") return res.status(400).send("start game");
    let logs = game.log.split("\n").slice(-100);
    res.send(logs);
});

app.get("/command", (req, res)=>{
    if(!game) return res.status(400).send("start game");
    if(game.status != "Running") return res.status(400).send("start game");
    if(!req.query.text) return res.status(400).send("send param 'text'");
    game.command(req.query.text);
    res.send(req.query.text);
});

app.get("/settings", (req, res)=>{
    let settings = fs.readFileSync(settings_path, {encoding: "UTF-8"});
    res.send(settings.replace(/\n/g, '<br>'));
});

app.get("/players", (req, res)=>{
    let players = game.players;
    res.send(players);
});

app.get('/findVersions', async(req,res)=>{
    let available = await axios.get("https://launchermeta.mojang.com/mc/game/version_manifest.json");
    let a = ['latest', ...available.data.versions.filter(x=>x.type=='release').map(x=>x.id)];
    res.send(a);
});

app.get('/setServerVersion', (req,res)=>{
    let version = req.query.version;
    if(!version) return res.status(400).send("need version param");
    setConfig('server_version', version);
    res.send(version+" version set!");
});

app.get('/gameStatus', (req,res)=>{
    if(!game) return res.send("Offline");
    if(game.status) return res.send(game.status);
    res.send("Offline");
});

app.get('/install', async(req,res)=>{
    let v = await axios.get("https://launchermeta.mojang.com/mc/game/version_manifest.json");

    let version = req.query.version;
    if(!version){
        return res.status(400).send("add param `version`<br>- latest<br>or from /findAllVersions");
    }
    if(version == 'latest'){
        version = v.data.latest.release;
    }

    let version_path = path.resolve(jars_path, `server-${version}.jar`);

    if( fs.existsSync(version_path) ) fs.unlinkSync(version_path);

    let version_data = (await axios.get( v.data.versions.find(x=>x.id==version).url )).data;
        
    download(version_data.downloads.server.url, {
        directory: jars_path,
        filename: `server-${version}.jar`
    }, function(err){
        if (err) throw err

        fs.mkdirSync(path.resolve(servers_path, `server-${version}`), {recursive: true});
        fs.writeFileSync(path.resolve(servers_path, `server-${version}`, 'eula.txt'), "eula=true", {encoding: "UTF-8"});
    
        setConfig("map", 'world');
        setConfig('server_version', version);

        game = new Game(
            path.resolve(servers_path, `server-${getConfig('server_version')}`), 
            path.resolve(jars_path, `server-${getConfig('server_version')}.jar`), 
            {debug: true}
        );
        game.start((err, process)=>{
            console.log("started!");
        });
        setTimeout(function(){
            game.stop(()=>{
                res.send({
                    status: 'installed',
                    version,
                    version_path
                });
            });
        }, 5000);
    });
});

app.post('/uploadMap', async(req, res)=>{
    if(!req.files) return res.status(400).send("send .zip file with 'map' key.");
    if(!req.files.map) return res.status(400).send("send .zip file with 'map' key.");
    if(req.files.map.mimetype != 'application/zip')  return res.status(400).send("map must be .zip");
    if(!req.body.name) return res.status(400).send("need 'name' param");
    if(!getConfig("server_version")) return res.status(400).send("set server_version");
    if(!req.body.version) req.body.version = getConfig("server_version");
    
    let server_path = path.resolve(servers_path, `server-${req.body.version}`);
    if( !fs.existsSync( server_path ) ) return res.status(400).send("no server directory exists");

    let map_zip_path = server_path +"/"+ req.body.name + '.zip';
    let map_path = path.resolve(server_path, req.body.name);
    if( fs.existsSync( map_path ) ) return res.status(400).send("map with name exists");

    fs.mkdirSync(map_path, {recursive: true});
    
    req.files.map.mv(map_zip_path);

    await decompress(map_zip_path, map_path);

    fs.unlinkSync(map_zip_path);

    // nesting files first try
    if( !fs.existsSync( path.resolve(map_path, 'level.dat') ) ){

        // searching inside folders
        let dirs = getDirectories( path.resolve(map_path) );
        let found = false;
        for(let dir of dirs){
            if( fs.existsSync( path.resolve(map_path, dir, 'level.dat') ) ){
                // map found: replace current content with it
                found = true;
                fs.renameSync( path.resolve(map_path, dir), path.resolve(server_path, "temp_"+req.body.name));
                rimraf(map_path, function(){
                    fs.renameSync( path.resolve(server_path, "temp_"+req.body.name), map_path );
                });
            }
        }

        if(!found){
            rimraf.sync(map_path);
            return res.status(400).send("not found lavel.dat after unzip, add only nesting content.");
        }
    }

    res.send("map uploaded!");
});

app.get('/getServerProperties', (req, res)=>{
    res.send(getServerProperties());
});

app.get('/updateServerProperty', (req, res)=>{
    if(!req.query.key) return res.status(400).send("look for /getServerProperties <br> need ?key= and &value");
    updateServerProperty(req.query.key, req.query.value)
    res.send(getServerProperties());
});

app.get('/serverMaps', (req,res)=>{
    if( !getConfig('server_version') ) return res.status(400).send("set /setServerVersion?version=<>");
    let maps = {
        current: getServerProperty('level-name'),
        maps: []
    };
    let dirs = getDirectories( path.resolve(servers_path, `server-${getConfig('server_version')}`) );
    for(let dir of dirs){
        if( fs.existsSync( path.resolve(servers_path, `server-${getConfig('server_version')}`, dir, 'level.dat') ) ){
            maps.maps.push(dir);
        }
    }
    if(maps.current == "world" && maps.maps.length==0) maps.maps.push(maps.current);
    res.send(maps);
});

app.get('/serverVersions', (req,res)=>{
    let versions = {
        current: getConfig('server_version'),
        versions: []
    };
    let files = fs.readdirSync( jars_path );
    for(let file of files){
        if(!file.includes('.jar')) continue;
        versions.versions.push(file.toString().replace("server-",'').replace('.jar',''));
    }
    res.send(versions);
});

app.get('/getServerMap', (req, res)=>{
    res.send(getConfig("map"));
});

app.get('/renameServerMap', (req, res)=>{
    if(!req.query.name) return res.status(400).send("send name param");
    let old_name = getConfig("map");
    let new_name = req.query.name;
    setConfig("map", new_name);
    updateServerProperty("level-name", new_name);
    let old_path = path.resolve(servers_path, `server-${getConfig('server_version')}`, old_name);
    let new_path = path.resolve(servers_path, `server-${getConfig('server_version')}`, new_name);
    fs.renameSync(old_path, new_path);
    res.send("done");
});

app.get("/downloadServerMap", (req, res)=>{
    let name = getConfig("map");
    let server_path = path.resolve(servers_path, `server-${getConfig('server_version')}`);
    child_process.execSync(`zip -r "${name}.zip" "./${name}"`, {
        cwd: server_path
    });
    res.download(server_path + `/${name}.zip`);
});

app.get("/removeServerMap", (req, res)=>{
    // получение списка карт без удаляемоей карты
    let current_map = getConfig("map");
    let maps = [];
    let dirs = getDirectories( path.resolve(servers_path, `server-${getConfig('server_version')}`) );
    for(let dir of dirs){
        if( fs.existsSync( path.resolve(servers_path, `server-${getConfig('server_version')}`, dir, 'level.dat') ) ){
            if(dir != current_map) maps.push(dir);
        }
    }

    // удаление карты
    let map_path = path.resolve(servers_path, `server-${getConfig('server_version')}`, current_map);
    if(fs.existsSync(map_path)) rimraf(map_path, function(){
        // установка новой карты, существующей или дефолтной
        let new_map = "";
        new_map = maps.length==0?"world":maps[0];
        setConfig("map", new_map);
        updateServerProperty("level-name", new_map);
        res.send("succesfully removed");
    });
});

app.get('/setServerMap', (req, res)=>{
    if(!req.query.map) return res.status(400).send("send map name with map param");
    setConfig("map", req.query.map);
    updateServerProperty("level-name", req.query.map);
    res.send("map set: "+req.query.map)
});

app.get('/getServerFullAddress', async (req, res)=>{
    if(!game) return res.status(500).send("start a game");
    if(game.status!='Running') return res.status(500).send("waiting until game start...");
    if(public_ip_data){
        if(public_ip_data.ip && public_ip_data.port) return res.send(public_ip_data);
    }
    try {
        let ip_req = await axios.get("https://api.ipify.org");
        let ip = ip_req.data;
        let port = getServerProperty("server-port");
        public_ip_data = {
            ip,
            port,
            full: `${ip}:${port}`
        };
        res.send(public_ip_data);
    } catch (error) {
        res.status(500).send('can\'t resolve ip address or port');
    }
});

function updateServerProperty(key, value){
    let server_version = getConfig('server_version');
    if(!server_version) return false;
    let config = getServerProperties();
    config[key] = value;
    let content = "";
    for(let key in config){
        content += key+"="+config[key]+"\n";
    }
    let file_path = path.resolve(servers_path, `server-${getConfig('server_version')}`, 'server.properties');
    fs.writeFileSync(file_path, content, {encoding: 'utf-8'});
    return true;
}

function getServerProperties(){
    let server_version = getConfig('server_version');
    if(!server_version) return false;
    let file_path = path.resolve(servers_path, `server-${getConfig('server_version')}`, 'server.properties');
    if(!fs.existsSync(file_path)) return false;
    let content = fs.readFileSync(file_path, {encoding: 'utf-8'});
    let content_splitted = content.split("\n");
    let config = {};
    for(let row of content_splitted){
        let key = row.split("=")[0];
        let value = row.split("=")[1];
        if(!key) continue;
        config[key] = value;
    }
    return config;
}



function getServerProperty(key){
    let p = getServerProperties();
    if(!p) return false;
    return p[key];
}

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
