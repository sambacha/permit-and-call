const Migrations = artifacts.require('./Migrations.sol');
const PermitAndCall = artifacts.require('./PermitAndCall.sol');

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(PermitAndCall);
};
