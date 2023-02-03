/* eslint-disable @typescript-eslint/no-explicit-any */
import { NetscriptPort, NS } from "NetScriptDefinitions";

export class LoggerFactory {
    private static loggerFactory: LoggerFactory;

    static init(ns: NS) {
        if (!this.loggerFactory) this.loggerFactory = new LoggerFactory(ns);
    }

    static newLogger() {
        return this.loggerFactory.newLogger();
    }

    ns: NS;

    private constructor(ns: NS) {
        this.ns = ns;
    }

    private newLogger() {
        return new Logger(this.ns.getHostname(), this.ns.print.bind(this.ns), this.ns.getPortHandle(6));
    }
}

type PrintFunction = (...args: any[]) => void

export class Logger {
    private hostname: string;
    private print: PrintFunction;
    private portHandle:NetscriptPort;

    constructor(host:string, print: PrintFunction, portHandle:NetscriptPort) {
        this.hostname = host;
        this.print = print;
        this.portHandle = portHandle;
    }

    info(...args: any[]) {
        const caller = new Error().stack.split("\n")[2].trim().match(/at (.+?) \(.+/)[1];

        const message = `[${new Date().toLocaleString()}][${this.hostname}][${caller}][INFO] - ${args}`;
        this.print(message);
        this.portHandle.tryWrite(message);
    }
}