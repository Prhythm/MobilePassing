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
function pageLoad() {
    MP.init({
        appId: '635157403647818045',
        target: '#signin',
        //useSocket: false,
        onrefreshing: function (key) {

        },
        onrefreshed: function () {

        },
        onerror: function (data) {
            var blocker = document.querySelector('.blocker');
            while (blocker.firstChild) {
                blocker.removeChild(blocker.firstChild);
            }
            blocker.appendChild(document.createTextNode(data.Message));
            var memo = document.createElement('div');
            memo.appendChild(document.createTextNode('Click to get new one!'));
            blocker.appendChild(memo);
            blocker.style.display = 'block';
        },
        onpassed: function (data) {
            setTimeout(extend, 200);
            MP.profile(data.Token, function (profile) {
                var elm = document.querySelector('.inner-radius');
                while (elm.firstChild) {
                    elm.removeChild(elm.firstChild);
                }
                var div = document.createElement('div');
                div.setAttribute('class', 'welcome');
                div.appendChild(document.createTextNode('Hi, ' + profile.DisplayName));
                div.appendChild(document.createElement('br'));
                div.appendChild(document.createTextNode('Welcome to MP Demo'));
                elm.appendChild(div)
            });
        },
        onexpired: function (data) {
            var blocker = document.querySelector('.blocker');
            while (blocker.firstChild) {
                blocker.removeChild(blocker.firstChild);
            }
            blocker.appendChild(document.createTextNode(data.Message));
            var memo = document.createElement('div');
            memo.appendChild(document.createTextNode('Click to get new one!'));
            blocker.appendChild(memo);
            blocker.style.display = 'block';
        }
    });
}