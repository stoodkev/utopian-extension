var endpoint = 'http://localhost:4040/api';
var steemConnectCallback = 'http://localhost:3000/callback';
//var githubClient = '06b0ef5509fc7de00493';
//var githubCallback = 'https://utopian.io/github/callback';

var githubClient = '1ed58da028b638550c03';
var githubCallback = 'http://localhost:3000/github/callback';

function getCurrentTabUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];
        var url = tab.url;

        callback(url);
    });
}

function getCookies(domain, name, callback) {
    chrome.cookies.get({"url": domain, "name": name}, function(cookie) {
        if(callback) {
            callback(cookie ? cookie.value : null);
        }
    });
}

function isAuthorised (token, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", endpoint + '/users/' + token + '/platforms/github', false);
    xhr.send();

    var status = xhr.status;
    var response = xhr.responseText;

    if (status === 404) {
        callback(404);
        return;
    }

    if (status === 401) {
        callback(401);
        return;
    }

    callback(JSON.parse(response));
}

function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

document.addEventListener('DOMContentLoaded', function() {
    getCurrentTabUrl(function(url) {
        var signGithub = document.getElementById('sign-github');
        var welcome = document.getElementById('welcome-cont');
        var connected = document.getElementById('connected');
        var githubAccount = document.getElementById('github-account-name');
        var utopianAccount = document.getElementById('utopian-account-name');
        var mustAuthoriseAction = document.getElementById('must-authorise');
        var mustSyncAction = document.getElementById('must-sync-github');
        var connectionActions = document.getElementById('connection-actions');
        var authoriseUtopianUrl = 'https://v2.steemconnect.com/oauth2/authorize?client_id=utopian.app&response_type=code&redirect_uri='+steemConnectCallback+'&scope=offline,vote,comment,comment_delete,comment_options,custom_json,claim_reward_balance&state='+ url;


        signGithub.addEventListener("click", function(){
            chrome.tabs.create({active: true, url: "https://github.com/login"});
        });

        mustAuthoriseAction.addEventListener("click", function(){
            chrome.tabs.create({active: true, url: authoriseUtopianUrl});
        });

        mustSyncAction.addEventListener("click", function(){
            var githubRequest = 'https://github.com/login/oauth/authorize?client_id='+githubClient+'&redirect_uri='+githubCallback+'&scope=repo,user,gist&state=' + url;

            chrome.tabs.create({active: true, url: githubRequest});
        });

        function showWelcome() {
            welcome.style.display = 'block';
            connected.style.display = 'none';
            connectionActions.style.display = 'none';
        }

        function hideWelcome() {
            welcome.style.display = 'none';
        }

        function mustSyncGithub() {
            connectionActions.style.display = 'block';
            connected.style.display = 'none';
            mustAuthoriseAction.style.display = 'none';
            mustSyncAction.style.display = 'block';
        }

        function mustAuthorise() {
            connectionActions.style.display = 'block';
            mustAuthoriseAction.style.display = 'block';
            mustSyncAction.style.display = 'none';
            connected.style.display = 'none';
        }

        function authorised (user) {
            connectionActions.style.display = 'none';
            connected.style.display = 'block';
            utopianAccount.innerHTML = '@' + user.account;
            githubAccount.innerHTML = '@' + user.github.login;
        }

        function verify (access_token) {
            getCookies(url, "dotcom_user", function(githubUser) {
                if (!githubUser) {
                    showWelcome();
                    return;
                }
                isAuthorised(access_token, function(userRes) {
                    console.log(userRes)
                    if (userRes === 404) {
                        mustSyncGithub();
                        return;
                    }
                    if (userRes === 401) {
                        mustAuthorise();
                        return;
                    }

                    if (userRes.github.account !== githubUser) {
                        chrome.cookies.remove({ url: 'https://github.com', name: "utopian_token" });

                        mustSyncGithub();
                        return;
                    }

                    authorised(userRes);
                });
            });
        }

        if(url.indexOf('github') > -1) {
            hideWelcome();

            getCookies(url, "utopian_token", function(utopianToken) {
                if (!utopianToken) {
                    const access_token = getParameterByName("access_token", url);

                    if (access_token) {
                        chrome.cookies.set({ url: 'https://github.com', name: "utopian_token", value: access_token }, function (cookie){
                            console.log(JSON.stringify(cookie));
                            console.log(chrome.extension.lastError);
                            console.log(chrome.runtime.lastError);

                            verify(access_token);
                        });
                    } else {
                        mustSyncGithub();
                    }
                }
                if (utopianToken) {
                    verify(utopianToken);
                }
            });
        } else {
            showWelcome();
        }
    });
});