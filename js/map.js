let g_map;
let g_markerMapping = {};			// A mapping from marker tooltip string to {marker, count}, where marker is the handle and count is the number of events that this marker is assigned to

function initMap() {
	g_map = L.map('map', {
		minZoom: -3,
		maxZoom: 4,
		center: [0, 0],
		zoom: -3,
		maxBoundsViscosity: 1,
		crs: L.CRS.Simple
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
				zOffset = data[k].Y;
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
			else if (k.startsWith('ZoraMonument')) {
				icon = monumentIcon;
				zOffset = -1000;
			}
			else
				continue;
			let marker = L.marker([-data[k].Z, data[k].X], {icon: icon, zIndexOffset : zOffset, keyboard: false});
			marker.addTo(markers).bindTooltip(k, { className : 'no-background-tooltip' });
			if (g_markerMapping[k])
				throw 'multiple markers with same name \'' + k + '\'';
			g_markerMapping[k] = {marker: marker, count: 0};
		}
	})
	.catch(error => {
		console.log('Cannot load map elements' + error);
	});
}

function createHTMLContentForMovePopup(from, to) {
	let htmlContent = '';
	let mergedCompareLinkParam = '';
	let moves = g_moves[from][to];
	for (let i = 0; i < moves.length; i++) {
		let frame = moves[i].eventIdx == 0 ? 0 : g_runs[moves[i].runUID].events[moves[i].eventIdx - 1].frame;
		let [videoLink, compareLinkParam] = frameToVideoLinkAndCompareLinkParam(moves[i].runUID, frame);
		let link = '<a href = "' + videoLink + '" target = "_blank">' + frameIdxToTime(moves[i].numFrame) + '</a>';
		htmlContent += "<tr><td>" + (i + 1) + "</td><td>" + link + "</td><td>" + moves[i].runUID + "</td></tr>";
		if (compareLinkParam) {
			if (mergedCompareLinkParam.length)
				mergedCompareLinkParam += '&';
			mergedCompareLinkParam += compareLinkParam;
		}
	}
	let compareLink = 'https://viewsync.net/watch?' + mergedCompareLinkParam;
	htmlContent = 
		`<div style = "font-weight: bold">` + (from ? from : 'SoR') + ' --> ' + to + `</div>
		<table class="move-table">
			<thead><tr>
				<th><button title="Compare" onclick="window.open('` + compareLink + `', '_blank')"` + `>C</button></th>
				<th>Time</th>
				<th>Run</th>
			</tr></thead>`
		+ htmlContent
		+ `<tr></tr>
		</table>`;
	return htmlContent;
}

async function addMovesToMap() {
	for (const [from, tos] of Object.entries(g_moves)) {
		for (const [to, moves] of Object.entries(tos)) {
			if (g_moves[to][from] && to < from)
				continue;
			let latLngs = [g_markerMapping[from.length > 0 ? from : "Shrine of Resurrection"].marker.getLatLng(),g_markerMapping[to].marker.getLatLng()];

			let path = L.polyline(latLngs, {
				"weight": 4,
				"color": 'khaki',
				"opacity": 1,
			}).addTo(g_map);
			path.on('mouseover', function(e) {
				path.setStyle({ weight: 6});
			});
			path.on('mouseout', function(e) {
				path.setStyle({ weight: 4});
			});
			{
				let htmlContent = createHTMLContentForMovePopup(from, to);
				if (g_moves[to][from])
					htmlContent += '<br>' + createHTMLContentForMovePopup(to, from);
				path.bindPopup(htmlContent);
			}
		}
	}
}

initMap();
