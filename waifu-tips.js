function loadWidget(config) {
    let { waifuPath, apiPath, cdnPath } = config;
    let useCDN = false,
        modelList;
    if (typeof cdnPath === "string") {
        useCDN = true;
        if (!cdnPath.endsWith("/")) cdnPath += "/";
    } else if (typeof apiPath === "string") {
        if (!apiPath.endsWith("/")) apiPath += "/";
    } else {
        console.error("Invalid initWidget argument!");
        return;
    }
    localStorage.removeItem("waifu-display");
    sessionStorage.removeItem("waifu-text");
    document.body.insertAdjacentHTML("beforeend", `<div id="waifu">
			<div id="waifu-tips"></div>
			<canvas id="live2d" width="800" height="800"></canvas>
			<div id="waifu-tool">
				<span class="fa fa-lg fa-comment"></span>
				<span class="fa fa-lg fa-paper-plane"></span>
				<span class="fa fa-lg fa-user-circle"></span>
				<span class="fa fa-lg fa-street-view"></span>
				<span class="fa fa-lg fa-camera-retro"></span>
				<span class="fa fa-lg fa-info-circle"></span>
				<span class="fa fa-lg fa-times"></span>
			</div>
		</div>`);
    // https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
    setTimeout(() => {
        document.getElementById("waifu").style.bottom = 0;
    }, 0);

    function randomSelection(obj) {
        return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
    }
    // Detect user activity and display a message when idle
    let userAction = false,
        userActionTimer,
        messageTimer,
        messageArray = ["Long time no see, life goes by so fast...", "Big villain! How long have you been ignoring people?", "Hey~ Come and play with me!", "Take Xiaoquan punches your chest!", "Remember to add Xiaojia to the Adblock whitelist!"];
    window.addEventListener("mousemove", () => userAction = true);
    window.addEventListener("keydown", () => userAction = true);
    setInterval(() => {
        if (userAction) {
            userAction = false;
            clearInterval(userActionTimer);
            userActionTimer = null;
        } else if (!userActionTimer) {
            userActionTimer = setInterval(() => {
                showMessage(randomSelection(messageArray), 6000, 9);
            }, 20000);
        }
    }, 1000);

    (function registerEventListener() {
        document.querySelector("#waifu-tool .fa-comment").addEventListener("click", showQuotable);
        document.querySelector("#waifu-tool .fa-paper-plane").addEventListener("click", () => {
            if (window.Asteroids) {
                if (!window.ASTEROIDSPLAYERS) window.ASTEROIDSPLAYERS = [];
                window.ASTEROIDSPLAYERS.push(new Asteroids());
            } else {
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/gh/stevenjoezhang/asteroids/asteroids.js";
                document.head.appendChild(script);
            }
        });
        document.querySelector("#waifu-tool .fa-user-circle").addEventListener("click", loadOtherModel);
        document.querySelector("#waifu-tool .fa-street-view").addEventListener("click", loadRandModel);
        document.querySelector("#waifu-tool .fa-camera-retro").addEventListener("click", () => {
            showMessage("Is it cute?", 6000, 9);
            Live2D.captureName = "photo.png";
            Live2D.captureFrame = true;
        });
        document.querySelector("#waifu-tool fa-brands fa-github").addEventListener("click", () => {
            open("https://web.facebook.com/0x3EF8");
        });
        document.querySelector("#waifu-tool .fa-times").addEventListener("click", () => {
            localStorage.setItem("waifu-display", Date.now());
            showMessage("May you meet someone important again one day.", 2000, 11);
            document.getElementById("waifu").style.bottom = "-500px";
            setTimeout(() => {
                document.getElementById("waifu").style.display = "none";
                document.getElementById("waifu-toggle").classList.add("waifu-toggle-active");
            }, 3000);
        });
        const devtools = () => {};
        console.log("%c", devtools);
        devtools.toString = () => {
            showMessage("Haha, you opened the console, do you want to see my little secret?", 6000, 9);
        };
        window.addEventListener("copy", () => {
            showMessage("What did you copy, remember to add the source!", 6000, 9);
        });
        window.addEventListener("visibilitychange", () => {
            if (!document.hidden) showMessage("Wow, you're finally back~", 6000, 9);
        });
    })();

    (function welcomeMessage() {
        let text;
        if (location.pathname === "/") { // if it's the homepage
            const now = new Date().getHours();
            if (now > 5 && now <= 7) text = "Good morning! A day's plan begins in the morning, and a good day is about to begin.";
            else if (now > 7 && now <= 11) text = "Good morning! The work is going well, don't sit for a long time, get up and move around more!";
            else if (now > 11 && now <= 13) text = "It's noon, I worked all morning, now it's lunch time!";
            else if (now > 13 && now <= 17) text = "It's easy to get sleepy in the afternoon, have you completed today's exercise goal?";
            else if (now > 17 && now <= 19) text = "It's evening! The sunset outside the window is very beautiful, but the most beautiful is the red sunset~";
            else if (now > 19 && now <= 21) text = "Good evening, how was your day?";
            else if (now > 21 && now <= 23) text = ["It's so late, rest early, good night~", "Take care of your eyes in the middle of the night!"];
            else text = "Are you a night owl? If you don't sleep so late, are you up tomorrow?";
        } else if (document.referrer !== "") {
            const referrer = new URL(document.referrer),
                domain = referrer.hostname.split(".")[1];
            if (location.hostname === referrer.hostname) text = `欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
            else if (domain === "baidu") text = `Hello! Friends from Baidu search<br>Did you find me by searching for <span>${referrer.search.split("&wd=")[1].split("&")[0]}</span>? `;
            else if (domain === "so") text = `Hello! Friends from 360 Search<br>Did you find me by searching for <span>${referrer.search.split("&q=")[1].split("&")[0]}</span>? `;
            else if (domain === "google") text = `Hello! Friends from Google Search<br>Welcome to <span>"${document.title.split(" - ")[0]}"</span>`;
            else text = `Hello! Friends from <span>${referrer.hostname}</span>`;
        } else {
            text = `Welcome to <span>"${document.title.split(" - ")[0]}"</span>`;
        }
        showMessage(text, 7000, 8);
    })();

    function showQuotable() {
        // Add the API of Quotable
        fetch("https://api.quotable.io/random")
            .then(response => response.json())
            .then(result => {
                const text = `This sentence comes from <span>“${result.from}”</span>, which was contributed by <span>${result.creator}</span> on Quotable.io. `;
                showMessage(result.Quotable, 6000, 9);
                setTimeout(() => {
                    showMessage(text, 4000, 9);
                }, 6000);
            });
    }

    function showMessage(text, timeout, priority) {
        if (!text || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > priority)) return;
        if (messageTimer) {
            clearTimeout(messageTimer);
            messageTimer = null;
        }
        text = randomSelection(text);
        sessionStorage.setItem("waifu-text", priority);
        const tips = document.getElementById("waifu-tips");
        tips.innerHTML = text;
        tips.classList.add("waifu-tips-active");
        messageTimer = setTimeout(() => {
            sessionStorage.removeItem("waifu-text");
            tips.classList.remove("waifu-tips-active");
        }, timeout);
    }

    (function initModel() {
        let modelId = localStorage.getItem("modelId"),
            modelTexturesId = localStorage.getItem("modelTexturesId");
        if (modelId === null) {
            // First access to load the specified material of the specified model
            modelId = 1; // model ID
            modelTexturesId = 53; // Texture ID
        }
        loadModel(modelId, modelTexturesId);
        fetch(waifuPath)
            .then(response => response.json())
            .then(result => {
                window.addEventListener("mouseover", event => {
                    for (let { selector, text }
                        of result.mouseover) {
                        if (!event.target.matches(selector)) continue;
                        text = randomSelection(text);
                        text = text.replace("{text}", event.target.innerText);
                        showMessage(text, 4000, 8);
                        return;
                    }
                });
                window.addEventListener("click", event => {
                    for (let { selector, text }
                        of result.click) {
                        if (!event.target.matches(selector)) continue;
                        text = randomSelection(text);
                        text = text.replace("{text}", event.target.innerText);
                        showMessage(text, 4000, 8);
                        return;
                    }
                });
                result.seasons.forEach(({ date, text }) => {
                    const now = new Date(),
                        after = date.split("-")[0],
                        before = date.split("-")[1] || after;
                    if ((after.split("/")[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split("/")[0]) && (after.split("/")[1] <= now.getDate() && now.getDate() <= before.split("/")[1])) {
                        text = randomSelection(text);
                        text = text.replace("{year}", now.getFullYear());
                        //showMessage(text, 7000, true);
                        messageArray.push(text);
                    }
                });
            });
    })();

    async function loadModelList() {
        const response = await fetch(`${cdnPath}model_list.json`);
        modelList = await response.json();
    }

    async function loadModel(modelId, modelTexturesId, message) {
        localStorage.setItem("modelId", modelId);
        localStorage.setItem("modelTexturesId", modelTexturesId);
        showMessage(message, 4000, 10);
        if (useCDN) {
            if (!modelList) await loadModelList();
            const target = randomSelection(modelList.models[modelId]);
            loadlive2d("live2d", `${cdnPath}model/${target}/index.json`);
        } else {
            loadlive2d("live2d", `${apiPath}get/?id=${modelId}-${modelTexturesId}`);
            console.log(`Live2D model ${modelId}-${modelTexturesId} is loaded`);
        }
    }

    async function loadRandModel() {
        const modelId = localStorage.getItem("modelId"),
            modelTexturesId = localStorage.getItem("modelTexturesId");
        if (useCDN) {
            if (!modelList) await loadModelList();
            const target = randomSelection(modelList.models[modelId]);
            loadlive2d("live2d", `${cdnPath}model/${target}/index.json`);
            showMessage("Does my new clothes look good?", 4000, 10);
        } else {
            // optional "rand" (random), "switch" (order)
            fetch(`${apiPath}rand_textures/?id=${modelId}-${modelTexturesId}`)
                .then(response => response.json())
                .then(result => {
                    if (result.textures.id === 1 && (modelTexturesId === 1 || modelTexturesId === 0)) showMessage("I don't have any other clothes yet!", 4000, 10);
                    else loadModel(modelId, result.textures.id, "Does my new clothes look good?");
                });
        }
    }

    async function loadOtherModel() {
        let modelId = localStorage.getItem("modelId");
        if (useCDN) {
            if (!modelList) await loadModelList();
            const index = (++modelId >= modelList.models.length) ? 0 : modelId;
            loadModel(index, 0, modelList.messages[index]);
        } else {
            fetch(`${apiPath}switch/?id=${modelId}`)
                .then(response => response.json())
                .then(result => {
                    loadModel(result.model.id, 0, result.model.message);
                });
        }
    }
}

function initWidget(config, apiPath) {
    if (typeof config === "string") {
        config = {
            waifuPath: config,
            apiPath
        };
    }
    document.body.insertAdjacentHTML("beforeend", `<div id="waifu-toggle">
			<span> Signboard girl </ span>
		</div>`);
    const toggle = document.getElementById("waifu-toggle");
    toggle.addEventListener("click", () => {
        toggle.classList.remove("waifu-toggle-active");
        if (toggle.getAttribute("first-time")) {
            loadWidget(config);
            toggle.removeAttribute("first-time");
        } else {
            localStorage.removeItem("waifu-display");
            document.getElementById("waifu").style.display = "";
            setTimeout(() => {
                document.getElementById("waifu").style.bottom = 0;
            }, 0);
        }
    });
    if (localStorage.getItem("waifu-display") && Date.now() - localStorage.getItem("waifu-display") <= 86400000) {
        toggle.setAttribute("first-time", true);
        setTimeout(() => {
            toggle.classList.add("waifu-toggle-active");
        }, 0);
    } else {
        loadWidget(config);
    }
}