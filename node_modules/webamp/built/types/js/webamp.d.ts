import { Options } from "./types";
import WebampLazy, { PrivateOptions } from "./webampLazy";
export type * from "./types";
export default class Webamp extends WebampLazy {
    constructor(options: Options & PrivateOptions);
}
