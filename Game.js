var Game = {  
	// just runs the game.
	run: function() {
		var images = ["background", "sprites"];
		Game.loadImages(images, function(images) {
			background = images[0];
			sprites = images[1];
			Util.reset();

			Game.setKeyListener(
				[{ keys: [KEY.LEFT,  KEY.A], mode: 'down', action: function() { keyLeft   = true;  } },
				{ keys: [KEY.RIGHT, KEY.D], mode: 'down', action: function() { keyRight  = true;  } },
				{ keys: [KEY.UP,    KEY.W], mode: 'down', action: function() { keyFaster = true;  } },
				{ keys: [KEY.DOWN,  KEY.S], mode: 'down', action: function() { keySlower = true;  } },
				{ keys: [KEY.LEFT,  KEY.A], mode: 'up',   action: function() { keyLeft   = false; } },
				{ keys: [KEY.RIGHT, KEY.D], mode: 'up',   action: function() { keyRight  = false; } },
				{ keys: [KEY.UP,    KEY.W], mode: 'up',   action: function() { keyFaster = false; } },
				{ keys: [KEY.DOWN,  KEY.S], mode: 'up',   action: function() { keySlower = false; } }]);
			
			var now = null,
				last = Util.timestamp(),
				dt = 0;
				gdt = 0;
			
			function frame() {
        		now = Util.timestamp();
        		dt  = Math.min(1, (now - last) / 1000); //requestAnimationFrame will help
        		gdt = gdt + dt;
        		while (gdt > step) {
					gdt = gdt - step;
					// update the state of the game based on the step (dt)
          			Updater.update(step);
        		}
        		Renderer.render();
				last = now;
				// requestAnimationFrame in js helps synch game graphic over large dt change
        		requestAnimationFrame(frame, canvas); // loop
      		}
      		frame(); 
      		Game.playMusic();
		});
	},
	  
  	loadImages: function(names, callback) { 
    	var result = [];
    	var count  = names.length;

    	var onload = function() {
      		if (--count == 0)
        	callback(result);
    	};

    	for(var n = 0 ; n < names.length ; n++) {
      		var name = names[n];
      		result[n] = document.createElement('img');
      		Dom.on(result[n], 'load', onload);
      		result[n].src = "images/" + name + ".png";
    	}
	},
	  
  	setKeyListener: function(keys) {
    	var onkey = function(keyCode, mode) {
      		var n, k;
      		for(n = 0 ; n < keys.length ; n++) {
        		k = keys[n];
        		k.mode = k.mode || 'up';
        		if ((k.key == keyCode) || (k.keys && (k.keys.indexOf(keyCode) >= 0))) {
          			if (k.mode == mode) {
            			k.action.call();
          			}
        		}
      		}
    	};
    	Dom.on(document, 'keydown', function(ev) { onkey(ev.keyCode, 'down'); } );
    	Dom.on(document, 'keyup',   function(ev) { onkey(ev.keyCode, 'up');   } );
  	},

  	playMusic: function() {
    	var music = Dom.get('music');
    	music.loop = true;
    	music.volume = 0.50; 
    	music.muted = (Dom.storage.muted === "true");
    	music.play();
    	Dom.toggleClassName('mute', 'on', music.muted);
    	Dom.on('mute', 'click', function() {
      		Dom.storage.muted = music.muted = !music.muted;
      		Dom.toggleClassName('mute', 'on', music.muted);
    	});
  	}
}