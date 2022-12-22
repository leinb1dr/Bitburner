import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.run("Nuker.js");
    ns.run("ServerController.js");
    ns.run("HackingManager.js");
    ns.run("PurchaseHackNet.js", 1, 30);
    ns.run("PurchaseServers.js");
}