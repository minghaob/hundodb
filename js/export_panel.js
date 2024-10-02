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
		name: 'Warps',
		format: 'Warp {name}',
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
}

function updateExportLSSButton() {
	let button = document.getElementById('export_splits');
	let exportRunUID = document.getElementById("export_select").value;
	if (!exportRunUID) {
		button.disabled = true;
		return;
	}

	let options = document.getElementById('export_split_options').querySelector('tbody').rows;
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
