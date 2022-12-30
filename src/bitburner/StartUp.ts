import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.run("Nuker.js");
    // ns.run("ServerController.js");
    // ns.run("HackingManager.js");
    ns.run("purchasers/PurchaseHackNet.js", 1, 30);
    ns.run("purchasers/PurchaseServers.js");
    ns.run("purchasers/UpgradeGang.js");
    ns.run("cycles/allocator.js");
    ns.run("cycles/scheduler.js");

    // const totalRam = ns.getServerMaxRam("home")-ns.getServerUsedRam("home")+ns.getScriptRam("StartUp.js")-ns.getScriptRam("ConfigUpdater.js");
    // const hackRam = ns.getScriptRam("Hack.js");
    // const t = Math.round(totalRam / hackRam);
    // ns.spawn("Hack.js", t, t, 0);
}