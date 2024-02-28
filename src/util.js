import {parse} from "protobufjs"
export function loadProto(str) {
    return parse(str)
}
