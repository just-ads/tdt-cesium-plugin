import "../util/zlib.min";
import {
    Credit,
    defaultValue,
    defined,
    DeveloperError,
    Ellipsoid,
    Event,
    GeographicTilingScheme,
    TerrainProvider,
    when,
    Request, RequestScheduler,
    HeightmapTerrainData, Rectangle
} from 'cesium'
import {randomNum} from "../../xzmap/util/util";

function getRequest(url, request) {
    request = defined(request) ? request : new Request();
    request.url = url;
    request.requestFunction = function () {
        let promise, xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.send();
        promise = when.defer();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (defined(xhr.response)) {
                        let e = new DataView(xhr.response), x = new Uint8Array(e.byteLength);
                        for (let d = 0; d < e.byteLength;) {
                            x[d] = e.getUint8(d);
                            d++
                        }
                        let t = undefined;
                        if (!(x.length < 1000)) {
                            let _x = new Zlib.Inflate(x);
                            if (defined(_x)) {
                                t = _x.decompress();
                            }
                        }
                        if (defined(t)) {
                            promise.resolve(t);
                        } else {
                            promise.reject(t);
                        }
                    }
                } else {
                    (400 <= xhr.status || 0 === xhr.status) && promise.reject(undefined);
                }
            }
        };
        return promise.promise;
    };
    return RequestScheduler.request(request);
}

class GeoTerrainProvider {
    constructor(options) {
        options = defaultValue(options, {});
        if (!defined(options.url)) throw new DeveloperError('options.url is required.');
        this._dataType = defaultValue(options.dataType, 'int');
        this._tileType = defaultValue(options.tileType, 'heightmap');
        this._url = options.url;
        this._maxTerrainLevel = defaultValue(options.dataType, 'int');
        this._proxy = options.proxy;
        this._subdomains = options.subdomains;
        this.init(options);
    }

    init(options) {
        this._ready = false;
        this._errorEvent = new Event();
        this._readyPromise = when.defer();
        this._terrainDataStructure = {
            heightScale: 0.001,
            heightOffset: -1000,
            elementsPerHeight: 3,
            stride: 4,
            elementMultiplier: 256,
            isBigEndian: true
        }
        const credit = options.credit;
        if (typeof credit === 'string') {
            this._credit = new Credit(credit);
        }
        this._rectangles = [];
        const ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        this._tilingScheme = new GeographicTilingScheme({ellipsoid});
        this._heightmapWidth = 64;
        this._heightmapHeight = 64;
        this._levelZeroMaximumGeometricError = TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
            ellipsoid,
            Math.min(this._heightmapWidth, this._heightmapHeight),
            this._tilingScheme.getNumberOfXTilesAtLevel(0)
        );
        this._ready = true;
        this._readyPromise.resolve(true);
        this._name = options.name;
        this._opacity = options.opacity;
        this._maxExtent = options.maxExtent;
        this._topLevel = defaultValue(options.topLevel, 5);
        this._bottomLevel = defaultValue(options.bottomLevel, 25);
    }

    requestTileGeometry(x, y, level, request) {
        if (!this._ready) throw new DeveloperError('requestTileGeometry must not be called before ready returns true.');
        let s = '', url = this._url;
        if (Array.isArray(this._subdomains) && this._subdomains.length) {
            s = this._subdomains[randomNum(0, this._subdomains.length - 1)];
            url = this._url.replace('{s}', s);
        }
        // Gets the total number of tiles in the Y direction at a specified level-of-detail.
        this._tilingScheme.getNumberOfYTilesAtLevel(level);
        if (level < this._bottomLevel && level >= this._topLevel) {
            let _request;
            url = url.replace('{x}', x).replace('{y}', y).replace('{z}', level + 1);
            const proxy = this._proxy;
            if (defined(proxy)) {
                url = proxy.getURL(url);
                request = defaultValue(request, true);
                _request = getRequest(url, request);
                if (!defined(_request)) {
                    return
                }
            } else {
                _request = getRequest(url);
            }
            if (this._tileType === 'quantized-mesh') {
                // todo
            }
            return when(_request, (e) => {
                let x = this.transformBuffer(e);
                if (defined(x)) {
                    const terrainData = new HeightmapTerrainData({
                        buffer: x,
                        width: this._heightmapWidth,
                        height: this._heightmapHeight,
                        childTileMask: this.getChildTileMask(x, y, level),
                        structure: this._terrainDataStructure
                    });
                    terrainData._skirtHeight = 6000;
                    return terrainData;
                }
            })
        }
        if(level < this._topLevel){
            return new HeightmapTerrainData({
                buffer: this.getVHeightBuffer(),
                width: this._heightmapWidth,
                height: this._heightmapHeight,
                childTileMask: this.getChildTileMask(x, y, level),
                structure: this._terrainDataStructure
            });
        }
        if (level >= this._bottomLevel) {
            return new Promise(function (e, x) {
                x('该级别不发送请求!');
            });
        } else {
            return undefined;
        }
    }

    getLevelMaximumGeometricError(e){
        if (!this.ready)
            throw new DeveloperError('requestTileGeometry must not be called before ready returns true.');
        return this._levelZeroMaximumGeometricError / (1 << e);
    }

    getTileDataAvailable(e, x, d){
        if (d < 25) return true;
    }

    transformBuffer(e) {
        let x = 2;
        if (this._dataType === 'int') {
            x = 2
        } else if (this._dataType === 'float') {
            x = 4
        }
        let d = e;
        if (d.length !== 22500 * x) return null;
        let t, _, n, a,
            r = new ArrayBuffer(x),
            o = new DataView(r),
            s = this._heightmapWidth, c = this._heightmapHeight, h = new Uint8Array(s * c * 4);
        for (let f = 0; f < c; f++)
            for (let l = 0; l < s; l++) {
                n = parseInt(149 * f / (c - 1));
                a = parseInt(149 * l / (s - 1));
                _ = x * (150 * n + a);
                if (4 === x) {
                    o.setInt8(0, d[_]);
                    o.setInt8(1, d[_ + 1]);
                    o.setInt8(2, d[_ + 2]);
                    o.setInt8(3, d[_ + 3]);
                    t = o.getFloat32(0, true);
                } else {
                    t = d[_] + 256 * d[_ + 1]
                }
                if (10000 < t || t < -2000) t = 0;
                let u = (t + 1000) / 0.001, i = 4 * (f * s + l);
                h[i] = u / 65536;
                h[1 + i] = (u - 256 * h[i] * 256) / 256;
                h[2 + i] = u - 256 * h[i] * 256 - 256 * h[1 + i];
                h[3 + i] = 255;
            }
        return h;
    }

    getVHeightBuffer(){
        let e = this._vHeightBuffer;
        if (!defined(e)) {
            e = new Uint8ClampedArray(this._heightmapWidth * this._heightmapHeight * 4);
            for (let x = 0; x < this._heightmapWidth * this._heightmapHeight * 4;){
                e[x++] = 15;
                e[x++] = 66;
                e[x++] = 64;
                e[x++] = 255;
            }
            this._vHeightBuffer = e;
        }
        return e;
    }

    getChildTileMask(x, d, t) {
        let h = new Rectangle()
        let _ = this._tilingScheme, i = this._rectangles, n = _.tileXYToRectangle(x, d, t), a = 0;
        for (let r = 0; r < i.length && 15 !== a; ++r) {
            let o = i[r];
            if (!(o.maxLevel <= t)) {
                let s = o.rectangle, c = Rectangle.intersection(s, n, h);
                if (defined(c)) {
                    if (f(_, s, 2 * x, 2 * d, t + 1, h)) {
                        (a |= 4)
                    }
                    if (f(_, s, 2 * x + 1, 2 * d, t + 1, h)) {
                        (a |= 8)
                    }
                    if (f(_, s, 2 * x, 2 * d + 1, t + 1, h)) {
                        (a |= 1)
                    }
                    if (f(_, s, 2 * x + 1, 2 * d + 1, t + 1, h)) {
                        (a |= 2)
                    }
                }
            }
        }
        return a;
    }

    f(e, x, d, t, _, h) {
        let i = e.tileXYToRectangle(d, t, _);
        return defined(Rectangle.intersection(i, x, h));
    }


    get errorEvent() {
        return this._errorEvent;
    }

    get credit() {
        return this._credit;
    }

    get tilingScheme() {
        if (!this.ready) throw new DeveloperError('requestTileGeometry must not be called before ready returns true.');
        return this._tilingScheme;
    }

    get ready() {
        return this._ready;
    }

    get readyPromise() {
        return this._readyPromise.promise;
    }

    get hasWaterMask() {
        return false;
    }

    get hasVertexNormals() {
        return false
    }
}

export default GeoTerrainProvider
