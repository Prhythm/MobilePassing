/*!
 * Mobile Passing Clinet Library v0.1.4.6
 * http://mobilepassing.com/
 *
 * Copyright 2012, 2013 Prhythm Studio, Mobile Passing and other contributors
 * Released under the MIT license
 *
 * Date: 2014-02-18T09:11:11.804Z
 */
(function (window, name) {
    var console = window['console'] || { debug: function () { }, log: function () { }, info: function () { }, warm: function () { }, error: function () { } };

    /*
     * Define class MobilePassing & initial settings
     */
    var mp = function MobilePassing() {
        this.version = '0.1.4.6';

        this.option({
            //appId: 'application id (digital only)',
            //appSecret: 'secret key',
            //target: 'target element (dom element or element id)',
            host: 'mobilepassing.com',
            port: undefined,
            ssl: undefined,
            useSocket: true,
            socketTimeout: 10000,
            loadImmediately: true,
            renderType: 'src', // src|background
            onrefreshing: false,
            onrefreshed: false,
            onerror: false,
            onpassed: false,
            onexpired: false
        });
    };

    /*
     * Define Guid generator
     */
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

    /*
     * Define dom event binder
     * @param element
     * @param name
     * @param handler
     * @param useCapture
     */
    mp.bind = function (element, name, handler, useCapture) {
        if (addEventListener) {
            element.addEventListener(name, handler, useCapture || false);
        } else {
            element.attachEvent(name, handler);
        }
    };

    /*
     * Define dom event remover
     * @param element
     * @param name
     * @param handler
     */
    mp.unbind = function (element, name, handler) {
        if (removeEventListener) {
            element.removeEventListener(name, handler, false);
        } else {
            element.detachEvent(name, handler);
        }
    };

    /*
     * Wrap getter of target element
     */
    mp.getTarget = function () {
        if (String == mp.setting.target.constructor) {
            var t = document.querySelector(mp.setting.target);
            if (t) return t;
        } else if (1 == mp.setting.target.nodeType) {
            return mp.setting.target;
        }
        throw new Error('Unavailable target element:' + mp.settings.target);
    };

    /*
     *  XMLHttpRequest generator
     */
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

    /*
     * Ajax wrapper
     * @param option
     */
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

    /*
     * Generate url from setting
     */
    mp.generateUrl = function () {
        var s = mp.setting;
        var schema = s.ssl == undefined || s.ssl ? 'https:' : 'http:';
        var port = s.port == undefined || (schema == 'https:' && s.port * 1 == 443) || (schema == 'http:' && s.port * 1 == 80) || s.port;
        return schema + '//' + s.host + (true == port ? '' : ':' + port);
    }

    /*
     * WebSocket connector
     */
    mp.connect = function () {
        if (typeof (WebSocket) != 'undefined') {
            var s = mp.setting;
            if (!s.appId) throw new Error('App ID is required!');
            var url = mp.generateUrl() + '/Socket/' + s.appId + '/' + s.key;
            url = 'ws' + url.substring(4);
            var ws = s.socket = new WebSocket(url);
            ws.onopen = function () {
                console.info('Socket ' + url + ' connected');
            };
            ws.onmessage = function (evt) {
                var data = {};
                try { data = JSON.parse(evt.data); } catch (ex) { }
                switch (data.code) {
                    case 200:
                        if (s.onpassed && Function == s.onpassed.constructor) {
                            ws.close();
                            s.onpassed(data.data);
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
            setTimeout(mp.handleTimeout, s.socketTimeout || 10000);
            return ws;
        } else {
            return false;
        }
    };

    /*
     * Handle websocket connection timeout
     */
    mp.handleTimeout = function () {
        var ws = mp.setting.socket;
        if (ws.readyState == WebSocket.CONNECTING) {
            ws.close();
            setTimeout(mp.polling, 100);
        }
    };

    /*
     * Polling request
     */
    mp.polling = function () {
        var s = mp.setting;
        if (!s.appId) throw new Error('App ID is required!');
        var url = mp.generateUrl() + '/Token/' + s.appId + '/' + s.key;
        mp.executeAjax({
            url: url,
            headers: { 'Accept': 'application/json' },
            success: function (data, status, xhr) {
                if (data && data.code) {
                    switch (data.code) {
                        case 200:
                            if (s.onpassed && Function == s.onpassed.constructor) {
                                s.onpassed(data.data, xhr);
                            }
                            break;
                        case 300:
                            setTimeout(mp.polling, 1000);
                            break;
                        case 404:
                            if (s.onexpired && Function == s.onexpired.constructor) {
                                s.onexpired(data, xhr);
                            }
                            break;
                        default:
                            if (s.onerror && Function == s.onerror.constructor) {
                                s.onerror(data, xhr);
                            }
                            break;
                    }
                }
            }
        });
    };

    /* Public methods */

    /*
     * Initialize QR code
     * @param option
     */
    mp.prototype.init = function (option) {
        var s = mp.setting;
        this.option(option);
        if (true == s.loadImmediately) this.refresh();
        return this;
    };

    /*
     * Renew a QR code
     * @param key
     * @param option
     */
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
        if (!s.appId) throw new Error('App ID is required!');

        // onrefreshing
        if (s.onrefreshing && Function == s.onrefreshing.constructor) {
            var v = s.onrefreshing(key);
            if (typeof (v) != 'undefined') key = v;
        }

        s.key = key = key || new mp.guid().toString('N');
        var url = mp.generateUrl() + '/QRCode/' + s.appId + '/' + key;
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

    /*
     * Set option
     * @param option
     * @param value
     */
    mp.prototype.option = function (option, value) {
        var s = mp.setting = mp.setting || {};
        if (arguments.length == 1 && Object == option.constructor) {
            for (var n in option) {
                this.option(n, option[n]);
            }
        } else if (arguments.length == 2 && String == option.constructor) {
            switch (option) {
                case 'appId':
                    if (!/^\d+$/.test(value)) throw new Error('Unexpected appId');
                    s[option] = value;
                    break;
                case 'port':
                    if (!isNaN(value * 1)) s[option] = value * 1;
                    break;
                case 'ssl':
                    if (true == value)
                        s[option] = true;
                    else if (undefined == value)
                        s[option] = undefined;
                    else
                        s[option] = false;
                    break;
                case 'socketTimeout':
                    if (!isNaN(value * 1) && value * 1 > 1000) s[option] = value * 1;
                    break;
                case 'useSocket':
                case 'loadImmediately':
                    s[option] = true == value ? true : false;
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

    /*
     * Request profile data from server
     * @param token
     * @param callback
     * @param error
     */
    mp.prototype.profile = function (token, callback, error) {
        var s = mp.setting;
        if (!s.appSecret) throw new Error('App secret is required!');

        var url = mp.generateUrl() + '/Profile/' + token;
        mp.executeAjax({
            url: url,
            verb: 'POST',
            data: JSON.stringify({ appId: s.appId, appSecret: s.appSecret }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            success: function (data, status, xhr) {
                if (data && data.code) {
                    switch (data.code) {
                        case 200:
                            if (callback && Function == callback.constructor) {
                                callback(data.data, xhr);
                            }
                            break;
                        case 409:
                        default:
                            if (error && Function == error.constructor) {
                                error(data, xhr);
                            }
                            break;
                    }
                }
            }
        });
        return this;
    }

    /*
     * Execute XML http request
     * @param option
     */
    mp.prototype.ajax = function (option) {
        mp.executeAjax(option);
        return this;
    };

    window[name] = new mp();
})(window, 'MP');