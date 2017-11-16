function Emitter(options) {
    var self = this;
    this.gfx = options.gfx;
    if(!this.gfx) {
        this.gfx = new createjs.Shape();
        this.gfx.graphics.beginFill(options.color || "purple").moveTo(-10, 10).lineTo(-10, -10).lineTo(10, 0).closePath();
    }
    this.gfx.x = options.x;
    this.gfx.y = options.y;
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
        var rot = options.rotation;
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
        this.gfx.rotation = options.rotation * 180 / Math.PI;
    }

    canvas.addChild(this.gfx);
    emitters.push(this);
    //TODO: this.gfx.makeDraggable();
    
    this.gfx.addEventListener("mousedown", function(e) {
        if(e.ctrlKey) {
            self.remove();
        } else {
            allowClick();
        }
    });

    this.remove = function() {
        canvas.removeChild(this.gfx);
        emitters.splice(emitters.indexOf(this), 1);
    };
}

function Target(options) {
    var self = this;
    this.gfx = options.gfx;
    this.fill = options.color;

    if(!this.gfx) {
        this.gfx = new createjs.Container();
        this.circleGfx = new createjs.Shape();
        this.circleGfx.graphics.beginFill(options.color).drawCircle(0,0,options.radius || 25);
        this.gfx.addChild(this.circleGfx);
    }
    this.gfx.x = options.x;
    this.gfx.y = options.y;

/*
    this.text = new TextNode(options.text, {fill:"black", font:"bold 8pt Arial", textAlign:"center", y:4});
    this.gfx.appendChild(this.text);
    this.text.__defineSetter__("underCursor", function(t) { self.underCursor = t; });
    this.text.__defineGetter__("underCursor", function() { return self.underCursor; });
*/
    canvas.addChild(this.gfx);
    this.gfx.zIndex = 5;
    this.text = options.text;
    this.properties = options.properties || {};
    targets.push(this);
    
    this.gfx.addEventListener("mousedown", function(e) {
        if(e.ctrlKey) {
            self.remove();
        } else {
            allowClick();
        }
    });

    this.remove = function() {
        canvas.remove(this.gfx);
        targets.splice(targets.indexOf(this), 1);
    };
}

function Well(options) {
    var undefined;
    var self = this;

    this.redraw = function() {
        this.gfx.graphics.clear().beginFill(this.fill || "white").drawCircle(0, 0, this.radius || 0);
    };

    this.power = options.power==undefined ? 300 : options.power;
    this.radius = this.power / POWER_PER_RADIUS || options.radius || 2;
    this.fill = options.color;

    this.gfx = options.gfx;
    if(!this.gfx) {
        this.gfx = new createjs.Shape();
        this.redraw();
    }

    this.gfx.x = (options.x != undefined) ? options.x : this.gfx.x;
    this.gfx.y = (options.y != undefined) ? options.y : this.gfx.y;
    this.gfx.zIndex = options.userMade?8:0;
    canvas.addChild(this.gfx);

    this.speed = options.speed || BASE_SHOT_SPEED;
    this.baseSpeed = options.speed || BASE_SHOT_SPEED;
    var sum = Math.abs(options.dx) + Math.abs(options.dy);
    this.dx = this.speed * (sum ? options.dx / sum : 0);
    this.dy = this.speed * (sum ? options.dy / sum : 0);
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
    });

    this.remove = function() {
        canvas.removeChild(this.gfx);

        shots.splice(shots.indexOf(this), 1);
    }
    
    shots.push(this);
}

function Block(options) {
    var self = this;
    this.gfx = options.gfx;

    options.width = options.width || 50;
    options.height = options.height || 50;

    if(options.width < 0) { options.x += options.width; options.width = Math.abs(options.width); }
    if(options.height < 0) { options.y += options.height; options.height = Math.abs(options.height); }

    if(!this.gfx) {
        this.gfx = new createjs.Shape();
        this.gfx.graphics.beginFill(options.color || "red").rect(0,0, options.width, options.height);
    }
    this.gfx.rotation = options.rotation*180/Math.PI;
    this.gfx.x = options.x || this.gfx.x;
    this.gfx.y = options.y || this.gfx.y;
    this.width = options.width;
    this.height = options.height;

    this.hp = options.hp || 0;
    this.mobile = options.mobile;

    this.hitFuncs = [];
    this.hit = function(dx, dy){ for(var i=0; i < this.hitFuncs.length; ++i) { this.hitFuncs[i](dx,dy); } };
    if(this.hp != 0) {
        this.hitFuncs.push(function(dx, dy) { if(self.hp == 1) self.remove(); else if(self.hp > 0) self.hp--; });
    } else if(this.mobile) {
        this.hitFuncs.push(function(dx, dy) { self.gfx.x += dx; self.gfx.y += dy; });
    }

    canvas.addChild(this.gfx);
    blocks.push(this);
    // TODO: this.gfx.makeDraggable();
    
    this.gfx.addEventListener("mousedown", function(e) {
        if(e.ctrlKey) {
            self.remove();
        } else {
            allowClick();
        }
    });

    this.remove = function() {
        canvas.removeChild(this.gfx);
        blocks.splice(blocks.indexOf(this), 1);
    };
}
