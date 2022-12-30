import { NS } from "NetScriptDefinitions";

export type NetworkScanResult = {
    seen: Set<string>,
    root: string[]
}


export class Discovery {
    ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    findAll(filter: (val: string) => true = () => true, startServer: string = "home"): NetworkScanResult {
        // server crawl stack
        const servers = [startServer];

        // no backtrack set
        const seen = new Set<string>();
        seen.add(startServer);
        const root: string[] = [];

        // Continue while we have servers to look at
        while (servers.length > 0) {
            const cur = servers.shift();
            // All adjacent servers
            const newServers = this.ns.scan(cur);
            for (const server of newServers) {
                // Determine if we have seen the server, before adding it to the queue
                if (!seen.has(server)) {
                    seen.add(server);
                    servers.push(server);
                    //Determine if we have rooted this server
                    if (this.ns.hasRootAccess(server) && filter(server)) {
                        root.push(server);
                    }
                }
            }
        }

        return { root: root, seen: seen };
    }
}