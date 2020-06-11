// ** SDF (SERVER DATA FLOW) ENGINE ** //

let server_data = {};

let data_queries_empty = {
    serverMaps: ["world"]
};

let data_queries_types = {
    "getServerProperties:broadcast-rcon-to-ops": "bool",
    "getServerProperties:view-distance": "number",
    "getServerProperties:max-build-height": "number",
    "getServerProperties:server-ip": "text",
    "getServerProperties:level-seed": "text",
    "getServerProperties:rcon.port": "number",
    "getServerProperties:gamemode": ["survival","creative","adventure","spectator"],
    "getServerProperties:server-port": "number",
    "getServerProperties:allow-nether": "bool",
    "getServerProperties:enable-command-block": "bool",
    "getServerProperties:enable-rcon": "bool",
    "getServerProperties:enable-query": "bool",
    "getServerProperties:op-permission-level": "number",
    "getServerProperties:prevent-proxy-connections": "bool",
    "getServerProperties:generator-settings": "text",
    "getServerProperties:resource-pack": "text",
    "getServerProperties:level-name": "text",
    "getServerProperties:rcon.password": "text",
    "getServerProperties:player-idle-timeout": "number",
    "getServerProperties:motd": "text",
    "getServerProperties:query.port": "number",
    "getServerProperties:force-gamemode": "bool",
    "getServerProperties:hardcore": "bool",
    "getServerProperties:white-list": "bool",
    "getServerProperties:broadcast-console-to-ops": "bool",
    "getServerProperties:pvp": "bool",
    "getServerProperties:spawn-npcs": "bool",
    "getServerProperties:generate-structures": "bool",
    "getServerProperties:spawn-animals": "bool",
    "getServerProperties:snooper-enabled": "bool",
    "getServerProperties:difficulty": ["peaceful", "easy", "normal", "hard"],
    "getServerProperties:function-permission-level": "number",
    "getServerProperties:network-compression-threshold": "number",
    "getServerProperties:level-type": "text",
    "getServerProperties:spawn-monsters": "text",
    "getServerProperties:max-tick-time": "number",
    "getServerProperties:enforce-whitelist": "bool",
    "getServerProperties:use-native-transport": "bool",
    "getServerProperties:max-players": "number",
    "getServerProperties:resource-pack-sha1": "text",
    "getServerProperties:spawn-protection": "number",
    "getServerProperties:online-mode": "bool",
    "getServerProperties:allow-flight": "bool",
    "getServerProperties:max-world-size": "number"
}

let query_queue = {};

let data_queries = [];
let primary_data_queries = [];
$("[data-query]").each(function(i,val){
    if(!data_queries.includes($(this).attr('data-query'))) data_queries.push($(this).attr('data-query'));
    if(!primary_data_queries.includes($(this).attr('data-query').split(":")[0])) primary_data_queries.push($(this).attr('data-query').split(":")[0]);
});
console.log("found data_queries:",data_queries);
console.log("found primary_data_queries:",primary_data_queries);

function query(path, params, cb){
    if(!cb) cb = function(){};
    if(!params) params = {};
    let updated = (new Date()).getTime();
    if(!query_queue[path]) query_queue[path] = {status: 'new', updated, query: undefined};
    if(query_queue[path] == 'waiting') return console.log("waiting for response", query_queue[path], 'before create new query.');
    query_queue[path] = {status: 'waiting', updated};
    // console.log("query", path, params);
    params.password = localStorage.NMAPassword;
    if(path == "install") changeSubpage("loading");
    query_queue[path].query = $.get(path, params).done(function(d){
        cb(d); query_queue[path] = {status: 'done', updated};
    }).fail(function(d){
        cb(false); query_queue[path] = {status: 'error', updated};
    });
}

let last_DataQueryUpdate = parseInt((new Date()).getTime()/1000)-10;
function updateDataQuery(params = {}){
    if(!params.force){
        if(parseInt((new Date()).getTime()/1000) - last_DataQueryUpdate <= 2) return;
    }
    last_DataQueryUpdate = parseInt((new Date()).getTime()/1000);
    if(!localStorage.NMAPassword) return;

    for(let data_query of primary_data_queries){
        query(data_query, {}, function(d){
            if(server_data[data_query] == JSON.stringify(d)) return;
            server_data[data_query] = JSON.stringify(d);

            let depended_data_queries = data_queries.filter(x=>x.includes(`${data_query}:`));

            let d_current = d.current||undefined;

            depended_data_queries.push(data_query);
            for(let depended_data_query of depended_data_queries){

                let _data = d;

                if(!depended_data_query.includes(":")){
                    if(data_query == "serverVersions") _data = _data.versions;
                    if(data_query == "serverMaps") _data = _data.maps;
                }else{
                    let levels = depended_data_query.split(":");
                    let _d;
                    for(let level of levels) _d = _data[level];
                    _data = _d;
                }

                if(data_queries_empty[depended_data_query] && d.length == 0) d = data_queries_empty[depended_data_query];

                if(!_data){
                    if(depended_data_query=='logs') d = "Game not started";
                }

                if(depended_data_query == "gameStatus"){
                    switch(d){
                        case "Stopped":
                        case "Offline":
                            $("body").attr("gameStatus", "offline");
                            break;
                        case "Stopping":
                        case "Starting":
                            $("body").attr("gameStatus", "working");
                            break;
                        case "Running":
                            $("body").attr("gameStatus", "online");
                            break;
                    }
                }

                $('[data-query="'+depended_data_query+'"]').each(function(i, val){
                    let tag = $(this).prop("tagName");
                    if(tag == "SELECT"){
                        $(val).html("");
                        let _html = "";
                        for(let x of _data) _html += ("<option value='"+x+"'>"+x+"</option>");
                        $(val).html(_html);
                        if(d_current) $(val).val(d_current);
                    }

                    if(tag == "UL"){
                        $(val).html("");
                        let _html = "";
                        for(let x of _data) _html += ("<li>"+x+"</li>");
                        $(val).html(_html);
                        if(d_current) $(val).val(d_current);
                    }
        
                    if(tag == "INPUT"){
                        $(val).val("");
                        $(val).val(_data);
                        $(val).attr("data", _data);
                    }
    
                    if(tag == "DIV" || tag == "SPAN"){
                        let _data_1 = Array.isArray(_data)?_data.join("<br>"):_data;
                        $(val).html("");
                        $(val).html(_data_1);
                        $(val).attr("data", _data_1);
                    }
                });

            }
            
            $(".server_console")[0].scrollTop = $(".server_console")[0].scrollHeight;
        });
    }
}

$("[action-query]").click(function(){
    let type = $(this).attr("action-type");
    if(type == 'download'){
        window.location.href = $(this).attr("action-query")+"?password="+localStorage.NMAPassword;
        return;
    }
    if(!type){
        query($(this).attr("action-query"));
        updateDataQuery({force: true});
    }
});

$('[change-query]').change(function(){
    let q = $(this).attr('change-query');
    let key = $(this).attr('change-query-key')||"value";
    let value = $(this).val();
    query(q, {[key]: value}, function(d){
        if(!d) {
            if($(this).attr('change-query-error')) swal.fire('Wow!', $(this).attr('change-query-error'),'error');
            return; 
        }
        if($(this).attr('change-query-success')) swal.fire('Done!', $(this).attr('change-query-success'),'success');
        updateDataQuery({force: true});
    });
});

setInterval(updateDataQuery, 2000);




// ** ROUTING ** //

function changePage(p){
    $('[page]').addClass("hidden");
    $('[page="'+p+'"]').removeClass("hidden");
}
function changeSubpage(p){
    $('[subpage]').addClass("hidden");
    $('[subpage="'+p+'"]').removeClass("hidden");
    $(".dash_title").text($('[subpage="'+p+'"]').attr("headTitle"));
}
function getCurrentPage(){
    return $('[page]:not(.hidden)').attr("page")
}

$.fn.hasAttr = function(name) {  
    return this.attr(name) !== undefined;
};

$("[to-subpage]").click(function(){
    changeSubpage($(this).attr("to-subpage"));
});




// ** LOGIN AND PAGE LOADING ** //

$(document).ready(function(){
    if(localStorage.NMAPassword){
        $.get('/verifyPassword', {password: localStorage.NMAPassword}).done(function(){
            changePage('dash');
            query('serverVersions', {}, function(d){
                if(d){
                    if(d.versions.length == 0){
                        changeSubpage('first');
                    }else{
                        changeSubpage('main');
                    }
                }else{
                    // swal.fire('Wow!','Error while getting server versions.','error');
                }
            });
        }).fail(function(){
            changePage('login');
        });
    }else{
        changePage('login');
    }

    updateDataQuery();
});
$('.password').keyup(function(e){if(e.which==13)$('.login').click();});
$('.login').click(function(){
    let password = $(".password").val();
    $(this).prop('disabled', true);
    $.get('/verifyPassword', {password}).done(function(){
        localStorage.NMAPassword = password;
        document.location.reload(true);
    }).fail(function(){
        swal.fire('Wow!','Wrong password?','error');
        $('.login').prop('disabled', false);
    });
});




// ** BUTTONS TRIGGERS ** //

$('.quit').click(function(){
    localStorage.NMAPassword = "";
    document.location.reload(true);
});

$(".first_start_install").click(function(){
    $(this).prop("disabled", true);
    query("install", {version: $(".first_available_versions").val()}, function(d){
        if(!d) return swal.fire('Wow!','Error while installation.','error');
        swal.fire('Done!','Now you can start server!','success');
        changeSubpage('main');
    });
});

$("button.install_server_version").click(function(){
    query("install", {version: $("select.install_server_version").val()}, function(d){
        if(!d) return swal.fire('Wow!','Error while installation.','error');
        swal.fire('Done!','Now you can start server!','success');
        changeSubpage('main');
    });
});

$(".server_console_input").keyup(function(e){
    if(e.which == 13){
        query("command", {text: $(this).val()}, function(data){
            setTimeout(function(){
                updateDataQuery({force: true});
            }, 500);
        });
        $(this).val("");
    }
})



// ** DATA EDITOR ** //

$('[data-editable]').click(function(){
    if($("body").attr("gamestatus") != 'offline'){
        return;
    }

    var rect = $(this)[0].getBoundingClientRect();
    // console.log(rect.top, rect.right, rect.bottom, rect.left);
    $(".data-editor").css({top: rect.top, left: rect.left})

    let dataType = data_queries_types[$(this).attr("data-query")] || "text";
    if( Array.isArray(dataType) ) dataType = "array";
    if(dataType == "array"){
        $(".data-editor [data-type='"+dataType+"'] .input option").remove();
        let _html = "";
        for(let option of data_queries_types[$(this).attr("data-query")]) _html += '<option value="'+option+'">'+option+'</option>';
        $(".data-editor [data-type='"+dataType+"'] .input").html(_html);
    }
    $(".data-editor [data-type]").addClass("hidden");
    $(".data-editor [data-type='"+dataType+"']").removeClass("hidden");
    $(".data-editor [data-type='"+dataType+"'] .input").val($(this).attr("data"));
    $(".data-editor").attr("primary-data-query", $(this).attr("data-query"));
    $(".data-editor").attr("primary-data-action", $(this).attr("data-action"));
    $(".data-editor").removeClass("hidden");
    $(".data-editor [data-type]:not(.hidden) .input").focus();
});
$('.data-editor .cancel').click(function(){
    $(".data-editor").addClass("hidden");
});
$('.data-editor .save').click(function(){
    $(".data-editor").addClass("hidden");
    let url_to_save = {
        "getServerProperties": "updateServerProperty",
        "getServerMap": true
    }
    let primary_data_query = $(".data-editor").attr("primary-data-query").split(":")[0];
    let primary_data_query_key = $(".data-editor").attr("primary-data-query").split(":")[1];
    let primary_data_action = $(".data-editor").attr("primary-data-action");
    let value = $(".data-editor [data-type]:not(.hidden) .input").val();
    if(url_to_save[primary_data_query]){
        if(primary_data_query=="getServerProperties"){
            query(url_to_save[primary_data_query], {key: primary_data_query_key, value});
        }
        if(primary_data_query=="getServerMap"){
            if(primary_data_action == "rename"){
                query('renameServerMap', {name: value});
            }
        }
        updateDataQuery({force: true});
    }else{
        swal.fire("Saving error", "Can't to resolve api url to save value.", "error");
    }
});
$('.data-editor .input').keyup(function(e){
    if(e.which == 13) return $('.data-editor .save').click();
});




// ** SERVER MAP UPLOAD ** //

$('[subpage="upload_server_map"] input[type="file"]').change(function(){
    let name = $(this)[0].files[0].name.split(".")[0];
    $('[subpage="upload_server_map"] input[type="text"]').val(name);
});
$('[subpage="upload_server_map"] .upload_server_map').click(function(){
    let map = $('[subpage="upload_server_map"] input[type="file"]')[0].files[0];
    let formData = new FormData();
    formData.append("map", map);
    formData.append("name", $('[subpage="upload_server_map"] input[type="text"]').val());
    $('[subpage="upload_server_map"] .upload_server_map').prop({disabled: true});
    fetch('/uploadMap?password='+localStorage.NMAPassword, {method: "POST", body: formData}).then(function(data){
        $('[subpage="upload_server_map"] .upload_server_map').prop({disabled: false});
        if(data.status==200){
            changeSubpage('main');
            updateDataQuery({force: true});
            $('[subpage="upload_server_map"] input[type="file"]').val("");
            $('[subpage="upload_server_map"] input[type="text"]').val("");
            return swal.fire("Upload complete", "Now you can use your map for plaing!", "success");
        }else{
            data.text().then(function(x){
                swal.fire("Upload error", x, "error");
            });
        }
    }).catch(function(x){
        console.log(x);
        
    });
})