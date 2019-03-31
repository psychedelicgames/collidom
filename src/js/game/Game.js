/**
 * Class encapsulating the client side of the game, handles drawing and
 * updates.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

 //calculamos dimensiones del usuario, usando dimensiones del div canvas-container
 //debería de usarse una id, en vez de una clase
 //correr función para acomodar acá on resize.

/**
 * Creates a game on the client side to manage and render the players,
 * projectiles, and powerups.
 * @constructor
 * @param {Object} socket The socket connected to the server.
 * @param {Leaderboard} leaderboard The Leaderboard object to update.
 * @param {Drawing} drawing The Drawing object that will render the game.
 * @param {ViewPort} viewPort The ViewPort object that will manage the player's view of the entities.
 */
function Game(socket, leaderboard, drawing, viewPort) {
  this.socket = socket;
  //this.leaderboard = leaderboard;
  this.drawing = drawing;
  this.viewPort = viewPort;
  this.self = null;
  this.players = [];
  this.projectiles = [];
  this.powerups = [];
  this.blocks = [];
  this.explosions = [];
  this.latency = 0;
  this.animationFrameId = 0;
  this.background_ready = 0;
}

/**
 * Factory method for the Game class.
 * @param {Object} socket The socket connected to the server.
 * @param {Element} canvasElement The HTML5 canvas to render the game on.
 * @param {Element} leaderboardElement The div element to render the leaderboard in.
 * @return {Game}
 */
Game.create = function(socket, canvasElement, leaderboardElement) {
  canvasElement.width = Constants.CANVAS_WIDTH;
  canvasElement.height = Constants.CANVAS_HEIGHT;
  var canvasContext = canvasElement.getContext('2d');

  //var leaderboard = Leaderboard.create(leaderboardElement);
  var drawing = Drawing.create(canvasContext);
  var viewPort = ViewPort.create();

  var game = new Game(socket, leaderboard, drawing, viewPort);
  game.init();
  return game;
};

/**
 * Initializes the game and sets the event handler for the server packets.
 */
Game.prototype.init = function() {
  this.socket.on('update', bind(this, function(data) {
    this.receiveGameState(data);
    //la información recibida acá posee la latencia del usuario...
    //quizás sea bueno usarla un poco más.
    //console.log(data);
  }));
};

/**
 * Updates the game's internal storage of all the powerups, called each time the server sends packets.
 * @param {Object} state An object containing the state of the game sent by the server.
 */
Game.prototype.receiveGameState = function(state) {
  //this.leaderboard.update(state['leaderboard']);
  this.self         = state['self'];
  this.players      = state['players'];
  this.projectiles  = state['projectiles'];
  this.powerups     = state['powerups'];
  this.blocks       = state['blocks'];
  this.explosions   = state['explosions'];
  this.latency      = state['latency'];
};

/**
 * This method begins the animation loop for the game.
 */
Game.prototype.animate = function() {
  this.animationFrameId = window.requestAnimationFrame( bind(this, this.run))
  //console.log(this.animationFrameId);
};

/**
 * This method stops the animation loop for the game.
 */
Game.prototype.stopAnimation = function() {
  window.cancelAnimationFrame(this.animationFrameId);
};

/**
 * This method is a convenience method that calls update and draw.
 */
Game.prototype.run = function() {
  this.update();
  this.draw();
  this.animate();
};

/**
 * Updates the state of the game client side and relays intents to the
 * server.
 */
Game.prototype.update = function() {

  if (this.self) {

    // console.time("framer");

    const canvas_hold       = document.getElementById('canvas-container');
    const canvas_hold_info  = canvas_hold.getBoundingClientRect();
    const canvas_hold_w     = canvas_hold_info.width;
    const canvas_hold_h     = canvas_hold_info.height;

    //armamos camera con la posición de la camera
    camera_x = this.self['camera_x'];
    camera_y = this.self['camera_y'];
    camera = {x: camera_x, y: camera_y};

    //armamos unidad con la posición del usuario
    var unidad_x = this.self['camera_x'];
    var unidad_y = this.self['camera_y'];
    unidad = {x: unidad_x, y: unidad_y};

    //armamos aim con la posición del cursor
    //var aim_x = Input.MOUSE[0] - Constants.CANVAS_WIDTH / 2;
    //var aim_y = Input.MOUSE[1] - Constants.CANVAS_HEIGHT / 2;
    //aim = {x: aim_x, y: aim_y};

    //calculamos el medio
    var usuario_x = (canvas_hold_w / 2);
    var usuario_y = (canvas_hold_h / 2);
    usuario = {x: usuario_x, y: usuario_y};

    //maximos menos medias
    var maxima_x = Constants.CANVAS_WIDTH - usuario.x;
    var maxima_y = Constants.CANVAS_HEIGHT - usuario.y;
    maxima = {x: maxima_x, y: maxima_y};

    //si el usuario se acerca a la máxima izquierda
    if (camera.x < usuario.x) { camera.x = usuario.x; this.viewPort.update(camera.x, camera.y) }
    //si el usuario se acerca a la máxima superior
    if (camera.y < usuario.y) { camera.y = usuario.y; this.viewPort.update(camera.x, camera.y) }
    //si el usuario se acerca a la máxima derecha
    if (camera.x > maxima.x) { camera.x = maxima.x; this.viewPort.update(camera.x, camera.y) }
    //si el usuario se acerca a la máxima inferior
    if (camera.y > maxima.y) { camera.y = maxima.y; this.viewPort.update(camera.x, camera.y) }
    //seguir al usuario
    else { this.viewPort.update(camera.x, camera.y); }

    //diferencia lineal camera unidad.
    var diferencia_camera_unidad_x = camera.x - unidad.x;
    var diferencia_camera_unidad_y = camera.y - unidad.y;
    diferencia_camera_unidad = {x: diferencia_camera_unidad_x, y: diferencia_camera_unidad_y};

    /************************************************************/
    /* calculamos el angulo de disparo **************************/

    //comenzamos por calcular el angulo de disparo
    var turretAngle = Math.atan2(
    //calculo la diferencia
    //calcular radianes desde la posición del player a la posición del cursor
    (Input.MOUSE[1] - Constants.CANVAS_HEIGHT / 2) + (diferencia_camera_unidad.y),
    (Input.MOUSE[0] - Constants.CANVAS_WIDTH / 2) + (diferencia_camera_unidad.x)
    ) + Math.PI / 2;


    /************************************************************/
    /* prevención de operaciones sin foco ***********************/

    //observamos al canvas y vemos si posee foco
    var canvas_focus = document.getElementById('canvas');
    var canvas_isFocused = (document.activeElement === canvas_focus);
    // console.log(canvas_isFocused);

    //si el canvas no posee foco, liberar varaibles
    if (canvas_isFocused == false) {
      //armamos acá la información para enviar al servidor
      Input.UP = false;
      Input.RIGHT = false;
      Input.DOWN = false;
      Input.LEFT = false;
      Input.LEFT_CLICK = false;
    };

    /************************************************************/
    /* armamos el pack con información para el server ***********/

    //armamos acá la información para enviar al servidor
    var pack = {
      'keyboardState': {
        'up':           Input.UP,
        'right':        Input.RIGHT,
        'down':         Input.DOWN,
        'left':         Input.LEFT
      },
      'turretAngle':    turretAngle,
      'shot':           Input.LEFT_CLICK,
      'timestamp':      (new Date()).getTime()
    };

    /************************************************************/
    /* emisión de información hacia el server *******************/

    //enviamos el input al servidor y analizamos el feedback
    this.socket.emit('player-action', pack, function(feedback) {
      //revisamos si disparó
      if (feedback && feedback.player_has_fired == 'yes') {
        //sacudimos el canvas en cualquier caso de disparo
        canvas_shake();
        //removemos el "wanna_fire", le interrumpimos el fuego.
        if(feedback.player_main_ammo != "Assassin MK1") {
          Input.LEFT_CLICK = false;
        }
        //salvo que posea una Assassin.
        if(feedback.player_main_ammo == "Assassin MK1") {
          //es obvio que se podría hacer con más elegancia.
          setTimeout(function(){ Input.LEFT_CLICK = false; }, 2000);
        }
        //reproducimos el sonido de la munición .
        if(feedback.player_main_ammo == "common") {
          sounds['./audio/ammo/common.mp3'].play();
          // $('#canvas').addClass('shake shake-slow');
        }
        else if(feedback.player_main_ammo == "Assassin MK1") {
          sounds['./audio/ammo/quick.mp3'].play();
        }
        else if(feedback.player_main_ammo == "Vladof relics 1.0") {
          sounds['./audio/ammo/fork.mp3'].play();
        }
        else {
          sounds['./audio/ammo/common.mp3'].play();
        }
      }
    })
  }

  //console.timeEnd("framer_posiciones");
};

function canvas_shake() {

  TweenMax.set("#canvas", {
    top: '50%',
    left: '50%',
    ease: RoughEase.ease.config({ template:  Power1.easeOut, strength: 1.5, points: 10, taper: "out", randomize:  true, clamp: true})
  });
  TweenMax.staggerTo("#canvas", 0.1, {
    top: R(50.02,50.15) + '%',
    left: R(50.02,50.15) + '%',
    delay: 0,
    ease: RoughEase.ease.config({ template:  Power1.easeOut, strength: 1.5, points: 10, taper: "out", randomize:  true, clamp: true}),
    force3D: true
  });
  TweenMax.staggerTo("#canvas", 0.1, {
    top: R(49.99,49.90) + '%',
    left: R(49.99,49.90) + '%',
    delay: 0.2,
    ease: RoughEase.ease.config({ template:  Power1.easeOut, strength: 1.5, points: 10, taper: "out", randomize:  true, clamp: true}),
    force3D: true
  });
  TweenMax.staggerTo("#canvas", 0.1, {
    top: '50%',
    left: '50%',
    delay: 0.3,
    ease: RoughEase.ease.config({ template:  Power1.easeOut, strength: 1.5, points: 10, taper: "out", randomize:  true, clamp: true}),
    force3D: true
  });

  TweenMax.set(".playing-footer-container", {
    bottom: '0px',
    left: '0px',
    ease: RoughEase.ease.config({ template:  Power1.easeOut, strength: 1.5, points: 10, taper: "out", randomize:  true, clamp: true})
  });
  TweenMax.staggerTo(".playing-footer-container", 0.1, {
    bottom: R(0,2) + 'px',
    left: R(0,2) + 'px',
    delay: 0,
    ease: RoughEase.ease.config({ template:  Power1.easeOut, strength: 1.5, points: 10, taper: "out", randomize:  true, clamp: true}),
    force3D: true
  });
  TweenMax.staggerTo(".playing-footer-container", 0.1, {
    bottom: R(-1,-2) + 'px',
    left: R(-1,-2) + 'px',
    delay: 0.2,
    ease: RoughEase.ease.config({ template:  Power1.easeOut, strength: 1.5, points: 10, taper: "out", randomize:  true, clamp: true}),
    force3D: true
  });
  TweenMax.staggerTo(".playing-footer-container", 0.1, {
    bottom: '0px',
    left: '0px',
    delay: 0.3,
    ease: RoughEase.ease.config({ template:  Power1.easeOut, strength: 1.5, points: 10, taper: "out", randomize:  true, clamp: true}),
    force3D: true
  });

  TweenMax.set(".player-hub", {
    bottom: '0px',
    left: '-100px'
  });
  TweenMax.staggerTo(".player-hub", 0.1, {
    bottom: R(-3,-0.3) + 'px',
    left: R(-103,-100.8) + 'px',
    delay: 0,
    ease: RoughEase.ease.config({ template:  Bounce.easeOut, strength: 1.5, points: 20, taper: "out", randomize:  true, clamp: false}),
    force3D: true
  });
  TweenMax.staggerTo(".player-hub", 0.1, {
    bottom: R(-1,-0.1) + 'px',
    left: R(-98,-99.5) + 'px',
    delay: 0.2,
    ease: RoughEase.ease.config({ template:  Bounce.easeOut, strength: 1.5, points: 20, taper: "out", randomize:  true, clamp: false}),
    force3D: true
  });
  TweenMax.staggerTo(".player-hub", 0.1, {
    bottom: '0px',
    left: '-100px',
    delay: 0.4,
    ease: RoughEase.ease.config({ template:  Bounce.easeOut, strength: 1.5, points: 20, taper: "out", randomize:  true, clamp: false}),
    force3D: true
  });

  function R(max,min){return Math.random()*(max-min)+min};
};

/**
 * Draws the state of the game onto the HTML5 canvas.
 */
Game.prototype.draw = function() {
  if (this.self) {

    //console.time("framer_draw");

    // Clear the canvas.
    this.drawing.clear();

    //acá es donde queremos supervisar
    stats.begin();

    //revisamos la condición de background,
    if (this.background_ready == 0) {
      //console.log('armando background, solo una vez');
      //background
      var center = this.viewPort.selfCoords;
      var leftX = this.self['x'] - Constants.CANVAS_WIDTH / 2;
      var topY = this.self['y'] - Constants.CANVAS_HEIGHT / 2;
      var drawStartX = Math.max( leftX - (leftX % Drawing.TILE_SIZE), Constants.WORLD_MIN);
      var drawStartY = Math.max( topY - (topY % Drawing.TILE_SIZE), Constants.WORLD_MIN);
      var drawEndX = Math.min( drawStartX + Constants.CANVAS_WIDTH + Drawing.TILE_SIZE, Constants.WORLD_MAX);
      var drawEndY = Math.min( drawStartY + Constants.CANVAS_HEIGHT + Drawing.TILE_SIZE, Constants.WORLD_MAX);
      posiciones = {};
      posiciones.x_minima = this.viewPort.toCanvasX(drawStartX),
      posiciones.y_minima = this.viewPort.toCanvasY(drawStartY),
      posiciones.x_maxima = this.viewPort.toCanvasX(drawEndX),
      posiciones.y_maxima = this.viewPort.toCanvasY(drawEndY),
      this.drawing.drawTiles(
          posiciones.x_minima,
          posiciones.y_minima,
          posiciones.x_maxima,
          posiciones.y_maxima,
          this.self['health']
      );
      // console.log(posiciones);
      //this.background_ready = 1;
    };

    // Draw the projectiles next.
    for (var i = 0; i < this.projectiles.length; ++i) {
      //console.log(this.projectiles[i]);
      this.drawing.drawBullet(
          this.viewPort.toCanvasCoords(this.projectiles[i]),
          this.projectiles[i]['orientation'],
          this.projectiles[i]['ammo'],
          this.viewPort.toCanvasX(this.projectiles[i]['source_x']),
          this.viewPort.toCanvasY(this.projectiles[i]['source_y'])
        );
    }

    // Draw the powerups next.
    for (var i = 0; i < this.powerups.length; ++i) {
      this.drawing.drawPowerup(
          this.viewPort.toCanvasCoords(this.powerups[i]),
          this.powerups[i]['name']
        );
    }

    //Draw the blocks next.
    for (var i = 0; i < this.blocks.length; ++i) {
      this.drawing.drawBlock(
          this.viewPort.toCanvasCoords(this.blocks[i]),
          this.blocks[i]['name']
        );
    }

    // Draw the explosion next.
    for (var i = 0; i < this.explosions.length; ++i) {
      this.drawing.drawExplosion( this.viewPort.toCanvasCoords(this.explosions[i]), this.explosions[i]);
      //this.drawing.foreground_rain();
      //mala idea, se ponen las cosas un poco pesadas :)
      //console.log(this.explosions);
    }

    // Draw the tank that represents the player.
    if (this.self) {
      //predefinimos shieldsize en null
      var shieldsize = null;
      //asociamos el escudo a una variable
      var shield = this.self['powerups']['shield_powerup'];
      //si posee escudo calculamos el valor
      if (shield != null && shield != undefined) {
      shieldsize = this.self['powerups']['shield_powerup']['data'];
      }
      //console.log('shield size: ' + shieldsize);
      this.drawing.drawTank(
          true,
          this.viewPort.toCanvasCoords(this.self),
          this.self['orientation'],
          this.self['turretAngle'],
          this.self['name'],
          this.self['kind'],
          this.self['health'],
          this.self['powerups']['shield_powerup'],
          shieldsize);
    }

    // Draw any other tanks.
    for (var i = 0; i < this.players.length; ++i) {
      //predefinimos shieldsize en null
      var shieldsize = null;
      //asociamos el escudo a una variable
      var shield = this.players[i]['powerups']['shield_powerup'];
      //si posee escudo calculamos el valor
      if (shield != null && shield != undefined) {
      shieldsize = this.players[i]['powerups']['shield_powerup']['data'];
      }
      //console.log('shield size: ' + shieldsize);
      this.drawing.drawTank(
          false,
          this.viewPort.toCanvasCoords(this.players[i]),
          this.players[i]['orientation'],
          this.players[i]['turretAngle'],
          this.players[i]['name'],
          this.players[i]['kind'],
          this.players[i]['health'],
          this.players[i]['powerups']['shield_powerup']);
    }

    //finalizamos las mediciones
    stats.end();
  }

   // console.timeEnd("framer");
};
