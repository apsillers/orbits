function worldLoop() {
    
    // move emitters (deprecated -- emitters are not mobile)
    for(var i=0; i< emitters.length; ++i) {
        var p = emitters[i];
        var sum = Math.abs(p.dx) + Math.abs(p.dy);
        if(sum) {
            p.gfx.x += p.speed * p.dx/sum;
            p.gfx.y += p.speed * p.dy/sum;
        }
    }

    // emitters fire periodically
    for(var i = 0; i < emitters.length; ++i) {
        var emitr = emitters[i];
        emitr.doShotCountdown();
    }
    
    // handles shots
    for(var i=0; i< shots.length; ++i) {
        var s = shots[i];
        
        // acceleration due to gravity wells
        for(var j=0; j < shots.length; ++j) {
            var w = shots[j];
            
            // only move the shot if: the well is the shot, the well has nonzero pull, and the shot is not user-made
            if(w != s && w.power > 0 && !s.userMade) {
                var vect = distVector(w.gfx, s.gfx, true);
                var dist = Math.max(vect.r, w.gfx.radius);
                var strength = w.power / POWER_PER_RADIUS / Math.pow(dist,1.5) / POWER_ADJUST_FACTOR;
                
                var ddx = strength * (vect.x);
                var ddy = strength * (vect.y);

                s.dx += ddx * s.gravReaction;
                s.dy += ddy * s.gravReaction;

                // gavity wells eat shots
                if(w.consuming && !s.userMade && s.edible && vect.r < w.gfx.radius + s.gfx.radius) {
                    if(!w.static) w.power += POWER_PER_SHOT;
                    s.remove();
                }
                
                // add a message to very large wells
                /*if(w.power > POPPING_POWER && w.userMade && w.gfx.childNodes.length == 0) {
                    w.gfx.appendChild(new TextNode("Click to pop", {fill:"black", textAlign:"center"}));
                }*/
            }
        }
        
        // slow down very fast shots
        var sum = Math.abs(s.dx) + Math.abs(s.dy);
        var speed = Math.sqrt(s.dx*s.dx + s.dy*s.dy);
        if(speed > s.baseSpeed) {
            var slowdown = speed>2*s.baseSpeed?s.bigSlowdown:s.smallSlowdown;
            s.dx = (Math.abs(s.dx)/s.dx || 0) * Math.max(0, ((Math.abs(s.dx) - (slowdown) * (Math.abs(s.dx)/sum || 0))));
            s.dy = (Math.abs(s.dy)/s.dy || 0) * Math.max(0, ((Math.abs(s.dy) - (slowdown) * (Math.abs(s.dy)/sum || 0))));
        }
        
        // speed up slow shots
        if(speed < s.baseSpeed) {
            s.dx = (Math.abs(s.dx)/s.dx || 0) * (Math.abs(s.dx) + (speed < s.baseSpeed/2?s.bigSpeedup:s.smallSpeedup) * (Math.abs(s.dx)/sum || 0));
            s.dy = (Math.abs(s.dy)/s.dy || 0) * (Math.abs(s.dy) + (speed < s.baseSpeed/2?s.bigSpeedup:s.smallSpeedup) * (Math.abs(s.dy)/sum || 0));
        }

        // handle bouncing against blocks and arena walls
        if(!s.userMade) {
            while(doBounces(s, blocks, canvas.height, canvas.width));
        }

        // atropy non-static wells
        if(s.power > 0 && !s.static) {
            if(!s.protected && (s.power-=ATROPHY_RATE) <= 0) s.remove();
            else {
                s.gfx.radius = s.power / POWER_PER_RADIUS;
                if(self.userMade && s.power < POPPING_POWER) s.gfx.removeAllChildren(); //remove message
            }
        }

        // recolor and re-assign props to shots that go through targets
        for(var j=0; j < targets.length; ++j) {
            var t = targets[j];
            var vect = distVector(t.gfx, s.gfx);
            
            if(vect.r < t.gfx.radius + s.gfx.radius && !s.userMade) {
                s.gfx.fill = t.gfx.fill;

                s.gravReaction = parseInt(t.properties.gravReaction || 1);
                s.baseSpeed = BASE_SHOT_SPEED * (t.properties.speedFactor || 1);
                s.power = parseInt(t.properties.gravPull || 0);
                s.gfx.radius = parseInt(t.properties.radius || 2);
                s.edible = (typeof t.properties.edible != "undefined") ? t.properties.edible : true;
                s.smallSlowdown = parseInt((t.properties.smallSlowdown || 1) * SMALL_SPEED_INC);
                s.smallSpeedup = parseInt((t.properties.smallSpeedup || 1) * SMALL_SPEED_INC);
            }
        }
        
        s.gfx.needMatrixUpdate = true;
    }
    
    // if making a new well, increase the size of the placeholder
    if(newWell) newWell.radius = Math.min(newWell.radius+newWell.radius/20, 40);
}
