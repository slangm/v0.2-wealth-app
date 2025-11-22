import { expect } from "chai"
import { ethers } from "hardhat"

describe("ProtectedSavingsVault", () => {
  it("deposits and tracks boosters", async () => {
    const [deployer, user] = await ethers.getSigners()
    const asset = await ethers.deployContract("MockERC20", ["USD Stablecoin", "USDC", deployer.address, 6])
    const vault = await ethers.deployContract("ProtectedSavingsVault", [
      await asset.getAddress(),
      "Protected Savings",
      "psUSD",
      400,
      deployer.address,
    ])

    await vault.setStrategy(deployer.address)
    await asset.mint(user.address, ethers.parseUnits("1000", 6))
    await asset.connect(user).approve(vault, ethers.MaxUint256)

    await expect(vault.connect(user).deposit(ethers.parseUnits("100", 6), user.address)).to.emit(
      vault,
      "Deposit",
    )

    expect(await vault.balanceOf(user.address)).to.equal(ethers.parseUnits("100", 6))
    await vault.setBooster(user.address, 150)
    expect(await vault.currentYieldBps(user.address)).to.equal(550)
  })
})

