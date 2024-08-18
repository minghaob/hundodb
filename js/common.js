let g_colorPalette = [
	{ color: 'dodgerblue', opacity: 1, },
	{ color: 'red', opacity: 1, },
	{ color: 'greenyellow', opacity: 1, },
	{ color: 'magenta', opacity: 1, },
	{ color: 'aqua', opacity: 1, },
	{ color: 'white', opacity: 1, },
	{ color: 'orange', opacity: 1, },
	{ color: 'rgb(167, 132, 255)', opacity: 1},
	{ color: 'gold', opacity: 1, },
	//{ color: 'black', opacity: 1, },
];

function frameIdxToTime(frameIdx) {

	// second & subsecond part
	if (frameIdx < 1800)
		return (frameIdx / 30).toFixed(2);
	ret = ((frameIdx % 1800) / 30).toFixed(2).padStart(5, '0');
	frameIdx = Math.floor(frameIdx / 1800);

	// minute part
	if (frameIdx < 60)		// less then 1 hour
		return frameIdx.toString() + ':' + ret;

	// hour and minute
	return  Math.floor(frameIdx / 60) + ':' + (frameIdx % 60).toString().padStart(2, '0') + ':' + ret;
}
