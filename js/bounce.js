function doBounces(shot, blocks, canvas_height, canvas_width) {
    var s = shot,
        hasBounced = false;
    for(var j=0; j < blocks.length; ++j) {
        var block = blocks[j];
        // if the shot would be inside this block at the end of the move, bounce it
        if(s.dx + s.gfx.x > block.gfx.x && s.dx + s.gfx.x < block.gfx.x +  block.gfx.width &&
           s.dy + s.gfx.y > block.gfx.y && s.dy + s.gfx.y < block.gfx.y +  block.gfx.height) {
            // check if it started the move from the left or right, top or bottom
            var started_left = s.gfx.x <= block.gfx.x + block.gfx.width/2;
            var started_above = s.gfx.y <= block.gfx.y + block.gfx.height/2;
            
            // if shot starts with an x outside the box's x range
            if(s.gfx.x <= block.gfx.x || s.gfx.x >= block.gfx.x + block.gfx.width) {

                var distance = started_left ? s.gfx.x - block.gfx.x : block.gfx.x + block.gfx.width - s.gfx.x, // get distance from the nearest boundary
                    fraction_of_dx = distance / s.dx, // find the percentage of dx that this distance is
                    partial_dy = s.dy * fraction_of_dx; // find that same percentace of dy

                // if the y traversed while the shot is reaching the
                // x-boundary of the box is enough to get the shot to cross
                // the y-boundary, we have entered from the right or left
                // side, not the top or bottom
                if(s.gfx.y + partial_dy > block.gfx.y && s.gfx.y + partial_dy < block.gfx.y +  block.gfx.height) {
                    if(started_left) { s.gfx.x = 2*block.gfx.x - (s.gfx.x + s.dx); }
                    else { s.gfx.x = 2*(block.gfx.x+block.gfx.width) - (s.gfx.x + s.dx); }
                    s.dx *= -1;
                    hasBounced = true;
                } else {
                    if(started_above) { s.gfx.y = 2*block.gfx.y - (s.gfx.y + s.dy); }
                    else { s.gfx.y = 2*(block.gfx.y+block.gfx.height) - (s.gfx.y + s.dy); }
                    s.dy *= -1;
                    hasBounced = true;
                }
            } else {
                if(s.gfx.y <= block.gfx.y || s.gfx.y >= block.gfx.y + block.gfx.height    ) {
                    // the short started directly below the block
                    if(started_above) { s.gfx.y = 2*block.gfx.y - (s.gfx.y + s.dy); }
                    else { s.gfx.y = 2*(block.gfx.y+block.gfx.height) - (s.gfx.y + s.dy); }
                    s.dy *= -1;
                    hasBounced = true;
                } else {
                    // TODO: the shot started inside the block
                    // (this should never happen, but may if, e.g., the block was dragged over the shot)
                    if(started_left) { s.gfx.x = 2*block.gfx.x - (s.gfx.x + s.dx); }
                    else { s.gfx.x = 2*(block.gfx.x+block.gfx.width) - (s.gfx.x + s.dx); }
                    s.dx *= -1;
                    hasBounced = true;
                }
            }
        }
    }

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

    return hasBounced;
}
