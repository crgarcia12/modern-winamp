import { Options } from "./types";
import { PrivateOptions } from "./webampLazy";
import Webamp from "./webamp";
export default class WebampWithButterchurn extends Webamp {
    constructor(options: Options & PrivateOptions);
}
