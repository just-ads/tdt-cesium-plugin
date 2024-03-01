# tdt_terrain
> cesium天地图地形和地名，提取自天地图官方插件

## 使用

### 地形
```javascript
const viewer = new Cesium.Viewer('container');

viewer.terrainProvider = new TdtPlug.GeoTerrainProvider({
    url: 'https://t{s}.tianditu.gov.cn/mapservice/swdx?T=elv_c&x={x}&y={y}&l={z}&tk=你的token',
    subdomains: ['0','1','2','3','4','5','6','7'],
});

```
### 地名
```javascript
const viewer = new Cesium.Viewer('container');
new TdtPlug.GeoWTFS(viewer, {
        subdomains: ['0','1','2','3','4','5','6','7'],
        url: 'https://t{s}.tianditu.gov.cn/mapservice/GetTiles?lxys={z},{x},{y}&tk=你的token',
        icoUrl: 'https://t{s}.tianditu.gov.cn/mapservice/GetIcon?id={id}&tk=你的token',
        metadata:{
            boundBox: {
                minX: -180,
                minY: -90,
                maxX: 180,
                maxY: 90
            },
            minLevel: 1,
            maxLevel: 20
        },
        autoCollide: true, //是否开启避让
        collisionPadding: [5, 10, 8, 5], //开启避让时，标注碰撞增加内边距，上、右、下、左
        serverFirstStyle: true, //服务端样式优先
    })
```

