import {parse} from "protobufjs"
export function loadProto(str) {
    return parse(str)
}

// window.test = function () {
//     const wtfs = new GeoWTFS(xzMap.viewer,{
//         subdomains: ['0','1','2','3','4','5','6','7'],
//         url: 'https://t{s}.tianditu.gov.cn/mapservice/GetTiles?lxys={z},{x},{y}&tk=1b4a615dbff43f696e8541df66c81c2d',
//         icoUrl: 'https://t{s}.tianditu.gov.cn/mapservice/GetIcon?id={id}&tk=1b4a615dbff43f696e8541df66c81c2d',
//         metadata:{
//             boundBox: {
//                 minX: -180,
//                 minY: -90,
//                 maxX: 180,
//                 maxY: 90
//             },
//             minLevel: 1,
//             maxLevel: 20
//         },
//         aotuCollide: true, //是否开启避让
//         collisionPadding: [5, 10, 8, 5], //开启避让时，标注碰撞增加内边距，上、右、下、左
//         serverFirstStyle: true, //服务端样式优先
//     })
//     wtfs.initTDT([{"x":6,"y":1,"level":2,"boundBox":{"minX":90,"minY":0,"maxX":135,"maxY":45}},{"x":7,"y":1,"level":2,"boundBox":{"minX":135,"minY":0,"maxX":180,"maxY":45}},{"x":6,"y":0,"level":2,"boundBox":{"minX":90,"minY":45,"maxX":135,"maxY":90}},{"x":7,"y":0,"level":2,"boundBox":{"minX":135,"minY":45,"maxX":180,"maxY":90}},{"x":5,"y":1,"level":2,"boundBox":{"minX":45,"minY":0,"maxX":90,"maxY":45}},{"x":4,"y":1,"level":2,"boundBox":{"minX":0,"minY":0,"maxX":45,"maxY":45}},{"x":5,"y":0,"level":2,"boundBox":{"minX":45,"minY":45,"maxX":90,"maxY":90}},{"x":4,"y":0,"level":2,"boundBox":{"minX":0,"minY":45,"maxX":45,"maxY":90}},{"x":6,"y":2,"level":2,"boundBox":{"minX":90,"minY":-45,"maxX":135,"maxY":0}},{"x":6,"y":3,"level":2,"boundBox":{"minX":90,"minY":-90,"maxX":135,"maxY":-45}},{"x":7,"y":2,"level":2,"boundBox":{"minX":135,"minY":-45,"maxX":180,"maxY":0}},{"x":5,"y":2,"level":2,"boundBox":{"minX":45,"minY":-45,"maxX":90,"maxY":0}},{"x":4,"y":2,"level":2,"boundBox":{"minX":0,"minY":-45,"maxX":45,"maxY":0}},{"x":3,"y":1,"level":2,"boundBox":{"minX":-45,"minY":0,"maxX":0,"maxY":45}},{"x":3,"y":0,"level":2,"boundBox":{"minX":-45,"minY":45,"maxX":0,"maxY":90}},{"x":2,"y":0,"level":2,"boundBox":{"minX":-90,"minY":45,"maxX":-45,"maxY":90}},{"x":0,"y":1,"level":2,"boundBox":{"minX":-180,"minY":0,"maxX":-135,"maxY":45}},{"x":1,"y":0,"level":2,"boundBox":{"minX":-135,"minY":45,"maxX":-90,"maxY":90}},{"x":0,"y":0,"level":2,"boundBox":{"minX":-180,"minY":45,"maxX":-135,"maxY":90}}]);
// }
