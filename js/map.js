let g_map;
let g_markerMapping = {};			// A mapping from marker tooltip string to {marker, count}, where marker is the handle and count is the number of events that this marker is assigned to
let g_movePaths = {};				// from -> { to -> path }
let g_warpMovePaths = {};			// from ->  path
let g_highlightedRun;				// uid of the run being highlighted

function initMap() {
	g_map = L.map('map', {
		minZoom: -3,
		maxZoom: 5,
		center: [0, 0],
		zoom: -3,
		maxBoundsViscosity: 1,
		crs: L.CRS.Simple,
		zoomControl: false,
	});

	// Dimensions of the image
	var w = 6000;  // width of the image in pixels
	var h = 5000;  // height of the image

	// Calculate the edges of the image, in coordinates
	var southWest = g_map.unproject([-w, h], 0);
	var northEast = g_map.unproject([w, -h], 0);
	var bounds = new L.LatLngBounds(southWest, northEast);

	g_map.setMaxBounds(bounds);

	// Add the image overlay 
	// (replace 'path_to_your_large_image.jpg' with the path to your image file)
	L.imageOverlay('data/botw-map.jpg', bounds).addTo(g_map);

	var korokIcon = L.icon({
		iconUrl: 'icons/korok.png',
		iconSize:     [20, 20],
		iconAnchor:   [10, 10],
	});
	var orbIcon = L.icon({
		iconUrl: 'icons/orb.png',
		iconSize:     [20, 20],
		iconAnchor:   [10, 10],
	});
	var towerIcon = L.icon({
		iconUrl: 'icons/tower.png',
		iconSize:     [20, 20],
		iconAnchor:   [10, 10],
	});
	var monumentIcon = L.icon({
		iconUrl: 'icons/monument.png',
		iconSize:     [16, 16],
		iconAnchor:   [8, 8],
	});
	var memoryIcon = L.icon({
		iconUrl: 'icons/memory.png',
		iconSize:     [20, 20],
		iconAnchor:   [10, 10],
	});
	var techLabIcon = L.icon({
		iconUrl: 'icons/techlab.png',
		iconSize:     [20, 20],
		iconAnchor:   [10, 10],
	});
	var starIcon = L.icon({
		iconUrl: 'icons/star.png',
		iconSize:     [16, 16],
		iconAnchor:   [8, 8],
	});
	var dialogIcon = L.icon({
		iconUrl: 'icons/npc.png',
		iconSize:     [20, 20],
		iconAnchor:   [10, 10],
	});

	g_map.createPane('movesPane').style.zIndex = 450;
	g_map.createPane('markerFrontPane').style.zIndex = 500;
	g_map.createPane('markerBackPane').style.zIndex = 400;

	// create the dropdown run list
	var selectRunButton = L.easyButton({
		id: 'runlist-button',
		states:[
			{
				icon: '<div>Select Run ▼</div>',
				onClick: function(btn, map) { // callback on button click
					var dropdownContent = L.DomUtil.get('runlist-dropdown');
					if (dropdownContent.style.display === 'block') {
						dropdownContent.style.display = 'none';
					} else {
						var ulEle = dropdownContent.querySelector('ul');
						ulEle.innerHTML = '';
						var runIds = Object.keys(g_runs);
						runIds.sort(function(a,b){
							return g_runs[a].events.at(-1).frame[1] - g_runs[b].events.at(-1).frame[1];
						});
						for (const runId of runIds) {
							var li = L.DomUtil.create('li', '', ulEle);
							li.innerHTML = runId + ' (<span style="color: forestgreen;">' + g_runs[runId].route + '</span>)';
							if (runId == g_highlightedRun){
								li.classList.add("highlighted-row");
							}
							li.onclick = function(){
								highlightRun(this.textContent.split(' ')[0]);
							};
						}
						dropdownContent.style.display = 'block';
					}
					g_map.closePopup();
				}
			}
		]
	});
	selectRunButton.addTo(g_map);
	// put the dropdown list under it
	selectRunButton.button.parentNode.appendChild(L.DomUtil.get('runlist-dropdown'));

	fetch('data/coords.json').then(response => {
		if (response.ok)
			return response.json();
	})
	.then(data => {
		// Create a feature group for all markers
		var markers = L.featureGroup().addTo(g_map);

		for (let k in data){
			let icon;
			let zOffset = 0;
			let pane = 'markerFrontPane';
			if (k.endsWith('Tower')) {
				icon = towerIcon;
				zOffset = 10000;
			}
			else if (k.endsWith('Shrine')) {
				icon = orbIcon;
				zOffset = 5000;
			}
			else if (k.length == 3) {
				icon = korokIcon;
				zOffset = data[k][1];
				//pane = 'markerBackPane';
			}
			else if (k.startsWith('Vah')) {
				var name = k.split(' ').slice(0, 2).join('_').toLowerCase();
				icon = L.icon({
					iconUrl: 'icons/' + name + '.png',
					iconSize:     [20, 20],
					iconAnchor:   [10, 10],
				});
				zOffset = 5000;
			}
			else if (k.startsWith('Memory')) {
				icon = memoryIcon;
				zOffset = 5000;
			}
			else if (k == 'Shrine of Resurrection') {
				icon = L.icon({
					iconUrl: 'icons/sor.png',
					iconSize:     [20, 20],
					iconAnchor:   [10, 10],
				});
				zOffset = 5000;
			}
			else if (k.startsWith('Zora Monument')) {
				icon = monumentIcon;
				zOffset = -1000;
				//pane = 'markerBackPane';
			}
			else if (k.endsWith('Tech Lab')) {
				icon = techLabIcon;
				zOffset = -1000;
			}
			else if (k == 'Paraglider' || k == 'Thunder Helm') {
				icon = starIcon;
				zOffset = -1000;
			}
			else {
				icon = dialogIcon;
				zOffset = -1000;
			}
			let marker = L.marker([-data[k][2], data[k][0]], {icon: icon, zIndexOffset : zOffset, keyboard: false, pane : pane});
			marker.addTo(markers).bindTooltip(k, { className : 'no-background-tooltip' });
			if (g_markerMapping[k])
				throw 'multiple markers with same name \'' + k + '\'';
			g_markerMapping[k] = {marker: marker, count: 0};
		}

		g_map.on('click', function(e) {
			var dropdownContent = L.DomUtil.get('runlist-dropdown');
			dropdownContent.style.display = 'none';
		});
		
		fetchDB();
	})
	.catch(error => {
		console.log('Cannot load map elements' + error);
	});
}

function createMovePolyline(latLngs, from, to) {
	let path = L.polyline(latLngs, {
		"weight": 3,
		"color": 'khaki',
		"opacity": 1,
		"pane": 'movesPane',
	}).addTo(g_map);
	path.on('mouseover', function(e) {
		path.setStyle({weight: 5});
		// if (to)
		// 	g_markerMapping[to].marker.openTooltip();
		// if (!from.startsWith('Vah') || from.endsWith('(Tamed)'))
		// 	g_markerMapping[from].marker.openTooltip();
	});
	path.on('mouseout', function(e) {
		path.setStyle({weight: 3});
		// if (to)
		// 	g_markerMapping[to].marker.closeTooltip();
		// if (!from.startsWith('Vah') || from.endsWith('(Tamed)'))
		// 	g_markerMapping[from].marker.closeTooltip();
	});

	g_map.getRenderer(path).options.padding = 1;
	return path;
}

function AdjustPositionAfterDivineBeast(label)
{
	// link warps automatically after a divine beast
	// adjust the starting position of the next movement accordingly
	if (label == 'Vah Medoh')
		return L.latLng(1802.698, -3590.5625);
	else if (label == 'Vah Naboris')
		return L.latLng(-2861.727, -3782.125);
	else if (label == 'Vah Ruta')
		return L.latLng(430.644, 3283.5);
	else if (label == 'Vah Rudania')
		return L.latLng(2424.264, 1583.75);

	return g_markerMapping[label].marker.getLatLng();
}

function highlightRun(runUID) {
	if (g_highlightedRun != runUID)
		g_highlightedRun = runUID;
	else
		g_highlightedRun = null;

	let lightGrayHalfTransparent = {
		color: 'dimgray',
		opacity: 0.6,
	};
	let khakiOpaque = {
		color: 'khaki',
		opacity: 1,
	};
	let defaultColor = g_highlightedRun ? lightGrayHalfTransparent : khakiOpaque;

	for (const [from, tos] of Object.entries(g_movePaths))
		for (const [to, path] of Object.entries(tos))
			path.setStyle(defaultColor);
	for (const [from, path] of Object.entries(g_warpMovePaths))
		path.setStyle(defaultColor);

	if (g_highlightedRun)
		highlightMovesInRun(runUID);

	var runListButton = L.DomUtil.get('runlist-button');
	runListButton.textContent = (g_highlightedRun == null ? 'Select Run' : 'Run: ' + g_highlightedRun) + ' ▼';
}

function highlightMovesInRun(runUID) {
	let colors = [
		{ color: 'dodgerblue', opacity: 1, },
		{ color: 'red', opacity: 1, },
		{ color: 'magenta', opacity: 1, },
		{ color: 'greenyellow', opacity: 1, },
		{ color: 'aqua', opacity: 1, },
		{ color: 'white', opacity: 1, },
		{ color: 'orange', opacity: 1, },
		{ color: 'gold', opacity: 1, },
		{ color: 'rgb(167, 132, 255)', opacity: 1},
		{ color: 'black', opacity: 1, },
	];
	let curColorIdx = 0;

	if (!g_runs[runUID])
		return;
	const events = g_runs[runUID].events;
	for (let evtIdx = 0; evtIdx < events.length; evtIdx++) {
		let last = evtIdx == 0 ? "Shrine of Resurrection" : events[evtIdx - 1].label;
		let cur = events[evtIdx].label;
		let isWarp = events[evtIdx].type == 'Warp';
		if (isWarp) {
			if (g_warpMovePaths[last]) {
				g_warpMovePaths[last].setStyle(colors[curColorIdx]);
				g_warpMovePaths[last].bringToFront();
			}
			curColorIdx = (curColorIdx + 1) % colors.length;
		}
		else {
			if (g_movePaths[last] && g_movePaths[last][cur]) {
				g_movePaths[last][cur].setStyle(colors[curColorIdx]);
				g_movePaths[last][cur].bringToFront();
			}
			else if (g_movePaths[cur] && g_movePaths[cur][last]) {
				g_movePaths[cur][last].setStyle(colors[curColorIdx]);
				g_movePaths[cur][last].bringToFront();
			}
			if (cur.startsWith('Vah') && !cur.endsWith('(Tamed)'))
				curColorIdx = (curColorIdx + 1) % colors.length;
		}
	}
}

async function addMovesToMap() {
	// movements
	for (const [from, tos] of Object.entries(g_moves)) {
		for (const [to, moves] of Object.entries(tos)) {
			if (g_moves[to] && g_moves[to][from] && to < from && !from.startsWith("Vah") && !to.startsWith("Vah"))
				continue;
			let latLngs = [AdjustPositionAfterDivineBeast(from), g_markerMapping[to].marker.getLatLng()];
			let path = createMovePolyline(latLngs, from, to);

			path.on('click', function(e) {
				let htmlContent = createHTMLContentForMovePopup(from, to, g_moves[from][to]);
				if (!from.startsWith("Vah") && !to.startsWith("Vah") && g_moves[to] && g_moves[to][from])
					htmlContent += '<br>' + createHTMLContentForMovePopup(to, from, g_moves[to][from]);
				L.popup(e.latlng, {content: htmlContent}).openOn(g_map);
	
				g_markerMapping[to].marker.openTooltip();
				if (!from.startsWith('Vah') || from.endsWith('(Tamed)'))
					g_markerMapping[from].marker.openTooltip();
			});
			if (!g_movePaths[from])
				g_movePaths[from] = {};
			g_movePaths[from][to] = path;
		}
	}

	// warp movements
	for (const [from, tos] of Object.entries(g_warpMoves)) {
		if (Object.keys(tos).length) {
			let latLngs = [AdjustPositionAfterDivineBeast(from)];
			latLngs.push(L.latLng(latLngs[0].lat + 100, latLngs[0].lng));

			let path = createMovePolyline(latLngs, from);
			path.setStyle({
				dashArray: '10, 5'
			});
			path.on('click', function(e) {
				let htmlContent = '';
				for (const [to, moves] of Object.entries(tos)) {
					if (htmlContent.length)
						htmlContent += '<br>';
					htmlContent += createHTMLContentForMovePopup(from, to, g_warpMoves[from][to]);
				}
				L.popup(e.latlng, {content: htmlContent}).openOn(g_map);

				if (!from.startsWith('Vah') || from.endsWith('(Tamed)'))
					g_markerMapping[from].marker.openTooltip();
				for (const [to, moves] of Object.entries(tos))
					g_markerMapping[to].marker.openTooltip();
			});
			g_warpMovePaths[from] = path;
		}
	}

	// single label movements (e.g. shrines, divine beasts)
	for (const [label, moves] of Object.entries(g_singleLabelMoves)) {
		g_markerMapping[label].marker.on('click', function(e) {
			let htmlContent = createHTMLContentForSingleLabelMovePopup(label, moves);
			L.popup(g_markerMapping[label].marker.getLatLng(), {content: htmlContent, maxWidth: 600}).openOn(g_map);
		});

	}
}

initMap();
