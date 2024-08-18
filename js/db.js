let g_runs = {};				// uid -> runDoc
let g_moves = {};				// from -> { to -> [{ runUID, startEventIdx, endEventIdx, numFrame}, ... (sorted by numFrame decreasing order) ]]}
let g_warpMoves = {};			// same format as g_moves but ends on a travel
let g_singleLabelMoves = {};	// label -> {segNames, records : [{runUID, eventIdx, segFrames : [segFrames ...]}, ...] }

function addMove(from, to, isTravel, runUID, startEventIdx, endEventIdx, numFrame) {
	let moves = isTravel ? g_warpMoves : g_moves;
	if (!moves[from])
		moves[from] = {};
	if (!moves[from][to])
		moves[from][to] = [];

	let newElement = {
		runUID : runUID,
		startEventIdx : startEventIdx,
		endEventIdx : endEventIdx,
		numFrame : numFrame
	};

	let arr = moves[from][to];
	let index = arr.findIndex(obj => obj.numFrame > newElement.numFrame);
	if (index == -1)
		arr.push(newElement);
	else
		arr.splice(index, 0, newElement);
}

function addSingleLabelMove(label, runUID, eventIdx, numFrame) {
	let segNames = g_runs[runUID].events[eventIdx].segments.map(subArray => subArray[1]);
	
	if (!g_singleLabelMoves[label]) {
		g_singleLabelMoves[label] = { segNames: segNames, records : [] };
	}
	else {
		let exisitingSegNames = g_singleLabelMoves[label].segNames;
		if (segNames.length != exisitingSegNames.length || !segNames.every((value, index) => value == exisitingSegNames[index])) {
			console.log("segment names missmatch for", label, ':' ,segNames, exisitingSegNames);
			return;
		}
	}

	let segFrames = g_runs[runUID].events[eventIdx].segments.map(subArray => subArray[0]);
	segFrames = segFrames.map((value, index) => index == 0 ? value - g_runs[runUID].events[eventIdx].frame[0] + 1 : value - segFrames[index - 1]);

	let newElement = {
		runUID : runUID,
		eventIdx : eventIdx,
		numFrame : numFrame,
		segFrames : segFrames,
	};

	let arr = g_singleLabelMoves[label].records;
	let index = arr.findIndex(obj => obj.numFrame > newElement.numFrame);
	if (index == -1)
		arr.push(newElement);
	else
		arr.splice(index, 0, newElement);
}

function frameToVideoLinkAndCompareLinkParam(runUID, frame) {
	let run = g_runs[runUID];
	if (!run)
		return [null, null];
	
	for (let vidIdx = 0; vidIdx < run.videos.length; vidIdx++) {
		for (let segIdx = 0; segIdx < run.videos[vidIdx].segments.length; segIdx++) {
			let seg = run.videos[vidIdx].segments[segIdx];
			if (frame <= seg[1] - seg[0]) {
				let t = Math.floor((seg[0] + frame) / 30);
				let remote = run.videos[vidIdx].remote;
				let videoLink = remote + '?t=' + t;
				let compareLinkParam = 'v=' + remote.substring(remote.lastIndexOf('/') + 1) + '&t=' + t;
				return [videoLink, compareLinkParam];
			}
			frame -= seg[1] - seg[0] + 1;
		}
	}

	return [null, null];
}

function onDBFetched() {
	addMovesToMap();
	syncDBToComparePane();
}

function fetchDB() {
	const hdbRunsURL = 'runs/';
	fetch(hdbRunsURL + 'list.txt')
		.then(response => response.text())
		.then(text => {
			const files = text.split('\n');

			let numTotalRuns = 0;
			let numProcessedRuns = 0;
			let numLoadedRuns = 0;
			files.forEach(file => {
				if (file.length > 0)
					numTotalRuns++;
			});
			if (files.length >0)
				console.log("Loading " + numTotalRuns + " runs from HundoDB");
			files.forEach((file) => {
				if (file.length > 0) {
					fetch(hdbRunsURL + file)
						.then(response => response.text())
						.then(text => {
							let runDoc = jsyaml.load(text);
							if (g_runs[runDoc.uid])
								throw("run uid " + uid + " already used.");
							g_runs[runDoc.uid] = runDoc;
							const events = runDoc.events;
							for (let evtIdx = 0; evtIdx < events.length; evtIdx++) {
								let last = evtIdx == 0 ? "Shrine of Resurrection" : events[evtIdx - 1].label;
								let cur = events[evtIdx].label;
								let numFrame = evtIdx == 0 ? events[evtIdx].frame[0] : events[evtIdx].frame[0] - events[evtIdx - 1].frame[1];
								let startEventIdx = evtIdx - 1;
								addMove(last, cur, events[evtIdx].type == 'Warp', runDoc.uid, startEventIdx, evtIdx, numFrame);
								if (events[evtIdx].segments) {
									addSingleLabelMove(cur, runDoc.uid, evtIdx, events[evtIdx].frame[1] - events[evtIdx].frame[0] + 1);
								}
							}
							numProcessedRuns++;
							numLoadedRuns++;
							if (numProcessedRuns == numTotalRuns) {
								console.log("Loaded " + numLoadedRuns + " runs from HundoDB");
								onDBFetched();
							}
						})
						.catch(error => {
							console.log("Cannot load " + hdbRunsURL + file + ": " + error);
							numProcessedRuns++;
							if (numProcessedRuns == numTotalRuns) {
								console.log("Loaded " + numLoadedRuns + " runs from HundoDB");
								onDBFetched();
							}
						});
				}
			});
		})
		.catch (error => {
			console.log("Error fetching HundoDB runs: " + error);
		});
}