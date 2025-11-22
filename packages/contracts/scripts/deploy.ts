import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying with", await deployer.getAddress())

  const assetAddress = process.env.BASE_ASSET ?? ""
  if (!assetAddress) {
    throw new Error("Set BASE_ASSET to deployed asset address")
  }

  const ProtectedSavingsVault = await ethers.getContractFactory("ProtectedSavingsVault")
  const protectedVault = await ProtectedSavingsVault.deploy(assetAddress, "Protected Savings", "psUSD", 400, await deployer.getAddress())
  await protectedVault.waitForDeployment()

  console.log("ProtectedSavingsVault:", await protectedVault.getAddress())

  const GrowthStrategyVault = await ethers.getContractFactory("GrowthStrategyVault")
  const growthVault = await GrowthStrategyVault.deploy(assetAddress, "Growth Strategy", "gwGROW", await deployer.getAddress())
  await growthVault.waitForDeployment()

  console.log("GrowthStrategyVault:", await growthVault.getAddress())
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

