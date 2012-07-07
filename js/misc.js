// used at the beginning of click handlers to stop default click behaviors
function allowClick() {
    clearTimeout(newWellTimeout);
    newWellTimeout = null;
    clearTimeout(newBlockTimeout);
    newBlockTimeout = null;
    clearTimeout(newEmitterTimeout);
    newEmitterTimeout = null;
    clearTimeout(newTargetTimeout);
    newTargetTimeout = null;
}

function distVector(obj1, obj2, log) {
    var distX = obj1.x - obj2.x;
    var distY = obj1.y - obj2.y;
    var sum = Math.abs(distX) + Math.abs(distY) || 0.01;
    return {x: distX/sum,
            y: distY/sum,
            r: Math.sqrt(distX*distX + distY*distY)};
}

// clean up when cake skips removals
setInterval(function() {
    for(var i = 0; i < canvas.childNodes.length; ++i) {
        if(canvas.childNodes[i].erased == true) {
            canvas.remove(canvas.childNodes[i]);
        }
    }
}, 5000);
