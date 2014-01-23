﻿/*!
 * Mobile Passing Library v0.1.4.1
 * http://www.mobilepassing.com/
 *
 * Copyright 2012, 2013 Prhythm Studio, Mobile Passing
 *
 * Date: 2014-01-22T14:16:12.160Z
 */
(function (window, name) {
    // Define class MobilePassing & initial settings
    var mp = function MobilePassing() {
        this.option({
            //appId: 'application id (digital only)',
            //target: 'target element (dom element or element id)',
            host: 'mobilepassing.com',
            port: undefined,
            ssl: false,
            useSocket: true,
            socketTimeout: 10000,
            renderType: 'src', // src|background
            onrefreshing: false,
            onrefreshed: false,
            onerror: false,
            onpassed: false,
            onexpired: false
        });
    };
    // Define Guid generator
    mp.guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        this.value = s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        this.toString = function (format) {
            if ('N' == format) {
                return this.value.replace(/-/g, '');
            } else {
                return this.value;
            }
        }
    };
    // Define dom event binder
    mp.bind = function (element, name, handler, useCapture) {
        if (addEventListener) {
            element.addEventListener(name, handler, useCapture || false);
        } else {
            element.attachEvent(name, handler);
        }
    };
    // Define dom event remover
    mp.unbind = function (element, name, handler) {
        if (removeEventListener) {
            element.removeEventListener(name, handler, false);
        } else {
            element.detachEvent(name, handler);
        }
    };
    // Wrap getter of target element
    mp.getTarget = function () {
        if (String == mp.setting.target.constructor) {
            var t = document.querySelector(mp.setting.target);
            if (t) return t;
        } else if (1 == mp.setting.target.nodeType) {
            return mp.setting.target;
        }
        throw new Error('Unavailable target element:' + mp.settings.target);
    };
    // XMLHttpRequest generator
    mp.getXHR = function () {
        if (typeof (XMLHttpRequest) == 'undefined') {
            XMLHttpRequest = function () {
                try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (ex) { }
                try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (ex) { }
                try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (ex) { }
                throw new Error("This browser does not support XMLHttpRequest.");
            };
        }
        return new XMLHttpRequest();
    };
    // Ajax wrapper
    mp.executeAjax = function (option) {
        var s = { async: true };
        if (option && Object == option.constructor) {
            for (var i in option) {
                s[i] = option[i];
            }
        }

        var xhr = mp.getXHR();

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                    if (s.success && Function == s.success.constructor) {
                        if (xhr.responseXML) {
                            s.success(xhr.responseXML, xhr);
                            return;
                        } else if (xhr.response) {
                            try { s.success(JSON.parse(xhr.response), xhr); return; } catch (ex) { }
                        }
                        s.success(xhr.response, xhr);
                    }
                } else {
                    if (s.error && Function == s.error.constructor) {
                        s.error(xhr);
                    }
                }
            }
        };
        xhr.onerror = s.error;
        xhr.onabort = s.abort;
        xhr.onloadstart = s.loadstart;
        xhr.onloadend = s.loadend;
        xhr.onprogress = s.progress;
        xhr.ontimeout = s.timeout;

        switch (s.verb = (s.verb || 'get').toUpperCase()) {
            case 'GET':
            case 'HEAD':
            case 'POST':
            case 'PUT':
            case 'DELETE':
            case 'TRACE':
            case 'OPTIONS':
            case 'CONNECT':
            case 'PATCH':
                break;
            default:
                s.verb = 'GET';
                break;
        }

        xhr.open(s.verb, s.url, s.async);
        if (s.headers && Object == s.headers.constructor) {
            for (var i in s.headers) {
                xhr.setRequestHeader(i, s.headers[i]);
            }
        }
        if (s.data && Object == s.data.constructor) {
            var valuePair = [];
            for (var i in s.data) {
                valuePair.push(encodeURIComponent(i) + '=' + encodeURIComponent(s.data[i]));
            }
            xhr.send(valuePair.join('&'));
        } else {
            xhr.send(s.data || null);
        }
    };
    // WebSocket connector
    mp.connect = function () {
        if (typeof (WebSocket) != 'undefined') {
            var s = mp.setting;
            var p = s.ssl && (!s.port || s.port * 1 == 443) || !s.ssl && (!s.port || s.port * 1 == 80) || s.port;
            var url = 'ws' + (s.ssl ? 's' : '') + '://' + s.host + (true == p ? '' : ':' + p) + '/Socket/' + s.appId + '/' + s.key;
            var ws = s.socket = new WebSocket(url);
            ws.onopen = function () {
                console.info('Socket ' + url + ' connected');
            };
            ws.onmessage = function (evt) {
                var data = {};
                try { data = JSON.parse(evt.data); } catch (ex) { }
                switch (data.Code) {
                    case 200:
                        if (s.onpassed && Function == s.onpassed.constructor) {
                            ws.close();
                            s.onpassed(data.Data);
                        }
                        break;
                    case 300:
                        break;
                    case 404:
                        if (s.onexpired && Function == s.onexpired.constructor) {
                            ws.close();
                            s.onexpired(data, evt.target);
                        }
                        break;
                    default:
                        if (s.onerror && Function == s.onerror.constructor) {
                            ws.close();
                            s.onerror(data, evt.target);
                        }
                        break;
                }
            };
            ws.onerror = function (evt) {
                console.error(evt);
            };
            ws.onclose = function () {
                console.info('Socket ' + url + ' closed');
            };
            setTimeout(mp.handleTimeout, s.socketTimeout);
            return ws;
        } else {
            return false;
        }
    };
    mp.handleTimeout = function () {
        var ws = mp.setting.socket;
        if (ws.readyState == WebSocket.CONNECTING) {
            ws.close();
            setTimeout(mp.polling, 100);
        }
    };
    mp.polling = function () {
        var s = mp.setting;
        var p = s.ssl && (!s.port || s.port * 1 == 443) || !s.ssl && (!s.port || s.port * 1 == 80) || s.port;
        var url = 'http' + (s.ssl ? 's' : '') + '://' + s.host + (true == p ? '' : ':' + p) + '/Token/' + s.appId + '/' + s.key;
        mp.executeAjax({
            url: url,
            headers: { 'Accept': 'application/json' },
            success: function (data, status, jqXHR) {
                if (data && data.Code) {
                    switch (data.Code) {
                        case 200:
                            if (s.onpassed && Function == s.onpassed.constructor) {
                                s.onpassed(data.Data, jqXHR);
                            }
                            break;
                        case 300:
                            setTimeout(mp.polling, 1000);
                            break;
                        case 404:
                            if (s.onexpired && Function == s.onexpired.constructor) {
                                s.onexpired(data, jqXHR);
                            }
                            break;
                        default:
                            if (s.onerror && Function == s.onerror.constructor) {
                                s.onerror(data, jqXHR);
                            }
                            break;
                    }
                }
            }
        });
    };

    /* Public methods */
    mp.prototype.init = function (option) {
        var s = mp.setting;
        this.option(option);
        this.refresh();
        return this;
    };
    mp.prototype.refresh = function (key, option) {
        if (option) this.option(option);

        // image load evnet
        function codeLoad() {
            mp.unbind(mp.getTarget(), 'load', codeLoad);
            if (s.useSocket) {
                mp.connect();
            } else {
                setTimeout(mp.polling, 500);
            }
        }

        var s = mp.setting;

        // onrefreshing
        if (s.onrefreshing && Function == s.onrefreshing.constructor) {
            var v = s.onrefreshing(key);
            if (typeof (v) != 'undefined') key = v;
        }

        s.key = key = key || new mp.guid().toString('N');
        var p = s.ssl && (!s.port || s.port * 1 == 443) || !s.ssl && (!s.port || s.port * 1 == 80) || s.port;
        var url = 'http' + (s.ssl ? 's' : '') + '://' + s.host + (true == p ? '' : ':' + p) + '/QRCode/' + s.appId + '/' + key;
        switch (s.renderType) {
            case 'src':
                // Attach image onload event
                mp.bind(mp.getTarget(), 'load', codeLoad);
                mp.getTarget().setAttribute('src', url);
                break;
            case 'background':
                var image = new Image();
                // Attach image onload event
                image.onload = codeLoad;
                image.src = url;
                mp.getTarget().style.backgroundImage = 'url(' + url + ')';
                break;
        }

        // onrefreshed
        if (s.onrefreshed && Function == s.onrefreshed.constructor)
            s.onrefreshed();

        return this;
    };
    mp.prototype.option = function (option, value) {
        var s = mp.setting = mp.setting || {};
        if (arguments.length == 1 && Object == option.constructor) {
            for (var n in option) {
                this.option(n, option[n]);
            }
        } else if (arguments.length == 2 && String == option.constructor) {
            switch (option) {
                case 'appId':
                    if (!/^\d+$/.test(value)) throw new Error('Uexpected appId');
                    s[option] = value;
                    break;
                case 'port':
                    if (!isNaN(value * 1)) s[option] = value * 1;
                    break;
                case 'ssl':
                    if (true == value)
                        s[option] = true;
                    else
                        s[option] = false;
                    break;
                case 'renderType':
                    if ('src' == value || 'background' == value)
                        s[option] = value;
                    else
                        s[option] = 'src';
                    break;
                case 'onrefreshing':
                case 'onrefreshed':
                case 'onerror':
                case 'onpassed':
                case 'onexpired':
                    if (value && Function == value.constructor) s[option] = value;
                    break;
                case 'target':
                case 'host':
                default:
                    s[option] = value;
                    break;
            }
        }
        return s;
    };
    mp.prototype.profile = function (token, callback, error) {
        var s = mp.setting;
        var p = s.ssl && (!s.port || s.port * 1 == 443) || !s.ssl && (!s.port || s.port * 1 == 80) || s.port;
        var url = 'http' + (s.ssl ? 's' : '') + '://' + s.host + (true == p ? '' : ':' + p) + '/Profile/' + token;
        mp.executeAjax({
            url: url,
            headers: { 'Accept': 'application/json' },
            success: function (data, status, jqXHR) {
                if (data && data.Code) {
                    switch (data.Code) {
                        case 200:
                            if (callback && Function == callback.constructor) {
                                callback(data.Data, jqXHR);
                            }
                            break;
                        case 409:
                        default:
                            if (error && Function == error.constructor) {
                                error(data, jqXHR);
                            }
                            break;
                    }
                }
            }
        });
    }
    mp.prototype.ajax = function (option) {
        mp.executeAjax(option);
        return this;
    };

    window[name] = new mp();
})(window, 'MP');