function Emitter(options) {
    var self = this;
    this.gfx = options.gfx || new Polygon([-10, 10, -10, -10, 10, 0], {fill:"purple"});
    this.gfx.x = options.x;
    this.gfx.y = options.y;
    this.gfx.fill = options.color || "purple";
    this.gfx.zIndex = 20;
    this.shotPeriod = options.shotPeriod || SHOT_RATE;
    this.shotCountdown = this.shotPeriod;

    this.doShotCountdown = function() {
        self.shotCountdown -= WORLD_PERIOD;
        if(self.shotCountdown <= 0) {
            self.shotCountdown = self.shotPeriod + self.shotCountdown;
            self.shoot();
        }
    }

    this.shoot = function() {
        if(shots.length < MAX_SHOTS) {
            new Well({
                x:self.gfx.x, y:self.gfx.y,
                power:0, radius:2, static: true,
                consuming:false,
                dx:self.shotDx, dy:self.shotDy,
                color:"white"});
        }
    }

    if(typeof options.rotation != "undefined") {
        var rot = options.rotation instanceof Array ? options.rotation[0] : options.rotation;
        var ratio = Math.tan(rot);
        if(ratio == 0) {
            this.shotDx = 1;
            this.shotDy = 0;
        } else {
            var sum = ratio + 1/ratio;
            this.shotDy =  ratio / sum;
            this.shotDx = (1/ratio) / sum;
            if(rot < 0 && rot > -Math.PI/2) { this.shotDy *= -1; }
            if(rot < -Math.PI/2 && rot > -Math.PI) { this.shotDx *= -1; this.shotDy *= -1; }
            if(rot <= -Math.PI && rot > -Math.PI*3/2) { this.shotDx *= -1; }
        }
        this.gfx.rotation = options.rotation;
    }

    canvas.append(this.gfx);
    emitters.push(this);
    this.gfx.makeDraggable();
    
    this.gfx.addEventListener("mousedown", function(e) {
        if(e.ctrlKey) {
            self.remove();
        } else {
            allowClick();
        }
    });

    this.remove = function() {
        this.gfx.removeSelf();
        emitters.splice(emitters.indexOf(this), 1);
    };
}

function Target(options) {
    var self = this;
    this.gfx = options.gfx || new Circle(options.radius || 25,
                                        {fill:options.color, x:options.x,
                                                             y:options.y});
    this.text = new TextNode(options.text, {fill:"black", font:"bold 8pt Arial", textAlign:"center", y:4});
    this.gfx.appendChild(this.text);
    this.text.__defineSetter__("underCursor", function(t) { self.underCursor = t; });
    this.text.__defineGetter__("underCursor", function() { return self.underCursor; });
    canvas.append(this.gfx);
    this.gfx.zIndex = 5;
    this.text = options.text;
    this.properties = options.properties || {};
    targets.push(this);
    this.gfx.makeDraggable();
    
    this.gfx.addEventListener("mousedown", function(e) {
        if(e.ctrlKey) {
            self.remove();
        } else {
            allowClick();
        }
    });

    this.remove = function() {
        this.gfx.removeSelf();
        targets.splice(targets.indexOf(this), 1);
    };
}

function Well(options) {
    var undefined;
    var self = this;
    this.gfx = options.gfx || new Circle(0, {fill:options.color||"white", stroke:"none"});
    this.gfx.x = (options.x != undefined) ? options.x : this.gfx.x;
    this.gfx.y = (options.y != undefined) ? options.y : this.gfx.y;
    this.gfx.zIndex = options.userMade?8:0;
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
    this.gravReaction = options.gravReaction || 1;
    this.bigSlowdown = options.bigSlowdown || LARGE_SPEED_INC;
    this.smallSlowdown = options.smallSlowdown || SMALL_SPEED_INC;
    this.bigSpeedup = options.bigSpeedup || LARGE_SPEED_INC;
    this.smallSpeedup = options.smallSpeedup || SMALL_SPEED_INC;
    this.edible = options.edible || true;

    // user can remove large user-made wells via click
    this.gfx.addEventListener("mousedown", function(e) {
        /*if(self.power > POPPING_POWER && self.userMade) {
            clearTimeout(newWellTimeout);
            newWellTimeout = null;
            self.remove();
        }
        else */if(self.userMade && e.ctrlKey) {
            self.remove();
        }
    })
    
    this.remove = function() {
        this.gfx.erased = true; // sometimes cake.js doesn't remove stuff??
        canvas.removeChild(this.gfx);
        shots.splice(shots.indexOf(this), 1);
    }
    
    shots.push(this);
}

function Block(options) {
    var self = this;

    this.gfx = options.gfx || new Rectangle(this.width, this.height);
    this.gfx.width = options.width || this.gfx.width || 50;
    this.gfx.height = options.height || this.gfx.height || 50;
    this.gfx.rotation = options.rotation ? [options.rotation,0,0] : this.gfx.rotation;
    this.gfx.x = options.x || this.gfx.x;
    this.gfx.y = options.y || this.gfx.y;

    if(this.gfx.width < 0) { this.gfx.x += this.gfx.width; this.gfx.width = Math.abs(this.gfx.width); }
    if(this.gfx.height < 0) { this.gfx.y += this.gfx.height; this.gfx.height = Math.abs(this.gfx.height); }

    this.gfx.fill = options.color || "red";
    this.hp = options.hp || 0;
    this.mobile = options.mobile;

    this.hitFuncs = [];
    this.hit = function(dx, dy){ for(var i=0; i < this.hitFuncs.length; ++i) { this.hitFuncs[i](dx,dy); } };
    if(this.hp != 0) {
        this.hitFuncs.push(function(dx, dy) { if(self.hp == 1) self.remove(); else if(self.hp > 0) self.hp--; });
    } else if(this.mobile) {
        this.hitFuncs.push(function(dx, dy) { self.gfx.x += dx; self.gfx.y += dy; self.gfx.needMatrixUpdate = true; });
    }

    canvas.append(this.gfx);
    blocks.push(this);
    this.gfx.makeDraggable();
    
    this.gfx.addEventListener("mousedown", function(e) {
        if(e.ctrlKey) {
            self.remove();
        } else {
            allowClick();
        }
    });

    this.remove = function() {
        this.gfx.removeSelf();
        blocks.splice(blocks.indexOf(this), 1);
    };
}
