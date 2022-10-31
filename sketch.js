const resource = {
  entity: null,
  player: null,
  collection: null,
  background: null,
  heart: null,
  heartlose: null,
};

const audio = {
  got: null,
  hurt: null,
  zombiespawn: null,
  menu_music: null,
  game_music: null,
}

var game;

function preload(){
  let files = [ 
    {  name: "player", url: "src/game_player.png" }, 
    { name: "entity", url: "src/game_zombie.png" }, 
    { name: "collection", url:"src/game_pumpkin.png" },
    { name: "background", url:"src/background.jpg" },
    { name:"heart", url:"src/heart.png" },
    { name:"heartlose", url:"src/heart-lose.png" },
  ];
  for( let file of files ){
    resource[ file.name ] = loadImage( file.url );
  }
  let audioFiles = [
    {name:"got", url:"src/got-it.mp3"},
    {name:"hurt", url:"src/hurt.m4a"},
    {name:"zombiespawn", url:"src/zombie-spawn.m4a"},
    {name:"menu_music", url:"src/menu_music.m4a"},
    {name:"game_music", url:"src/game_music.m4a"},
  ]
  for(let file of audioFiles){
    audio[file.name] = loadSound( file.url );
  }
}

function player1CtrlMouse( event, player ){
  
  player.move = true;
  player.target.set( mouseX - player.hitbox.w/2, mouseY - player.hitbox.h/2 );
}

function Charactor( { position, hitbox, picture, ctrl, automove } ){
  this.hp = 10;
  this.pos = position || createVector( 0, 0 );
  this.hitbox = hitbox || new Hitbox( picture.width, picture.height );
  this.picture = picture;
  this.movement = createVector( 5, 5 );
  this.move = false;
  this.destory = false;
  this.automove = automove || function( ){};
  this.collect = 0;
  this.target = createVector( 0, 0 );
  if( ctrl && ctrl.mousedown ){
    window.addEventListener( 'mousedown', ( event ) => {
      ctrl.mousedown( event, this );
    });
  }
  
  if( ctrl && ctrl.touchstart ){
    window.addEventListener( 'touchstart', ( event ) => {
      ctrl.touchstart( event, this );
    });
  }
}

Charactor.prototype.run = function( ){
  if( this.move ){
    let dirx = this.pos.x - this.target.x < 0 ? this.movement.x : -this.movement.x;
    let diry = this.pos.y - this.target.y < 0 ? this.movement.y : -this.movement.y;

    this.pos.add( dirx, diry );
  }
  this.automove( );
}

Charactor.prototype.draw = function(){
  let { w, h } = this.hitbox;
  let { x, y } = this.pos;
  image( this.picture,x,y,w,h );
}

Charactor.prototype.detect = function( target ){
  // target = another Charactor
  let player = this;
  // check player postion and target position
  let { x, y } = player.pos;
  let { w, h } = player.hitbox;
  let { x: tx, y: ty } = target.pos;
  let { w: tw, h: th } = target.hitbox;
  if( x < tx + tw && x + w > tx && y < ty + th && y + h > ty ){
    return true;
  }
  return false;
}

function Hitbox( w, h ){
  this.w = w;
  this.h = h;
}

function Game(){
  this.gamemode = 0;
  // 0 => not start
  // 1 => started
  // 2 => introduction
  // 3 => gameover
  let self = this;
  this.players = [];
  this.entitys = [];
  this.collection = [];
  this.spawn_method_1 = function( ){
    self.entitys.push(
      new Charactor(
        {
          position: createVector( random(100, width-100) , random(100, height-100) ),
          hitbox: new Hitbox( 64, 32 ),
          picture: resource['entity'],
          automove: function( ){
            this.pos.add( random(-1,1), random(-1,1) );
          }
        }
      )
    )
    audio['zombiespawn'].play( );
  }
  this.spawn_method_2 = function( ){
    // point base entitys spwan
    self.entitys.push(
      new Charactor(
        {
          position: createVector( random(100, width-100) , random(100, height-100) ),
          hitbox: new Hitbox( 64, 64 ),
          picture: resource['entity'],
          automove: function( ){
            // get player[0] position and follow him
            let { x, y } = game.players[0].pos;
            let dirx = (this.pos.x - x < 0 ? this.movement.x : -this.movement.x)/10;
            let diry = (this.pos.y - y < 0 ? this.movement.y : -this.movement.y)/10;
            this.pos.add( dirx, diry );
          }
        }
      )
    )
    audio['zombiespawn'].play( );
  }
}
Game.prototype.start = function(){
  this.gamemode = 1;
  this.players = [];
  this.entitys = [];
  this.collection = [];
  // this.started = true;
  this.players.push( 
    new Charactor( 
      { 
        position: createVector( width/2, height/2 ),
        hitbox: new Hitbox( 128, 128 ),
        picture: resource['player'],
        ctrl: {
          mousedown: player1CtrlMouse,
          touchstart: player1CtrlTouch
        }
      }
    ) 
  );
}

function player1CtrlTouch( event, player ){
  console.log( event );
}



Game.prototype.run = function(){
  // background( 51 );
  background( resource['background'] );
  for(let player of this.players){
    // draw player hp
    if( player.hp === 0 ){
      player.destory = true;
      this.gamemode = 3;
    }
    for(let i = 0 ; i < 10 ; i++ ){
      if( i < player.hp ){
        image( resource['heart'], 10 + i*30, 10, 30, 30 );
      }else{
        image( resource['heartlose'], 10 + i*30, 10, 30, 30 );
      }
      
    }
    fill(255);
    textSize( 32 );
    let content = `Collect: ${player.collect} pumpkin`;
    text( content, width - textWidth( content ) - 10, 32 );
    // text( `You got ${player.collect} pumpkin`, 0, 20 );
    player.run();
    player.draw();
    for(let pumpkin of this.collection){
      let hit = pumpkin.detect( player );
      if( hit && pumpkin.destory === false ){
        pumpkin.destory = true;
        audio['got'].play();
        player.collect++;
        if( player.collect % 10 == 0 ){
          console.log( this );
          this.spawn_method_2();
        }
      }
    }

    for( let entity of this.entitys ){
      let hit = entity.detect( player );
      if( hit ){
        player.hp --;
        entity.destory = true;
        audio['hurt'].play();
      }
    }
  }
  
  for(let i = 0 ; i<this.collection.length;i++){
    let item = this.collection[i];
    item.draw( );
    if( item.destory ){
      this.collection.splice( i, 1 );
      i--;
    }
  }
  
  
  
  // collection spwan condition
  if( this.collection.length < 3 ){
    this.collection.push( 
      new Charactor(
        { 
          position: createVector( random(100, width-100) , random(100, height-100) ),
          hitbox: new Hitbox( 64, 64 ),
          picture: resource['collection'],
        }
      )
    )
  }

  for( let i = 0 ; i < this.entitys.length ; i++ ){
    let entity = this.entitys[i];
    entity.run();
    entity.draw();
    if( entity.destory ){
      this.entitys.splice( i, 1 );
      i--;
    }
  }
  
  
  // time base entitys spwan
  if( frameCount % 600 === 60 ){
    this.spawn( 1 );
  }
}

Game.prototype.spawn = function( method ){
  switch( method ){
    case 1:
      this.spawn_method_1( );
      break;
    case 2:
      this.spawn_method_2( );
      break;
  }
}



function setup() {
  createCanvas(800, 600);

  game = new Game( );
}

function gameMenu( ){
  // draw three button middle of screen
  // the first button is start game
  // the second button is introduction
  // the third button is exit game

  // draw background
  background( 51 );
  // draw title
  fill( 255 );
  textSize( 64 );
  let title = 'Pumpkin Hunter';
  text( title, width/2 - textWidth(title)/2, height/2 - 150 );
  // text( title, width/2 - textSize( title )/2, height/10 );
  // draw button
  let button = [
    {
      text: 'Start Game',
      action: function( ){
        game.start();
      }
    },
    {
      text: 'Introduction',
      action: function( ){
        game.gamemode = 2;
      }
    },
    {
      text: 'Exit Game',
      action: function( ){
        game.gamemode = -1;
        window.open("https://github.com/ZoneTwelve");
      }
    }
  ];
  for( let i = 0 ; i < button.length ; i++ ){
    let { text: content, action } = button[i];
    let x = width/2 - 100;
    let y = height/2 - 50 + i * 100;
    let w = 200;
    let h = 50;
    fill( 255 );
    rect( x, y, w, h );
    fill( 0 );
    textSize( 32 );
    text( content, x + w/2 - textWidth(content)/2, y + h/2 + 10 );
    if( mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h ){
      fill( 255, 0, 0 );
      rect( x, y, w, h );
      fill( 0 );
      text( content, x + w/2 - textWidth(content)/2, y + h/2 + 10 );
      if( mouseIsPressed ){
        action();
      }
    }
  }
}

function Introduction( ){
  // draw background
  background( 51 );
  // draw title
  fill( 255 );
  textSize( 64 );
  let title = 'Introduction';
  text( title, width/2 - textWidth(title)/2, height/10 );
  // draw content
  let content = [
    'This game is a Halloween game for HWD.',
    'You are a pumpkin hunter, you need to collect pumpkin.',
    'But there are some zombies in the forest,',
    '  you need to avoid them.',
    'You can use mouse to control your hunter.',
  ];
  for( let i = 0 ; i < content.length ; i++ ){
    fill( 255 );
    textSize( 32 );
    text( content[i], width/2 - textWidth(content[i])/2, height/2 - 100 + i * 50 );
  }
  // draw button
  let button = [
    {
      text: 'Back',
      action: function( ){
        game.gamemode = 0;
      }
    }
  ];
  for( let i = 0 ; i < button.length ; i++ ){
    let { text: content, action } = button[i];
    let x = width/2 - 100;
    let y = height/2 + 200 + i * 100;
    let w = 200;
    let h = 50;
    fill( 255 );
    rect( x, y, w, h );
    fill( 0 );
    textSize( 32 );
    text( content, x + w/2 - textWidth(content)/2, y + h/2 + 10 );
    if( mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h ){
      fill( 255, 0, 0 );
      rect( x, y, w, h );
      fill( 0 );
      text( content, x + w/2 - textWidth(content)/2, y + h/2 + 10 );
      if( mouseIsPressed ){
        action();
      }
    }
  }
}

function gameOver( ){
  // game over
  fill( 255 );
  textSize( 64 );
  let title = 'Game Over';

  text( title, width/2 - textWidth(title)/2, height/10 );
  let content = [
    'You are dead.',
    'You can try again.',
    `You have collected ${game.players[0].collect} pumpkins.`,
  ];
  for( let i = 0 ; i < content.length ; i++ ){
    fill( 255 );
    textSize( 32 );
    text( content[i], width/2 - textWidth(content[i])/2, height/2 - 100 + i * 50 );
  }

  // draw button
  let button = [
    {
      text: 'Back',
      action: function( ){
        game.gamemode = 0;
      }
    },
    {
      text: 'Try Again',
      action: function( ){
        game.start();
        game.gamemode = 1;
      }
    }
  ];
  for( let i = 0 ; i < button.length ; i++ ){
    let { text: content, action } = button[i];
    let x = width/2 - 100;
    let y = height/2 + 100 + i * 100;
    let w = 200;
    let h = 50;
    fill( 255 );
    rect( x, y, w, h );
    fill( 0 );
    textSize( 32 );
    text( content, x + w/2 - textWidth(content)/2, y + h/2 + 10 );
    if( mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h ){
      fill( 255, 0, 0 );
      rect( x, y, w, h );
      fill( 0 );
      text( content, x + w/2 - textWidth(content)/2, y + h/2 + 10 );
      if( mouseIsPressed ){
        action();
      }
    }
  }
}

var played = {
  menu_music: false,
  game_music: false,
}
function draw() {
  if( game.gamemode === 0 ){
    gameMenu();
    if( played['menu_music'] === false ){
      audio['menu_music'].loop( );
      played['menu_music'] = true;
    }
  }else if( game.gamemode === 1 ){
    audio['menu_music'].stop();
    played['menu_music'] = false;
    if( played['game_music'] === false ){
      audio['game_music'].play( );
      played['game_music'] = true;
      setInterval( ( ) => played['game_music'] = false, 1000 * 73 );
    }
    game.run();
  }else if( game.gamemode === 2 ){
    Introduction();
  }else if( game.gamemode === 3 ){
    gameOver( );
  }
}