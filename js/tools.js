newWell = null;
newWellTimeout = null;
newEmitter = null;
newEmitterTimeout = null;
newBlock = null;
newBlockTimeout = null;
currentTool = null;

function initTools() {
    $(canvas.canvas).on("mousedown", function(e) {
        var offset = $(this).offset();
        var offsetX = e.pageX - offset.left;
        var offsetY = e.pageY - offset.top;
        if(e.ctrlKey) {
            return;
        }
        if(currentTool == "targets") {
            new Target({color:$("#tool-color").val(), x:offsetX, y:offsetY, text:$("#tool-name").val(),
                        properties:propertiesFromTool()});
        } else if(currentTool == "wells") {
            // create newWell placeholder
            if(!newWell && !newWellTimeout) {
                // start making a new well (if no one cancels the timeout)
                newWellTimeout = setTimeout(function() {
                    newWell = new Circle(BASE_WELL_SIZE, {fill:"#444", x:offsetX, y:offsetY});
                    canvas.appendChild(newWell);
                    newWellTimeout = null;
                }, 20);
            }
        } else if(currentTool == "emitters") {
            if(!newEmitter && !newEmitterTimeout) {
            // start making a new emitter (if no one cancels the timeout)
                newEmitterTimeout = setTimeout(function() {
                    newEmitter = new Polygon([-10, 10, -10, -10, 10, 0], {fill:"purple", opacity:0.5, x:offsetX, y:offsetY});
                    canvas.appendChild(newEmitter);
                    newEmitterTimeout = null;
                }, 20);
            }
        } else if(currentTool == "blocks") {
            if(!newBlock && !newBlockTimeout) {
                // start making a new emitter (if no one cancels the timeout)
                newBlockTimeout = setTimeout(function() {
                    newBlock = new Rectangle(0, 0, {fill:"gray", opacity:0.5, x:offsetX, y:offsetY});
                    canvas.appendChild(newBlock);
                    newBlockTimeout = null;
                }, 20);
            }
        }
    });

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
            newEmitter.needMatrixUpdate = true;
            console.log("sup", newEmitter.rotation)
        }
        if(newBlock) {
            newBlock.width = offsetX - newBlock.x ;
            newBlock.height = offsetY - newBlock.y;
        }
    });

    // turn newWell into a real well
    $(canvas.canvas).on("mouseup", function(e) {
        var offset = $(this).offset();
        var offsetX = e.pageX - offset.left;
        var offsetY = e.pageY - offset.top;
        if(currentTool == "wells") {
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
        } else if(currentTool == "emitters") {
            if(newEmitter) {
                newEmitter.opacity = 1;
                new Emitter({ gfx:newEmitter, rotation:newEmitter.rotation, x:newEmitter.x, y:newEmitter.y });
                newEmitter = null;
            } else if(newEmitterTimeout != null) {
                newEmitter = null;
                clearTimeout(newEmitterTimeout);
                newEmitterTimeout = null;
            }
        } else if(currentTool == "blocks") {
            if(newBlock) {
                newBlock.opacity = 1;
                new Block({ gfx:newBlock, color:"gray",
                            mobile:$("#blocks-mobile").attr("checked")=="checked",
                            hp:$("#blocks-destructable").attr("checked") ? $("#blocks-hp").val() : 0 });
                newBlock = null;
            } else if(newBlockTimeout != null) {
                clearTimeout(newBlockTimeout);
                newBlockTimeout = null;
            }
        }
    }); 
}
