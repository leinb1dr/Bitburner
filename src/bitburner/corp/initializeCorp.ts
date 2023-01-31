import { Corporation, Division, NS } from "NetScriptDefinitions";

enum CityName {
    Aevum = "Aevum",
    Chongqing = "Chongqing",
    Sector12 = "Sector-12",
    NewTokyo = "New Tokyo",
    Ishima = "Ishima",
    Volhaven = "Volhaven",
}

async function hasFunds(ns: NS, c: Corporation, cost: number) {
    while (c.getCorporation().funds < cost) {
        await ns.sleep(1000);
    }
}

export async function initializeCorp(ns: NS, c: Corporation) {
    !c.hasUnlockUpgrade("Smart Supply") && c.unlockUpgrade("Smart Supply");

    const division = initDivision(ns, c);

    await initialExpansion(ns, c, division);
    await purchaseAdvert(ns, c, division);
    await expandStorage(ns, c, division);
    !ns.scriptRunning("/corp/moralBooster.js", "home") && ns.run("/corp/moralBooster.js");
    await purchaseUpgrades(ns, c);
    await purchaseMaterials(ns, c, division);
    ns.toast("Time to find investors");
}

function initDivision(ns: NS, c: Corporation): Division {
    const info = c.getCorporation();
    let division = info.divisions.map(c.getDivision).find(div => div.type === "Agriculture");
    if (!division) {
        c.expandIndustry("Agriculture", "Agriculture");
        division = c.getDivision("Agriculture");
    }
    return division;
}

async function initialExpansion(ns: NS, c: Corporation, division: Division) {

    const currentCities = division.cities;

    // Check each city to see if we have an office
    for (const city in CityName) {
        if (isNaN(Number(city)) && currentCities.indexOf(CityName[city]) === -1) {

            // Wait for funds to expand
            await hasFunds(ns, c, c.getConstants().officeInitialCost);

            // Expand and set initial workers
            const newCity = CityName[city];
            c.expandCity(division.name, newCity);
            c.hireEmployee(division.name, newCity, "Operations");
            c.hireEmployee(division.name, newCity, "Engineer");
            c.hireEmployee(division.name, newCity, "Business");

            // Wait for funds to build a warehouse
            await hasFunds(ns, c, c.getConstants().warehouseInitialCost);
            c.purchaseWarehouse(division.name, newCity);
        }

    }
}

async function purchaseAdvert(ns: NS, c: Corporation, { name: divisionName }: Division) {
    // Hire and advert for each division
    if (c.getHireAdVertCount(divisionName) < 1) {
        await hasFunds(ns, c, c.getHireAdVertCost(divisionName));
        c.hireAdVert(divisionName);
    }
}

async function expandStorage(ns: NS, c: Corporation, { name: divisionName }: Division) {

    const division = c.getDivision(divisionName);
    for (const city of division.cities) {
        const warehouse = c.getWarehouse(divisionName, city);
        // Ensure warehouse is at level 3
        while (warehouse.level < 3) {
            await hasFunds(ns, c, c.getUpgradeWarehouseCost(divisionName, city));
            c.upgradeWarehouse(divisionName, city);
            sellProducts(c, divisionName, city);
        }
    }

}

function sellProducts(corporation: Corporation, divisionName: string, city: CityName) {

    corporation.setSmartSupply(divisionName, city, true);
    corporation.setSmartSupplyUseLeftovers(divisionName, city, "Water", true);
    corporation.setSmartSupplyUseLeftovers(divisionName, city, "Energy", true);
    corporation.sellMaterial(divisionName, city, "Food", "MAX", "MP");
    corporation.sellMaterial(divisionName, city, "Plants", "MAX", "MP");

}

async function purchaseUpgrades(ns: NS, c: Corporation) {
    const upgrades = ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants", "Smart Factories"];
    for (const upgrade of upgrades) {
        while (c.getUpgradeLevel(upgrade) < 2) {
            await hasFunds(ns, c, c.getUpgradeLevelCost(upgrade));
            c.levelUpgrade(upgrade);
        }
    }
}

async function purchaseMaterials(ns: NS, c: Corporation, division: Division) {

    const materials = [{ name: "Hardware", rate: 12.5, total: 125 }, { name: "AI Cores", rate: 7.5, total: 75 }, { name: "Real Estate", rate: 2_700, total: 27_000_000 }];
    let buyMaterial = -1;
    while (buyMaterial != 0) {
        buyMaterial = 0;
        for (const city of division.cities) {
            for (const material of materials) {
                const materialInfo = c.getMaterial(division.name, city, material.name);
                if (materialInfo.qty < material.total) {
                    c.buyMaterial(division.name, city, material.name, material.rate);
                    buyMaterial += material.rate;
                } else {
                    c.buyMaterial(division.name, city, material.name, 0);
                }
            }
        }
        await ns.sleep(100);
    }
}