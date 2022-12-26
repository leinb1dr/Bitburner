import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.run("Nuker.js");
    ns.run("ServerController.js");
    ns.run("HackingManager.js");
    ns.run("PurchaseHackNet.js", 1, 30);
    ns.run("PurchaseServers.js");
    ns.run("UpgradeGang.js");

    const totalRam = ns.getServerMaxRam("home")-ns.getServerUsedRam("home")+ns.getScriptRam("StartUp.js")-ns.getScriptRam("ConfigUpdater.js");
    const hackRam = ns.getScriptRam("Hack.js");
    const t = Math.round(totalRam / hackRam);
    ns.spawn("Hack.js", t, t, 0);
}