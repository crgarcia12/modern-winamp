import { WindowId } from "../types";
interface Coord {
    x: number;
    y: number;
}
interface Props extends React.HTMLAttributes<HTMLDivElement> {
    handleDrop(e: React.DragEvent<HTMLDivElement>, coord: Coord): void;
    windowId: WindowId;
    onWheelActive?: (e: WheelEvent) => void;
}
export default function DropTarget(props: Props): import("react/jsx-runtime").JSX.Element;
export {};
