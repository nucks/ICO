const hre = require("hardhat");

async function main() {
  const ICO = await hre.ethers.getContractFactory("ICO");
  const SpaceCoinICO = await ICO.deploy(["0x3F0AE2Ab5b645CC69CE42EDACc83347c28312D45"], "0xDD37D98CCE3157648233cafEBd76Ea57e8EDD9fF");

  await SpaceCoinICO.deployed();

  console.log("SpaceCoinICO deployed to:", SpaceCoinICO.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
