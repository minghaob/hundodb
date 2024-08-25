function createHTMLContentForMovePopup(from, to, moves) {
	let htmlContent = '';
	let linkParams = [];
	for (let i = 0; i < moves.length; i++) {
		let frame = moves[i].startEventIdx == -1 ? 0 : g_runs[moves[i].runUID].events[moves[i].startEventIdx].frame[1];
		let [videoLink, compareLinkParam] = frameToVideoLinkAndCompareLinkParam(moves[i].runUID, frame);
		let link = '<a href = "' + videoLink + '" target = "_blank">' + (i > 0 ? '+' + frameIdxToTime(moves[i].numFrame - moves[0].numFrame) : frameIdxToTime(moves[i].numFrame)) + '</a>';
		htmlContent += '<tr runUID="' + moves[i].runUID + '" ' + (moves[i].runUID == g_highlightedRun ? 'class = "highlighted-row"' : '')
			+ '><td class = "rank-cell" onclick="onClickRankCell(event, this)" onauxclick="ignoreEvent(event)"><a href="#" onclick="onClickRankCell(event, this)" onauxclick="ignoreEvent(event)">'
			+ (i + 1) + "</a></td><td>" + link + '</td><td><a href="#" onclick="onClickRunCellText(event, this)" onauxclick="ignoreEvent(event)">' + moves[i].runUID + "</a></td></tr>";
		linkParams.push(compareLinkParam ? compareLinkParam : '');
	}
	htmlContent = 
		`<div style = "font-weight: bold">` + from + ' --> ' + to + `</div>
		<table class="move-table">
			<thead><tr>
				<th></th>
				<th style="width:30px"><a target = "_blank" class="header" data-linkparams=` + JSON.stringify(linkParams) + `>Time</a></th>
				<th>Run</th>
			</tr></thead>
			<tbody>`
		+ htmlContent
		+ `</tbody>
		</table>`;
	return htmlContent;
}

function createHTMLContentForSingleLabelMovePopup(label, moves) {
	let htmlContent = '';
	let linkParams = [];
	let segmentLinkParams = Array(moves.segNames.length).fill().map(() => []);

	let segFastestRecordIndex = new Array(moves.segNames.length).fill(0);
	for (let i = 1; i < moves.records.length; i++) {
		for (let j = 0; j < moves.records[i].segFrames.length; j++) {
			if (moves.records[i].segFrames[j] < moves.records[segFastestRecordIndex[j]].segFrames[j])
				segFastestRecordIndex[j] = i;
		}
	}
	for (let i = 0; i < moves.records.length; i++) {
		let record = moves.records[i];
		{
			let frame = g_runs[record.runUID].events[record.eventIdx].frame[0];
			let [videoLink, compareLinkParam] = frameToVideoLinkAndCompareLinkParam(record.runUID, frame);
			let link = '<a href = "' + videoLink + '" target = "_blank">' + (i > 0 ? '+' + frameIdxToTime(record.numFrame - moves.records[0].numFrame) : frameIdxToTime(record.numFrame)) + '</a>';
			htmlContent += '<tr runUID="' + record.runUID + '" ' + (record.runUID == g_highlightedRun ? 'class = "highlighted-row"' : '')
				+ '"><td class = "rank-cell" onclick="onClickRankCell(event, this)" onauxclick="ignoreEvent(event)"><a href="#" onclick="onClickRankCell(event, this)" onauxclick="ignoreEvent(event)">'
				+ (i + 1) + "</td><td>" + link + '</td><td><a href="#" onclick="onClickRunCellText(event, this)" onauxclick="ignoreEvent(event)">' + record.runUID + "</a></td>";
			linkParams.push(compareLinkParam ? compareLinkParam : '');
		}
		for (let j = 0; j < record.segFrames.length; j++) {
			let segFrame = record.segFrames[j];
			let frame = j == 0 ? g_runs[record.runUID].events[record.eventIdx].frame[0] : g_runs[record.runUID].events[record.eventIdx].segments[j - 1][0];
			let [videoLink, compareLinkParam] = frameToVideoLinkAndCompareLinkParam(record.runUID, frame);
			let text = (i != segFastestRecordIndex[j] ? '+' + frameIdxToTime(segFrame - moves.records[segFastestRecordIndex[j]].segFrames[j]): frameIdxToTime(segFrame));
			let colorText = (i != segFastestRecordIndex[j] ? '' : ' style = "color: peru;"');
			let link = '<a href = "' + videoLink + '" target = "_blank"' + colorText + '>' + text + '</a>';
			htmlContent += '<td>' + link + '</td>';
			segmentLinkParams[j].push(compareLinkParam ? compareLinkParam : '');
		}
		htmlContent += '</tr>';
	}
	let segmentsHeader = '';
	for (let i = 0; i < moves.segNames.length; i++) {
		segmentsHeader += '<th><a target = "_blank" class="header" data-linkparams=' + JSON.stringify(segmentLinkParams[i]) + '>' +  moves.segNames[i] + '</a></th>';
	}
	htmlContent = 
		`<div style = "font-weight: bold">` + label + `</div>
		<table class="move-table">
			<thead><tr>
				<th></th>
				<th><a target="_blank" class="header" data-linkparams=` + JSON.stringify(linkParams) + `>Time</a></th>
				<th>Run</th>`
		+ segmentsHeader
		+ `</tr></thead>
			<tbody>`
		+ htmlContent
		+ `</tbody
		</table>`;
	return htmlContent;
}


function onClickRunCellText(event, cell) {
	highlightRun(cell.textContent);
	let container = cell.parentNode.parentNode.parentNode.parentNode.parentNode;		// a -> td -> tr -> tbody -> table -> popup
	let rows = container.querySelectorAll('table.move-table tr');
	rows.forEach(function (row) {
		if (row.getAttribute('runUID') == g_highlightedRun)
			row.classList.add("highlighted-row");
		else
			row.classList.remove("highlighted-row");
	});

	event.preventDefault();
}

function onClickRankCell(event, cell) {
	if (cell.tagName !== 'TD')
		cell = cell.parentNode;
	cell.classList.toggle("selected-rank-cell");
	let tbody = cell.parentNode.parentNode;
	let selectedRows = [];
	for (let i = 0; i < tbody.rows.length; i++)
		if (tbody.rows[i].cells[0].classList.contains("selected-rank-cell"))
			selectedRows.push(i);
	let color = window.getComputedStyle(tbody.rows[0].cells[0].getElementsByTagName('a')[0]).color;		// get link color
	let headrow = tbody.parentNode.querySelector('thead').rows[0];
	for (let i = 0; i < headrow.cells.length; i++) {
		let aNode = headrow.cells[i].querySelector('a');
		if (aNode) {
			let linkParamsJson = aNode.getAttribute('data-linkparams');
			if (linkParamsJson) {
				let linkParams = JSON.parse(linkParamsJson);
				let mergedLinkParams = '';
				for (let j = 0; j < selectedRows.length; j++) {
					if (mergedLinkParams.length)
						mergedLinkParams += '&';
					mergedLinkParams += linkParams[selectedRows[j]];
				}
				if (mergedLinkParams.length) {
					let link = 'https://viewsync.net/watch?' + mergedLinkParams;
					aNode.href = link;
					aNode.classList.add('header-clickable');
					aNode.style.color = color;
				}
				else {
					aNode.removeAttribute('href');
					aNode.classList.remove('header-clickable');
					aNode.style.color = 'inherit';
				}
			}
		}
	}

	event.preventDefault();
	event.stopPropagation();
}

function ignoreEvent(event) {
	event.preventDefault();
}

function selectRunsInPopup(selection) {
	let moveTables = document.getElementsByClassName("move-table");
	for (table of moveTables) {
		for (let i = 1; i < table.rows.length; i++) {
			let rowRunUID = table.rows[i].getAttribute('runUID');
			if (rowRunUID && selection.includes(rowRunUID) && !table.rows[i].cells[0].classList.contains("selected-rank-cell"))
				table.rows[i].cells[0].click();
		}
	}
}
