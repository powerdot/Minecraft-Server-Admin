var Game = require("minecraft-runner");
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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

function runExpressServer(){
    console.log("Login at http://<your ip>:2020");
    app.listen(2020);
}

let game;


let configProto = {
    server_version: '',
    map: '',
    password: ''
};
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

app.get("/stop", (req, res)=>{
    try{
        game.stop();
    }catch(e){

    }
    res.send("stoped!");
});

app.get("/restart", (req, res)=>{
    try{
        game.restart();
    }catch(e){

    }
    res.send("restarted!");
});

app.get("/start", (req, res)=>{
    if( !getConfig('server_version') ) return res.status(400).send("set /setServerVersion?version=<>");
    updateServerProperty("level-name", req.query.map);
    game = new Game(
        path.resolve(servers_path, `server-${getConfig('server_version')}`), 
        path.resolve(jars_path, `server-${getConfig('server_version')}.jar`), 
        {}
    );
    game.start((err)=>{console.log("error:", err)});
    res.send(getServerProperties());
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
    let local = [];
    res.send({
        available: available.data.versions.filter(x=>x.type=='release').map(x=>x.id),
        local
    });
});

app.get('/setServerVersion', (req,res)=>{
    let version = req.query.version;
    if(!version) return res.status(400).send("need version param");
    setConfig('server_version', version);
    res.send(version+" version set!");
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
        res.send({
            status: 'installed',
            version,
            version_path
        });
    });

    fs.mkdirSync(path.resolve(servers_path, `server-${version}`), {recursive: true});
    fs.writeFileSync(path.resolve(servers_path, `server-${version}`, 'eula.txt'), "eula=true", {encoding: "UTF-8"});

    setConfig("map", 'world');

    setConfig('server_version', version);
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

    if( !fs.existsSync( path.resolve(map_path, 'level.dat') ) ){
        rimraf.sync(map_path);
        return res.status(400).send("not found lavel.dat after unzip, add only nesting content.");
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
        current_map: getServerProperty('level-name'),
        maps: []
    };
    let dirs = getDirectories( path.resolve(servers_path, `server-${getConfig('server_version')}`) );
    for(let dir of dirs){
        if( fs.existsSync( path.resolve(servers_path, `server-${getConfig('server_version')}`, dir, 'level.dat') ) ){
            maps.maps.push(dir);
        }
    }
    res.send(maps);
});

app.get('/setServerMap', (req, res)=>{
    if(!req.query.map) return res.status(400).send("send map name with map param");
    setConfig("map", req.query.map);
    updateServerProperty("level-name", req.query.map);
    res.send("map set: "+req.query.map)
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
    return getServerProperties()[key];
}

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
