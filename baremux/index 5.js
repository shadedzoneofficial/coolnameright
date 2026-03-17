"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

const WISP_URL = "wss://anura.pro/wisp/";

let scramjet = null;

// Make errors sticky and visible so we can debug on iPad
function showError(msg) {
	error.style.color = "red";
	error.style.fontSize = "14px";
	error.style.whiteSpace = "pre-wrap";
	error.style.wordBreak = "break-all";
	error.textContent = msg;
}

// Listen for errors broadcast from the service worker
navigator.serviceWorker && navigator.serviceWorker.addEventListener("message", (e) => {
	if (e.data && e.data.type === "sw-error") {
		showError("SW [" + e.data.stage + "]: " + e.data.message + "\n" + e.data.stack);
	}
});

async function waitForController() {
	if (navigator.serviceWorker.controller) return;
	return new Promise(resolve => {
		navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
	});
}

async function navigate(url) {
	if (location.protocol !== "https:") {
		showError("ERROR: Must use https://");
		return;
	}

	if (!scramjet) {
		showError("ERROR: Scramjet not loaded. See error above.");
		return;
	}

	try {
		error.textContent = "Setting up service worker...";
		const reg = await navigator.serviceWorker.register("./sw.js");
		if (!navigator.serviceWorker.controller) {
			error.textContent = "Installing SW... wait a moment then search again.";
			const sw = reg.installing || reg.waiting;
			if (sw) {
				sw.addEventListener("statechange", () => {
					error.textContent = "SW state: " + sw.state;
					if (sw.state === "activated") window.location.reload();
				});
			}
			await waitForController();
		}
	} catch (err) {
		showError("SW register error: " + err.toString());
		return;
	}

	try {
		error.textContent = "Encoding URL...";
		const encoded = scramjet.encodeUrl(url);
		error.textContent = "Navigating to: " + encoded.substring(0, 60) + "...";
		window.location.href = encoded;
	} catch (err) {
		showError("Navigate error: " + err.toString());
	}
}

// Init scramjet
try {
	const { ScramjetController } = $scramjetLoadController();
	scramjet = new ScramjetController({
		wisp: WISP_URL,
		files: {
			wasm: "scram/scramjet.wasm.wasm",
			all: "scram/scramjet.all.js",
			sync: "scram/scramjet.sync.js",
		},
	});
	scramjet.init();
	error.textContent = "Scramjet ready.";
	setTimeout(() => { if (error.textContent === "Scramjet ready.") error.textContent = ""; }, 2000);
} catch (err) {
	showError("Scramjet init error: " + err.toString());
}

// Listeners are ALWAYS attached outside the try block
form.addEventListener("submit", async (e) => {
	e.preventDefault();
	await navigate(search(address.value, document.getElementById('sj-engine').value));
});

document.querySelectorAll(".shortcut").forEach(el => {
	el.addEventListener("click", async (e) => {
		e.preventDefault();
		await navigate(el.dataset.url);
	});
});

function switchWisp() {
	const newWisp = document.getElementById('sj-wisp-select').value;
	const status = document.getElementById('sj-wisp-status');
	try {
		const { ScramjetController } = $scramjetLoadController();
		scramjet = new ScramjetController({
			wisp: newWisp,
			files: {
				wasm: "scram/scramjet.wasm.wasm",
				all: "scram/scramjet.all.js",
				sync: "scram/scramjet.sync.js",
			},
		});
		scramjet.init();
		status.textContent = '✓ Switched';
		setTimeout(() => status.textContent = '', 2000);
	} catch(e) {
		status.textContent = '✗ Error: ' + e.toString();
	}
}
