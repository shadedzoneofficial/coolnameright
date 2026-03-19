"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

const WISP_URL = "wss://anura.pro/wisp/";

async function waitForController() {
	if (navigator.serviceWorker.controller) return;
	return new Promise(resolve => {
		navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
	});
}

async function init() {
	if (typeof $scramjetLoadController === "undefined") {
		error.textContent = "ERROR: scramjet.all.js failed to load.";
		return;
	}

	let scramjet;
	try {
		const { ScramjetController } = $scramjetLoadController();
		scramjet = new ScramjetController({
			wisp: WISP_URL,
			files: {
				wasm: "https://closet1.great-site.net/scram/scramjet.wasm.wasm",
				all: "https://closet1.great-site.net/scram/scramjet.all.js",
				sync: "https://closet1.great-site.net/scram/scramjet.sync.js",
			},
		});
		scramjet.init();
	} catch (err) {
		error.textContent = "Startup error: " + err.toString();
		return;
	}

	async function navigate(url) {
		error.textContent = "";
		if (location.protocol !== "https:") {
			error.textContent = "ERROR: Must use https://";
			return;
		}
		await waitForController();
		}
		try {
			error.textContent = "Loading...";
			window.location.href = scramjet.encodeUrl(url);
		} catch (err) {
			error.textContent = "Error: " + err.toString();
		}
	}

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
}

init();

function switchWisp() {
	const newWisp = document.getElementById('sj-wisp-select').value;
	const status = document.getElementById('sj-wisp-status');
	try {
		const { ScramjetController } = $scramjetLoadController();
		const s = new ScramjetController({
			wisp: newWisp,
			files: {
				wasm: "https://closet1.great-site.net/scram/scramjet.wasm.wasm",
				all: "https://closet1.great-site.net/scram/scramjet.all.js",
				sync: "https://closet1.great-site.net/scram/scramjet.sync.js",
			},
		});
		s.init();
		status.textContent = '✓ Switched';
		setTimeout(() => status.textContent = '', 2000);
	} catch(e) {
		status.textContent = '✗ Error';
	}
}
