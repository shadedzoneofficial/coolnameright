"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

const WISP_URL = "wss://anura.pro/wisp/";

let scramjet;

async function init() {
	if (typeof $scramjetLoadController === "undefined") {
		error.textContent = "ERROR: scramjet.all.js failed to load.";
		return;
	}

	try {
		scramjet = new ScramjetController({
    wisp: WISP_URL,
    prefix: "/coolnameright/scramjet/",
    files: {
        wasm: "https://closet1.great-site.net/scram/scramjet.wasm.wasm",
        all: "https://closet1.great-site.net/scram/scramjet.all.js",
        sync: "https://closet1.great-site.net/scram/scramjet.sync.js",
    },
});
	} catch (err) {
		error.textContent = "Startup error: " + err.toString();
		return;
	}

	// Register SW first
	try {
		await navigator.serviceWorker.register("/coolnameright/sw.js", { scope: "/coolnameright/" });
	} catch (err) {
		error.textContent = "SW error: " + err.toString();
		return;
	}

	// Wait for SW to be in control, but only if it isn't already
	if (!navigator.serviceWorker.controller) {
		await new Promise(resolve => {
			navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
		});
		// After SW takes control, init scramjet and stop - page does NOT reload
	}

	// Now init scramjet with the active SW
	scramjet.init();

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

async function navigate(url) {
	error.textContent = "";
	if (location.protocol !== "https:") {
		error.textContent = "ERROR: Must use https://";
		return;
	}
	try {
		error.textContent = "Loading...";
		window.location.href = scramjet.encodeUrl(url);
	} catch (err) {
		error.textContent = "Error: " + err.toString();
	}
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
