var imgs = {};
var icons = {};
var texts = {};
var titles = {};
var check = {};
var windowIds = {};
var curTabId;
var windowId;

const port = whale.runtime.connect({ name: 'tabInfo_tabFinder' });

port.onMessage.addListener((message) => {
    imgs = message.imgs;
    icons = message.icons;
    texts = message.texts;
    titles = message.titles;
    windowIds = message.windowIds;
    if (message.name == "update") {
        search();
    }
    if (message.name == "remove") {
        if (check[message.tabId])
            deleteTabCard(message.tabId);
    }
    if (message.name = "active") {
        if (check[message.tabId])
            setTimeout(() => {
                modifyImg(message.tabId);
            }, 200);
    }
});

function modifyImg(tabId) {
    $("#t" + tabId + " .card > img").attr("src", imgs[tabId]);
    $("#t" + tabId + " .card > img").attr("visibility", "visible");
}

function init() {
    whale.tabs.getSelected(null, (tab) => {
        curTabId = tab.id;
    });
}

window.onload = function () {
    init();
    handleDragDrop();
    var key = document.getElementById("keyword");
    var searchBtn = document.getElementById("searchBtn");

    key.focus();
    key.addEventListener("keydown", function (key) {
        if (key.keyCode == 13)
            search();
    });

    searchBtn.addEventListener('click', function () {
        search();
    });

    key.addEventListener('keyup', function (event) {
        if (key.value == "") {
            searchBtn.innerText = "all";
        }
        else {
            searchBtn.innerText = "find";
        }
    });

    whale.windows.getCurrent(null, (result) => {
        windowId = result.id;
    })
}

const handleDragDrop = () => {
    window.addEventListener("dragover", e => {
        e.preventDefault();
        e.dataTransfer.effectAllowed = "none";
        e.dataTransfer.dropEffect = "none";
    });

    window.addEventListener("drop", e => {
        e.preventDefault();
        e.dataTransfer.effectAllowed = "none";
        e.dataTransfer.dropEffect = "none";
    });
}

function addTabCard(tabId, keywordIndex) {
    var key = document.getElementById("keyword");
    check[tabId] = true;
    let colNode = document.createElement("div");
    colNode.className = "col-12 col-sm-6 animated fadeInUp";
    colNode.id = "t" + tabId;
    let cardNode = document.createElement("div");


    if (curTabId == tabId)
        cardNode.className = "card mb-3 curTab";
    else
        cardNode.className = "card mb-3";

    let cardHeader = document.createElement("div");
    cardHeader.className = "card-header";

    var favIconImage = document.createElement("img");
    favIconImage.className = "rounded-circle";
    favIconImage.style.width = "24px";
    favIconImage.src = icons[tabId];
    if (icons[tabId] == undefined || icons[tabId] == "chrome://resources/whale/img/favicon.png") {
        favIconImage.src = "/icon/default.png";
    }

    let title = document.createTextNode(" " + titles[tabId]);

    let delIcon = document.createElement('img');
    delIcon.setAttribute("src", "/icon/delete.png");
    delIcon.style.width = "20px";
    delIcon.className = "float-right";
    delIcon.id = "delIcon";
    delIcon.onclick = function () { deleteTabCard(tabId); deleteTab(parseInt(tabId)); };

    let captureImg = document.createElement("img");
    captureImg.src = imgs[tabId];
    if (captureImg.src == undefined) {
        captureImg.src = "/icon/noImg.png";
    }
    captureImg.width = "100%";
    captureImg.className = "card-img-top";


    let cardBody = document.createElement("div");
    cardBody.className = "card-body";

    let text = document.createElement("p");
    text.className = "card-text";
    text.innerText = formatText(texts[tabId].substring(keywordIndex));

    cardHeader.appendChild(favIconImage);
    cardHeader.appendChild(delIcon);
    cardHeader.appendChild(title);

    if (key.value.length != 0)
        cardBody.appendChild(text);

    cardNode.appendChild(cardHeader);

    cardNode.appendChild(captureImg);


    cardNode.appendChild(cardBody);
    colNode.appendChild(cardNode);
    document.getElementById("box").appendChild(colNode);

    cardNode.onclick = function () {
        whale.tabs.update(parseInt(tabId), { "selected": true });
    }
}

function deleteTabCard(tabId) {
    $('#t' + tabId).removeClass().addClass("col-12 animated zoomOut");
    setTimeout(function () {
        check[tabId] = false;
        $('#t' + tabId).remove();
    }, 100);
}

function search() {
    document.getElementById("box").innerHTML = "";
    var key = document.getElementById("keyword").value;

    for (var index in texts) {
        var regex = new RegExp(key, "i");
        var keywordIndex = texts[index].search(regex);
        if (keywordIndex != -1 && windowId == windowIds[index]) {
            addTabCard(index, keywordIndex);
        }
    }
    highlightKeywordInSideBar(key);
}

function highlightKeywordInSideBar(key) {
    var context = document.getElementsByClassName("card-body");
    for (var i = 0; i < context.length; i++) {
        var instance = new Mark(context[i]);
        instance.mark(key, { "separateWordSearch": false });
    }
}

// text format
function formatText(text) {
    if (text == "undefined") text = "";
    if (text.length > 50)
        text = text.substring(0, 47) + "...";
    text = text.replace(/[\r\n]/g, '');
    return text;
}

// delete Tab
function deleteTab(tabId) {
    whale.tabs.remove(tabId);
}

whale.tabs.onActivated.addListener((info) => {
    if (curTabId != null && check[curTabId]) {
        $("#t" + curTabId + " > .card").removeClass("curTab");
    }
    if (check[info.tabId]) {
        $("#t" + info.tabId + " > .card").addClass("curTab");
    }
    curTabId = info.tabId;
});