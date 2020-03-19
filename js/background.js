var port = [];
var imgs = {};
var icons = {};
var texts = {};
var titles = {};
var windowIds = {};
var curTab = null;
var onoff = false;

whale.runtime.onConnect.addListener(p => {
    if (p.name === 'tabInfo_tabFinder') {
        port.push(p);
        let idx = port.indexOf(p);

        p.onDisconnect.addListener(() => { port[idx] = null; });

        for (let i = 0; i < port.length; i++) {
            if (port[i] != null)
                port[i].postMessage({ name: "init", imgs: imgs, icons: icons, texts: texts, titles: titles, windowIds: windowIds });
        }
    }
});

function makeTabProperty(tabId, name) {
    whale.tabs.query({ currentWindow: true }, tab => {
        whale.tabs.get(tabId, (tab) => {
            var tabUrl = tab.url;

            if (tabUrl.includes("about:blank") || tabUrl.includes("whale://") || tabUrl.includes("chrome://") || tabUrl.includes("whale://extensions/")
                || tabUrl.includes("chrome-extension://") || tabUrl.includes("store.whale.naver.com/"))
                return;

            icons[tabId] = tab.favIconUrl;
            titles[tabId] = tab.title;
            windowIds[tabId] = tab.windowId;
            whale.tabs.executeScript(tabId, { code: "document.querySelector('body').innerText", allFrames: true }, (text) => {
                var s = "";
                for (var i = 0; i < text.length; i++)
                    s += text[i];
                texts[tabId] = s;
                if (curTab == tabId)
                    whale.tabs.captureVisibleTab(null, { format: "jpeg", quality: 40 }, (img) => {
                        imgs[tabId] = img;
                        for (let i = 0; i < port.length; i++) {
                            if (port[i] != null)
                                port[i].postMessage({ name: name, tabId: tabId, imgs: imgs, icons: icons, texts: texts, titles: titles, windowIds: windowIds });
                        }
                    });
                else {
                    imgs[tabId] = "../icon/noImg.png";

                    for (let i = 0; i < port.length; i++) {
                        if (port[i] != null)
                            port[i].postMessage({ name: name, tabId: tabId, imgs: imgs, icons: icons, texts: texts, titles: titles, windowIds: windowIds });
                    }
                }
            });
        });
    })

}

whale.tabs.getSelected(null, (tab) => {
    curTab = tab.id;
})

whale.tabs.onActivated.addListener((message) => {
    curTab = message.tabId;
    whale.tabs.get(message.tabId, (tab) => {
        var tabUrl = tab.url;
        if (tabUrl.includes("about:blank") || tabUrl.includes("whale://") || tabUrl.includes("chrome://") || tabUrl.includes("whale://extensions/")
            || tabUrl.includes("chrome-extension://") || tabUrl.includes("store.whale.naver.com/"))
            return;

        if (curTab == message.tabId)
            setTimeout(() => {
                whale.tabs.captureVisibleTab(null, { format: "jpeg", quality: 40 }, (img) => {
                    imgs[message.tabId] = img;

                    for (let i = 0; i < port.length; i++) {
                        if (port[i] != null)
                            port[i].postMessage({ name: "active", tabId: message.tabId, imgs: imgs, icons: icons, texts: texts, titles: titles, windowIds: windowIds });
                    }
                });
            }, 200);
    });
})

whale.tabs.onRemoved.addListener((tabId, removeInfo) => {
    delete texts[tabId];
    delete imgs[tabId];
    delete icons[tabId];
    delete titles[tabId];
    delete windowIds[tabId];

    for (let i = 0; i < port.length; i++) {
        if (port[i] != null)
            port[i].postMessage({ name: "remove", tabId: tabId, imgs: imgs, icons: icons, texts: texts, titles: titles, windowIds: windowIds });
    }
});

whale.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status != "complete")
        return;
    setTimeout(() => {
        makeTabProperty(tabId, "update");
    }, 200);
});

chrome.commands.onCommand.addListener(function (command) {
    if (!onoff) {
        whale.sidebarAction.show();
        onoff = true;
    } else {
        whale.sidebarAction.hide();
        onoff = false;
    }
});