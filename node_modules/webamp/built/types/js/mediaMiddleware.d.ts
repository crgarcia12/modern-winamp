import { IMedia } from "./media";
import { MiddlewareStore, Action, Dispatch } from "./types";
declare const _default: (media: IMedia) => (store: MiddlewareStore) => (next: Dispatch) => (action: Action) => Action;
export default _default;
