"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

const WISP_URL = "wss://anura.pro/wisp/";

let scramjet = null;

async function waitForController() {
	if (navigator.serviceWorker.controller) return;
	return new Promise(resolve => {
		navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
	});
}

async function navigate(url) {
	error.textContent = "";
	errorCode.textContent = "";

	if (location.protocol !== "https:") {
		error.textContent = "ERROR: Must use https://";
		return;
	}

	if (!scramjet) {
		error.textContent = "Startup error: Scramjet failed to load. Check the console.";
		return;
	}

	try {
		error.textContent = "Setting up...";
		const reg = await navigator.serviceWorker.register("./sw.js");
		if (!navigator.serviceWorker.controller) {
			error.textContent = "Installing... page will reload, then try again.";
			const sw = reg.installing || reg.waiting;
			if (sw) sw.addEventListener("statechange", () => { if (sw.state === "activated") window.location.reload(); });
			await waitForController();
		}
	} catch (err) {
		error.textContent = "SW error: " + err.toString();
		return;
	}

	try {
		error.textContent = "Loading...";
		window.location.href = scramjet.encodeUrl(url);
	} catch (err) {
		error.textContent = "Error: " + err.toString();
	}
}

// Initialize scramjet — but ALWAYS attach listeners regardless
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
} catch (err) {
	error.textContent = "Startup error: " + err.toString();
}

// These are OUTSIDE the try block so they always attach
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

// Switch Wisp server
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
		status.textContent = '✗ Error';
	}
}
