import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns:NS) {
	ns.disableLog("ALL");
	find(ns, [], "", "home", ns.args[0] as string, 0);
}

function find(ns: NS, stack: string[], prev: string, cur: string, term: string, depth: number) {

	if (depth >= 20) return 0;

	ns.scan(cur).forEach((adj) => {

		if (adj === term) {
			let commandSet = "";
			const totalPath = [...stack].concat([prev, cur, term]);
			totalPath.forEach(server => {
				if (server.length > 0) {
					if (server === "home") {
						commandSet = `${commandSet}${server};`;

					} else {
						commandSet = `${commandSet}connect ${server};`;
					}
				}
			});
			const terminalInput = document.getElementById("terminal-input") as HTMLInputElement;
			terminalInput.value = commandSet;
			const handler = Object.keys(terminalInput)[1];
			terminalInput[handler].onChange({ target: terminalInput });
			terminalInput[handler].onKeyDown({ key: "Enter", preventDefault: () => null });

			ns.print(commandSet);
			return 1;
		}

		if (adj != prev) {
			if (find(ns, [...stack].concat([prev]), cur, adj, term, depth + 1) == 1) return 1;
		}

	});
	return 0;

}