//Tiled module for WebClash

const colliderZoneSize = 8; //Collider zone size in tiles

exports.maps = [];
exports.maps_properties = [];
exports.maps_collider_zones = [];
exports.maps_dialogs = [];
exports.map_requests = {};

exports.loadAllMaps = function(cb)
{
    fs.readdir('maps', (err, files) => {
        if (err) {
            output.giveError('Could not load maps: ', err);
            return;
        }

        let count = 0;

        files.forEach(file => {
            //Skip metadata files

            if (file.indexOf('.metadata') !== -1)
                return;

            //Load map

            tiled.loadMap(file);

            count++;
        });

        output.give('Loaded ' + count + ' map(s).');

        if (cb !== undefined)
            cb();
    });
};

exports.loadMap = function(name)
{
    try
    {
        let location = 'maps/' + name,
            locationMetadata = 'maps/' + name.substr(0, name.lastIndexOf('.')) + '.metadata.json';

        //Load actual map

        let map = JSON.parse(fs.readFileSync(location, 'utf-8'))
        map.name = name.substr(0, name.lastIndexOf('.'));

        //Load map metadata if possible

        if (fs.existsSync(locationMetadata)) {
            let metadata = JSON.parse(fs.readFileSync(locationMetadata, 'utf-8'));

            //Copy metadata attributes to map

            for (let attr in metadata)
                map[attr] = metadata[attr];
        } else {
            output.give('No metadata found for map "' + name + '", this map has not been loaded.');

            return;
        }

        //Verify metadata for map

        this.verifyMetadata(map);

        //Add map to map collection

        this.maps.push(map);

        //Cache the map

        this.cacheMap(map);
    }
    catch(err)
    {
        output.giveError('Could not load map: ', err);
    }
};

exports.verifyMetadata = function(map) {
    //Check if the amount of layers and
    //map layers are consistent

    let layerAmount = 0;

    for (let l = 0; l < map.layers.length; l++)
        if (map.layers[l].type === 'tilelayer')
            layerAmount++;

    if (map.mapLayers == undefined || layerAmount !== map.mapLayers.length)
        output.give('The amount of layers in map "' + map.name + '" differ from the layers specified in the map settings, updating this is advised.');

    //Other metadata verification checks 

    //...
};

exports.mapWithName = function(name)
{
    for (let i = 0; i < this.maps.length; i++)
        if (this.maps[i].name === name)
            return this.maps[i];
};

exports.getMapIndex = function(name)
{
    for (let i = 0; i < this.maps.length; i++)
        if (this.maps[i].name === name)
            return i;

    return -1;
};

exports.getMapType = function(name)
{
    for (let i = 0; i < this.maps.length; i++)
        if (this.maps[i].name === name) {
            if (this.maps[i].mapType == undefined)
                this.maps[i].mapType = 'protected';

            return this.maps[i].mapType;
        }
};

exports.getMapTileRectangles = function(map, id)
{
    //Create rectangle array

    let rects = [];

    for (let l = 0; l < map.layers.length; l++) {
        if (!map.layers[l].visible ||
            map.layers[l].type !== 'tilelayer')
            continue;

        //Get map offset width and height
        //and calculate layer offset

        let offset_width = -map.width*map.tilewidth/2,
            offset_height = -map.height*map.tileheight/2;

        if (map.layers[l].offsetx !== undefined)
            offset_width += map.layers[l].offsetx;
        if (map.layers[l].offsety !== undefined)
            offset_height += map.layers[l].offsety;

        //Find all tiles in the layer that correspond to
        //the specified tile identifier (id), add the
        //rectangles of these tiles to the rectangle array

        for (let t = 0; t < map.layers[l].data.length; t++)
            if (map.layers[l].data[t] == id+1)
                rects.push({
                    x: (t % map.layers[l].width) * map.tilewidth + offset_width,
                    y: Math.floor(t / map.layers[l].width) * map.tileheight + offset_height,
                    w: map.tilewidth,
                    h: map.tileheight
                });
    }

    return rects;
}

exports.cacheMap = function(map)
{
    let id = this.getMapIndex(map.name);

    this.maps_properties[id] = [];
    this.maps_collider_zones[id] = [];
    this.maps_dialogs[id] = {};

    //Check if tilesets exist

    if (map.tilesets === undefined)
        return;

    //Calculate base offset width and height

    let offset_width = -map.width*map.tilewidth/2,
        offset_height = -map.height*map.tileheight/2;

    //Cache tilesets

    for (let t = 0; t < map.tilesets.length; t++)
    {
        let tileset = map.tilesets[t];

        if (tileset.tiles === undefined)
            continue;

        for (let i = 0; i < tileset.tiles.length; i++) {
            //Calculate actual

            let actual = tileset.tiles[i].id;
            if (t > 0)
                actual = tileset.tiles[i].id + map.tilesets[t].firstgid - 1;

            //Check properties

            if (tileset.tiles[i].properties != undefined) {
                //Get checks (if they exist)

                let checks = this.getPropertyChecks(tileset.tiles[i].properties);

                //Create properties

                for (let p = 0; p < tileset.tiles[i].properties.length; p++)
                {
                    let property = tileset.tiles[i].properties[p];

                    this.maps_properties[id].push({
                        tile: tileset.tiles[i].id,
                        name: property.name,
                        value: property.value,
                        rectangles: this.getMapTileRectangles(map, actual),
                        checks: checks
                    });
                }
            }
        }
    }

    //Cache object layers

    for (let l = 0; l < map.layers.length; l++)
    {
        if (!map.layers[l].visible ||
            map.layers[l].type !== 'objectgroup')
            continue;

        //Get offset width and height

        let layer_offset_width = 0,
            layer_offset_height = 0;
            
        if (map.layers[l].offsetx !== undefined)
            layer_offset_width = map.layers[l].offsetx;
        if (map.layers[l].offsety !== undefined)
            layer_offset_height = map.layers[l].offsety;

        //Cycle through all objects

        for (let o = 0; o < map.layers[l].objects.length; o++)
        {
            const data = map.layers[l].objects[o];

            //Check properties

            if (data.properties != undefined) {
                //Get checks (if they exist)

                let checks = this.getPropertyChecks(data.properties);

                //Create properties

                for (let p = 0; p < data.properties.length; p++)
                {
                    let property = data.properties[p];

                    //Get collision data

                    let coll = {
                        x: data.x + offset_width + layer_offset_width,
                        y: data.y + offset_height + layer_offset_height,
                        w: data.width,
                        h: data.height
                    };

                    //Add to map properties

                    this.maps_properties[id].push({
                        object: o,
                        name: property.name,
                        value: property.value,
                        rectangles: [coll],
                        checks: checks
                    });
                }
            }
        }
    }

    //Cache collider zones

    for (let z_x = 0; z_x < map.width; z_x += colliderZoneSize)
        for (let z_y = 0; z_y < map.height; z_y += colliderZoneSize) {
            //Create new zone entry

            let zoneId = this.maps_collider_zones[id].length;
            this.maps_collider_zones[id][zoneId] = {
                x: z_x * map.tilewidth + offset_width,
                y: z_y * map.tileheight + offset_height,
                w: colliderZoneSize * map.tilewidth,
                h: colliderZoneSize * map.tileheight,
                colliders: []
            };

            for (let l = 0; l < map.layers.length; l++)
            {
                if (!map.layers[l].visible ||
                    map.layers[l].type !== 'objectgroup')
                    continue;

                //Get offset width and height

                let layer_offset_width = 0,
                    layer_offset_height = 0;

                if (map.layers[l].offsetx !== undefined)
                    layer_offset_width = map.layers[l].offsetx;
                if (map.layers[l].offsety !== undefined)
                    layer_offset_height = map.layers[l].offsety;

                //Create zone rectangle

                let zone = {
                    x: this.maps_collider_zones[id][zoneId].x + layer_offset_width,
                    y: this.maps_collider_zones[id][zoneId].y + layer_offset_height,
                    w: this.maps_collider_zones[id][zoneId].w,
                    h: this.maps_collider_zones[id][zoneId].h
                };

                //Cycle through all objects

                for (let o = 0; o < map.layers[l].objects.length; o++)
                {
                    const data = map.layers[l].objects[o];

                    //Get collision data

                    let coll = {
                        x: data.x + offset_width + layer_offset_width,
                        y: data.y + offset_height + layer_offset_height,
                        w: data.width,
                        h: data.height
                    };

                    //Create collider boolean

                    let createCollider = true;
                    let checks = [];

                    //Check properties

                    if (data.properties != undefined) {
                        //Get checks (if they exist)

                        checks = this.getPropertyChecks(data.properties);

                        //For all properties, check certain properties

                        for (let p = 0; p < data.properties.length; p++)
                        {
                            let property = data.properties[p];

                            //Evaluate property name,
                            //as design properties do
                            //not require colliders!

                            if (property.name === 'mapDialogue' ||
                                property.name === 'lightHotspot' ||
                                property.name === 'NPC' ||
                                property.name === 'item')
                                createCollider = false;
                        }
                    }

                    //Check if not a point or
                    //create collider is set
                    //to false

                    if (!createCollider ||
                        data.width === 0 ||
                        data.height === 0 ||
                        data.point)
                        continue;
                    
                    //Check if collider falls in the current zone

                    if (!this.checkRectangularCollision(coll, zone))
                        continue;

                    //Add collider to zone

                    this.maps_collider_zones[id][zoneId].colliders.push({
                        collider: coll,
                        checks: checks
                    });
                }
            }
        }

    //Cache dialog metadata

    if (map.mapDialogs != undefined) {
        for (let d = 0; d < map.mapDialogs.length; d++) 
            this.maps_dialogs[id][map.mapDialogs[d].name] = map.mapDialogs[d].dialog;

        //Remove unnecessary map data

        delete map.mapDialogs;
    }

    //Handle design properties

    this.handleMapDesign(id);

    //Load NPCs

    npcs.loadMap(id);
};

exports.handleMapDesign = function(map)
{
    //Cycle through all properties

    for (let p = 0; p < this.maps_properties[map].length; p++) {
        let property = this.maps_properties[map][p];

        for (let r = 0; r < property.rectangles.length; r++) {
            //Simplify current rectangle

            let rect = property.rectangles[r];

            //Switch on property name

            switch (property.name) {
                //Item design property

                case 'item':
                    items.createMapItem(
                        map, 
                        rect.x+rect.w/2,
                        rect.y+rect.h/2,
                        property.value
                    );
                    break;

                //Other design properties

                //...
            }
        }
    }
};

exports.getPropertyChecks = function(properties) {
    let checks = [];

    for (let p = 0; p < properties.length; p++)
    {
        let property = properties[p];

        //Check for get variable checks

        if (property.name === 'getVariableTrue')
            checks.push({
                name: property.value,
                value: true
            });
        if (property.name === 'getVariableFalse')
            checks.push({
                name: property.value,
                value: false
            });
    }

    return checks;
};

exports.checkPropertyWithRectangle = function(map, property_name, property_value, rectangle)
{
    let data = {
        near: false,
        map: map
    };

    if (map == -1 ||
        this.maps_properties[map] == undefined ||
        this.maps_properties[map].length == 0)
        return data;

    for (let p = 0; p < this.maps_properties[map].length; p++) {
        if (this.maps_properties[map][p].name !== property_name ||
            this.maps_properties[map][p].value !== property_value)
            continue;

        for (let r = 0; r < this.maps_properties[map][p].rectangles.length; r++)
            if (this.checkRectangularCollision(this.maps_properties[map][p].rectangles[r], rectangle))
            {
                data.near = true;
                data.tile = this.maps_properties[map][p].tile;
                data.object = this.maps_properties[map][p].object;

                break;
            }
    }

    return data;
};

exports.getPropertiesWithRectangle = function(map, rectangle)
{
    if (map == -1 ||
        this.maps_properties[map] === undefined ||
        this.maps_properties[map].length == 0)
        return [];

    let result = [];

    for (let p = 0; p < this.maps_properties[map].length; p++)
        for (let r = 0; r < this.maps_properties[map][p].rectangles.length; r++) 
            if (this.checkRectangularCollision(this.maps_properties[map][p].rectangles[r], rectangle))
                result.push(this.maps_properties[map][p]);

    return result;
}

exports.getPropertiesFromTile = function(map, tile)
{
    let result = [];

    if (this.maps_properties[map] == undefined)
        return result;

    for (let p = 0; p < this.maps_properties[map].length; p++) {
        if (this.maps_properties[map][p].tile == tile)
            result.push({
                name: this.maps_properties[map][p].name,
                value: this.maps_properties[map][p].value
            });
    }

    return result;
};

exports.getPropertiesFromObject = function(map, object)
{
    let result = [];

    if (this.maps_properties[map] == undefined)
        return result;

    for (let p = 0; p < this.maps_properties[map].length; p++) {
        if (this.maps_properties[map][p].object == object)
            result.push({
                name: this.maps_properties[map][p].name,
                value: this.maps_properties[map][p].value
            });
    }

    return result;
};

exports.findCollisionZone = function(map, rectangle)
{
    //Go over all collider zones, check for the first found
    //collided zone - as it does not matter which zone the
    //target resides in the most

    for (let zone = 0; zone < this.maps_collider_zones[map].length; zone++)
        if (this.checkRectangularCollision(this.maps_collider_zones[map][zone], rectangle))
            return zone;

    //No zone was found

    return -1;
};

exports.checkCollisionWithRectangle = function(map, rectangle, playerOverride)
{
    //Check if the map does not exist or the map has no collider zones

    if (map === -1 ||
        this.maps_collider_zones[map] == undefined)
        return false;

    //Grab the current collider zone

    let zone = this.findCollisionZone(map, rectangle);

    //Check if the zone is valid

    if (zone === -1)
        return false;

    //For all colliders in the zone, check if the target collides with any

    let colliders = this.maps_collider_zones[map][zone].colliders;
    for (let c = 0; c < colliders.length; c++) {
        //Skip any invalid colliders

        if (colliders[c] == undefined)
            continue;

        //If not an NPC, make sure to check checks

        if (playerOverride != undefined)
            if (!game.checkPlayerForChecks(playerOverride, colliders[c].checks))
                continue;

        //Check for collision

        if (this.checkRectangularCollision(colliders[c].collider, rectangle))
            return true;
    }

    //No collision with any colliders in the target's zone

    return false;
};

exports.checkRectangleInMap = function(map, rect)
{
    //Calculate main map boundary

    let boundary = {
        x: -this.maps[map].width*this.maps[map].tilewidth/2,
        y: -this.maps[map].height*this.maps[map].tileheight/2,
        w: this.maps[map].width*this.maps[map].tilewidth,
        h: this.maps[map].height*this.maps[map].tileheight
    };

    //Check if in the boundary

    return this.checkRectangularCollision(boundary, rect);
};

exports.checkRectangularCollision = function(rect1, rect2)
{
    if (rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.h + rect1.y > rect2.y)
        return true;

    return false;
};

exports.generateRequestIdentifier = function(map_id, player_id) {
    //Generate a valid identifier

    let request_id = tools.randomString();

    while (this.map_requests[request_id] != undefined)
        request_id = tools.randomString();

    //Set player id at request id

    this.map_requests[request_id] = {
        player_id: player_id,
        map_id: map_id
    }

    //Return the generated request id

    return request_id;
};

exports.requestMap = function(req, res) {
    try {
        let request_id = req.params.request_id;

        //Check if paramaters are valid

        if (request_id == undefined ||
            tiled.map_requests[request_id] == undefined) {
            res.send('error');
            return;
        }

        //Get player id and map id and delete entry

        let player_id = tiled.map_requests[request_id].player_id,
            map_id    = tiled.map_requests[request_id].map_id;

        delete tiled.map_requests[request_id];

        //If external clients are allowed, make sure
        //to allow CORS access across the domain.
        //Otherwise map loading won't be possible
        //for external clients.

        if (properties.allowExternalClients)
            res.header('Access-Control-Allow-Origin', '*');

        //Send custom tailored map for player

        res.send(tiled.createPlayerMap(player_id, map_id));
    }
    catch (err) {
        //Give error and respond to client with error

        output.giveError('Could not handle map request: ', err);

        res.send('error');
    }
};

exports.createPlayerMap = function(id, map_id) {
    let vars = {};

    //Get all needed global variables

    for (let i = 0; i < this.maps_properties[map_id].length; i++) 
        for (let ii = 0; ii < this.maps_properties[map_id][i].checks.length; ii++) {
            let check = this.maps_properties[map_id][i].checks[ii];

            //TODO: For some reason all variable checks are
            //      duplicated, this probably is caused by
            //      the Tiled caching process somewhere
            //      in the property caching process.
            //      Reproduce with: console.log(check);

            if (vars[check.name] == undefined) {
                let result = game.getPlayerGlobalVariable(id, check.name);
                if (result == undefined)
                    result = false;

                vars[check.name] = result;
            }
        }

    //Return the map with the checks

    return {
        vars: vars,
        map: this.maps[map_id]
    };
};

exports.inDialogRange = function(player, map, dialogName) {
    //Check if map properties exist

    if (this.maps_properties[map].length === 0)
        return false;

    //Proximity distance in tiles

    let proximity = 3;
    
    //Create player rectangle

    let rect = {
        x: game.players[player].pos.X, 
        y: game.players[player].pos.Y,
        w: game.players[player].character.width,
        h: game.players[player].character.width
    };

    rect.x -= (proximity/2)*this.maps[map].tilewidth;
    rect.y -= (proximity/2)*this.maps[map].tileheight;
    rect.w += proximity*this.maps[map].tilewidth;
    rect.h += proximity*this.maps[map].tileheight;

    //Check property with rectangle

    let result = this.checkPropertyWithRectangle(
        map, 
        'mapDialogue', 
        dialogName, 
        rect
    );

    //Return near

    return result.near;
};