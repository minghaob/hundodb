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
	var techLabIcon = L.icon({
		iconUrl: 'icons/techlab.png',
		iconSize:     [20, 20],
		iconAnchor:   [10, 10],
	});

	g_map.createPane('movesPane').style.zIndex = 450;
	g_map.createPane('markerFrontPane').style.zIndex = 500;
	g_map.createPane('markerBackPane').style.zIndex = 400;

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
				zOffset = data[k].Y;
				pane = 'markerBackPane';
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
				pane = 'markerBackPane';
			}
			else if (k.endsWith('Tech Lab')) {
				icon = techLabIcon;
				zOffset = -1000;
			}
			else
				continue;
			let marker = L.marker([-data[k].Z, data[k].X], {icon: icon, zIndexOffset : zOffset, keyboard: false, pane : pane});
			marker.addTo(markers).bindTooltip(k, { className : 'no-background-tooltip' });
			if (g_markerMapping[k])
				throw 'multiple markers with same name \'' + k + '\'';
			g_markerMapping[k] = {marker: marker, count: 0};
		}

		fetchDB();
	})
	.catch(error => {
		console.log('Cannot load map elements' + error);
	});
}

function createHTMLContentForMovePopup(from, to, moves) {
	let htmlContent = '';
	let mergedCompareLinkParam = '';
	for (let i = 0; i < moves.length; i++) {
		let frame = moves[i].startEventIdx == -1 ? 0 : g_runs[moves[i].runUID].events[moves[i].startEventIdx].frame[1];
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
		`<div style = "font-weight: bold">` + from + ' --> ' + to + `</div>
		<table class="move-table">
			<thead><tr>
				<th></th>
				<th style="width:30px"><a href = "` + compareLink + `" target = "_blank" class="header">Time</a></th>
				<th>Run</th>
			</tr></thead>`
		+ htmlContent
		+ `</table>`;
	return htmlContent;
}

function createHTMLContentForSingleLabelMovePopup(label, moves) {
	let htmlContent = '';
	let mergedCompareLinkParam = '';
	let mergedSegmentCompareLinkParam = new Array(moves.segNames.length).fill('');
	for (let i = 0; i < moves.records.length; i++) {
		let record = moves.records[i];
		{
			let frame = g_runs[record.runUID].events[record.eventIdx].frame[0];
			let [videoLink, compareLinkParam] = frameToVideoLinkAndCompareLinkParam(record.runUID, frame);
			let link = '<a href = "' + videoLink + '" target = "_blank">' + frameIdxToTime(record.numFrame) + '</a>';
			htmlContent += "<tr><td>" + (i + 1) + "</td><td>" + link + "</td><td>" + record.runUID + "</td>";
			if (compareLinkParam) {
				if (mergedCompareLinkParam.length)
					mergedCompareLinkParam += '&';
				mergedCompareLinkParam += compareLinkParam;
			}
		}
		for (let j = 0; j < record.segFrames.length; j++) {
			let segFrame = record.segFrames[j];
			let frame = j == 0 ? g_runs[record.runUID].events[record.eventIdx].frame[0] : g_runs[record.runUID].events[record.eventIdx].segments[j - 1][0];
			let [videoLink, compareLinkParam] = frameToVideoLinkAndCompareLinkParam(record.runUID, frame);
			let link = '<a href = "' + videoLink + '" target = "_blank">' + frameIdxToTime(segFrame) + '</a>';
			htmlContent += '<td>' + link + '</td>';
			if (compareLinkParam) {
				if (mergedSegmentCompareLinkParam[j].length)
					mergedSegmentCompareLinkParam[j] += '&';
				mergedSegmentCompareLinkParam[j] += compareLinkParam;
			}			
		}
		htmlContent += '</tr>';
	}
	let segmentsHeader = '';
	for (let i = 0; i < moves.segNames.length; i++) {
		let compareLink = 'https://viewsync.net/watch?' + mergedSegmentCompareLinkParam[i];
		segmentsHeader += '<th><a href = "' + compareLink + '" target = "_blank" class="header">' +  moves.segNames[i] + '</a></th>';
	}
	let compareLink = 'https://viewsync.net/watch?' + mergedCompareLinkParam;
	htmlContent = 
		`<div style = "font-weight: bold">` + label + `</div>
		<table class="move-table">
			<thead><tr>
				<th></th>
				<th><a href = "` + compareLink + `" target = "_blank" class="header">Time</a></th>
				<th>Run</th>`
		+ segmentsHeader
		+ `</tr></thead>`
		+ htmlContent
		+ `</table>`;
	return htmlContent;
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
	return path;
}

function AdjustPositionAfterDivineBeast(label)
{
	// link warps automatically after a divine beast
	// adjust the starting position of the next movement accordingly
	if (label == 'Vah Medoh')
		return [1802.698, -3590.5625];
	else if (label == 'Vah Naboris')
		return [-2861.727, -3782.125];
	else if (label == 'Vah Ruta')
		return [430.644, 3283.5];
	else if (label == 'Vah Rudania')
		return [2424.264, 1583.75];

	return g_markerMapping[label].marker.getLatLng();
}

async function addMovesToMap() {
	// movements
	for (const [from, tos] of Object.entries(g_moves)) {
		for (const [to, moves] of Object.entries(tos)) {
			if (g_moves[to] && g_moves[to][from] && to < from && !from.startsWith("Vah") && !to.startsWith("Vah"))
				continue;
			let latLngs = [AdjustPositionAfterDivineBeast(from), g_markerMapping[to].marker.getLatLng()];
			let path = createMovePolyline(latLngs, from, to);

			let htmlContent = createHTMLContentForMovePopup(from, to, g_moves[from][to]);
			if (!from.startsWith("Vah") && !to.startsWith("Vah") && g_moves[to] && g_moves[to][from])
				htmlContent += '<br>' + createHTMLContentForMovePopup(to, from, g_moves[to][from]);
			path.bindPopup(htmlContent);
			path.on('click', function(e) {
				g_markerMapping[to].marker.openTooltip();
				if (!from.startsWith('Vah') || from.endsWith('(Tamed)'))
					g_markerMapping[from].marker.openTooltip();
			});
		}
	}

	// warp movements
	for (const [from, tos] of Object.entries(g_warpMoves)) {
		let htmlContent = '';
		for (const [to, moves] of Object.entries(tos)) {
			if (htmlContent.length)
				htmlContent += '<br>';
			htmlContent += createHTMLContentForMovePopup(from, to, g_warpMoves[from][to]);
		}

		if (htmlContent.length) {
			let latLngs = [AdjustPositionAfterDivineBeast(from)];
			latLngs.push(L.latLng(latLngs[0].lat + 100, latLngs[0].lng));

			let path = createMovePolyline(latLngs, from);
			path.setStyle({
				dashArray: '10, 5'
			});
			path.bindPopup(htmlContent);
			path.on('click', function(e) {
				if (!from.startsWith('Vah') || from.endsWith('(Tamed)'))
					g_markerMapping[from].marker.openTooltip();
			});
		}
	}

	// single label movements (e.g. shrines, divine beasts)
	for (const [label, moves] of Object.entries(g_singleLabelMoves)) {
		let htmlContent = createHTMLContentForSingleLabelMovePopup(label, moves);
		g_markerMapping[label].marker.bindPopup(htmlContent, { maxWidth : 500});
	}
}

initMap();
