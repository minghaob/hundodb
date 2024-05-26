let g_runs = {};		// uid -> runDoc
let g_moves = {};		// from -> { to -> [{ runUID, eventIdx, numFrame }, ... (sorted by numFrame decreasing order) ]]}

function addMove(from, to, runUID, eventIdx, numFrame) {
	if (!g_moves[from])
		g_moves[from] = {};
	if (!g_moves[from][to])
		g_moves[from][to] = [];
	let arr = g_moves[from][to];
	arr.push({
		runUID : runUID,
		eventIdx : eventIdx,
		numFrame : numFrame
	});
	for (let cur = arr.length - 1;
		cur > 0	&& (
			arr[cur].numFrame < arr[cur - 1].numFrame
		|| (arr[cur].numFrame == arr[cur - 1].numFrame && arr[cur].runUID < arr[cur - 1].runUID)
		)
		; cur--) {
			[arr[cur], arr[cur - 1]] = [arr[cur - 1], arr[cur]];
	}
}

function frameToVideoLinkAndCompareLinkParam(runUID, frame) {
	let run = g_runs[runUID];
	if (!run)
		return null;
	
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

	return 'null1';
}

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
                            let last = evtIdx == 0 ? "" : events[evtIdx - 1].label;
                            let cur = events[evtIdx].label;
							let numFrame = evtIdx == 0 ? events[evtIdx].frame : events[evtIdx].frame - events[evtIdx - 1].frame;
							addMove(last, cur, runDoc.uid, evtIdx, numFrame);
                        }
                        numProcessedRuns++;
                        numLoadedRuns++;
                        if (numProcessedRuns == numTotalRuns) {
                            console.log("Loaded " + numLoadedRuns + " runs from HundoDB");
							addMovesToMap();
						}
                    })
                    .catch(error => {
                        console.log("Cannot load " + hdbRunsURL + file + ": " + error);
                        numProcessedRuns++;
                        if (numProcessedRuns == numTotalRuns) {
                            console.log("Loaded " + numLoadedRuns + " runs from HundoDB");
							addMovesToMap();
						}
                    });
            }
        });
    })
    .catch (error => {
        console.log("Error fetching HundoDB runs: " + error);
    });
