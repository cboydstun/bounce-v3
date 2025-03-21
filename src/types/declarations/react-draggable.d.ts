declare module 'react-draggable' {
    import * as React from 'react';

    export interface DraggableProps {
        allowAnyClick?: boolean;
        axis?: 'both' | 'x' | 'y' | 'none';
        bounds?: { left?: number; top?: number; right?: number; bottom?: number } | string;
        cancel?: string;
        children?: React.ReactNode;
        defaultClassName?: string;
        defaultClassNameDragging?: string;
        defaultClassNameDragged?: string;
        defaultPosition?: { x: number; y: number };
        disabled?: boolean;
        grid?: [number, number];
        handle?: string;
        offsetParent?: HTMLElement;
        onMouseDown?: (e: MouseEvent) => void;
        onStart?: (e: MouseEvent, data: DraggableData) => void | false;
        onDrag?: (e: MouseEvent, data: DraggableData) => void | false;
        onStop?: (e: MouseEvent, data: DraggableData) => void | false;
        nodeRef?: React.RefObject<HTMLElement>;
        position?: { x: number; y: number };
        positionOffset?: { x: number | string; y: number | string };
        scale?: number;
        transform?: string;
    }

    export interface DraggableData {
        node: HTMLElement;
        x: number;
        y: number;
        deltaX: number;
        deltaY: number;
        lastX: number;
        lastY: number;
    }

    export interface DraggableCoreProps {
        allowAnyClick?: boolean;
        cancel?: string;
        children?: React.ReactNode;
        disabled?: boolean;
        enableUserSelectHack?: boolean;
        grid?: [number, number];
        handle?: string;
        nodeRef?: React.RefObject<HTMLElement>;
        onMouseDown?: (e: MouseEvent) => void;
        onStart?: (e: MouseEvent, data: DraggableData) => void | false;
        onDrag?: (e: MouseEvent, data: DraggableData) => void | false;
        onStop?: (e: MouseEvent, data: DraggableData) => void | false;
        offsetParent?: HTMLElement;
        scale?: number;
        transform?: string;
    }

    export class DraggableCore extends React.Component<DraggableCoreProps> { }
    export default class Draggable extends React.Component<DraggableProps> {
        static DraggableCore: typeof DraggableCore;
    }
}
