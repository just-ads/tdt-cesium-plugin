import {inflate} from 'pako/lib/inflate.js'
import {
    defaultValue,
    defined,
    DeveloperError,
    Ellipsoid,
    Resource,
    HeightmapTerrainData,
    Rectangle,
    TileAvailability,
    CustomHeightmapTerrainProvider
} from 'cesium'

function f(e, x, d, t, _, h) {
    let i = e.tileXYToRectangle(d, t, _);
    return defined(Rectangle.intersection(i, x, h));
}

function createAvailability(provider) {
    const overallAvailability = [[[0, 0, 1, 0]]]
    const length = overallAvailability.length;
    const availability = new TileAvailability(provider.tilingScheme, 19);
    for (let level = 0; level < length; ++level) {
        const levelRanges = overallAvailability[level];
        for (let i = 0; i < levelRanges.length; ++i) {
            const range = levelRanges[i];
            availability.addAvailableTileRange(
                level,
                range[0],
                range[1],
                range[2],
                range[3],
            );
        }
    }
    return availability
}

function createHeightmapTerrainData(provider, buffer, level, x, y) {
    const terrainData = new HeightmapTerrainData({
        buffer: provider._transformBuffer(buffer),
        width: provider._width,
        height: provider._height,
        childTileMask: provider._getChildTileMask(x, y, level),
        structure: provider._terrainDataStructure
    });
    terrainData._skirtHeight = 6000;
    provider.availability.addAvailableTileRange(level, x, y, x, y)
    return terrainData;
}

class GeoTerrainProvider extends CustomHeightmapTerrainProvider {
    constructor(options) {
        options = defaultValue(options, {});
        super({
            ...options,
            // 必需，虽然 requestTileGeometry 被重写了
            callback: () => undefined,
            ellipsoid: Ellipsoid.WGS84,
            width: 64,
            height: 64,
        });
        if (!defined(options.url)) throw new DeveloperError('options.url is required.');
        this._dataType = defaultValue(options.dataType, 'int16');
        this._url = options.url;
        this._subdomains = options.subdomains;
        this._token = options.token;

        this._rectangles = [];
        this._topLevel = 5;
        this._bottomLevel = 25;
        this._terrainDataStructure = {
            heightScale: 0.001,
            heightOffset: -1000,
            elementsPerHeight: 3,
            stride: 4,
            elementMultiplier: 256,
            isBigEndian: true
        }
        this._availability = createAvailability(this);
    }

    get availability() {
        return this._availability
    }

    requestTileGeometry(x, y, level, request) {
        if (level >= this._bottomLevel) return Promise.reject(`${level}该级别不发送请求!`);
        if (level < this._topLevel) {
            return Promise.resolve(new HeightmapTerrainData({
                buffer: this._getVHeightBuffer(),
                width: this._width,
                height: this._height,
                childTileMask: this._getChildTileMask(x, y, level),
                structure: this._terrainDataStructure
            }));
        }

        let s = '', url = this._url;
        if (Array.isArray(this._subdomains) && this._subdomains.length) {
            s = this._subdomains[(x + y) % this._subdomains.length];
            url = url.replace('{s}', s);
        }
        url = url.replace('{token}', this._token).replace('{x}', x).replace('{y}', y).replace('{z}', level + 1);

        const tileResource = Resource.fetchArrayBuffer({url, request});
        if (!tileResource) return undefined;

        return tileResource
            .then(buffer => {
                if (buffer.byteLength < 1000) return Promise.reject('无效数据');
                return inflate(buffer);
            })
            .then(uint8Array => {
                return createHeightmapTerrainData(this, uint8Array, level, x, y);
            });
    }

    getTileDataAvailable(e, x, d) {
        if (d < this._bottomLevel) return true;
    }

    _transformBuffer(e) {
        let x = 2;
        if (this._dataType === 'int16') {
            x = 2
        } else if (this._dataType === 'float') {
            x = 4
        }
        let d = e;
        if (d.length !== 22500 * x) return null;
        let t, _, n, a,
            r = new ArrayBuffer(x),
            o = new DataView(r),
            s = this._width, c = this._height, h = new Uint8Array(s * c * 4);
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

    _getVHeightBuffer() {
        let e = this._vHeightBuffer;
        if (!defined(e)) {
            e = new Uint8ClampedArray(this._width * this._height * 4);
            for (let x = 0; x < this._width * this._height * 4;) {
                e[x++] = 15;
                e[x++] = 66;
                e[x++] = 64;
                e[x++] = 255;
            }
            this._vHeightBuffer = e;
        }
        return e;
    }

    _getChildTileMask(x, d, t) {
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
}

export default GeoTerrainProvider
