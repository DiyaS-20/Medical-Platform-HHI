const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

// Static configuration
const rpcURL = "http://127.0.0.1:7545"; // Ganache RPC URL
const contractPath = path.resolve(__dirname, "./build/contracts/MedicalPortal.json");
const contractJSON = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const contractAddress = "0xE4D171D38E9a1E3eBaF621f7461a5454263DdEAA"; // Replace with your contract's address

// Web3 and contract instance
const web3 = new Web3(rpcURL);
const medicalPortal = new web3.eth.Contract(contractJSON.abi, contractAddress);

/**
 * Logs an event on the blockchain.
 * @param {string} userId - User ID
 * @param {string} eventType - Type of the event
 * @param {string} description - Description of the event
 */
const logBlockchainEvent = async (userId, eventType, description) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const receipt = await medicalPortal.methods
      .logEvent(userId, eventType, description)
      .send({ from: accounts[0], gas: 3000000 }); // Set a higher gas limit
    console.log(`Blockchain event logged successfully. Transaction Hash: ${receipt.transactionHash}`);
  } catch (error) {
    console.error(`Error logging event for user ${userId}:`, error.message);
    throw error;
  }
};


/**
 * Fetches logs from the blockchain for a specific user.
 * @param {string} userId - User ID
 * @returns {Array} - Array of logs
 */
const fetchBlockchainLogs = async (userId) => {
  try {
    console.log(`Fetching logs for user ${userId} from blockchain...`);
    const logs = await medicalPortal.methods.getLogs(userId).call();
    return logs;
  } catch (error) {
    console.error(`Error fetching logs for user ${userId}:`, error.message);
    throw error;
  }
};

module.exports = { logBlockchainEvent, fetchBlockchainLogs };
