const client = {
    inGame: false,
    connect: function(cb) {
        //Try to make a connection
        
        window['socket'] = io.connect(
            (properties.address.length > 0 ? (properties.address + ":" + properties.port) : undefined)
        );
        
        //Setup possible server requests
        
        this.setup();
        
        //Callback
        
        cb();
    },
    joinGame: function() {
        if (this.inGame)
        {
            //Clear any cached game elements
            
            game.players = [];
            game.player = -1;
            
            game.tilesets = [];
        }
 
        this.inGame = true;
        
        socket.emit('CLIENT_JOIN_GAME');
    },
    setup: function() {
        socket.on('UPDATE_CLIENT_NAME', function(t) { document.title = t; });
        
        socket.on('REQUEST_LANDING', view.loadLanding);
        socket.on('REQUEST_GAME', view.loadGame);
        
        socket.on('GAME_PLAYER_UPDATE', function (data) {
             //Check if the recieved data is valid
            
             if (data === undefined || data.name === undefined)
                 return;
            
             //Check if in-game
             if (!client.inGame)
                 return;
            
             //Get the id of the player's data
            
             let id;
            
             if (data.isPlayer) 
                 id = game.player;
             else 
                 id = game.getPlayerIndex(data.name);
            
             //If the player does not yet exist, create it
            
             if (id == -1 && data.isPlayer) {
                 game.instantiatePlayer(data.name);
                 
                 id = game.player;
             }
             else if (id == -1) {
                 game.instantiateOther(data.name);
                 
                 id = game.players.length-1;
             }
            
             //Check what data is present
            
             if (data.remove)
                 game.removePlayer(id);
             if (data.pos !== undefined) {
                 game.players[id].POS = data.pos;
                 
                 if (data.isPlayer)
                     game.players[id].Movement(0, 0);
             }
             if (data.moving !== undefined) 
                 game.players[id]._moving = data.moving;
             if (data.direction !== undefined) 
                 game.players[id]._direction = data.direction;
             if (data.stats !== undefined)
                 game.players[id]._stats = data.stats;
             if (data.character !== undefined) {
                 game.players[id].SPRITE = new lx.Sprite(data.character.src);
                 game.players[id].SPRITE.Clip(0, 0, data.character.width, data.character.height);
                 
                 game.players[id].SIZE = game.players[id].SPRITE.Size();
                 
                 if (data.isPlayer) 
                 {
                     player.setCollider(data.character.collider);
                     player.setMovement(data.character.movement);
                 }
                 
                 game.players[id]._animation = data.character.animation;
                 game.players[id]._animation.cur = 0;
             }
        });
        socket.on('GAME_MAP_UPDATE', function (data) {
             //Check if data is valid
            
             if (data === undefined)
                 return;
            
             //Check if in-game
            
             if (!client.inGame)
                 return;
            
            //Load map
            
            game.loadMap(data); 
        });
        socket.on('GAME_NPC_UPDATE', function (data) {
            //Check if the recieved data is valid
            
             if (data === undefined || data.name === undefined)
                 return;
            
             //Check if in-game
            
             if (!client.inGame)
                 return;
            
             //Check if NPC exists, if not instantiate
            
             if (game.npcs[data.id] === undefined)
                 game.instantiateNPC(data.id, data.name);
            
             //Handle data
            
             if (data.pos !== undefined)
                 game.npcs[data.id].POS = data.pos;
             if (data.type !== undefined)
                 game.npcs[data.id]._type = data.type;
             if (data.moving !== undefined) 
                 game.npcs[data.id]._moving = data.moving;
             if (data.direction !== undefined) 
                 game.npcs[data.id]._direction = data.direction;
             if (data.stats !== undefined)
                 game.npcs[data.id]._stats = data.stats;
             if (data.character !== undefined) {
                 game.npcs[data.id].SPRITE = new lx.Sprite(data.character.src);
                 game.npcs[data.id].SPRITE.Clip(0, 0, data.character.width, data.character.height);
                 
                 game.npcs[data.id].SIZE = game.npcs[data.id].SPRITE.Size();
                 
                 game.npcs[data.id]._animation = data.character.animation;
                 game.npcs[data.id]._animation.cur = 0;
             }
        });
        socket.on('GAME_CHAT_UPDATE', function (data) {
            ui.chat.addMessage(data);
        })
    }
}