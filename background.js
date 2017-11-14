chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    chrome.tabs.executeScript(null, { file: "jquery.min.js" }, function() {
        chrome.tabs.executeScript(null, { file: "jquery.cookie.js" }, function() {
            chrome.tabs.executeScript(null, { file: "content.js" });
        });
    });
});