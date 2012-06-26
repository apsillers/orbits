var depressedKeys = {};
depressedKeys.keys = {};
depressedKeys.add = function(key) {
    this.keys[key] = +new Date();
    var toggleObj = this.toggleMap[key];
    if(toggleObj) $("#"+toggleObj.id).css(toggleObj.property, toggleObj.vals[1]);
}
depressedKeys.remove = function(key) {
    delete this.keys[key];
    var toggleObj = this.toggleMap[key];
    if(toggleObj) $("#"+toggleObj.id).css(toggleObj.property, toggleObj.vals[0]);
}
depressedKeys.has = function(key) {
    return key in this.keys;
}
depressedKeys.toggleMap = {
    "A":{ id: "tool-well-noncon", property: "background-color", vals:["inherit","#F66"], current:false },
    "S":{ id: "tool-well-static", property: "background-color", vals:["inherit","#F66"], current:false },
    "Z":{ id: "tool-emit-place", property: "background-color", vals:["inherit","#6F6"], current:false }
}

$(document).keydown(function(e) {
    var key = String.fromCharCode(e.which);
    depressedKeys.add(key);
});

$(document).keyup(function(e) {
    var key = String.fromCharCode(e.which);
    depressedKeys.remove(key);
});

setTimeout(function() {
    var now = +new Date();
    for(key in depressedKeys.keys) {
        if(depressedKeys.keys[key] - now > 500) {
            depressedKeys.keys.remove(key);
        }
    }
}, 500);
