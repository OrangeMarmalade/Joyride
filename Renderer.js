// using this var as a better basis to give more meaning and easy to access calls.
var Renderer = {

    // we get all of the helper functions (below) together into one function to render all assets
    render: function() {
          
        var baseSegment = Util.findSegment(position);
        var basePercent = Util.percentRemaining(position, segmentLength);
        var playerSegment = Util.findSegment(position+playerZ);
        var playerPercent = Util.percentRemaining(position+playerZ, segmentLength);
        var playerY = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
        var maxy = height;
          
        var x  = 0;
        var dx = - (baseSegment.curve * basePercent);
          
	    ctx.clearRect(0, 0, width, height);
          
        Renderer.background(ctx, background, width, height, BACKGROUND.SKY,   skyOffset,  resolution * skySpeed  * playerY);
        Renderer.background(ctx, background, width, height, BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
        Renderer.background(ctx, background, width, height, BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);
          
        var n, i, segment, car, sprite, spriteScale, spriteX, spriteY;
          
        // based on the draw distance, we will draw the graphics segment by segment
        for(n = 0 ; n < drawDistance ; n++) {
          
            segment = segments[(baseSegment.index + n) % segments.length];
            segment.looped = segment.index < baseSegment.index;
            segment.fog = Util.exponentialFog(n/drawDistance, fogDensity);
            segment.clip = maxy;
          
            Util.project(segment.p1, (playerX * roadWidth) - x,      playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);
            Util.project(segment.p2, (playerX * roadWidth) - x - dx, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);
          
            x  = x + dx;
            dx = dx + segment.curve;
          
            if ((segment.p1.camera.z <= cameraDepth)         || 
                (segment.p2.screen.y >= segment.p1.screen.y) || 
                (segment.p2.screen.y >= maxy))              
                continue;
          
            Renderer.segment(ctx, width, lanes,
                    	    segment.p1.screen.x,
                            segment.p1.screen.y,
                            segment.p1.screen.w,
                            segment.p2.screen.x,
                            segment.p2.screen.y,
                            segment.p2.screen.w,
                            segment.fog,
                            segment.color);
          
            maxy = segment.p1.screen.y;
	    }
          
        for(n = (drawDistance-1) ; n > 0 ; n--) {
            segment = segments[(baseSegment.index + n) % segments.length];
          
    	    for(i = 0 ; i < segment.cars.length ; i++) {
        	    car = segment.cars[i];
       		    sprite = car.sprite;
    	        spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
    	        spriteX = Util.interpolate(segment.p1.screen.x, segment.p2.screen.x, car.percent) + (spriteScale * car.offset * roadWidth * width/2);
    	        spriteY = Util.interpolate(segment.p1.screen.y, segment.p2.screen.y, car.percent);
    	        Renderer.sprite(ctx, width, height, resolution, roadWidth, sprites, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
    	    }
          
    	    for(i = 0 ; i < segment.sprites.length ; i++) {
    	        sprite = segment.sprites[i];
    	        spriteScale = segment.p1.screen.scale;
    	        spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * roadWidth * width/2);
    	        spriteY = segment.p1.screen.y;
    	        Renderer.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
    	    }
          
    	    if (segment == playerSegment) {
    	        Renderer.player(ctx, width, height, resolution, roadWidth, sprites, speed/maxSpeed,
    	                        cameraDepth/playerZ,
    	                        width/2,
    	                        (height/2) - (cameraDepth/playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height/2),
    	                        speed * (keyLeft ? -1 : keyRight ? 1 : 0),
    	                        playerSegment.p2.world.y - playerSegment.p1.world.y);
    	    }
	    }
    },

    // basic function to draw a four cornered polygon, used to draw the roads and rumbleline
    polygon: function(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    },
    // function to draw each segment unto the canvas.
    segment: function(ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {

        var r1 = Renderer.rumbleWidth(w1, lanes),
            r2 = Renderer.rumbleWidth(w2, lanes),
            l1 = Renderer.laneMarkerWidth(w1, lanes),
            l2 = Renderer.laneMarkerWidth(w2, lanes),
            lanew1, lanew2, lanex1, lanex2, lane;
    
            ctx.fillStyle = color.grass;
            ctx.fillRect(0, y2, width, y1 - y2);
    
            Renderer.polygon(ctx, x1-w1-r1, y1, x1-w1, y1, x2-w2, y2, x2-w2-r2, y2, color.rumble);
            Renderer.polygon(ctx, x1+w1+r1, y1, x1+w1, y1, x2+w2, y2, x2+w2+r2, y2, color.rumble);
            Renderer.polygon(ctx, x1-w1, y1, x1+w1, y1, x2+w2, y2, x2-w2, y2, color.road);
    
            if (color.lane) {
                lanew1 = w1*2/lanes;
                lanew2 = w2*2/lanes;
                lanex1 = x1 - w1 + lanew1;
                lanex2 = x2 - w2 + lanew2;
                for(lane = 1 ; lane < lanes ; lanex1 += lanew1, lanex2 += lanew2, lane++)
                    Renderer.polygon(ctx, lanex1 - l1/2, y1, lanex1 + l1/2, y1, lanex2 + l2/2, y2, lanex2 - l2/2, y2, color.lane);
            }
    
        Renderer.fog(ctx, 0, y1, width, y2-y1, fog);
    },

    // background scenery needs to include parallax effect, hence there would be rotation and offset
    // based on player location
    background: function(ctx, background, width, height, layer, rotation, offset) {

        rotation = rotation || 0;
        offset   = offset   || 0;

        var imageW = layer.w/2;
        var imageH = layer.h;

        var sourceX = layer.x + Math.floor(layer.w * rotation);
        var sourceY = layer.y
        var sourceW = Math.min(imageW, layer.x+layer.w-sourceX);
        var sourceH = imageH;
    
        var destX = 0;
        var destY = offset;
        var destW = Math.floor(width * (sourceW/imageW));
        var destH = height;

        ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
        if (sourceW < imageW)
      	    ctx.drawImage(background, layer.x, sourceY, imageW-sourceW, sourceH, destW-1, destY, width-destW, destH);
    },

    sprite: function(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY, offsetX, offsetY, clipY) {

        var destW  = (sprite.w * scale * width/2) * (SPRITES.SCALE * roadWidth);
        var destH  = (sprite.h * scale * width/2) * (SPRITES.SCALE * roadWidth);

        destX = destX + (destW * (offsetX || 0));
        destY = destY + (destH * (offsetY || 0));

        var clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;
        if (clipH < destH)
            ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h*clipH/destH), destX, destY, destW, destH - clipH);
    },

    player: function(ctx, width, height, resolution, roadWidth, sprites, speedPercent, scale, destX, destY, steer, updown) {

        var bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1,1]);
        var sprite;
        if (steer < 0)
            sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
        else if (steer > 0)
            sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
        else
            sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;

        Renderer.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1);
    },

    fog: function(ctx, x, y, width, height, fog) {
        if (fog < 1) {
            ctx.globalAlpha = (1-fog)
            ctx.fillStyle = COLORS.FOG;
            ctx.fillRect(x, y, width, height);
            ctx.globalAlpha = 1;
        }
    },

    rumbleWidth:     function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(6,  2*lanes); },
    laneMarkerWidth: function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(32, 8*lanes); },  
}
