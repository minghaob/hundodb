function syncDBToComparePane() {
	let compareNode = document.getElementById("compare_select");
	let withNode = document.getElementById("with_select");
	var runIds = Object.keys(g_runs);
	runIds.sort(function(a,b){
		return g_runs[a].events.at(-1).frame[1] - g_runs[b].events.at(-1).frame[1];
	});
	for (const runId of runIds) {
		compareNode.append(new Option(runId, runId));
		withNode.append(new Option(runId, runId));
	}
}

function getCompareResultFromMoveRecords(compareRunUID, withRunUID, records) {
	let withCommunityBest = withRunUID == 'communitybest';
	let compareFrame = 0;
	let withFrame = 0;
	if (records.length > 1) {
		for (let i = 0; i < records.length; i++) {
			if (records[i].runUID == compareRunUID)
				compareFrame = records[i].numFrame;
			if (withCommunityBest) {
				if (withFrame == 0 && records[i].runUID != compareRunUID)
					withFrame = records[i].numFrame;
			}
			else {
				if (records[i].runUID == withRunUID)
					withFrame = records[i].numFrame;
			}
		}
	}

	return {
		compareFrame : compareFrame,
		withFrame: withFrame,
		isFastest: compareFrame == records[0].numFrame,
	}
}

function labelToClass(label) {
	if (label.endsWith('Shrine'))
		return 'shrine';
	else if (label.endsWith('Tower'))
		return 'tower';
	else if (label.startsWith('Vah'))
		return 'divinebeast';
	else if (label.startsWith('Memory'))
		return 'memory';
	else if (label.length == 3 && label[1] >= '0' && label[1] <= '9' && label[2] >= '0' && label[2] <= '9')
		return 'korok';
	else if (label.startsWith('Zora Monument'))
		return 'monument';
	else if (label.endsWith('Tech Lab'))
		return 'keyitem';
	else if (label == 'Shrine of Resurrection')
		return 'keyitem';
	else if (label == 'Paraglider')
		return 'keyitem';
	else if (label == 'Thunder Helm')
		return 'keyitem';
	else
		return 'npc';
}

function labelToDivWithclass(label) {
	return '<span class="' + labelToClass(label) + '">' + label + '</span>'
}

function onCompareRunChange() {
	let compareRunUID = document.getElementById("compare_select").value;
	if (g_highlightedRun != compareRunUID)
		highlightRun(compareRunUID);
	updateComparePaneTable();
}

function updateComparePaneTable() {
	let compareRunUID = document.getElementById("compare_select").value;
	let withRunUID = document.getElementById("with_select").value;
	let tableNode = document.getElementById("compare_table");

	tableNode.innerHTML = '';

	if (!compareRunUID || !withRunUID)
		return;

	let runDoc = g_runs[compareRunUID];
	const events = runDoc.events;
	let compareResults = [];
	for (let evtIdx = 0; evtIdx < events.length; evtIdx++) {
		let last = evtIdx == 0 ? "Shrine of Resurrection" : events[evtIdx - 1].label;
		let cur = events[evtIdx].label;
		let isWarp = events[evtIdx].type == 'Warp';
		
		{
			let res = getCompareResultFromMoveRecords(compareRunUID, withRunUID, isWarp ? g_warpMoves[last][cur] : g_moves[last][cur]);
			res.text = labelToDivWithclass(last) + ' &#45;&gt; ' + labelToDivWithclass(cur);
			res.origIdx = compareResults.length;
			if (isWarp)
				res.polyline = g_warpMovePaths[last];
			else {
				if (g_movePaths[last] && g_movePaths[last][cur])
					res.polyline = g_movePaths[last][cur];
				else if (g_movePaths[cur] && g_movePaths[cur][last])
					res.polyline = g_movePaths[cur][last];
			}
			compareResults.push(res);
		}

		if (events[evtIdx].segments) {
			let res = getCompareResultFromMoveRecords(compareRunUID, withRunUID, g_singleLabelMoves[cur].records);
			res.text = labelToDivWithclass(cur);
			res.origIdx = compareResults.length;
			res.marker = g_markerMapping[cur].marker;
			compareResults.push(res);
		}
	}

	if (document.getElementById("compare_sort").checked) {
		compareResults.sort(function(a,b){
			if (a.withFrame != 0 && b.withFrame != 0) {
				let aDif = a.compareFrame - a.withFrame;
				let bDif = b.compareFrame - b.withFrame;
				if (aDif != bDif)
					return bDif - aDif;
				if (a.isFastest != b.isFastest)
					return a.isFastest;
				return a.origIdx - b.origIdx;
			}
			if (a.withFrame == 0 && b.withFrame != 0)
				return 1;
			if (a.withFrame != 0 && b.withFrame == 0)
				return -1;
			return a.origIdx - b.origIdx;
		});
	}

	for (let idx = 0; idx < compareResults.length; idx++) {
		let res = compareResults[idx];
		let newRow = tableNode.insertRow(-1);
		let cell0 = newRow.insertCell(-1);
		cell0.innerHTML = '<span>' + res.text + '</span>';
		cell0.style.textAlign = 'left';
		cell0.classList.add("movement");
		let span = cell0.querySelector('span');
		span.onclick = function () {
			if (res.marker) {
				res.marker.openPopup();
				g_map.panTo(res.marker.getLatLng());
			}
			else if (res.polyline) {
				res.polyline.openPopup();
				g_map.fitBounds(res.polyline.getBounds(), { maxZoom : g_map.getZoom() });
				//g_map.panTo(res.polyline.getBounds().getCenter());
			}
		}
		
		let cell1 = newRow.insertCell(-1);
		cell1.style.textAlign = 'right';
		if (res.withFrame == 0) {
			cell1.innerHTML = '-';
			cell1.classList.add('na');
		}
		else if (res.compareFrame == res.withFrame) {
			cell1.innerHTML = '0.00';
			if (res.isFastest)
				cell1.classList.add('fastest');	
		}
		else if (res.compareFrame > res.withFrame) {
			cell1.innerHTML = '+' + frameIdxToTime(res.compareFrame - res.withFrame);
			cell1.classList.add('slower');
		}
		else {
			cell1.innerHTML = '-' + frameIdxToTime(res.withFrame - res.compareFrame);
			if (res.isFastest)
				cell1.classList.add('fastest');	
			else
				cell1.classList.add('faster');
		}

	}
}