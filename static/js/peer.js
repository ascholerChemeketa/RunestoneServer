var ws = null;
function connect(event) {
    ws = new WebSocket(`ws://localhost:8080/chat/${user}/ws`);
    ws.onmessage = function (event) {
        var messages = document.getElementById('messages')
        var message = document.createElement('li')
        let mess = JSON.parse(event.data);
        if (mess.type === "text") {
            var content = document.createTextNode(mess.message)
            message.appendChild(content)
            messages.appendChild(message)
        } else if (mess.type === "control") {
            let messarea;
            switch (mess.message) {
                // This will be some kind of control message for the page
                case "countDownAndStop":
                    messarea = document.getElementById("imessage");
                    let count = 10;
                    let itimerid = setInterval(async function () {
                        if (count > 0) {
                            messarea.innerHTML = `<h3>Finish Up only ${count} seconds remaining</h3>`;
                            count = count - 1;
                        } else {
                            messarea.innerHTML = `<h3>Time is up</h3>`;
                            window.mcList[currentQuestion].submitButton.disabled = true;
                            clearInterval(itimerid);
                            // send log message to indicate voting is over
                            if (voteNum == 2) {
                                await logStopVote();
                            }
                        }
                    }, 1000);
                    break;
                case "enableVote":
                    window.mcList[currentQuestion].submitButton.disabled = false;
                    messarea = document.getElementById("imessage");
                    messarea.innerHTML = `<h3>Time to make your 2nd vote</h3>`
                    break;
                default:
                    console.log("unknown control message");
            }
        }
    }
}

async function logStopVote() {
    // This can be refactored to take some parameters if peer grows
    // to require more logging functionality.
    let eventInfo = {
        sid: eBookConfig.username,
        div_id: currentQuestion,
        event: "peer",
        act: "stop_question",
        course_id: eBookConfig.course,
    }
    let request = new Request(eBookConfig.ajaxURL + "hsblog", {
        method: "POST",
        headers: this.jsonHeaders,
        body: JSON.stringify(eventInfo),
    });
    try {
        let response = await fetch(request);
        if (!response.ok) {
            throw new Error("Failed to save the log entry");
        }
        post_return = response.json();
    } catch (e) {
        alert(`Error: Your action was not saved! The error was ${e}`);
        console.log(`Error: ${e}`);
    }
}
// Send a message to the websocket server
// the server can then broadcast the message or send it to a
// specific user
async function sendMessage(event) {
    var input = document.getElementById("messageText")
    //#ws.send(JSON.stringify(mess))
    let mess = {
        type: "text",
        from: `${user}`,
        message: input.value,
        broadcast: false,
        course_name: eBookConfig.course,
        div_id: currentQuestion
    };
    await publishMessage(mess)
    var messages = document.getElementById('messages')
    var message = document.createElement('li')
    var content = document.createTextNode(input.value)
    message.appendChild(content)
    messages.appendChild(message)
    input.value = ''
    // not needed for onclick event.preventDefault()
}

function warnAndStopVote(event) {
    let mess = {
        type: "control",
        sender: `${user}`,
        message: "countDownAndStop",
        broadcast: true
    }

    publishMessage(mess);
    if (event.srcElement.id == "vote1") {
        let butt = document.querySelector("#vote1")
        butt.classList.replace("btn-info", "btn-secondary")
    } else {
        let butt = document.querySelector("#vote3")
        butt.classList.replace("btn-info", "btn-secondary")

    }
}

async function makePartners() {
    let butt = document.querySelector("#makep")
    butt.classList.replace("btn-info", "btn-secondary")

    let data = {
        div_id: currentQuestion
    }
    let jsheaders = new Headers({
        "Content-type": "application/json; charset=utf-8",
        Accept: "application/json",
    });
    let request = new Request("/runestone/peer/make_pairs", {
        method: "POST",
        headers: jsheaders,
        body: JSON.stringify(data),
    });
    let resp = await fetch(request);
    let spec = await resp.json();
}

function startVote2(event) {
    let butt = document.querySelector("#vote2")
    butt.classList.replace("btn-info", "btn-secondary")
    voteNum += 1;
    let mess = {
        type: "control",
        sender: `${user}`,
        message: "enableVote",
        broadcast: true
    }
    //ws.send(JSON.stringify(mess));
    publishMessage(mess)

}

async function clearPartners(event) {

    let butt = document.querySelector("#clearp")
    butt.classList.replace("btn-info", "btn-secondary")

    let data = {
        div_id: currentQuestion
    }
    let jsheaders = new Headers({
        "Content-type": "application/json; charset=utf-8",
        Accept: "application/json",
    });
    let request = new Request("/runestone/peer/clear_pairs", {
        method: "POST",
        headers: jsheaders,
        body: JSON.stringify(data),
    });
    let resp = await fetch(request);
    let spec = await resp.json();
}

async function publishMessage(data) {
    let jsheaders = new Headers({
        "Content-type": "application/json; charset=utf-8",
        Accept: "application/json",
    });
    let request = new Request("/runestone/peer/publish_message", {
        method: "POST",
        headers: jsheaders,
        body: JSON.stringify(data),
    });
    let resp = await fetch(request);
    let spec = await resp.json();
}