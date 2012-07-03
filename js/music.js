function addPlayButton(canvas) {
    mutebutton = new CanvasNode({fill:"white", x:canvas.width-25, y:25, opacity:0.4, zIndex:-1000});
    mutebutton.append(new Polygon([-5,-5, -5,5, 0,5, 5,10, 5,-10, 0,-5], {fill: "white"}));

    var nosound = new CanvasNode();
    nosound.append(new Circle(15, {fill:"none", stroke:"white", strokeWidth:2}))
    nosound.append(new Line(11,11,-11,-11, {fill:"none", stroke:"white", strokeWidth:2}))

    soundwaves = new CanvasNode();
    soundwaves.append(new Line(10,0,17,0, {fill:"none", stroke:"white", strokeWidth:2}))
    soundwaves.append(new Line(10,5,16,9, {fill:"none", stroke:"white", strokeWidth:2.5}))
    soundwaves.append(new Line(10,-5,16,-9, {fill:"none", stroke:"white", strokeWidth:2.5}))

    mutebutton.addEventListener("mousedown", function() {
        var music = $("#music")[0];
        if(music.paused) {
            allowClick();
            mutebutton.removeChild(nosound);
            mutebutton.append(soundwaves);
            music.play();
        } else {
            allowClick();
            mutebutton.removeChild(soundwaves);
            mutebutton.append(nosound);
            music.pause();
        }
    });
    mutebutton.append(nosound);
    canvas.append(mutebutton);
}
