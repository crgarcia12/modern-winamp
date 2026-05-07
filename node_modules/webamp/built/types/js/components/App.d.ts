import { FilePicker } from "../types";
import { IMedia } from "../media";
interface Props {
    filePickers: FilePicker[];
    media: IMedia;
    parentDomNode: HTMLElement;
    onMount?: () => void;
}
/**
 * Constructs the windows to render
 */
export default function App({ media, filePickers, onMount, parentDomNode, }: Props): import("react").ReactPortal | null;
export {};
