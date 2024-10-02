function initSidebar() {
	// add side bar
	g_sidebar = L.control.sidebar({
		autopan: false,       // whether to maintain the centered map point when opening the sidebar
		closeButton: false,    // whether t add a close button to the panes
		container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
		position: 'left',     // left or right
	}).addTo(g_map);
	// add compare panel
	{
		g_sidebar.addPanel({
			id:   'compare',
			tab:  '<i class="fa fa-database"></i>',
			title: 'Compare Runs',
			pane: '<div id="compare_panel_container"></div>',
		});
		let comparePaneContainer = L.DomUtil.get('compare_panel_container');
		let comparePaneContent = L.DomUtil.get('compare_panel_content');
		comparePaneContainer.appendChild(comparePaneContent);
		comparePaneContent.style.display = 'block';
	}

	g_sidebar.on('content', onSidebarContent);
	g_sidebar.on('closing', () => history.replaceState(null, '', window.location.pathname));
	
	initExportPanel();
	initHelpPanel();
}

function onSidebarContent(e) {
	if (e.id == 'compare') {
		replaceURLWithCompare();
	}
	else if (e.id == 'help') {
		history.replaceState(null, '', window.location.pathname);
	}
}