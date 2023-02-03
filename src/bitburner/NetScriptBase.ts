import { NS } from "NetScriptDefinitions";
import { HackSupport } from "./utility/HackSupport";
import { Logger, LoggerFactory } from "./utility/Logger";

export abstract class NetscriptBase {
    protected ns: NS
    protected support: HackSupport;
    protected logger: Logger;

    constructor(ns: NS) {
        LoggerFactory.init(ns);
        this.logger=LoggerFactory.newLogger();
        this.ns = ns;
        this.support = new HackSupport(ns);
    }

    protected abstract init();
}