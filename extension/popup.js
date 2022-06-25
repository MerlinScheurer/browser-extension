/*
Loaded into popup index.html
*/

let browserType = getBrowser();

// boilerplate to dedect browser type api
function getBrowser() {
    if (typeof chrome !== "undefined") {
        if (typeof browser !== "undefined") {
            return browser;
        } else {
            return chrome;
        }
    } else {
        console.log("failed to dedect browser");
        throw "browser detection error"
    };
}


// store access details
document.getElementById("save-login").addEventListener("click", function () {
    let toStore = {
        "access": {
            "url": document.getElementById("url").value,
            "port": document.getElementById("port").value,
            "apiKey": document.getElementById("api-key").value
        }
    };
    browserType.storage.local.set(toStore, function() {
        console.log("Stored connection details: " + JSON.stringify(toStore));
        pingBackend();
    });
})


// verify connection status
document.getElementById("status-icon").addEventListener("click", function() {
    pingBackend();
})


// send cookie
document.getElementById("sendCookies").addEventListener("click", function() {
    sendCookie();
})


function sendCookie() {
    console.log("popup send cookie");

    function handleResponse(message) {
        console.log("handle cookie response: " + JSON.stringify(message));
        let cookie_validated = message.cookie_validated;
        document.getElementById("sendCookiesStatus").innerText = "validated: " + cookie_validated
    }

    function handleError(error) {
        console.log(`Error: ${error}`);
    }

    let checked = document.getElementById("sendCookies").checked;
    let toStore = {
        "sendCookies": {
            "checked": checked
        }
    };
    browserType.storage.local.set(toStore, function() {
        console.log("stored option: " + JSON.stringify(toStore));
    })
    if (checked === false) {
        return
    }
    let sending = browserType.runtime.sendMessage({"sendCookie": true});
    sending.then(handleResponse, handleError);
}


// send ping message to TA backend
function pingBackend() {

    function handleResponse(message) {
        if (message.response === "pong") {
            setStatusIcon(true);
            console.log("connection validated")
        }
    }
    
    function handleError(error) {
        console.log(`Error: ${error}`);
        setStatusIcon(false);
    }

    console.log("ping TA server")
    let sending = browserType.runtime.sendMessage({"verify": true});
    sending.then(handleResponse, handleError);

}

// add url to image
function addUrl(access) {
    const url = `${access.url}:${access.port}`;
    document.getElementById("ta-url").setAttribute("href", url);
}


function setCookieState() {

    function handleResponse(message) {
        console.log(message);
        document.getElementById("sendCookies").checked = message.cookie_enabled;
        if (message.validated_str) {
            document.getElementById("sendCookiesStatus").innerText = message.validated_str;
        }
    }

    function handleError(error) {
        console.log(`Error: ${error}`);
    }

    console.log("set cookie state");
    let sending = browserType.runtime.sendMessage({"cookieState": true});
    sending.then(handleResponse, handleError)
    document.getElementById("sendCookies").checked = true;
}


// change status icon based on connection status
function setStatusIcon(connected) {

    let statusIcon = document.getElementById("status-icon")
    if (connected == true) {
        statusIcon.innerHTML = "&#9745;";
        statusIcon.style.color = "green";
    } else {
        statusIcon.innerHTML = "&#9746;";
        statusIcon.style.color = "red";
    }

}


function downloadEvent() {

    let button = document.getElementById("downloadButton");
    let payload = {
        "download": {
            "url": button.getAttribute("data-id")
        }
    };

    function handleResponse(message) {
        console.log("popup.js response: " + JSON.stringify(message));
        browserType.storage.local.remove("youtube").then(response => {
            let download = document.getElementById("download");
            download.innerHTML = ""
            let message = document.createElement("p");
            message.innerText = "Download link sent to Tube Archivist"
            download.appendChild(message)
            download.appendChild(document.createElement("hr"));
        })
    }
    
    function handleError(error) {
        console.log(`Error: ${error}`);
    }

    let sending = browserType.runtime.sendMessage(payload);
    sending.then(handleResponse, handleError)

}


function subscribeEvent() {

    let button = document.getElementById("subscribeButton");
    let payload = {
        "subscribe": {
            "url": button.getAttribute("data-id")
        }
    };

    function handleResponse(message) {
        console.log("popup.js response: " + JSON.stringify(message));
        browserType.storage.local.remove("youtube").then(response => {
            let download = document.getElementById("download");
            download.innerHTML = ""
            let message = document.createElement("p");
            message.innerText = "Subscribe link sent to Tube Archivist"
            download.appendChild(message)
            download.appendChild(document.createElement("hr"));
        })
    }

    function handleError(error) {
        console.log(`Error: ${error}`);
    }

    let sending = browserType.runtime.sendMessage(payload);
    sending.then(handleResponse, handleError)

}


// fill in form
document.addEventListener("DOMContentLoaded", async () => {

    function onGot(item) {
        if (!item.access) {
            console.log("no access details found");
            setStatusIcon(false);
            return
        }
        document.getElementById("url").value = item.access.url;
        document.getElementById("port").value = item.access.port;
        document.getElementById("api-key").value = item.access.apiKey;
        pingBackend();
        addUrl(item.access);
    };

    function setCookiesOptions(result) {
        if (!result.sendCookies || result.sendCookies.checked === false) {
            console.log("sync cookies not set");
            return
        }
        console.log("set options: " + JSON.stringify(result));
        setCookieState();

    }
    
    function onError(error) {
        console.log(`Error: ${error}`);
    };

    browserType.storage.local.get("access", function(result) {
        onGot(result)
    });

    browserType.storage.local.get("sendCookies", function(result) {
        setCookiesOptions(result)
    })

    browserType.storage.local.get("youtube", function(result) {
        if (result.youtube) {
            createButtons(result);
        }
    })

})


function createButtons(result) {

    let download = document.getElementById("download");
    let linkType = document.createElement("h3");
    linkType.innerText = result.youtube.type.charAt(0).toUpperCase() + result.youtube.type.slice(1);
    let title = document.createElement("p");
    title.innerText = result.youtube.title;

    // dl button
    let downloadButton = document.createElement("button");
    downloadButton.innerText = "download";
    downloadButton.id = "downloadButton";
    downloadButton.setAttribute("data-id", result.youtube.url);
    downloadButton.addEventListener("click", function(){downloadEvent()}, false);

    // subscribe button
    let subscribeButton = document.createElement("button");
    subscribeButton.innerText = "subscribe";
    subscribeButton.id = "subscribeButton";
    subscribeButton.setAttribute("data-id", result.youtube.url);
    subscribeButton.addEventListener("click", function(){subscribeEvent()}, false);

    download.appendChild(linkType);
    download.appendChild(title);
    download.appendChild(downloadButton);
    download.appendChild(subscribeButton);
    download.appendChild(document.createElement("hr"));

}
