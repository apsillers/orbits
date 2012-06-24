var emitters = [];
var shots = [];
var targets = [];
var blocks = [];

newWell = null;
newWellTimeout = null;
newEmitter = null;
newEmitterTimeout = null;

POPPING_POWER = 800; // the strength at which user-made wells can be popped
POWER_PER_RADIUS = 15; // power units per pixel of radius
POWER_PER_SHOT = 30; // power gained when consuming a shot
POWER_ADJUST_FACTOR = 0.07; // tweaks how powerful wells are
ATROPHY_RATE = 0.5; // decrease in power per cycle of non-static wells
BASE_WELL_SIZE = 5; // minimum size of a new well
MAX_SHOTS = 100;
WORLD_PERIOD = 7;
SHOT_RATE = 500; // how often emitters fire shots
BASE_SHOT_SPEED = 1.5; // how fast shots move normally
SMALL_SPEED_INC = 0.16;
LARGE_SPEED_INC = 0.8;

window.onload = init;

function init() {
    canvas = new Canvas($("#canvas-div").get(0), 800, 600, {fill:"black"});
    
    $(canvas.canvas).on("mousemove", function(e) {
        var offset = $(this).offset();
        var offsetX = e.pageX - offset.left;
        var offsetY = e.pageY - offset.top;
        // if a new well is being placed, have it follow the cursor
        if(newWell) {
            newWell.x = offsetX;
            newWell.y = offsetY;
        }
        // if an emitter is being placed, tilt it to follow the cursor
        if(newEmitter) {
            var deltaX = newEmitter.x - offsetX;
            var deltaY = newEmitter.y - offsetY;
            var rot = deltaX>0?Math.atan(deltaY/deltaX)-Math.PI:Math.atan(deltaY/deltaX);
            if(deltaX==0) { rot *= -1; }
            newEmitter.rotation = [rot,0,0];
        }
    });
    
    $(canvas.canvas).on("contextmenu", function(e) { e.preventDefault(); })
    $(canvas.canvas).css("-webkit-tap-highlight-color", "rgba(0,0,0,0)");

    // turn newWell into a real well
    $(canvas.canvas).on("mouseup", function(e) {
        var offset = $(this).offset();
        var offsetX = e.pageX - offset.left;
        var offsetY = e.pageY - offset.top;
        if(e.button == 0) {
            if(newWell) {
                new Well({x:offsetX, y:offsetY, static:depressedKeys.has("S"),
                          consuming: !depressedKeys.has("A"), userMade: true,
                          power:newWell.radius*POWER_PER_RADIUS});
                canvas.removeChild(newWell);
                newWell = null;
            } else if(newWellTimeout != null) {
                new Well({x:offsetX, y:offsetY, static:depressedKeys.has("S"),
                          consuming: !depressedKeys.has("A"), userMade: true,
                          power:BASE_WELL_SIZE*POWER_PER_RADIUS});
                clearTimeout(newWellTimeout);
                newWellTimeout = null;
            }
        } else if(e.button == 2) {
            if(newEmitter) {
                newEmitter.opacity = 1;
                new Emitter({ gfx:newEmitter, rotation:newEmitter.rotation, x:newEmitter.x, y:newEmitter.y });
                newEmitter = null;
            } else if(newEmitterTimeout != null) {
                newEmitter = null;
                clearTimeout(newEmitterTimeout);
                newEmitterTimeout = null;
            }
        }
    });
    
    
    $(canvas.canvas).on("mousedown", function(e) {
        var offset = $(this).offset();
        var offsetX = e.pageX - offset.left;
        var offsetY = e.pageY - offset.top;
        if(e.button == 0) {
            if(e.shiftKey) {
                //drop a thing
                new Target({color:$("#tool-color").val(), x:offsetX, y:offsetY, text:$("#tool-name").val(),
                            properties:propertiesFromTool()});
            } else if(!e.ctrlKey) {
                // create newWell placeholder
                if(!newWell && !newWellTimeout) {
                    // start making a new well (if no one cancels the timeout)
                    newWellTimeout = setTimeout(function() {
                        newWell = new Circle(BASE_WELL_SIZE, {fill:"#444", x:offsetX, y:offsetY});
                        canvas.appendChild(newWell);
                        newWellTimeout = null;
                    }, 20);
                }
            }
        } else if(e.button == 2) {
            if(!newEmitter && !newEmitterTimeout) {
            // start making a new emitter (if no one cancels the timeout)
                newEmitterTimeout = setTimeout(function() {
                    newEmitter = new Polygon([-10, 10, -10, -10, 10, 0], {fill:"purple", opacity:0.5, x:offsetX, y:offsetY});
                    canvas.appendChild(newEmitter);
                    newEmitterTimeout = null;
                }, 20);
            }
        }
    });

    // move everything, etc.
    worldInt = setInterval(function() {
        var now = +new Date();
        var timeDiff = (typeof lastTime != "undefined") ? now - lastTime : WORLD_PERIOD;
        do {
            worldLoop();
            timeDiff -= WORLD_PERIOD;
        } while(timeDiff >= WORLD_PERIOD);
        lastTime = +new Date();
    }, WORLD_PERIOD);
    
    // emitters fire periodically
    shotInt = setInterval(function() {
        for(var i = 0; i < emitters.length; ++i) {
            var emitr = emitters[i];
            if(shots.length < MAX_SHOTS) {
                new Well({
                    gfx:new Circle(2, {fill:"#fff"}),
                    x:emitr.gfx.x, y:emitr.gfx.y,
                    power:0, radius:2, static: true,
                    consuming:false,
                    dx:emitr.shotDx, dy:emitr.shotDy,
                    color:"white"});
            }
        }
    }, SHOT_RATE);

    addPlayButton(canvas);

    if(window.location.hash) {
        try {
            loadState(atob(window.location.hash.substr(1)));
        } catch(e) {
           setupCourse(); 
        }
    }
    else { setupCourse(); }
}

function setupCourse() {
    new Target({color:"red", x:100, y:160, text:"RvGr", properties:{gravReaction:-1}});
    new Target({color:"orange", x:200, y:100, text:"LoGr", properties:{gravReaction:0.25}});
    new Target({color:"blue", x:600, y:100, text:"LoSp",  properties:{speedFactor:0.5, smallSlowdown:5}});
    new Target({color:"#5F5", x:700, y:160, text:"HiSp", properties:{speedFactor:2, smallSpeedup:5}});
    new Target({color:"yellow", x:600, y:400, text:"HiGr", properties:{gravReaction:4, edible:false}});
    new Target({color:"#F55", x:400, y:300, text:"MkGr",  properties:{gravPull:50, radius:3}, radius:27});

    new Block({color:"#AAA", x:600, y:525});
    new Block({color:"#A00", x:200, y:325});

    new Emitter({ rotation:0, x:50, y:550 });
}
