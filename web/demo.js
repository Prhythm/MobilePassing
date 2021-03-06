zindex = 9999;
prePadding = 40;
function extend() {
    var div = document.createElement('div');
    div.setAttribute('class', 'signin-box');
    div.style.zIndex = --zindex;
    div.style.backgroundColor = 'rgb(' + Math.round(Math.random() * 256) + ', ' + Math.round(Math.random() * 256) + ', ' + Math.round(Math.random() * 256) + ')';
    var padding = Math.round(Math.random() * 100) + 10 + prePadding;
    div.style.padding = padding + 'px';
    div.style.marginLeft = (-padding - 5) + 'px';
    div.style.marginTop = (-padding - 5) + 'px';
    document.body.appendChild(div);
    prePadding = padding;

    if (prePadding < 4000) setTimeout(extend, 200);

}
function dim(data) {
    var blocker = document.querySelector('.blocker');
    while (blocker.firstChild) {
        blocker.removeChild(blocker.firstChild);
    }
    blocker.appendChild(document.createTextNode(data.message));
    var memo = document.createElement('div');
    memo.appendChild(document.createTextNode('Click to get new token!'));
    blocker.appendChild(memo);
    blocker.style.display = 'block';
}
function pageLoad() {
    MP.init({
        appId: '635157403647818045',
        appSecret: '0447ffc99ecc46f1a8a86f580364a7d4',
        target: '#signin',
        onerror: dim,
        onpassed: function (ticket) {
            setTimeout(extend, 200);
            MP.profile(ticket.token, function (profile) {
                var elm = document.querySelector('.inner-radius');
                while (elm.firstChild) {
                    elm.removeChild(elm.firstChild);
                }
                var div = document.createElement('div');
                div.setAttribute('class', 'welcome');
                div.appendChild(document.createTextNode('Hi, ' + profile.displayName));
                div.appendChild(document.createElement('br'));
                div.appendChild(document.createTextNode('Welcome to MP Demo'));
                elm.appendChild(div)
            });
        },
        onexpired: dim
    });
}