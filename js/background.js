// This method send message to main.js when url is changed.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if(changeInfo && changeInfo.status == "complete"){
        chrome.tabs.sendMessage(tabId, {data: tab}, function(response) {
        });
    }
});
