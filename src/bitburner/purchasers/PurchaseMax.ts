import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns:NS) {

	ns.print(ns.purchaseServer("home", ns.getPurchasedServerMaxRam()));
}