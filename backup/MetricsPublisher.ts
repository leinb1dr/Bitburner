import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export function reportHack(ns: NS, port: number, target: string, money: number, duration: number) {
	const hostname = ns.getHostname();
	ns.writePort(port, JSON.stringify({
		metrics: [
			{
				name: "hack",
				value: 1,
			},
			{
				name: "hack_money",
				value: money
			},
			{
				name: "hack_duration",
				value: duration
			}
		],
		labels: [{
			name: "target",
			value: target
		},{
			name: "source",
			value: hostname
		}
	]
	}));
}

/** @param {NS} ns */
export function reportGrow(ns: NS, port: number, target: string, money: number, duration: number) {
	const hostname = ns.getHostname();
	ns.writePort(port, JSON.stringify({
		metrics: [
			{
				name: "grow",
				value: 1,
			},
			{
				name: "grow_mutiplier",
				value: money
			},
			{
				name: "grow_duration",
				value: duration
			}
		],
		labels: [{
			name: "target",
			value: target
		},{
			name: "source",
			value: hostname
		}
	]
	}));
}

/** @param {NS} ns */
export function reportWeaken(ns: NS, port: number, target: string, money: number, duration: number) {
	const hostname = ns.getHostname();
	ns.writePort(port, JSON.stringify({
		metrics: [
			{
				name: "weaken",
				value: 1,
			},
			{
				name: "weaken_total",
				value: money
			},
			{
				name: "weaken_duration",
				value: duration
			}
		],
		labels: [{
			name: "target",
			value: target
		},{
			name: "source",
			value: hostname
		}
	]
	}));
}