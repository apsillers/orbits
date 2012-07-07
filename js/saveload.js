saveLoad = {
    saveState: function() {
        var state = {};
        state.shots = [];
        state.targets = [];
        state.emitters = [];
        state.blocks = [];
        for(var i=0, l=shots.length; i<l; ++i) {
            var s = shots[i];
            if(s.static && s.userMade) {
                state.shots.push({
                    static: true,
                    userMade: true,
                    power: s.power,
                    consuming: s.consuming,
                    x: s.gfx.x,
                    y: s.gfx.y,
                    radius: s.gfx.radius
                });
            }
        }

        for(var i=0, l=targets.length; i<l; ++i) {
            var t = targets[i];
            state.targets.push({
                color: t.gfx.fill,
                x: t.gfx.x,
                y: t.gfx.y,
                text: t.text,
                radius: t.radius,
                properties: t.properties
            });
        }

        for(var i=0, l=emitters.length; i<l; ++i) {
            var e = emitters[i];
            state.emitters.push({
                color: e.gfx.fill,
                x: e.gfx.x,
                y: e.gfx.y,
                rotation: e.gfx.rotation
            });
        }

        for(var i=0, l=blocks.length; i<l; ++i) {
            var b = blocks[i];
            state.blocks.push({
                color: b.gfx.fill,
                x: b.gfx.x,
                y: b.gfx.y,
                width: b.gfx.width,
                height: b.gfx.height,
                hp: b.hp,
                mobile: b.mobile,
                rotation: b.gfx.rotation instanceof Array ? b.gfx.rotation[0] : b.gfx.rotation
            });
        }

        return JSON.stringify(state);
    },


    loadState: function(state) {
        if(typeof state == "string") state = JSON.parse(state);

        for(var i=0, l=state.shots.length; i<l; ++i) {
             new Well(state.shots[i]);
        }

        for(var i=0, l=state.targets.length; i<l; ++i) {
             new Target(state.targets[i]);
        }

        for(var i=0, l=state.emitters.length; i<l; ++i) {
             new Emitter(state.emitters[i]);
        }

        for(var i=0, l=state.blocks.length; i<l; ++i) {
             new Block(state.blocks[i]);
        }
    },

    /* clears out targets, emitters, shots, and wells */
    clearEverything: function() {
        while(typeof shots[0] != "undefined") {
             shots[0].remove();
        }
        while(typeof targets[0] != "undefined") {
             targets[0].remove();
        }
        while(typeof emitters[0] != "undefined") {
             emitters[0].remove();
        }

        while(typeof blocks[0] != "undefined") {
             blocks[0].remove();
        }
    }
}
// bind to the save/load buttons
$(function() {
    $("#state-save").on("click", function() {
        var stateString = saveLoad.saveState();
        $("#state-dump").val(stateString);
        window.location.hash = "#" + btoa(stateString);
    });

    $("#state-load").on("click", function() {
        saveLoad.clearEverything();
        saveLoad.loadState($("#state-dump").val());
    });

    $("#state-sample").on("click", function() {
        saveLoad.clearEverything();
        saveLoad.loadState('{"shots":[{"static":true,"userMade":true,"power":600,"consuming":true,"x":419,"y":275,"radius":40}],"targets":[{"color":"#0ff","x":321,"y":315,"text":"Faster","properties":{"gravReaction":"4","smallSpeedup":"1","smallSlowdown":"1","gravPull":"0","speedFactor":"5","radius":"2","edible":true}},{"color":"#ff0","x":525,"y":325,"text":"Slower","properties":{"gravReaction":"2","smallSpeedup":"1","smallSlowdown":"1","gravPull":"0","speedFactor":"3","radius":"2","edible":true}}],"emitters":[{"color":"purple","x":462,"y":356,"rotation":[0,0,0]},{"color":"purple","x":365,"y":346,"rotation":[-3.141592653589793,0,0]}],"blocks":[]}');
    });
});
