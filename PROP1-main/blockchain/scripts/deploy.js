const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1️⃣ Deploy CDAAuthority
  const CDAAuthority = await hre.ethers.getContractFactory("CDAAuthority");
  const cda = await CDAAuthority.deploy(deployer.address);
  await cda.waitForDeployment();
  const cdaAddress = await cda.getAddress();
  console.log("CDAAuthority deployed at:", cdaAddress);

  // 2️⃣ Deploy RealEstateRegistry
  const RealEstateRegistry = await hre.ethers.getContractFactory("RealEstateRegistry");
  const registry = await RealEstateRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("RealEstateRegistry deployed at:", registryAddress);

  // 3️⃣ Deploy FractionalInvestment
  const FractionalInvestment = await hre.ethers.getContractFactory("FractionalInvestment");
  const fractional = await FractionalInvestment.deploy(
    registryAddress,
    cdaAddress
  );
  await fractional.waitForDeployment();
  const fractionalAddress = await fractional.getAddress();
  console.log("FractionalInvestment deployed at:", fractionalAddress);

  // 4️⃣ Deploy Crowdfunding
  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowd = await Crowdfunding.deploy();
  await crowd.waitForDeployment();
  const crowdAddress = await crowd.getAddress();
  console.log("Crowdfunding deployed at:", crowdAddress);

  console.log("\n✅ ALL CONTRACTS DEPLOYED SUCCESSFULLY");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});