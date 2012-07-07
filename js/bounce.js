function doBounces(shot, blocks, canvas_height, canvas_width) {
    var s = shot,
        collisionResults = null;
    for(var j=0; j < blocks.length; ++j) {
        var block = blocks[j];
        var ex = s.dx + s.gfx.x,
            ey = s.dy + s.gfx.y;

        collisionResults = LinAlg.vectorToBoxCollision(s, block, collisionResults);
    }


    if(!collisionResults) {
        // move shots; bounce shots off walls if out of bounds
        if(s.dx + s.gfx.x > canvas_width) {
            s.gfx.x = 2*canvas_width - (s.gfx.x + s.dx);
            s.dx *= -1;
            hasBounced = true;
        } else if(s.dx + s.gfx.x < 0) {
            s.gfx.x = -(s.gfx.x + s.dx);
            s.dx *= -1;
            hasBounced = true;
        } else {
            s.gfx.x += s.dx;
        }

        if(s.dy + s.gfx.y > canvas_height) {
            s.gfx.y = 2*canvas_height - (s.gfx.y + s.dy);
            s.dy *= -1;
            hasBounced = true;
        } else if(s.dy + s.gfx.y < 0) {
            s.gfx.y = -(s.gfx.y + s.dy);
            s.dy *= -1;
            hasBounced = true;
        } else {
            s.gfx.y += s.dy;
        }
    } else {
        var n = {x: Math.cos(collisionResults.normalAngle), y:-Math.sin(collisionResults.normalAngle)};
        var v = {x: s.dx, y: s.dy};
        var m = LinAlg.multiplyPoint(n, (-2*LinAlg.dotProduct(n, v)));
        v = LinAlg.sumPoints(v, m);
        s.dx = v.x;
        s.dy = v.y;
    }

    // if the shot is still out of bounds after the bounce, give up: it has moved away further than the length of the arena
    if(s.dx + s.gfx.x > canvas_width || s.dx + s.gfx.x < 0 || s.dy + s.gfx.y > canvas_height || s.dy + s.gfx.y < 0) {
        return false;
    }

    return !!collisionResults;
}

LinAlg = {
    vectorToBoxCollision: function(shot, box, collisionBest) {
        var closestCol = collisionBest?collisionBest.closestCollision:null,
            normalAngle = collisionBest?collisionBest.normalAngle:null;

        var sx = shot.gfx.x,
            sy = shot.gfx.y,
            ex = shot.gfx.x + shot.dx,
            ey = shot.gfx.y + shot.dy,
            rot = box.gfx.rotation instanceof Array ? -box.gfx.rotation[0] : -(box.gfx.rotation || 0);

        var b = [];
        b[0] = {x:box.gfx.x, y:box.gfx.y},
        b[1] = {x:b[0].x + box.gfx.width * Math.cos(rot), y:b[0].y - box.gfx.width * Math.sin(rot)},
        b[2] = {x:b[1].x + box.gfx.height * Math.sin(rot), y:b[1].y + box.gfx.height * Math.cos(rot)},
        b[3] = {x:b[2].x - box.gfx.width * Math.cos(rot), y:b[2].y + box.gfx.width * Math.sin(rot)};

        for(var i=0; i < 4; ++i) {
            var result = LinAlg.lineIntersect(sx, sy, ex, ey,
                                       b[i].x, b[i].y, b[(i+1)%4].x, b[(i+1)%4].y);

            if(result) {
                if(!closestCol || Math.pow(sx-closestCol[0],2)+Math.pow(sy-closestCol[1],2) > Math.pow(sx-result[0],2)+Math.pow(sy-result[1],2)) {
                    closestCol = result;
                    normalAngle = [rot-Math.PI/2, rot, rot+Math.PI/2, rot][i];
                }
            }
        }

        return closestCol ? {closestCollision: closestCol, normalAngle: normalAngle} : null;
    },

    lineIntersect: function(x1, y1, x2, y2,
                            x3, y3, x4, y4) {
        var mua,mub;
        var denom,numera,numerb;
        var x, y;
        var EPS = 0.0000001;

        denom = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1);
        numera = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3);
        numerb = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3);

        /* Are the line coincident? 
           TODO: this means that the vector colides at the earliest point of intersection */
        if (Math.abs(numera) < EPS && Math.abs(numerb) < EPS && Math.abs(denom) < EPS) {
            x = (x1 + x2) / 2;
            y = (y1 + y2) / 2;
            return {x:x, y:y};
        }

        /* Are the line parallel */
        if (Math.abs(denom) < EPS) {
            return false;
        }

        /* Is the intersection along the the segments */
        mua = numera / denom;
        mub = numerb / denom;
        if (mua < 0 || mua > 1 || mub < 0 || mub > 1) {
            return false;
        }

        x = x1 + mua * (x2 - x1);
        y = y1 + mua * (y2 - y1);
        return {x:x, y:y};
    },

    dotProduct: function(x1, y1, x2, y2) {
        if(x1 instanceof Object && y1 instanceof Object)
            return x1.x*y1.x + x1.y*y1.y;
        else
            return x1*x2 + y1*y2;
    },

    sumPoints: function(p1, p2) {
        return {x: p1.x + p2.x, y: p1.y + p2.y};
    },

    multiplyPoint: function(p, c) {
        return {x: p.x * c, y: p.y * c};
    }
}
