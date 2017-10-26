var Updater = {
    update: function(dt) {
        var n;
        var playerSegment = Util.findSegment(position+playerZ);
        var playerW       = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;
        
        var startPosition = position;
        
        Updater.updateCars(dt, playerSegment, playerW);
        
        Updater.updatePlayerPosition(dt);
    
        Updater.updatePlayerOnKey(playerSegment, dt);
    
        Updater.updatePlayerBoundaryCheck(playerSegment, playerW, dt);
        
        Updater.updateIfCollidingWithCar(playerSegment, playerW);
        
        Updater.updateBackgrounds(playerSegment, startPosition);
    }, 
    
    // update all the npc cars, and for each npc car, make sure they move out of the way of the player 
    // players can still crash into them of course
    updateCars: function(dt, playerSegment, playerW) {
        var n, car, oldSegment, newSegment;
        for(n = 0 ; n < cars.length ; n++) {
            car         = cars[n];
            oldSegment  = Util.findSegment(car.z);
            car.offset  = car.offset + Updater.updateCarOffset(car, oldSegment, playerSegment, playerW);
            car.z       = Util.increase(car.z, dt * car.speed, trackLength);
            car.percent = Util.percentRemaining(car.z, segmentLength); 
            newSegment  = Util.findSegment(car.z);
            if (oldSegment != newSegment) {
                index = oldSegment.cars.indexOf(car);
                oldSegment.cars.splice(index, 1);
                newSegment.cars.push(car);
            }
        }
    }, 

    updatePlayerPosition: function(dt) {
        position = Util.increase(position, dt * speed, trackLength);
    },

    updatePlayerOnKey: function(playerSegment, dt) {
        var speedPercent  = speed/maxSpeed;
        var dx = dt * 2 * speedPercent; 
    
        if (keyLeft)
            playerX = playerX - dx;
        else if (keyRight)
            playerX = playerX + dx;
        
        playerX = playerX - (dx * speedPercent * playerSegment.curve * centrifugal);
    
        if (keyFaster)
            speed = Util.accelerate(speed, accel, dt);
        else if (keySlower)
            speed = Util.accelerate(speed, braking, dt);
        else
            speed = Util.accelerate(speed, decel, dt);
    },

    updatePlayerBoundaryCheck: function(playerSegment, playerW, dt) {
        var sprite, spriteW;
        if ((playerX < -1) || (playerX > 1)) {
        
            if (speed > offRoadLimit)
                speed = Util.accelerate(speed, offRoadDecel, dt);

            // checks if colliding with billboards/trees
            for(n = 0 ; n < playerSegment.sprites.length ; n++) {
                sprite  = playerSegment.sprites[n];
                spriteW = sprite.source.w * SPRITES.SCALE;
                if (Util.overlap(playerX, playerW, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
                    speed = maxSpeed/5;
                    position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength); 
                    break;
                }
            }
        }
        playerX = Util.limit(playerX, -3, 3);     // dont ever let it go too far out of bounds
        speed   = Util.limit(speed, 0, maxSpeed); // or exceed maxSpeed
    },

    updateIfCollidingWithCar: function(playerSegment, playerW) {
        var car, carW;
        for(n = 0 ; n < playerSegment.cars.length ; n++) {
            car  = playerSegment.cars[n];
            carW = car.sprite.w * SPRITES.SCALE;
            if (speed > car.speed) {
                if (Util.overlap(playerX, playerW, car.offset, carW, 0.8)) {
                    speed    = car.speed * (car.speed/speed);
                    position = Util.increase(car.z, -playerZ, trackLength);
                    break;
                }
            }
        }
    }, 

    updateBackgrounds: function(playerSegment, startPosition) {
        skyOffset  = Util.increase(skyOffset,  skySpeed  * playerSegment.curve * (position-startPosition)/segmentLength, 1);
        hillOffset = Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);
        treeOffset = Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);
    },

    updateCarOffset: function(car, carSegment, playerSegment, playerW) {
        var i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = car.sprite.w * SPRITES.SCALE;
        
        // optimization, dont bother steering around other cars when 'out of sight' of the player
        if ((carSegment.index - playerSegment.index) > drawDistance)
            return 0;
        
        for(i = 1 ; i < lookahead ; i++) {
            segment = segments[(carSegment.index+i)%segments.length];
        
            if ((segment === playerSegment) && (car.speed > speed) && (Util.overlap(playerX, playerW, car.offset, carW, 1.2))) {
                if (playerX > 0.5)
                    dir = -1;
                else if (playerX < -0.5)
                    dir = 1;
                else
                    dir = (car.offset > playerX) ? 1 : -1;
                    return dir * 1/i * (car.speed-speed)/maxSpeed; 
            }
        
            for(j = 0 ; j < segment.cars.length ; j++) {
                otherCar  = segment.cars[j];
                otherCarW = otherCar.sprite.w * SPRITES.SCALE;
                if ((car.speed > otherCar.speed) && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) {
                    if (otherCar.offset > 0.5)
                        dir = -1;
                    else if (otherCar.offset < -0.5)
                        dir = 1;
                    else
                        dir = (car.offset > otherCar.offset) ? 1 : -1;
                        return dir * 1/i * (car.speed-otherCar.speed)/maxSpeed;
                }
            }
        }
        
        // if no cars ahead, but I have somehow ended up off road, then steer back on
        if (car.offset < -0.9)
            return 0.1;
        else if (car.offset > 0.9)
            return -0.1;
        else
            return 0;
    }
}
