import { NS } from "NetScriptDefinitions";
import { initializeCorp } from "corp/initializeCorp";
import { developProducts } from "corp/developProducts";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    await developProducts(ns, ns.corporation);
    // initializeCorp(ns, ns.corporation);
}