"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("pebblejs");
var UI = require("pebblejs/ui");
var ajax = require("pebblejs/lib/ajax");
var Settings = require("pebblejs/settings");
var CONFIG_URL = 'https://paul-em.github.io/pebble-fetch/';
Settings.config({ url: CONFIG_URL, autoSave: true }, function () {
    console.log('Config page opened');
}, function (e) {
    console.log('Config page closed');
    if (!e.failed) {
        refreshMainCard();
    }
});
var BUTTON_LABELS = { '0': '^', '1': '>', '2': 'v' };
var METHODS_WITH_BODY = ['post', 'put', 'patch'];
function getRequests() {
    var opts = Settings.option();
    if (opts && opts.requests) {
        return opts.requests;
    }
    return [null, null, null];
}
var mainCard = new UI.Card({
    title: 'Pebble Fetch',
    scrollable: false
});
function refreshMainCard() {
    var requests = getRequests();
    var lines = [];
    for (var i = 0; i < 3; i++) {
        var label = BUTTON_LABELS[String(i)];
        var req = requests[i];
        lines.push(label + '  ' + (req && req.name ? req.name : '(not set)'));
    }
    mainCard.body(lines.join('\n'));
}
function executeRequest(config) {
    var loadingCard = new UI.Card({ title: config.name, body: 'Sending...' });
    loadingCard.show();
    var headerObj = {};
    if (config.headers) {
        for (var i = 0; i < config.headers.length; i++) {
            var h = config.headers[i];
            if (h.key && h.value) {
                headerObj[h.key] = h.value;
            }
        }
    }
    var ajaxOpts = {
        url: config.url,
        method: config.method.toLowerCase(),
        headers: headerObj,
        cache: false
    };
    if (METHODS_WITH_BODY.indexOf(ajaxOpts.method) !== -1 && config.body) {
        try {
            ajaxOpts.data = JSON.parse(config.body);
            ajaxOpts.type = 'json';
        }
        catch (e) {
            ajaxOpts.data = config.body;
        }
    }
    ajax(ajaxOpts, function (_data, status) {
        UI.Vibe.vibrate('short');
        loadingCard.title('Success');
        loadingCard.body('Status: ' + status);
        setTimeout(function () { loadingCard.hide(); }, 3000);
    }, function (error, status) {
        UI.Vibe.vibrate('double');
        loadingCard.title('Failed');
        loadingCard.body('Status: ' + (status || 'unknown') + '\n' + (error || ''));
        setTimeout(function () { loadingCard.hide(); }, 3000);
    });
    loadingCard.on('click', 'back', function () {
        loadingCard.hide();
    });
}
function handleButton(index) {
    var requests = getRequests();
    var config = requests[index];
    if (config && config.url) {
        executeRequest(config);
    }
    else {
        UI.Vibe.vibrate('long');
        var noConfigCard = new UI.Card({
            title: 'Not Configured',
            body: 'Open settings on\nyour phone to\nconfigure this button.'
        });
        noConfigCard.show();
        setTimeout(function () { noConfigCard.hide(); }, 3000);
        noConfigCard.on('click', 'back', function () {
            noConfigCard.hide();
        });
    }
}
mainCard.on('click', 'up', function () { handleButton(0); });
mainCard.on('click', 'select', function () { handleButton(1); });
mainCard.on('click', 'down', function () { handleButton(2); });
refreshMainCard();
mainCard.show();
