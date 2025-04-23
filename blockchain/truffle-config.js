module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",  // Localhost
      port: 7545,         // Ganache default port
      network_id: "5777",    // Match any network ID
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",  // Specify the Solidity compiler version
    },
  },
};
