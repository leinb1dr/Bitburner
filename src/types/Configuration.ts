type GlobalConfig = {
    port: number,
    sleepTime: number,
    metrics: number
    metricsStorage: number
}

type DriverConfig = {
    portScripts: number
}

type FleetControllerConfig = {
    minSecurityOffset: number,
    maxSecurityOffset: number,
    minMoneyPercentage: number,
    maxMoneyPercentage: number,
    personalPrefixes: string[],
    unhackable: string[],
    sleepTime: number
}

type FleetWatchdogConfig = {
    defaultScript: string,
    scripts: string[],
    ratios: number[],
    dependencies: string[],
    blockList: string[]
}

type HackNetConfig = {
    ramUpgrade: number,
    levelUpgrade: number,
    cpuUpgrade: number,
    fleetSize: number,
    sleepTime: number
}

type GangConfig = {
    tasks: string[],
    sleepTime: number,
    upgradeMulti: number
}

type Configuration = {
    global: GlobalConfig,
    driver: DriverConfig,
    fleetController: FleetControllerConfig,
    fleetWatchdog: FleetWatchdogConfig,
    hackNet: HackNetConfig,
    gangs: GangConfig
}