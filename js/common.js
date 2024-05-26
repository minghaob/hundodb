
function frameIdxToTime(frameIdx) {
	// sub-second part, use frame
	let ret = (frameIdx % 30).toString().padStart(2, '0');
	frameIdx = Math.floor(frameIdx / 30);

	// second part
	if (frameIdx < 60)		// less than 1 minute
		return frameIdx.toString() + '.' + ret;
	ret = (frameIdx % 60).toString().padStart(2, '0') + '.' + ret;
	frameIdx = Math.floor(frameIdx / 60);

	// minute part
	if (frameIdx < 60)		// less then 1 hour
		return frameIdx.toString() + ':' + ret;

	// hour and minute
	return  Math.floor(frameIdx / 60) + ':' + (frameIdx % 60).toString().padStart(2, '0') + ':' + ret;
}
