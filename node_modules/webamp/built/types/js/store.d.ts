import { IMedia } from "./media";
import Emitter from "./emitter";
import { Extras, PartialState, Middleware, Store } from "./types";
export default function createWebampStore(media: IMedia, actionEmitter: Emitter, customMiddlewares: Middleware[] | undefined, stateOverrides: PartialState | undefined, extras: Extras): Store;
