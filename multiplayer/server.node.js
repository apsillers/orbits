var emitters = [];
var shots = [];
var targets = [];

var you;
newWell = null;
newWellTimeout = null;
mouseX = 0;
mouseY = 0;

POPPING_POWER = 800; // the strength at which user-made wells can be popped
POWER_PER_RADIUS = 15; // power units per pixel of radius
POWER_PER_SHOT = 30; // power gained when consuming a shot
POWER_ADJUST_FACTOR = 3; // tweaks how powerful wells are
ATROPHY_RATE = 0.5; // decrease in power per cycle of non-static wells
BASE_WELL_SIZE = 3; // minimum size of a new well
MAX_SHOTS = 100;
WORLD_PERIOD = 10;
SHOT_RATE = 500; // how often emitters fire shots
BASE_SHOT_SPEED = 4; // how fast shots move normally
SMALL_SPEED_INC = 0.16;
LARGE_SPEED_INC = 1.6;


var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8000);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
	
io.sockets.on('connection', function (socket) {



  socket.emit('news', { hello: 'world' });



  socket.on('my other event', function (data) {
    console.log(data);
  });


});

	you = new Emitter(new Polygon([-10, 10, -10, -10, 10, 0], {fill:"purple", x:50, y:550}));

	// turn newWell into a real well
	socket.on("placeWell", function(data) {
		new Well({x:offsetX, y:offsetY, static:false, consuming: true, userMade: true, power:newWell.radius*POWER_PER_RADIUS});
	});

	
	// create newWell
	socket.on("chargingWell", function() {
        socket.set("newWellSize", 0);
	})

	worldInt = setInterval(function() {
        

		you.dx = Math.abs(you.dx) < you.speed/2 ? 0 : you.dx, you.dy = Math.abs(you.dy) < you.speed/2 ? 0 : you.dy;
		
		// move emitters
	    for(var i=0; i< emitters.length; ++i) {
			var p = emitters[i];
			var sum = Math.abs(p.dx) + Math.abs(p.dy);
			if(sum) {
		        p.gfx.x += p.speed * p.dx/sum;
			    p.gfx.y += p.speed * p.dy/sum;
			}
		}
		
		// handles shots
		for(var i=0; i< shots.length; ++i) {
			var s = shots[i];
			
			// acceleration due to gravity wells
			for(var j=0; j < shots.length; ++j) {
				var w = shots[j];
				
				// if the well is the shot, don't do anything
				if(w != s && w.power > 0) {
					var vect = distVector(w.gfx, s.gfx, true);
					var strength = w.power / POWER_PER_RADIUS / vect.r / POWER_ADJUST_FACTOR;
					
					var ddx = (s.property=="revgrav"?-1:1) * strength * (vect.x);
					var ddy = (s.property=="revgrav"?-1:1) * strength * (vect.y);
					
					s.dx += ddx * (s.property=="revgrav"||s.property=="lowgrav"?0.5:1) * (s.property=="higrav"?4:1);
					s.dy += ddy * (s.property=="revgrav"||s.property=="lowgrav"?0.5:1) * (s.property=="higrav"?4:1);
					
					// gavity wells eat shots
					if(w.consuming && !s.userMade && s.property!="higrav" && vect.r < w.gfx.radius + s.gfx.radius) {
						if(!w.static) w.power += POWER_PER_SHOT;
						s.remove();
					}
					
					// add a message to very large wells
					if(w.power > POPPING_POWER && w.userMade && w.gfx.childNodes.length == 0) {
						w.gfx.appendChild(new TextNode("Click to pop", {fill:"black", textAlign:"center"}));
					}
				}
			}
			
			// slow down very fast shots
			var sum = Math.abs(s.dx) + Math.abs(s.dy);
			var speed = Math.sqrt(s.dx*s.dx + s.dy*s.dy);
			if(speed > s.baseSpeed) {
				s.dx = (Math.abs(s.dx)/s.dx || 0) * ((Math.abs(s.dx) - (s.property=="lowspeed" || speed > 2*s.baseSpeed?LARGE_SPEED_INC:SMALL_SPEED_INC) * (Math.abs(s.dx)/sum || 0)));
				s.dy = (Math.abs(s.dy)/s.dy || 0) * ((Math.abs(s.dy) - (s.property=="lowspeed" || speed > 2*s.baseSpeed?LARGE_SPEED_INC:SMALL_SPEED_INC) * (Math.abs(s.dy)/sum || 0)));
			}
			
			// speed up slow shots
			if(speed < s.baseSpeed) {
				s.dx = (Math.abs(s.dx)/s.dx || 0) * ((Math.abs(s.dx) + (s.property=="hispeed" || speed < s.baseSpeed/2?LARGE_SPEED_INC:SMALL_SPEED_INC) * (Math.abs(s.dx)/sum || 0)));
				s.dy = (Math.abs(s.dy)/s.dy || 0) * ((Math.abs(s.dy) + (s.property=="hispeed" || speed < s.baseSpeed/2?LARGE_SPEED_INC:SMALL_SPEED_INC) * (Math.abs(s.dy)/sum || 0)));
			}
			
			var diffX = s.dx;
			var diffY = s.dy;
			
			// move shots; bounce shots off walls if out of bounds
			if(diffX + s.gfx.x > canvas.width) {
				s.gfx.x = 2*canvas.width - (s.gfx.x + diffX);
				s.dx *= -1;
			} else if(diffX + s.gfx.x < 0) {
				s.gfx.x = -(s.gfx.x + diffX);
				s.dx *= -1;
			} else {
				s.gfx.x += diffX;
			}
			
			if(diffY + s.gfx.y > canvas.height) {
				s.gfx.y = 2*canvas.height - (s.gfx.y + diffY);
				s.dy *= -1;
			} else if(diffY + s.gfx.y < 0) {
				s.gfx.y = -(s.gfx.y + diffY);
				s.dy *= -1;
			} else {
				s.gfx.y += diffY;
			}
			
			// atropy non-static wells
			if(s.power > 0 && !s.static) {
				if(!s.protected && (s.power-=ATROPHY_RATE) <= 0) s.remove();
				else {
				    s.gfx.radius = s.power / POWER_PER_RADIUS;
					if(self.userMade && s.power < POPPING_POWER) s.gfx.removeAllChildren(); //remove message
				}
			}

			// recolor shots that go through targets
			for(var j=0; j < targets.length; ++j) {
		        var t = targets[j];
				var vect = distVector(t.gfx, s.gfx)
				
				if(vect.r < t.gfx.radius + s.gfx.radius) {
					s.gfx.fill = t.gfx.fill;
					s.property = t.property;
					if(s.property == "hispeed") s.baseSpeed = 2 * BASE_SHOT_SPEED;
					else if(s.property == "lowspeed") s.baseSpeed = BASE_SHOT_SPEED / 2;
					else s.baseSpeed = BASE_SHOT_SPEED;

                    // only add/remove gravity from emitter-generated pellets
					if(!s.userMade) {
    					if(s.property == "owngrav") {
                            s.power = 50;
						    s.gfx.radius = 3;
					    } else {
						    s.gfx.radius = 2;
                            s.power = 0;
                        }
					}
			    }
			}
			
		}
	}, WORLD_PERIOD);
	
	setupCourse();












function setupCourse() {
    new Target({color:"red", x:100, y:160, text:"RvGr", property:"revgrav"});
	new Target({color:"orange", x:200, y:100, text:"LoGr", property:"lowgrav"});
	new Target({color:"blue", x:600, y:100, text:"LoSp",  property:"lowspeed"});
	new Target({color:"#0F0", x:700, y:160, text:"HiSp", property:"hispeed"});
	new Target({color:"yellow", x:600, y:400, text:"HiGr", property:"higrav"});
	new Target({color:"#F55", x:400, y:300, text:"MkGr",  property:"owngrav", radius:27});
	//new Well({x:650, y:150, static: true, consuming: true, userMade: false, power:90});
	shotInt = setInterval(function() {
		if(shots.length < MAX_SHOTS)
	        new Well({gfx:new Circle(2, {fill:"#fff"}), x:you.gfx.x, y:you.gfx.y, power:0, radius:2, static: true, consuming:false, dx:1, dy:0, color:""});
	}, SHOT_RATE);
}

function distVector(obj1, obj2, log) {
	var distX = obj1.x - obj2.x;
	var distY = obj1.y - obj2.y;
	var sum = Math.abs(distX) + Math.abs(distY) || 0.01;
    return {x: distX/sum,
	        y: distY/sum,
			r: Math.sqrt(distX*distX + distY*distY)};
}

function Emitter(gfx) {
    this.gfx = gfx;
	canvas.append(gfx);
	this.speed = 1.5;
	emitters.push(this);
	this.gfx.makeDraggable();
	
	this.gfx.addEventListener("mousedown", function(e) {
			clearTimeout(newWellTimeout);
		    newWellTimeout = null;
	});
}

function Target(options) {
    this.gfx = options.gfx || new Circle(options.radius || 25,
	                                    {fill:options.color, x:options.x,
										                     y:options.y});
	this.gfx.appendChild(new TextNode(options.text, {fill:"black", font:"bold 8pt Arial", textAlign:"center", y:4}));
	canvas.append(this.gfx);
	this.gfx.zIndex = 5;
	this.text = options.text;
	this.property = options.property || "normal";
	targets.push(this);
	this.gfx.makeDraggable();
	
	this.gfx.addEventListener("mousedown", function(e) {
			clearTimeout(newWellTimeout);
		    newWellTimeout = null;
	});
}

function Well(options) {
    var undefined;
    var self = this;
    this.gfx = options.gfx || new Circle(0, {fill:this.color||"white", stroke:"none"});
	this.gfx.x = (options.x != undefined) ? options.x : this.gfx.x;
	this.gfx.y = (options.y != undefined) ? options.y : this.gfx.y;
	this.gfx.zIndex = -8;
	canvas.append(this.gfx);
	this.speed = options.speed || BASE_SHOT_SPEED;
	this.baseSpeed = options.speed || BASE_SHOT_SPEED;
	var sum = Math.abs(options.dx) + Math.abs(options.dy);
	this.dx = this.speed * (sum ? options.dx / sum : 0);
	this.dy = this.speed * (sum ? options.dy / sum : 0);
	this.power = options.power==undefined ? 300 : options.power;
	this.gfx.radius = options.radius || this.power / POWER_PER_RADIUS;
	this.consuming = options.consuming == undefined ? true : options.consuming;
	this.static = options.static;
	this.userMade = options.userMade;
	
	// user can remove large user-made wells via click
	this.gfx.addEventListener("mousedown", function(e) {
	    if(self.power > POPPING_POWER && self.userMade) {
			clearTimeout(newWellTimeout);
		    newWellTimeout = null;
			self.remove();
		}
	})

	this.level = 0;
	this.property = "normal";
	
	this.gfx.addEventListener("mouseover", function(e) {
		for(var i = 0; i < shots.length; ++i) { shots[i].protected = false; }
	    self.protected = true;
	})
	
	this.gfx.addEventListener("mouseout", function(e) {
	    self.protected = false;
	})
	
	this.remove = function() {
		this.gfx.erased = true; // sometimes cake.js doesn't remove stuff??
	    canvas.removeChild(this.gfx);
	    shots.splice(shots.indexOf(this), 1);
	}
	
	shots.push(this);
}

// clean up when cake skips removals
setInterval(function() {
    for(var i = 0; i < canvas.childNodes.length; ++i) {
        if(canvas.childNodes[i].erased == true) {
            canvas.remove(canvas.childNodes[i]);
        }
    }
}, 5000);
