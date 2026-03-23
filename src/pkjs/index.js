var CONFIG_URL = 'https://paul-em.github.io/pebble-fetch/';

var METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];

function getRequests() {
  var raw = localStorage.getItem('requests');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {}
  }
  return [null, null, null];
}

function sendRequestNames() {
  var requests = getRequests();
  var msg = {};
  for (var i = 0; i < 3; i++) {
    var key = 'RequestName' + i;
    msg[key] = requests[i] && requests[i].name ? requests[i].name : '';
  }
  Pebble.sendAppMessage(msg, function () {
    console.log('Names sent to watch');
  }, function (e) {
    console.log('Failed to send names: ' + JSON.stringify(e));
  });
}

function executeRequest(index) {
  var requests = getRequests();
  var config = requests[index];

  if (!config || !config.url) {
    Pebble.sendAppMessage({
      ResponseSuccess: 0,
      ResponseStatus: 0
    });
    return;
  }

  var options = {
    method: config.method || 'GET',
    headers: {}
  };

  if (config.headers) {
    for (var i = 0; i < config.headers.length; i++) {
      var h = config.headers[i];
      if (h.key && h.value) {
        options.headers[h.key] = h.value;
      }
    }
  }

  if (METHODS_WITH_BODY.indexOf(config.method) !== -1 && config.body) {
    options.body = config.body;
  }

  var xhr = new XMLHttpRequest();
  xhr.open(options.method, config.url, true);

  var headerKeys = Object.keys(options.headers);
  for (var j = 0; j < headerKeys.length; j++) {
    xhr.setRequestHeader(headerKeys[j], options.headers[headerKeys[j]]);
  }

  xhr.onload = function () {
    Pebble.sendAppMessage({
      ResponseSuccess: xhr.status >= 200 && xhr.status < 300 ? 1 : 0,
      ResponseStatus: xhr.status
    });
  };

  xhr.onerror = function () {
    Pebble.sendAppMessage({
      ResponseSuccess: 0,
      ResponseStatus: 0
    });
  };

  xhr.timeout = 15000;
  xhr.ontimeout = function () {
    Pebble.sendAppMessage({
      ResponseSuccess: 0,
      ResponseStatus: 408
    });
  };

  xhr.send(options.body || null);
}

Pebble.addEventListener('ready', function () {
  console.log('PebbleKit JS ready');
  sendRequestNames();
});

Pebble.addEventListener('appmessage', function (e) {
  var buttonIndex = e.payload.ButtonIndex;
  if (buttonIndex !== undefined) {
    console.log('Button pressed: ' + buttonIndex);
    executeRequest(buttonIndex);
  }
});

Pebble.addEventListener('showConfiguration', function () {
  var currentSettings = { requests: getRequests() };
  var url = CONFIG_URL + '#' + encodeURIComponent(JSON.stringify(currentSettings));
  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function (e) {
  if (e && e.response && e.response.length > 0) {
    try {
      var data = JSON.parse(decodeURIComponent(e.response));
      if (data.requests) {
        localStorage.setItem('requests', JSON.stringify(data.requests));
        sendRequestNames();
      }
    } catch (err) {
      console.log('Failed to parse config: ' + err);
    }
  }
});
