var emitters = [];
var shots = [];
var targets = [];
var blocks = [];

POPPING_POWER = 800; // the strength at which user-made wells can be popped
POWER_PER_RADIUS = 15; // power units per pixel of radius
POWER_PER_SHOT = 30; // power gained when consuming a shot
POWER_ADJUST_FACTOR = 0.09; // tweaks how powerful wells are
ATROPHY_RATE = 0.5; // decrease in power per cycle of non-static wells
BASE_WELL_SIZE = 5; // minimum size of a new well
MAX_SHOTS = 100;
WORLD_PERIOD = 7;
SHOT_RATE = WORLD_PERIOD*71; // how often emitters fire shots
BASE_SHOT_SPEED = 1.5; // how fast shots move normally
SMALL_SPEED_INC = 0.16;
LARGE_SPEED_INC = 0.8;

window.onload = init;

function init() {
    canvas = new Canvas($("#canvas-div").get(0), 800, 600, {fill:"black"});

    $(canvas.canvas).on("contextmenu", function(e) { e.preventDefault(); })

    initTools();

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

    addPlayButton(canvas);

    if(window.location.hash) {
        try {
            saveLoad.loadState(atob(window.location.hash.substr(1)));
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
    new Target({color:"#F55", x:400, y:300, text:"MkGr",  properties:{gravPull:60, radius:3}, radius:27});

    new Block({color:"#AAA", x:300, y:525, rotation: Math.PI/4 });
    new Block({color:"#AAA", x:300, y:525, rotation: Math.PI/4 });
    new Block({color:"#AAA", x:300, y:525, rotation: Math.PI/4 });
    new Block({color:"#AAA", x:300, y:525, rotation: Math.PI/4 });
    new Block({color:"#A00", x:200, y:325});

    new Emitter({ rotation:0, x:50, y:550 });
}
