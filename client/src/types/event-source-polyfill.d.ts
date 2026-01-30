declare module 'event-source-polyfill' {
    export class EventSourcePolyfill {
        constructor(url: string, eventSourceInitDict?: any);
        onopen: (event: any) => void;
        onmessage: (event: any) => void;
        onerror: (event: any) => void;
        close(): void;
    }
}
