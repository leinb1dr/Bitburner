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
    dependencies: string[]
}

type Configuration = {
    global: GlobalConfig,
    driver: DriverConfig,
    fleetController: FleetControllerConfig,
    fleetWatchdog: FleetWatchdogConfig
}