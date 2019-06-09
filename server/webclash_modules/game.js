//Game module for WebClash

const fs = require('fs');

exports.players = [];
exports.characters = {};

//Game properties

exports.playerConstraints = {
    inventorySize: 20
};

exports.time = {
    current: 0,
    update: function() {
        if (this.current >= gameplay.dayLength+gameplay.nightLength)
            this.current = 0;
        else
            this.current++;
    }
};

exports.startLoop = function()
{
    //Start game logics loop

    setInterval(function() {
        //Update NPCs

        npcs.updateMaps();

        //Update action cooldowns

        actions.updateCooldowns();

        //Update action projectiles

        actions.updateProjectiles();

        //Update game time

        game.time.update();
    }, 1000/60);

    //Start real time loop

    setInterval(function() {
        //Update world items

        items.updateMaps();

        //Update players

        game.updatePlayers();

        //Update in combat

        actions.combat.update();
    }, 1000);
};

exports.updateInCombat = function() {
    for (let p = 0; p < game.players.length; p++)
        if (game.players[p] != undefined &&
            game.players[p].combat.is)
            for (let action in game.players[p].actions_cooldown)
            {
                if (game.players[p].actions_cooldown[action] == undefined)
                    continue;

                game.players[p].actions_cooldown[action]--;

                if (game.players[p].actions_cooldown[action] <= 0)
                    game.players[p].actions_cooldown[action] = undefined;
            }
};

exports.savePermissions = function ()
{
    fs.writeFile('permissions.json', JSON.stringify(permissions, null, 1), 'utf8', function(err) {
        if (err)
            throw err;
    });
};

exports.refreshPlayer = function(channel, id)
{
    //Set channel

    game.players[id].channel = channel;

    //Set name of channel

    channel.name = game.players[id].name;
    
    try {
        storage.load('accounts', channel.name, function(user_data) {
            //Sync user settings if they exist

            if (user_data.settings != null)
                channel.emit('GAME_USER_SETTINGS', user_data.settings);

            //Load current world

            game.loadMap(channel, game.players[id].map);

            //Sync to player

            server.syncPlayer(id, channel, false);

            //Sync partial stats

            server.syncPlayerPartially(id, 'exp', channel, false);
            server.syncPlayerPartially(id, 'points', channel, false);
            server.syncPlayerPartially(id, 'attributes', channel, false);
            server.syncPlayerPartially(id, 'health', channel, false);
            server.syncPlayerPartially(id, 'mana', channel, false);
            server.syncPlayerPartially(id, 'actions', channel, false);
            server.syncPlayerPartially(id, 'quests', channel, false);
            server.syncPlayerPartially(id, 'gold', channel, false);

            //Sync inventory

            for (let i = 0; i < game.players[id].inventory.length; i++)
                if (game.players[id].inventory[i] != undefined)
                    server.syncInventoryItem(i, id, channel, false);

            //Sync equipment

            for (let equipment in game.players[id].equipment) {
                if (equipment != undefined)
                    server.syncEquipmentItem(equipment, id, channel, false);
            };
        });
    }
    catch (err) {
        output.giveError('Could not refresh player: ' + err);
    }
};

exports.addPlayer = function(channel)
{
    //Check if channel is valid

    if (channel.name === undefined)
        return;

    try {
        //Grab user data, player stats

        storage.load('accounts', channel.name, function(user_data) {
            //Sync user settings if they exist

            if (user_data.settings != null)
                channel.emit('GAME_USER_SETTINGS', user_data.settings);

            storage.load('stats', channel.name, function(player) {
                player.name = channel.name;
                player.character = game.characters[player.char_name];
                player.channel = channel;

                player.map_id = tiled.getMapIndex(player.map);

                //Add player

                let id = game.players.length;
                game.players[id] = player;

                //Calculate stat attributes

                game.calculatePlayerStats(id);

                //Load current world

                game.loadMap(channel, player.map);

                //Sync across server

                server.syncPlayer(id, channel, true);

                //Sync to player

                server.syncPlayer(id, channel, false);

                //Sync partial stats

                server.syncPlayerPartially(id, 'exp', channel, false);
                server.syncPlayerPartially(id, 'points', channel, false);
                server.syncPlayerPartially(id, 'attributes', channel, false);
                server.syncPlayerPartially(id, 'health', channel, false);
                server.syncPlayerPartially(id, 'mana', channel, false);
                server.syncPlayerPartially(id, 'actions', channel, false);
                server.syncPlayerPartially(id, 'quests', channel, false);
                server.syncPlayerPartially(id, 'gold', channel, false);

                //Sync inventory

                for (let i = 0; i < game.players[id].inventory.length; i++)
                    if (game.players[id].inventory[i] != undefined)
                        server.syncInventoryItem(i, id, channel, false);

                //Sync equipment

                for (let equipment in game.players[id].equipment) {
                    if (equipment != undefined)
                        server.syncEquipmentItem(equipment, id, channel, false);
                };

                //Sync equipment to others

                server.syncPlayerPartially(id, 'equipment', channel, true);
            });
        });
    }
    catch (err) {
        output.giveError('Could not add player: ', err);
    }
};

exports.removePlayer = function(channel)
{
    try {
        //Check if channel is valid

        if (channel === undefined || channel.name === undefined)
            return;

         //Get player index

        let id = game.getPlayerIndex(channel.name);

        //Check if valid

        if (id === -1)
            return;

        //Remove NPC targets

        npcs.removeNPCTargets(this.players[id].map_id, id, true);

        //Remove from clients

        server.removePlayer(id, channel);

        //Release owned world items

        items.releaseWorldItemsFromOwner(this.players[id].map_id, this.players[id].name);

        //Save player

        this.savePlayer(channel.name, this.players[id]);

        //Remove player entry

        this.players.splice(id, 1);

        //Set channel playing to false

        channel.playing = false;
    }
    catch (err) {
        output.giveError('Could not remove player: ', err);
    }
};

exports.updatePlayers = function()
{
    //Cycle through all players

    for (let p = 0; p < this.players.length; p++) {
        //Regenerate stats if on a protected map

        switch (tiled.getMapType(this.players[p].map)) {
            case 'protected': //Protected -> Regenerate players stats (health, mana, etc.)
                this.regeneratePlayer(p);
                break;
            case 'hostile': //Hostile -> NPCs will attack players within a range
                //...
                break;
        };
    }
};

exports.saveAllPlayers = function(callback)
{
    //Save all players recursively

    let id = -1;

    let cb = () => {
        id++;

        if (id >= game.players.length) {
            //Output

            if (id !== -1)
                output.give('Saved ' + id + ' players.');

            //Execute callback

            if (callback !== undefined)
                callback();
        }
        else
            game.savePlayer(game.players[id].name, game.players[id], cb);
    };

    cb();
};

exports.savePlayer = function(name, data, cb)
{
    let player = data;

    //Check if a new player data must be created

    if (player == undefined) {
        //Get starting position before saving

        let spos = this.tileToActualPosition(
            tiled.getMapIndex(properties.startingMap),
            properties.startingTile.x,
            properties.startingTile.y
        );

        player = {
            char_name: properties.playerCharacter,
            map: properties.startingMap,
            pos: { X: spos.x, Y: spos.y },
            moving: false,
            direction: 0,
            health: { cur: 100, max: 100 },
            mana: { cur: 100, max: 100 },
            level: 1,
            stats: {
                exp: 0,
                points: 0,
                attributes: {
                    power: 1,
                    toughness: 1,
                    vitality: 1,
                    agility: 1,
                    intelligence: 1,
                    wisdom: 1
                }
            },
            gvars: {},
            actions: [],
            equipment: {},
            quests: {},
            inventory: properties.playerStartingItems,
            gold: 0
        };
    }

    //Save player data

    storage.save('stats', name, {
        map: player.map,
        char_name: player.char_name,
        pos: player.pos,
        moving: player.moving,
        direction: player.direction,
        health: player.health,
        mana: player.mana,
        gold: player.gold,
        level: player.level,
        stats: player.stats,
        actions: player.actions,
        inventory: player.inventory,
        equipment: player.equipment,
        quests: player.quests,
        gvars: player.gvars
    }, cb);
};

exports.saveUserSettings = function(name, settings)
{
    storage.saveAttributes('accounts', name, {
        settings: settings
    });
};

exports.damagePlayer = function(id, damage, pvpDamager)
{
    //Subtract toughness from damage

    damage += this.players[id].attributes.toughness-1;

    if (damage >= 0)
        damage = 0;

    //Add damage

    this.players[id].health.cur += damage;

    //Check if player should die

    if (this.players[id].health.cur <= 0)
    {
        this.killPlayer(id, pvpDamager);

        return true;
    }

    //Sync health

    server.syncPlayerPartially(id, 'health');

    //Return false

    return false;
};

exports.healPlayer = function(id, heal)
{
    //Check if heal is valid

    if (heal <= 0)
        return;

    //Add damage

    this.players[id].health.cur += heal;

    //Check if player health is capped

    if (this.players[id].health.cur > this.players[id].health.max)
        this.players[id].health.cur = this.players[id].health.max;

    //Sync health

    server.syncPlayerPartially(id, 'health');
};

exports.regeneratePlayer = function(id)
{
    //Check if in-combat

    if (actions.combat.in(id))
        return;

    //Regenerate mana if possible

    if (this.players[id].mana.cur < this.players[id].mana.max) {
        this.players[id].mana.cur++;

        server.syncPlayerPartially(id, 'mana', this.players[id].channel, false);
    };

    //Regenerate health if possible

    if (this.players[id].health.cur < this.players[id].health.max) {
        this.players[id].health.cur++;

        server.syncPlayerPartially(id, 'health');
    };

    //...
};

exports.killPlayer = function(id, pvpKiller)
{
    //Handle on player death events

    game.onPlayerDeath(id, pvpKiller);

    //Reset all NPC targets on map from player

    npcs.removeNPCTargets(this.players[id].map_id, id, false);

    //Reset stats and sync

    this.players[id].health.cur = this.players[id].health.max;
    this.players[id].mana.cur = this.players[id].mana.max;

    server.syncPlayerPartially(id, 'health');
    server.syncPlayerPartially(id, 'mana', this.players[id].channel, false);

    //Load starting map if not on it

    if (this.players[id].map !== properties.startingMap)
        this.loadMap(this.players[id].channel, properties.startingMap);

    //Set starting tile

    this.setPlayerTilePosition(
        id,
        tiled.getMapIndex(properties.startingMap),
        properties.startingTile.x,
        properties.startingTile.y
    );

    //Check for quest objectives reset

    //Reset all NPC targets on map from player

    npcs.removeNPCTargets(this.players[id].map_id, id, false);

    //Reset player quest objectives (if specified)

    quests.resetQuestObjectives(id);
};

exports.onPlayerDeath = function(id, pvpKiller)
{
    //Check for all on player death events

    let deathEvents = gameplay.onPlayerDeath;

    //Lose gold death event

    if (deathEvents.loseGold.enabled) {
        let delta = -this.players[id].gold*(deathEvents.loseGold.losePercentage/100);

        this.deltaGoldPlayer(id, delta);
    }

    //Lose experience death event

    if (deathEvents.loseExperience.enabled) {
        let delta = -this.players[id].stats.exp*(deathEvents.loseExperience.losePercentage/100);

        this.deltaExperiencePlayer(id, delta)
    }

    //Lose inventory items death event

    if (deathEvents.loseItems) 
        for (let i = 0; i < this.playerConstraints.inventorySize; i++)
            items.dropPlayerItem(id, i, pvpKiller);

    //Lose equipment items death event

    if (deathEvents.loseEquipment)
        for (let key in this.players[id].equipment) 
            items.dropPlayerItem(id, key, pvpKiller);
};

exports.deltaManaPlayer = function(id, delta)
{
    //Add delta

    this.players[id].mana.cur += delta;

    //Check if player mana is capped

    if (this.players[id].mana.cur > this.players[id].mana.max)
        this.players[id].mana.cur = this.players[id].mana.max;
    else if (this.players[id].mana.cur < 0)
        this.players[id].mana.cur = 0;

    //Sync mana

    server.syncPlayerPartially(id, 'mana', this.players[id].channel, false);
};

exports.deltaGoldPlayer = function(id, delta)
{
    //Check if possible

    if (this.players[id].gold+delta < 0)
        return false;

    //Add delta

    this.players[id].gold += delta;

    //Sync gold

    server.syncPlayerPartially(id, 'gold', this.players[id].channel, false);

    //Return true

    return true;
};

exports.deltaExperiencePlayer = function(id, exp)
{
    //Make sure we only delta if
    //possible

    if (this.players[id].stats.exp === 0 &&
        exp < 0)
        return;

    //Delta experience

    this.players[id].stats.exp += exp;

    //Make sure experience gets adjusted
    //respectively when losing experience

    if (this.players[id].stats.exp < 0)
        this.players[id].stats.exp = 0;

    //Check if should level up

    if (this.players[id].stats.exp >= exptable[this.players[id].level-1])
    {
        //Level up and reset xp

        this.players[id].stats.exp = 0; //this.players[id].stats.exp-exptable[this.players[id].level-1];
        this.players[id].level++;

        //Give one player point to spend

        this.players[id].stats.points++;

        //Restore health and other stats if possible

        if (this.players[id].health.cur < this.players[id].health.max) {
            this.players[id].health.cur = this.players[id].health.max;

            server.syncPlayerPartially(id, 'health', this.players[id].channel, false);
        }
        if (this.players[id].mana.cur < this.players[id].mana.max) {
            this.players[id].mana.cur = this.players[id].mana.max;

            server.syncPlayerPartially(id, 'mana', this.players[id].channel, false);
        }

        //Sync to map (and player)

        server.syncPlayerPartially(id, 'level');

        //Sync to player

        server.syncPlayerPartially(id, 'points', this.players[id].channel, false);
    }

    //Sync to player

    server.syncPlayerPartially(id, 'exp', this.players[id].channel, false);
};

exports.incrementPlayerAttribute = function(id, attribute)
{
    //Check if player is eligible for an attribute increment

    if (this.players[id].stats.points <= 0)
        return;

    //Check if stat is valid

    if (this.players[id].stats.attributes[attribute] == undefined)
        return;

    //Increment attribute

    this.players[id].stats.attributes[attribute]++;

    //Decrement amount of points

    this.players[id].stats.points--;

    //Calculate new stats and sync

    this.calculatePlayerStats(id, true);

    //Sync new amount of points

    server.syncPlayerPartially(id, 'points', this.players[id].channel, false);
};

exports.calculatePlayerStats = function(id, sync)
{
    //Check if sync is undefined

    if (sync == undefined)
        sync = false;

    //Grab base attributes

    const result = {
        power: this.players[id].stats.attributes.power,
        intelligence: this.players[id].stats.attributes.intelligence,
        toughness: this.players[id].stats.attributes.toughness,
        vitality: this.players[id].stats.attributes.vitality,
        wisdom: this.players[id].stats.attributes.wisdom,
        agility: this.players[id].stats.attributes.agility
    };

    //Add stats based on equipment

    for (let equippable in this.players[id].equipment) {
        if (equippable == undefined ||
            this.players[id].equipment[equippable] == undefined)
            continue;

        let item = items.getItem(this.players[id].equipment[equippable]);

        if (item.stats != undefined) {
            if (item.stats.power > 0)
                result.power += item.stats.power;
            if (item.stats.intelligence > 0)
                result.intelligence += item.stats.intelligence;
            if (item.stats.toughness > 0)
                result.toughness += item.stats.toughness;
            if (item.stats.vitality > 0)
                result.vitality += item.stats.vitality;
            if (item.stats.wisdom > 0)
                result.wisdom += item.stats.wisdom;
            if (item.stats.agility > 0)
                result.agility += item.stats.agility;
        }
    }

    //Set the attributes property

    this.players[id].attributes = result;

    //Handle each attribute accordingly

    //Vitality attribute - max health

    const oldHealth = this.players[id].health.max;
    this.players[id].health.max = 90 + 10 * result.vitality;

    if (this.players[id].health.cur >= this.players[id].health.max)
        this.players[id].health.cur = this.players[id].health.max;

    if (oldHealth !== this.players[id].health.max && sync)
        server.syncPlayerPartially(id, 'health');

    //Wisdom attribute - max mana

    const oldMana = this.players[id].mana.max;
    this.players[id].mana.max = 90 + 10 * result.wisdom;

    if (this.players[id].mana.cur >= this.players[id].mana.max)
        this.players[id].mana.cur = this.players[id].mana.max;

    if (oldMana !== this.players[id].mana.max && sync)
        server.syncPlayerPartially(id, 'mana', this.players[id].channel, false);

    //Sync to player if sync is true

    if (result !== this.players[id].stats.attributes && sync)
        server.syncPlayerPartially(id, 'attributes', this.players[id].channel, false);
};

exports.getPlayerIndex = function(name)
{
    for (let i = 0; i < this.players.length; i++)
        if (this.players[i].name == name)
            return i;

    return -1;
};

exports.sendPlayers = function(channel)
{
    //Check if valid

    if (channel === undefined || channel.name === undefined)
        return;

    //Get player id

    let id = this.getPlayerIndex(channel.name);

    //Check if valid player

    if (id == -1)
        return;

    //Send all players in the same map

    for (let i = 0; i < this.players.length; i++)
            if (i != id && this.players[id].map === this.players[i].map)
                server.syncPlayer(i, channel, false);
}

exports.setPlayerTilePosition = function(id, map, x, y)
{
    //Get actual position

    let pos = this.tileToActualPosition(map, x, y);

    //Set new position

    if (pos.x != undefined)
        this.players[id].pos.X = pos.x-game.players[id].character.width/2;

    if (pos.y != undefined)
        this.players[id].pos.Y = pos.y-game.players[id].character.height;

    //Sync to players on the same map

    server.syncPlayerPartially(id, 'position');
};

exports.tileToActualPosition = function(map, x, y)
{
    //Calculate actual position

    let result = {};

    if (x != undefined)
        result.x = (x-tiled.maps[map].width/2)*tiled.maps[map].tilewidth;

    if (y != undefined)
        result.y = (y-tiled.maps[map].height/2-1)*tiled.maps[map].tileheight;

    //Return

    return result;
};

exports.setPlayerGlobalVariable = function(id, name, value)
{
    //Set player global variable

    game.players[id].gvars[name] = value;
};

exports.getPlayerGlobalVariable = function(id, name)
{
    //Return player global variable

    return game.players[id].gvars[name];
};

exports.loadMap = function(channel, map)
{
    //Check if valid

    if (channel.name === undefined)
        return;

    //Get map ID

    let map_id = tiled.getMapIndex(map);

    //Check if valid

    if (map_id == -1 || tiled.maps[map_id] === undefined) {
        output.give('Map with name \'' + map + '\' does not exist.');

        return;
    }

    //Get player id

    let id = this.getPlayerIndex(channel.name);

    //Check if valid player

    if (id == -1)
        return;

    //Check if map is different from current map

    if (game.players[id].map_id === map_id &&
        channel._roomId === map_id)
        return;

    //Remove player from others on the
    //same map

    server.removePlayer(id, channel);

    //Decrement map popularity and leave old
    //room, if it is available

    if (channel._roomId === game.players[id].map_id) {
        //Decrement map popularity

        npcs.mapPopularity[game.players[id].map_id]--;

        //Leave old room

        channel.leave();
    }

    //Set new map

    this.players[id].map = map;
    this.players[id].map_id = map_id;

    //Join map specific room

    channel.join(map_id);

    //Increment map popularity

    npcs.mapPopularity[map_id]++;

    //Send the corresponding map

    channel.emit('GAME_MAP_UPDATE', tiled.maps[map_id]);

    //Send player to all players in the same map

    server.syncPlayer(id, channel, true);

    //Send all players in the same map

    this.sendPlayers(channel);

    //Send all NPCs in the same map

    npcs.sendMap(map_id, channel);

    //Send all items in the same map

    items.sendMap(map_id, channel);
};

exports.loadAllCharacters = function(cb)
{
    let location = 'characters';

    fs.readdir(location, (err, files) => {
        let count = 0;

        files.forEach(file => {
            game.characters[file.substr(0, file.lastIndexOf('.'))] = game.loadCharacter(location + '/' + file);

            count++;
        });

        output.give('Loaded ' + count + ' character(s).');

        if (cb !== undefined)
            cb();
    });
};

exports.loadCharacter = function(location)
{
    try {
        return JSON.parse(fs.readFileSync(location, 'utf-8'));
    }
    catch (err)
    {
        output.giveError('Could not load character: ', err);
    }
};

exports.getPlayerCharacters = function()
{
    let result = [];

    for (let p = 0; p < properties.playerCharacters.length; p++) {
        let name = properties.playerCharacters[p],
            char = this.characters[name];

        result[p] = {
            name: name,
            src: char.src,
            width: char.width,
            height: char.height,
            animation: char.animation
        };
    }

    return result;
};

exports.calculateFace = function(pos, width, height, direction)
{
    let point = {
        X: pos.X,
        Y: pos.Y
    };

    //Get supposed pos based on direction

    switch (direction)
    {
        case 0:
            point.Y += height;
            break;
        case 1:
            point.X -= width;
            break;
        case 2:
            point.X += width;
            break;
        case 3:
            point.Y -= height;
            break;
    };

    return point;
};
