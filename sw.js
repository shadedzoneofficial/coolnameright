importScripts("https://closet1.great-site.net/scram/scramjet.all.js");

const scramjet = new ScramjetServiceWorker({
    prefix: "/coolnameright/scramjet/",
});

function broadcastError(stage, err) {
	self.clients.matchAll().then(clients => {
		clients.forEach(client => {
			client.postMessage({
				type: "sw-error",
				stage: stage,
				message: err && err.message ? err.message : String(err),
				stack: err && err.stack ? err.stack : ""
			});
		});
	});
}

async function handleRequest(event) {
	try {
		await scramjet.loadConfig();
	} catch (err) {
		broadcastError("loadConfig", err);
		return fetch(event.request);
	}

	if (!scramjet.route(event)) {
		return fetch(event.request);
	}

	try {
		return await scramjet.fetch(event);
	} catch (err) {
		broadcastError("fetch", err);
		return new Response(
			`<html><body style="background:#000;color:#f00;font-family:monospace;padding:20px">
				<h2>Scramjet SW Error</h2>
				<p><b>Stage:</b> fetch</p>
				<p><b>Error:</b> ${err.message || err}</p>
				<pre>${err.stack || ""}</pre>
			</body></html>`,
			{ headers: { "Content-Type": "text/html" } }
		);
	}
}

self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
	if (event.request.url.includes("closet1.great-site.net") || 
	    event.request.url.includes("scramjet.all.js") ||
	    event.request.url.includes("scramjet.wasm") ||
	    event.request.url.includes("scramjet.sync")) {
		return;
	}
	event.respondWith(handleRequest(event));
});

self.addEventListener("message", (event) => {
	if (event.data && event.data.scramjet$type === "loadConfig") {
		scramjet.config = event.data.config;
		scramjet.initEpoxy && scramjet.initEpoxy().catch(err => {
			broadcastError("initEpoxy", err);
		});
	}
});
