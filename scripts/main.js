// Function to get the current active tab in the current window
function getCurrentTab() {
    return new Promise((resolve, reject) => {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                resolve(tabs[0]);
            });
        } catch (e) {
            reject(e);
        }
    });
}

// Function to add event listeners to the start and stop buttons
function activateListeners() {
    // Listener for the start refresh button
    document.getElementById("startRefresh").addEventListener("click", async function () {
        // Validate the interval input value
        const intervalInput = document.getElementById('interval');
        const intervalValue = parseFloat(intervalInput.value);

        if (intervalValue > 99999999999) intervalInput.value = '99999999999';
        if (intervalValue < 0.05) intervalInput.value = '0.05';

        const interval = parseFloat(intervalInput.value) * 1000;
        if (!(interval > 0)) return;

        const tab = await getCurrentTab();
        chrome.runtime.sendMessage({
            cmd: "startRefresh",
            tab: tab,
            interval: interval
        }, function (res) {
            updatePopup();
            console.log(res);
        });
    });

    // Listener for the stop refresh button
    document.getElementById("stopRefresh").addEventListener("click", async function () {
        const tab = await getCurrentTab();
        chrome.runtime.sendMessage({
            cmd: "stopRefresh",
            tab: tab
        }, function (res) {
            updatePopup();
            console.log(res);
        });
    });
}

// Function to update the popup UI based on the current state
async function updatePopup() {
    const tab = await getCurrentTab();

    // Request to get the current refresh time
    chrome.runtime.sendMessage({
        cmd: "getRefreshTime",
        tab: tab
    }, function (res) {
        if (document.getElementById("interval").value === "") {
            document.getElementById("interval").value = res;
        }
    });

    // Request to check if the current tab is being refreshed
    chrome.runtime.sendMessage({
        cmd: "isRefreshing",
        tab: tab
    }, function (res) {
        document.getElementById("startRefresh").disabled = res;
        document.getElementById("interval").disabled = res;
        document.getElementById("stopRefresh").disabled = !res;
    });
}

// Initialize event listeners and update the popup UI when the DOM content is loaded
document.addEventListener('DOMContentLoaded', function () {
    activateListeners();
    updatePopup();
    document.getElementById("interval").focus();
    // Load and display saved patterns and default interval
    const patternTextarea = document.getElementById('patternList');
    const saveBtn = document.getElementById('savePatterns');
    chrome.storage.sync.get({ patterns: [], defaultInterval: 5 }, (data) => {
        patternTextarea.value = data.patterns.join('\n');
        // Only set interval if popup interval is empty
        if (!document.getElementById('interval').value) {
            document.getElementById('interval').value = data.defaultInterval;
        }
    });
    // Save patterns and default interval
    saveBtn.addEventListener('click', () => {
        const lines = patternTextarea.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const di = parseFloat(document.getElementById('interval').value) || 5;
        chrome.storage.sync.set({ patterns: lines, defaultInterval: di }, () => {
            saveBtn.textContent = 'Saved';
            setTimeout(() => { saveBtn.textContent = 'Save Patterns'; }, 1000);
        });
    });
}, false);
