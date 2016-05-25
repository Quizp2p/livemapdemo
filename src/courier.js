
importScripts('elasticsearch.js');


var client = new elasticsearch.Client(
    {
        host: 'localhost:9200',
        log:'trace'
    }
);

var asyncLock = false;

// console.log(client);

client.search({
            index: indexPattern,
            size: esWindowSize,
            //    type: '*',
            body: {
                "query": {
                    "filtered": {
                        "filter": {
                            "and": {
                                "filters": [{
                                    "exists": {
                                        "field": attackField
                                    }
                                }, {
                                    "range": {
                                        "@timestamp": {
                                            "gt": lastTimestamp,
                                            "lte": "now"
                                        }
                                    }
                                }],
                                "_cache": false
                            }
                        }
                    }
                },
                "sort": {
                    "@timestamp": "desc"
                }
            }
        }).then(function(resp) {
            var hits = resp.hits.hits;
            // console.log("DEBUG: in thenning stage");
            nextStep(hits);
            asyncLock = false;
        }, function(err) {
            console.trace(err.message);
            asyncLock = false;
        });

self.addEventListener('message', function (e) {
    var data = e.data;

    switch (data.cmd) {
        case 'ping':
            self.postMessage({'status': 'aloha', 'content': {}});
            break;
        case 'start':
            // setInterval(function () {
            //     self.postMessage({'status': 'unknown status', 'content': {}});
            // }, 1000);
            break;
    }
}, false);
