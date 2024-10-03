function initHelpPanel() {
	// add help panel
	g_sidebar.addPanel({
		id:   'help',
		tab:  '<i class="fa fa-question-circle"></i>',
		title: 'How to Use',
		pane: '<div id="help_panel_container"></div>',
	});
	let helpPaneContainer = L.DomUtil.get('help_panel_container');
	let helpPaneContent = L.DomUtil.get('help_panel_content');
	helpPaneContainer.appendChild(helpPaneContent);
	helpPaneContent.style.display = 'block';

	document.getElementById("help_panel_selectarun").onclick = () => {onClickHighlightRun();};

	document.getElementById("help_panel_movement").onclick = () => g_movePaths['Mogg Latan Shrine']['Kaya Wan Shrine'].openPopup();
	document.getElementById("help_panel_movement").onmouseover = () => g_movePaths['Mogg Latan Shrine']['Kaya Wan Shrine'].fire('mouseover');
	document.getElementById("help_panel_movement").onmouseout = () => g_movePaths['Mogg Latan Shrine']['Kaya Wan Shrine'].fire('mouseout');

	document.getElementById("help_panel_shrine").onclick = () => g_markerMapping['Kaya Wan Shrine'].marker.openPopup();
	document.getElementById("help_panel_shrine").onmouseover = () => g_markerMapping['Kaya Wan Shrine'].marker.fire('mouseover');
	document.getElementById("help_panel_shrine").onmouseout = () => g_markerMapping['Kaya Wan Shrine'].marker.fire('mouseout');

	document.getElementById("help_panel_divinebeast").onclick = () => g_markerMapping['Vah Ruta'].marker.openPopup();
	document.getElementById("help_panel_divinebeast").onmouseover = () => g_markerMapping['Vah Ruta'].marker.fire('mouseover');
	document.getElementById("help_panel_divinebeast").onmouseout = () => g_markerMapping['Vah Ruta'].marker.fire('mouseout');

	document.getElementById("help_panel_time").onmouseover = () => highlightPopupTimeCells(isTimeCell);
	document.getElementById("help_panel_time").onmouseout = () => highlightPopupTimeCells(isTimeCell);

	document.getElementById("help_panel_selectrows").onmouseover = () => highlightPopupTimeCells(isFirstCell);
	document.getElementById("help_panel_selectrows").onmouseout = () => highlightPopupTimeCells(isFirstCell);

	document.getElementById("help_panel_view").onmouseover = () => highlightPopupTimeCells(isTimeHeader);
	document.getElementById("help_panel_view").onmouseout = () => highlightPopupTimeCells(isTimeHeader);

	document.getElementById("help_panel_run").onmouseover = () => highlightPopupTimeCells(isRunCell);
	document.getElementById("help_panel_run").onmouseout = () => highlightPopupTimeCells(isRunCell);

	document.getElementById("help_panel_comparepanel").onclick = () => {g_sidebar.open("compare")};
	document.getElementById("help_panel_exportpanel").onclick = () => {g_sidebar.open("export")};
}

function highlightPopupTimeCells(cb) {
	let moveTables = document.getElementsByClassName("move-table");
	for (table of moveTables) {
		for (let i = 0; i < table.rows.length; i++) {
			for (let j = 0; j < table.rows[i].cells.length; j++) {
				if (cb(i, j)) {
					let cell = table.rows[i].cells[j];
					cell.classList.toggle('help-highlight');
				}
			}
		}
	}
}

function isTimeCell(row, col) {
	return row >= 1 && isTimeColumn(col);
}

function isFirstCell(row, col) {
	return row >= 1 && col == 0;
}

function isTimeHeader(row, col) {
	return row == 0 && isTimeColumn(col);
}

function isTimeColumn(col) {
	return col == 1 || col >= 3;
}

function isRunCell(row, col) {
	return row >= 1 && col == 2;
}
