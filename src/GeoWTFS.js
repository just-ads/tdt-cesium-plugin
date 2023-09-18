import {
    Cartesian2,
    Cartesian3,
    Color,
    createGuid,
    defaultValue,
    defined,
    DeveloperError,
    Entity,
    HorizontalOrigin,
    LabelStyle,
    Math as CMath,
    SceneTransforms,
    VerticalOrigin,
    combine
} from "cesium"
import {randomNum} from "../../xzmap/util/util";
import {loadProto} from "./util";


function o(e, x) {
    return x.minX >= e.minX && x.minX <= e.maxX && x.minY>= e.minY && x.minY <= e.maxY ||
        (x.maxX >= e.minX && x.maxX <= e.maxX && x.maxY >= e.minY && x.maxY <= e.maxY ||
            (x.minX>= e.minX && x.minX <= e.maxX && x.maxY >= e.minY && x.maxY <= e.maxY ||
                x.maxX >= e.minX && x.maxX <= e.maxX && x.minY >= e.minY && x.minY <= e.maxY));
}

function s(e) {
    let x = 0;
    for (let d = 0; d < e.length; d++) {
        if (null != e.charAt(d).match(/[^\x00-\xff]/gi)) {
            x += 2;
        } else {
            x += 1;
        }
    }
    return x;
}

function h(e, x) {
    let d = e.x, t = e.y, _ = e.width, i = e.height, n = x.x, a = x.y, r = x.width, o = x.height;
    return !(n <= d && n + r <= d) && (!(d <= n && d + _ <= n) && (!(a <= t && a + o <= t) && !(t <= a && t + i <= a)));
}

const proto = loadProto('option optimize_for = LITE_RUNTIME;package GEOPOI;enum enumGeometryType {ePoint = 0;eMultiLineString = 1;ePolygon = 2;} ;message PBPOI{required uint64 OID = 1;required string Name =2;repeated double Coordinates =3 [packed=true];required enumGeometryType GeometryType = 4;optional int32 Interate = 5;optional int32 SymbolID = 10  [default = 0];optional double DisplayHeight = 11 [default = 32];optional uint32 ShiningColor=12 [default =0];optional uint32\tFontNameIndex=13 [default =0];optional int32\tFontSize=14 [default =18];optional uint32\tFontColor=15 [default =0];};message StringTable {repeated string s = 1;}message PBPOITile{required int64 Version = 1;required int64 TileKey = 2;required StringTable StringTable = 3;repeated PBPOI POIS = 4;};').root.lookup('GEOPOI.PBPOITile')
const proto1 = loadProto('option optimize_for = LITE_RUNTIME;package GEOPOI;enum enumGeometryType {ePoint = 0;eMultiLineString = 1;ePolygon = 2;};enum enumZCoordType {eCloseGround = 0;eCloseSeaSurface = 1;eRelativelyGround = 2;eAbsolute = 3;};message PBPOI{required uint64 OID = 1;required string Name =2;repeated double Coordinates =3 [packed=true];required enumGeometryType GeometryType = 4;optional int32 Interate = 5;optional int32 SymbolID = 10  [default = 0];optional double DisplayHeight = 11 [default = 32];optional uint32 ShiningColor=12 [default =0];optional uint32\tFontNameIndex=13 [default =0];optional int32\tFontSize=14 [default =18];optional uint32\tFontColor=15 [default =0];optional enumZCoordType ZCoordType = 16 [default = eAbsolute];};message StringTable {repeated string s = 1;}message PBPOITile{required int64 Version = 1;required int64 TileKey = 2;required StringTable StringTable = 3;repeated PBPOI POIS = 4;};').root.lookup('GEOPOI.PBPOITile')
const proto2 = loadProto('option optimize_for = LITE_RUNTIME;package GEOPOI;enum enumGeometryType {ePoint = 0;eMultiLineString = 1;ePolygon = 2;};enum enumZCoordType {eCloseGround = 0;eCloseSeaSurface = 1;eRelativelyGround = 2;eAbsolute = 3;};message PBPOI{required uint64 OID = 1;required string Name =2;repeated double Coordinates =3 [packed=true];required enumGeometryType GeometryType = 4;optional int32 Priority = 5;repeated int32 Interates =6 [packed=true];optional int32 SymbolID = 10  [default = 0];optional double DisplayHeight = 11 [default = 32];optional uint32 ShiningColor=12 [default =0];optional uint32\tFontNameIndex=13 [default =0];optional int32\tFontSize=14 [default =18];optional uint32\tFontColor=15 [default =0];optional enumZCoordType ZCoordType = 16 [default = eAbsolute];optional int32 FontStyle=17;optional int32 ShiningSize=18;};message StringTable {repeated string s = 1;}message PBPOITile{required int64 Version = 1;required int64 TileKey = 2;required StringTable StringTable = 3;repeated PBPOI POIS = 4;};').root.lookup('GEOPOI.PBPOITile')

function parseData(data) {
    const d = {
        stringTable: [],
        pois: [],
        enumGeometryType: [
            {ePoint: 0},
            {eMultiLineString: 1},
            {ePolygon: 2}
        ],
        enumZCoordType: [
            {eCloseGround: 0},
            {eCloseSeaSurface: 1},
            {eRelativelyGround: 2},
            {eAbsolute: 3}
        ]
    }
    let i, n = new Uint8Array(data);
    try {
        i = proto2.decode(n);
    } catch (e) {
        console.error(e.message);
    }
    if(!i){
        try {
            i = proto1.decode(n);
        } catch (e) {
            console.error(e.message);
            i = proto.decode(n);
        }
    }
    d.version = parseInt(i.Version.toString());
    d.titleKey = parseInt(i.TileKey.toString());
    for (let a = i.StringTable.s.length, r = 0; r < a; r++)
        d.stringTable.push(i.StringTable.s[r].toString());
    let len = i.POIS.length;
    while (len--){
        const x = {}, e = i.POIS[len];
        x.oid = parseInt(e.OID.toString()) + '_' + d.titleKey;
        x.name = e.Name.toString();
        x.symbolID = parseInt(e.SymbolID.toString());
        x.displayHeight = e.DisplayHeight;
        x.shiningColor = e.ShiningColor;
        x.fontNameIndex = e.FontNameIndex;
        x.fontSize = e.FontSize;
        x.fontColor = e.FontColor;
        if (e.ZCoordType) {
            (x.zCoordType = e.ZCoordType)
        }
        x.geometryType = e.GeometryType;
        x.coordinate = e.Coordinates;
        x.priority = typeof e.Priority === 'undefined' ? null : e.Priority;
        x.interates = typeof e.Interates === 'undefined' ? null : e.Interates;
        x.fontStyle = typeof e.FontStyle === 'undefined' ? null : e.FontStyle;
        x.shiningSize = typeof e.ShiningSize === 'undefined' ? null : e.ShiningSize;
        d.pois.push(x);
    }
    return d
}

const defaultLabelGraphics = {
    font:"28px sans-serif",
    fontSize: 28,
    fillColor: Color.WHITE,
    scale: 0.5,
    outlineColor: Color.BLACK,
    outlineWidth: 5,
    style: LabelStyle.FILL_AND_OUTLINE,
    showBackground:false,
    backgroundColor: Color.RED,
    backgroundPadding:new Cartesian2(10, 10),
    horizontalOrigin:HorizontalOrigin.CENTER,
    verticalOrigin: VerticalOrigin.TOP,
    eyeOffset: Cartesian3.ZERO,
    pixelOffset:new Cartesian2(0, 8)
}

const defaultBillboardGraphics = {
    horizontalOrigin: HorizontalOrigin.CENTER,
    verticalOrigin: VerticalOrigin.CENTER,
    eyeOffset: Cartesian3.ZERO,
    pixelOffset: Cartesian2.ZERO,
    alignedAxis: Cartesian3.ZERO,
    color: Color.WHITE,
    rotation:0,
    scale:1,
    width:18,
    height:18
}

class GeoWTFS {
    constructor(viewer, options) {
        if (!defined(viewer)) throw new DeveloperError('viewer is required.');
        if(!defined(options.url)) throw new DeveloperError('options.url is required.');
        options = defaultValue(options, {});
        this.viewer = viewer;
        this.proxy = options.proxy;
        this.url = options.url;
        this.icoUrl = options.icoUrl;
        this.metadata = options.metadata;
        this.roadMetadata = options.roadMetadata;
        this.roadUrl = options.roadUrl;
        this.labelGraphics = combine(options.labelGraphics, defaultLabelGraphics, true);
        this.billboardGraphics = combine(options.billboardGraphics, defaultBillboardGraphics, true);
        this.aotuCollide = !!options.aotuCollide;
        this.collisionPadding = defaultValue(options.collisionPadding, [3, 5, 3, 5]);
        this.serverFirstStyle = !!options.serverFirstStyle;
        this.subdomains = options.subdomains || [];
        this.tileCache= [];
        this.labelCache = [];
        this._isInitial = false;
        this._latelyGrid = [];
        this._latelyRefreshStamp = 0;
        this._latelyCollisionStamp = 0;
        const guid = createGuid();
        this._UUID = 'GEO_WTFS_LABEL_' + guid;
        this._UUIDRoad = 'GEO_WTFS_LABEL_ROAD_' + guid;
        this.viewer.camera.percentageChanged = 0.18;
        this.bindEvent();
    }

    bindEvent(){
        this.viewer.scene.camera.moveEnd.addEventListener(this._moveEnd, this);
        this.viewer.scene.camera.changed.addEventListener(this._changed, this);
    }

    _moveEnd(){
        clearTimeout(this._timer);
        const surface = this.viewer.scene.globe._surface;
        if (surface._tilesToRender.length < 2 || 0 < surface._tileLoadQueueHigh.length) {
            this._timer = setTimeout(() => {
                this._moveEnd();
            }, 100);
        } else {
            const tiles = this.getTilesToRender();
            if (this.compareArray(tiles, this._latelyGrid)) return;
            this._queueCall(tiles);
            this.delaySynchronous();
        }
    }

    _changed(){
        const now = new Date().getTime(), x = now - this._latelyRefreshStamp, d = now - this._latelyCollisionStamp;
        if (300 < x) {
            this._moveEnd()
        }
        if (150 < d) {
            this.collisionDetection()
        }
    }

    getTilesToRender(){
        const tiles =  this.viewer.scene.globe._surface._tilesToRender.map(function (e) {
            return {
                x: e.x,
                y: e.y,
                level: e.level,
                boundBox: {
                    minX: CMath.toDegrees(e.rectangle.west),
                    minY: CMath.toDegrees(e.rectangle.south),
                    maxX: CMath.toDegrees(e.rectangle.east),
                    maxY: CMath.toDegrees(e.rectangle.north)
                }
            }
        }).sort(function (a, b) {
            return b.level - a.level;
        });
        const x = [tiles[0].level]
        for (let i = 0; i < tiles.length; i++) {
            if(tiles[i].level !== x[x.length - 1]){
                x.push(tiles[i].level);
                if(4 < x.length){
                    tiles.splice(i, Infinity);
                    i--;
                }
            }
        }
        return tiles
    }

    compareArray(tiles, latelyGrid){
        let flag = false;
        for (let t = 0; t < tiles.length; t++) {
            let _ = false;
            for (let i = 0; i < latelyGrid.length; i++)
                if (tiles[t].x === latelyGrid[i].x && tiles[t].y === latelyGrid[i].y && tiles[t].level === latelyGrid[i].level) {
                    _ = true;
                    break;
                }
            if (!_) {
                flag = true;
                break;
            }
        }
        return !flag;
    }

    _queueCall(tiles){
        this._latelyGrid = tiles;
        this._latelyRefreshStamp = new Date().getTime();
        let len = tiles.length;
        while (len--){
            const tile = tiles[len];
            if(this.metadata && o(this.metadata.boundBox, tile.boundBox)){
                if(this.metadata.minLevel > tile.level + 1 || this.metadata.maxLevel < tile.level + 1) return;
                const cacheTile = this.getCacheTile(tile.x, tile.y, tile.level, 0);
                if(cacheTile) {
                    this.addLabelAndIco(cacheTile);
                }else {
                    const s = this.subdomains.length ? randomNum(0, this.subdomains.length - 1) : '';
                    let url = this.getTileUrl().replace('{x}', tile.x).replace('{y}', tile.y)
                        .replace('{z}', tile.level + 1).replace('{s}', s);
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'arraybuffer';
                    const that = this;
                    xhr.onload = function () {
                        if(!(xhr.status < 200 || 300 <= xhr.status)){
                            const res = that.cutString(xhr.response);
                            let tileData;
                            if(res){
                                tileData = parseData(res);
                                tileData.x = this.tile.x;
                                tileData.y = this.tile.y;
                                tileData.z = this.tile.z;
                                tileData.t = 0;
                                that.addCacheTile(tileData);
                                that.addLabelAndIco(tileData);
                            }else {
                                tileData = {
                                    x: this.tile.x,
                                    y: this.tile.y,
                                    z: this.tile.z,
                                    t: 0
                                }
                                that.addCacheTile(tileData);
                                that.delaySynchronous();
                            }
                        }
                    }
                    xhr.onerror = function (e) {
                        console.error(e);
                    }
                    xhr.send();
                    xhr.tile = {
                        x: tile.x,
                        y: tile.y,
                        z: tile.level + 1
                    };
                }
            }
            if(this.roadMetadata && o(this.roadMetadata.boundBox, tile.boundBox)){
                if(this.roadMetadata.minLevel > tile.level + 1 || this.roadMetadata.maxLevel < tile.level + 1) return;
                const cacheTile = this.getCacheTile(tile.x, tile.y, tile.level, 0);
                if(cacheTile) {
                    this.addLabelAndIco(cacheTile);
                }else {
                    const s = this.subdomains.length ? randomNum(0, this.subdomains.length - 1) : '';
                    const url = this.getRoadTileUrl().replace('{x}', tile.x).replace('{y}', tile.y)
                        .replace('{z}', tile.level + 1).replace('{s}', s);
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'json';
                    const that = this;
                    xhr.onload = function () {
                        if(!(xhr.status < 200 || 300 <= xhr.status)){
                            const res = xhr.response;
                            let tileData;
                            if(res){
                                tileData = {
                                    pois: res.map(e => {
                                        return{
                                            oid: e.LabelPoint.X + '_' + e.LabelPoint.Y,
                                            name: e.Feature.properties.Name,
                                            coordinate: [e.LabelPoint.X, e.LabelPoint.Y, e.LabelPoint.Z ? e.LabelPoint.Z : 0]
                                        }
                                    }),
                                    x: this.tile.x,
                                    y: this.tile.y,
                                    z: this.tile.z,
                                    t: 1
                                }
                                that.addCacheTile(tileData);
                                that.addLabelAndIco(tileData);
                            }else {
                                tileData = {
                                    x: this.tile.x,
                                    y: this.tile.y,
                                    z: this.tile.z,
                                    t: 1
                                }
                                that.addCacheTile(tileData);
                                that.delaySynchronous();
                            }
                        }
                    }
                    xhr.onerror = function (e) {
                        console.error(e);
                    }
                    xhr.send();
                    xhr.tile = {
                        x: tile.x,
                        y: tile.y,
                        z: tile.level + 1
                    };
                }
            }
        }
    }

    cutString(e){
        if (!e) return '';
        let x = e.byteLength;
        if (x <= 28) {
            return '';
        } else {
            return e.slice(19, x - 9);
        }
    }

    addCacheTile(Tile){
        if (999 < this.tileCache.length) {
            (this.tileCache.splice(0, 500))
        }
        this.removeCacheTile(Tile.x, Tile.y, Tile.z, Tile.t);
        this.tileCache.push(Tile);
    }

    getCacheTile(x, y, z, t){
        let len = this.tileCache.length;
        while (len--){
            const tileCache = this.tileCache[len];
            if(tileCache.x === x && tileCache.y === y && tileCache.z === z && tileCache.t === t) return tileCache;
        }
        return null;
    }

    removeCacheTile(x, y, z, t){
        let i = this.tileCache.length;
        while (i--){
            const cacheTile = this.tileCache[i];
            if(cacheTile.x === x && cacheTile.y === y && cacheTile.z === z && cacheTile.t === t){
                this.tileCache.splice(i, 1);
                return
            }
        }
    }

    getCacheLabel(id){
        let i = this.labelCache.length;
        while (i--){
            const cacheLabel = this.labelCache[i];
            if(cacheLabel.name === this._UUID && cacheLabel.oid === id) return cacheLabel
        }
        return null;
    }

    addCacheLabel(label){
        if(999 < this.labelCache.length){
            this.labelCache.splice(0, 250);
        }
        this.removeCacheLabel(label.oid);
        label.timestamp = new Date().getTime();
        this.labelCache.push(label)
    }

    removeCacheLabel(id){
        let i = this.labelCache.length;
        while (i--){
            if (this.labelCache[i].name === this._UUID && this.labelCache[i].oid === id){
                this.labelCache.splice(i, 1);
                return;
            }
        }
    }

    HexadecimalConversion(e){
        if (4278190080 === e) return '#000000';
        let x = 4278190080 | parseInt(-Number(e));
        e = '';
        if ((x = x.toString(16).substring(1)).length < 6)
            for (let d = 6 - x.length, t = 0; t < d; t++) e += '0';
        return '#' + e + x;
    }

    addLabelAndIco(tile){
        if (tile.pois && tile.pois.length){
            let i = tile.pois.length
            while (i--){
                const item = tile.pois[i]
                let label = this.getCacheLabel(item.oid);
                !label && (label = this.createLabel(item, tile));
                this.addCacheLabel(label);
            }
        }
        this.delaySynchronous();
    }

    createLabel(poi, tile){
        if(poi) {
            const entityOption = {
                show: true,
                position: Cartesian3.fromDegrees(...poi.coordinate),
                label: {text: poi.name}
            }
            Object.assign(entityOption.label, this.labelGraphics);
            if(this.serverFirstStyle){
                if(undefined !== poi.fontSize){
                    entityOption.label.font = poi.fontSize + 'px ';
                    if(undefined !== poi.fontNameIndex && tile.stringTable && tile.stringTable[poi.fontNameIndex]){
                        entityOption.label.font += tile.stringTable[poi.fontNameIndex];
                    } else {
                        entityOption.label.font += 'sans-serif'
                    }
                    if(!this.labelGraphics.bold && (1 !== poi.fontStyle || 3 !== poi.fontStyle)) {
                        entityOption.label.font = 'bold ' + entityOption.label.font;
                    }
                    if(2 !== poi.fontStyle || 3 !== poi.fontStyle) {
                        entityOption.label.font = 'italic ' + entityOption.label.font;
                    }
                }
                if(undefined !== poi.fontColor){
                    entityOption.label.fillColor = Color.fromCssColorString(this.HexadecimalConversion(poi.fontColor));
                }
                if(undefined !== poi.shiningColor){
                    entityOption.label.outlineColor = Color.fromCssColorString(this.HexadecimalConversion(poi.shiningColor));
                }
                if(typeof poi.shiningSize === 'number'){
                    entityOption.label.outlineWidth = poi.shiningSize;
                }
                if(undefined !== poi.showBackground){
                    entityOption.label.showBackground = poi.showBackground;
                }
                if(undefined !== poi.backgroundColor){
                    entityOption.label.backgroundColor = poi.backgroundColor;
                }
                if(undefined !== poi.backgroundPadding){
                    entityOption.label.backgroundPadding = poi.backgroundPadding;
                }
                if(undefined !== poi.eyeOffset){
                    entityOption.label.eyeOffset = poi.eyeOffset;
                }
                if(undefined !== poi.pixelOffset) {
                    entityOption.label.pixelOffset = poi.pixelOffset;
                }
                if(undefined !== poi.style){
                    entityOption.label.style = poi.style;
                }
                if(undefined !== poi.scale){
                    entityOption.label.scale = poi.scale;
                }
                if(!tile.t){
                    if(undefined !== poi.verticalOrigin){
                        entityOption.label.verticalOrigin = poi.verticalOrigin;
                    }
                    if(undefined !== poi.horizontalOrigin){
                        entityOption.label.horizontalOrigin = poi.horizontalOrigin;
                    }
                }
            }
            if(undefined !== poi.symbolID && -1 < poi.symbolID){
                const s = this.subdomains.length ? randomNum(0, this.subdomains.length - 1) : '';
                entityOption.billboard = {image: this.getIcoUrl().replace('{id}', tile.symbolID).replace('{s}', this.subdomains[s])};
                Object.assign(entityOption.billboard, this.billboardGraphics)
                if(this.serverFirstStyle){
                    if(undefined !== poi.displayHeight){
                        entityOption.billboard.width = poi.displayHeight;
                        entityOption.billboard.height = poi.displayHeight;
                    }
                    if (undefined !== poi.eyeOffset) {
                        entityOption.billboard.eyeOffset = poi.eyeOffset;
                    }
                    if (undefined !== poi.pixelOffset) {
                        entityOption.billboard.pixelOffset = poi.pixelOffset;
                    }
                    if (undefined !== poi.rotation) {
                        // (_['billboard']['rotation'] = e['rotation'])
                        entityOption.billboard.rotation = poi.rotation;
                    }
                    if (undefined !== poi.alignedAxis) {
                        entityOption.billboard.alignedAxis = poi.alignedAxis;
                    }
                    if (undefined !== poi.color) {
                        entityOption.billboard.color = poi.color;
                    }
                    if (undefined !== poi.scale) {
                        entityOption.billboard.scale = poi.scale;
                    }
                    if(!tile.t){
                        if(undefined !== poi.verticalOrigin){
                            entityOption.billboard.verticalOrigin = poi.verticalOrigin
                        }
                        if(undefined !== poi.horizontalOrigin){
                            entityOption.billboard.horizontalOrigin = poi.horizontalOrigin
                        }
                    }
                }
            }
            if(tile.t) {
                entityOption.label.verticalOrigin = VerticalOrigin.CENTER;
                entityOption.label.horizontalOrigin = HorizontalOrigin.CENTER;
                entityOption.billboard.verticalOrigin = VerticalOrigin.CENTER;
                entityOption.billboard.horizontalOrigin = HorizontalOrigin.CENTER;
            }
            const entity = new Entity(entityOption);
            entity.name = tile.x ? this._UUIDRoad : this._UUID;
            entity.oid = poi.oid;
            entity.priority = poi.priority || 0;
            entity.xyz = tile.x + '_' + tile.y + '_' + (tile.z - 1);
            return entity
        }
    }

    getIcoUrl(){
        return (this.proxy ? this.proxy.proxy : '') + this.icoUrl;
    }

    getTileUrl(){
        return (this.proxy ? this.proxy.proxy : '') + this.url;
    }

    getRoadTileUrl(){
        return (this.proxy ? this.proxy.proxy : '') + this.roadUrl;
    }

    delaySynchronous(){
        clearTimeout(this._timer2);
        this._timer2 = setTimeout(() => {
            this.synchronousLabel();
        }, 100);
    }

    synchronousLabel(){
        let i = this.labelCache.length;
        while (i--){
            const label = this.labelCache[i];
            label.timestamp >= this._latelyRefreshStamp && !this.viewer.entities.contains(label)
            && (this._isInitial && this.aotuCollide && (label.show = false), this.viewer.entities.add(label));
        }
        if(!this._isInitial){
            let j = this.viewer.entities.values.length;
            while (j--){
                const entity = this.viewer.entities.values[j]
                !entity.name || entity.name !== this._UUID && entity.name !== this._UUIDRoad ||
                entity.timestamp < this._latelyRefreshStamp && (this.viewer.entities.remove(entity), j--);
            }
            if(this.aotuCollide) this.collisionDetection()
        }
    }

    /**
     * 碰撞检测
     */
    collisionDetection(){
        const entities = this.viewer.entities.values;
        let d = [], s =[], len = entities.length;
        while (len--) {
            const entity = entities[len];
            if(entity.name && (entity.name === this._UUID || entity.name === this._UUIDRoad)){
                let point, i;
                point = SceneTransforms.wgs84ToDrawingBufferCoordinates(this.viewer.scene, entity.position.getValue(0));
                entity.show = true;
                i = this.getLabelReact({point, entity});
                entity.collisionBox = i;
                let n = null, a = d.length;
                while (!n && a--){
                    if(d[a].xyz === entity.xyz) n = d[a]
                }
                if(!n){
                    n = {xzy: entity.xyz, entities: []};
                    d.push(n);
                    n.entities.push(entity);
                }
            }
        }
        let dLen = d.length;
        while (dLen--){
            const item = d[dLen];
            item.entities.sort(function (a, b) {return a.priority- b.priority;});
            for (let i = 0; i < item.entities.length; i++) {
                const oItem = item.entities[i];
                if(oItem.show){
                    for (let j = i + 1; j < item.entities.length; j++) {
                        if(item.entities[j].show && h(oItem.collisionBox, item.entities[j].collisionBox)){
                            item.entities[j].show = false;
                        }
                    }
                    s.push(oItem);
                }
            }
        }
        let m = s.length;
        while (m--){
            if(s[m].show){
                s.sort(function (a, b) {return a.priority - b.priority});
                for (let i = m + 1; i < s.length; i++) {
                    s[i].show && h(s[m].collisionBox, s[i].collisionBox) && (s[i].show = false);
                }
            }
        }
    }

    /**
     * 获取label的区域
     * @param data
     * @return {{x: number, width: *, y: number, height: *}}
     */
    getLabelReact(data){
        const {point, entity} = data;
        let fontSize = parseInt(entity.label.font);
        fontSize = 0 < fontSize ? fontSize : 15;
        const d = entity.label.text.getValue(0).split('\n');
        let t = 0;
        for (let i = 0; i < d.length; i++) {
            let n = s(d[i]) / 2;
            if(t < n) t = n;
        }
        let a = entity.billboard ? entity.billboard.width.getValue(0) * entity.billboard.scale.getValue(0) : 1;
        let r = entity.billboard ? entity.billboard.height.getValue(0) * entity.billboard.scale.getValue(0) : 1;
        return {
            x: (point ? point.x : -999) - a / 2 - this.collisionPadding[3],
            y: (point ? point.y : -999) - r / 2 - this.collisionPadding[0],
            width: fontSize * entity.label.scale.getValue(0) * t + entity.label.pixelOffset.getValue(0).x + a + this.collisionPadding[1],
            height: fontSize * entity.label.scale.getValue(0) * t + entity.label.pixelOffset.getValue(0).y + a + this.collisionPadding[2]
        }
    }

    initTDT(e){
        let x = 0;
        this._isInitial = true;
        this._queueCall(e);
        const t = setInterval(() => {
            if (3 < x) {
                this._isInitial = false;
                clearInterval(t);
            }
            if (x % 2 === 0 && this.aotuCollide) {
                this.collisionDetection()
            }
            x++;
        }, 600);
        return this;
    }

    getPropertyValue(e, x, d, t){
        if (undefined !== x[e]) {
            return x[e];
        } else {
            return undefined !== d[e] ? d[e] : t;
        }
    }

    unbindEvent(){
        this.viewer.scene.camera.moveEnd.removeEventListener(this._moveEnd, this);
        this.viewer.scene.camera.changed.removeEventListener(this._changed, this);
    }

    activate(){
        this._latelyGrid= [];
        this._moveEnd();
    }

    destroy(){
        let i = this.viewer.entities.values.length;
        while (i--){
            const entity = this.viewer.entities.values[i];
            !entity.name || entity.name !== this._UUID && entity.name !== this._UUIDRoad || (this.viewer.entities.remove(entity), i--);
        }
        this.viewer.camera.percentageChanged = 0.5;
        this.unbindEvent();
        this.handler = this.handler && this.handler.destroy();
        this.proxy = undefined;
        this.viewer = undefined;
        this.url = undefined;
        this.labelGraphics = undefined;
        this.billboardGraphics = undefined;
        this.aotuCollide = undefined;
        this.collisionPadding = undefined;
        this.tileCache = undefined;
        this.labelCache = undefined;
        this._latelyGrid = undefined;
        this._latelyRefreshStamp = undefined;
        this._roadTileset = undefined;
    }

    getLabelVisibility(Label){
        if (!Label) return false;
        const x = this.viewer.canvas.getBoundingClientRect();
        return !(Label.x < -10 || Label.x > x.right + 10) && !(Label.y < -10 || Label.y > x.bottom + 10);
    }
}

export default GeoWTFS
