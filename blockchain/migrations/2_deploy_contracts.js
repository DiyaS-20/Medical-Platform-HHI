const MedicalPortal = artifacts.require("MedicalPortal");

module.exports = function (deployer) {
  deployer.deploy(MedicalPortal);
};
