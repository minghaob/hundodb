let exportSplitOptions = [
	{
		name: 'Shrines',
		format: '{numKorok} - {name}',
		checked: true,
	},
	{
		name: 'Towers',
		format: '{name}',
		checked: true,
	},
	{
		name: 'Divine Beasts',
		format: '{name}',
		checked: true,
	},
	{
		name: 'Enter Divine Beasts',
		format: 'Enter {name}',
		checked: true,
	},
	{
		name: 'Paraglider',
		format: 'Paraglider',
		checked: true,
	},
	{
		name: 'Thunder Helm',
		format: 'Thunder Helm',
		checked: true,
	},
	{
		name: 'Warps',
		format: 'Warp {name}',
		checked: false,
	},
	{
		name: 'Koroks',
		format: '{name}',
		checked: false,
	},
];

function initExportPanel() {
	g_sidebar.addPanel({
		id:   'export',
		tab:  '<i class="fa fa-file-export"></i>',
		title: 'Export',
		pane: '<div id="export_panel_container"></div>',
	});

	let exportPaneContainer = L.DomUtil.get('export_panel_container');
	let exportPaneContent = L.DomUtil.get('export_panel_content');
	exportPaneContainer.appendChild(exportPaneContent);
	exportPaneContent.style.display = 'block';

	let exportOptionsTBody = document.getElementById('export_split_options').querySelector('tbody');

	for (let option of exportSplitOptions) {
		let row = document.createElement('tr');
		let id = 'export_split_' + option.name;
		let id2 = id + '_format';
		row.innerHTML = `<td class="h6">
							<input class="form-check-input" style="margin-top:1px" type="checkbox" id="` + id + `"` + (option.checked ? ' checked' : '') + `>
							<label class="form-check-label" for="` + id + `">` + option.name + `</label>
						</td>
						<td class="h6">
							<input class="form-control" style="height:24px" type="text" id="` + id2 + `" value="` + option.format + `"` + (option.checked ? '' : ' disabled') + `>
						</td>`;
		exportOptionsTBody.appendChild(row);
		let element = document.getElementById(id);
		element.onchange = () => {
			document.getElementById(id2).disabled = !element.checked;
			updateExportLSSButton();
		}
	}

	document.getElementById('export_select').onchange = () => updateExportLSSButton();
	document.getElementById('export_splits').onclick = () => exportLSS();
}

function updateExportLSSButton() {
	let button = document.getElementById('export_splits');
	let exportRunUID = document.getElementById("export_select").value;
	if (!exportRunUID) {
		button.disabled = true;
		return;
	}

	let enable = false;
	for (let option of exportSplitOptions) {
		let id = 'export_split_' + option.name;
		let id2 = id + '_format';
		if (document.getElementById(id).checked) {
			enable = true;
			break;
		}
	}

	button.disabled = !enable;
}

function syncDBToExportPane() {
	let exportNode = document.getElementById("export_select");
	var runIds = Object.keys(g_runs);
	runIds.sort(function(a,b){
		return g_runs[a].events.at(-1).frame[1] - g_runs[b].events.at(-1).frame[1];
	});
	for (const runId of runIds) {
		exportNode.append(new Option(runId, runId));
	}
}

function ResolveFormatString(format, numKorok, name) {
	return format.replace('{numKorok}', numKorok).replace('{name}', name);
}

function exportLSS() {
	let exportRunUID = document.getElementById("export_select").value;

	let formats = {};
	for (let option of exportSplitOptions) {
		let id = 'export_split_' + option.name;
		let id2 = id + '_format';
		if (document.getElementById(id).checked) {
			formats[option.name] = document.getElementById(id2).value;
		}
	}

	let run = g_runs[exportRunUID];
	if (!run)
		return;

	let splits = [];
	let numKorok = 0;
	const events = run.events;
	for (let evtIdx = 0; evtIdx < events.length; evtIdx++) {
		let event = events[evtIdx];
		if (event.type == 'Shrine') {
			let format = formats['Shrines'];
			if (format) {
				splits.push([
					ResolveFormatString(format, numKorok, event.label.slice(0, -7)),
					event.segments[1][0],
				]);
			}
		}
		else if (event.type == 'Tower Activation') {
			let format = formats['Towers'];
			if (format) {
				splits.push([
					ResolveFormatString(format, numKorok, event.label),
					event.frame[0],
				]);
			}
		}
		else if (event.type == 'Medoh' || event.type == 'Naboris' ||event.type == 'Ruta' ||event.type == 'Rudania') {
			let format = formats['Enter Divine Beasts'];
			if (format) {
				splits.push([
					ResolveFormatString(format, numKorok, event.label),
					event.frame[0],
				]);
			}
			format = formats['Divine Beasts'];
			if (format) {
				splits.push([
					ResolveFormatString(format, numKorok, event.label),
					event.segments[6][0],
				]);
			}
		}
		else if (event.type == 'Paraglider') {
			let format = formats['Paraglider'];
			if (format) {
				splits.push([
					ResolveFormatString(format, numKorok, event.label),
					event.frame[0],
				]);
			}
		}
		else if (event.type == 'Thunder Helm') {
			let format = formats['Thunder Helm'];
			if (format) {
				splits.push([
					ResolveFormatString(format, numKorok, event.label),
					event.frame[0],
				]);
			}
		}
		else if (event.type == 'Warp') {
			let format = formats['Warps'];
			if (format) {
				let name = event.label;
				if (name.endsWith(' (Tamed)'))
					name = name.slice(0, -8);
				if (name.endsWith(' Shrine'))
					name = name.slice(0, -7);
				splits.push([
					ResolveFormatString(format, numKorok, name),
					event.frame[0],
				]);
			}
		}
		else if (event.type == 'Korok Seed') {
			numKorok++;
			let format = formats['Koroks'];
			if (format) {
				splits.push([
					ResolveFormatString(format, numKorok, event.label),
					event.frame[0],
				]);
			}
		}
		else if (event.type == 'GG') {
			splits.push([
				'100%',
				event.frame[0],
			]);
		}
	}

	let lss = createLSS(splits, document.getElementById('export_split_time').checked);
	downloadFile(lss, exportRunUID + '.lss');
}

function createLSS(splits, includeTime) {
	let content =
`<?xml version="1.0" encoding="UTF-8"?>
<Run version="1.7.0">
  <GameIcon />
  <GameName>The Legend of Zelda: Breath of the Wild</GameName>
  <CategoryName>100%</CategoryName>
  <LayoutPath>
  </LayoutPath>
  <Metadata>
    <Run id="" />
    <Platform usesEmulator="False">
    </Platform>
    <Region>
    </Region>
    <Variables />
  </Metadata>
  <Offset>-00:00:01</Offset>
  <AttemptCount>` + (includeTime ? 1 : 0) + `</AttemptCount>
  <AttemptHistory>
`
	if (includeTime) {
		content += 
`    <Attempt id="1">
      <RealTime>` + frameIdxToTime(splits.at(-1)[1]) + `</RealTime>
    </Attempt>
`;
	}
	content +=
`  </AttemptHistory>
  <Segments>
`;

	if (includeTime) {
		let last = 0;
		for (let split of splits) {
			content +=
`    <Segment>
      <Name>` + split[0] + `</Name>
      <Icon />
      <SplitTimes>
        <SplitTime name="Personal Best">
          <RealTime>` + frameIdxToTime(split[1]) + `</RealTime>
        </SplitTime>
      </SplitTimes>
      <BestSegmentTime>
        <RealTime>` + frameIdxToTime(split[1] - last) + `</RealTime>
      </BestSegmentTime>
      <SegmentHistory>
        <Time id="1">
          <RealTime>` + frameIdxToTime(split[1] - last) + `</RealTime>
        </Time>
      </SegmentHistory>
    </Segment>
`;
			last = split[1];
		}
	}
	else {
		for (let split of splits) {
			content +=
`    <Segment>
      <Name>` + split[0] + `</Name>
      <Icon />
      <SplitTimes>
        <SplitTime name="Personal Best" />
      </SplitTimes>
      <BestSegmentTime />
      <SegmentHistory />
    </Segment>
`;
		}
	}

	content +=
`  </Segments>
  <AutoSplitterSettings />
</Run>`;

	return content;
}

function downloadFile(content, name) {
	// Create a Blob from the file content
	const blob = new Blob([content], { type: 'text/plain' });

	// Create an anchor element
	const a = document.createElement('a');

	// Create a URL for the Blob and set it as the href attribute
	a.href = URL.createObjectURL(blob);

	// Set the desired file name for download
	a.download = name;

	// Programmatically click the anchor to trigger the download
	a.click();

	// Release the object URL after the download to avoid memory leaks
	URL.revokeObjectURL(a.href);
}
