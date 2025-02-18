declare module 'retell-client-js-sdk' {
    export class RetellWebClient {
        constructor();

        on(event: string, callback: (...args: any[]) => void): void;
        startCall(options: { accessToken: string }): Promise<void>;
        stopCall(): void;
    }
}