
self.addEventListener('message', function(e) {
    var data = e.data;

    switch (data.cmd) {
        case 'ping':
            self.postMessage({
                'status': 'aloha',
                'content': {}
            });
            break;
        case 'start':
        try {
            //     self.postMessage({'status': 'unknown status', 'content': {}});
            var query = data.msg.search_param.query,
                map = data.msg.search_param.map,
                // indexName = data.msg.index_name;
                esHost = data.msg.esHost,
                debugMod = data.msg.settings.debugMod,
                wsLoc = data.msg.settings.wsHost,
                wsPsk = data.msg.settings.psk,
                wsTimeout = data.msg.settings.wsTimeout;
                // esTimeout = data.msg.settings.esTimeout;

                self.lastTimestamp = map.lastTimestamp.value;

                if (debugMod) {
                    var ws = mockHits(wsLoc, wsPsk, wsTimeout, pushResults);
                } else {


                    self.asyncLock = false;
                    var lastEsSearchTime = 0;
                        // lastTimestamp = map.lastTimestamp.value;
                    if (!(query = renderQuery(query, map)))
                        throw "Error :: renderQuery() failed with empty results";

                    var latestQuery;

                    setInterval(function() {
                        // var now = Date.now(),
                        //     EsDelay = (now - lastEsSearchTime) / 1000.0;
                        //     console.log(EsDelay);

                            if (!self.asyncLock) {

                                self.asyncLock = true;

                                console.log("DEBUG :: Latest lastTimestamp is --->");
                                console.log(self.lastTimestamp);

                                if (!(latestQuery = updateTimestamp(query, map.lastTimestamp, self.lastTimestamp)))
                                    throw "Error :: updateLastTimestamp() failed with empty results";

                                console.log(JSON.stringify(latestQuery));

                                var client = new elasticsearch.Client({
                                    host: esHost,
                                    log: 'error',
                                    apiVersion: '1.7'
                                });

                                client.search(latestQuery).then(function(resp) {
                                    lastEsSearchTime = Date.now();
                                    var hits = resp.hits.hits;
                                    // console.log("DEBUG: in thenning stage");
                                    // console.log(JSON.stringify(hits));
                                    updateLastTimestamp(hits, map);
                                    parseHits(hits, map, pushResults);
                                    self.asyncLock = false;
                                }, function(err) {
                                    console.trace(err.message);
                                    self.asyncLock = false;
                                });
                            }

                    }, 1000);
                }
        }
        catch (e) {
           console.log('Error!');
           console.log(e);
       }
       break;
    }
}, false);

function renderQuery(query, map) {
    if (query && map) {

        var templates = map.templates,
            queryJSON = JSON.stringify(query);

        for (var field in templates) {
            queryJSON = queryJSON.replace(templates[field].regEx, templates[field].value);
        }

        return JSON.parse(queryJSON);
    } else {
        console.log("Error: in renderQuery() , query or map is empty!");
        return '';
    }
}

function updateTimestamp(query, lastTimestampConfig, lastTimestamp) {
    if (query && lastTimestampConfig && lastTimestamp) {
        return JSON.parse(JSON.stringify(query).replace(lastTimestampConfig.regEx, lastTimestamp))
    } else {
        console.log("Error: in updateTimestamp() , parameters are empty!");
        return '';
    }}

function getObjAttribute(obj, path) {
    if ((typeof path === 'string') && path) {
        pathSerie = path.split('.');
        // console.log(pathSerie);
    } else {
        return '';
    }
    if (typeof obj !== 'object') {
        return '';
    }
    var result = obj;
    pathSerie.forEach(function(subPath) {
        // console.log(result);
        result = result[subPath];
    });
    // console.log(result);
    return result;

}

function parseHits(hits, map, cb) {
    var destKeys = map.destKeys,
        srcKeys = map.srcKeys,
        attackField = map.attackField,
        timeStampFiled = map.timeStampField;

    hits.forEach(function(hit) {

        var destLoc = {
            lat: getObjAttribute(hit, '_source.' + destKeys.latKey),
            lon: getObjAttribute(hit, '_source.' + destKeys.lonKey),
            country: getObjAttribute(hit, '_source.' + destKeys.countryKey),
            region: getObjAttribute(hit, '_source.' + destKeys.regionKey),
            ip: getObjAttribute(hit, '_source.' + destKeys.ipKey)
        };
        var srcLoc = {
            lat: getObjAttribute(hit, '_source.' + srcKeys.latKey),
            lon: getObjAttribute(hit, '_source.' + srcKeys.lonKey),
            country: getObjAttribute(hit, '_source.' + srcKeys.countryKey),
            region: getObjAttribute(hit, '_source.' + srcKeys.regionKey),
            ip: getObjAttribute(hit, '_source.' + srcKeys.ipKey)
        };
        var attackType = getObjAttribute(hit, '_source.' + attackField);

        var lastTimeStamp = getObjAttribute(hit, '_source.' + timeStampFiled);

        cb({
            destLoc : destLoc,
            srcLoc : srcLoc,
            attackType : attackType,
            lastTimestamp : lastTimeStamp
        });

    })
}

function mockHits(loc, psk, wsTimeout, cb) {
    // var Random = Mock.Random;
    // console.log(Random);

    var wsDiscTime = 0;

    function start(loc, psk) {
        var webSocket = new WebSocket(loc);

        webSocket.onopen = function() {
            wsDiscTime = 0;
            // d3.select("#events-data").selectAll("tr.row").remove();
            webSocket.send(psk);
        };

        webSocket.onmessage = function(evt) {
            if (!evt) {
                return;
            }

            // Parse the json to a js obj and clean the data
            var resutls = JSON.parse(evt.data)
            console.log(resutls);

            cb(resutls);
        };

        webSocket.onclose = function() {
            //try to reconnect in 5 seconds
            var interval = 500;

            wsDiscTime += 500;

            // d3.select("#events-data").selectAll("tr.row").remove();
            // d3.select("#events-data").append("tr").attr('class', 'row').html("<td colspan='7'><img src='images/loading.gif' style='margin-top: 6px;'/>&nbsp;<span style='display: inline-block; height: 25px; vertical-align: middle;'>Loading...</span></td>");

            if (wsDiscTime > wsTimeout) {
                console.log("We are having difficulties in the WebSocket connectivity. We will continue trying...");
                wsDiscTime = 0;
            }

            setTimeout(function(){
                console.log("websocket closed, reconnecting in " + interval + "ms");
                start(loc, psk);
            }, interval);
        };

        return webSocket;
    }

    return start(loc, psk);

}

function pushResults(results) {

    var destLoc = results.destLoc,
        srcLoc = results.srcLoc,
        attackType = results.attackType;

    console.log("DEBUG :: PUSHING message as :");
    console.log(results);
    
    self.postMessage({
        'status': 'data',
        'content': '{"latitude":"'+ destLoc.lat +'","longitude":"'+ destLoc.lon +'","countrycode":"'+destLoc.country+'","country":"'+destLoc.country+'","city":"'+destLoc.region+'","latitude2":"'+srcLoc.lat+'","longitude2":"'+srcLoc.lon+'","countrycode2":"'+srcLoc.country+'","country2":"'+srcLoc.country+'","city2":"'+srcLoc.region+'","type":"'+ attackType + '","md5":"' + destLoc.ip + '","hostip":"' + srcLoc.ip + '"}'
    });

}

function updateLastTimestamp(hits, map) {

     var timeStampFiled = map.timeStampField;

     var lastTimestamp = getObjAttribute(hits[0], '_source.' + timeStampFiled);

    if (lastTimestamp) {
        self.lastTimestamp = lastTimestamp;
        console.log("DEBUG :: Setting lastTimestamp as --->");
        console.log(self.lastTimestamp);
    }

}
