require("@nomiclabs/hardhat-waffle");

const { ALCHEMY_API_HTTP_KEY,  RINKEBY_PRIVATE_KEY } = require('./secrets')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkleby: {
      url: ALCHEMY_API_HTTP_KEY,
      accounts: [`0x${RINKEBY_PRIVATE_KEY}`],
    }
  }
};
