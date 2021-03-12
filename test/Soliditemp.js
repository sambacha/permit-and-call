// const { expectRevert } = require('openzeppelin-test-helpers');
// const { expect } = require('chai');

const PermitAndCall = artifacts.require('PermitAndCall');

contract('PermitAndCall', function ([_, addr1]) {
  describe('PermitAndCall', async function () {
    it('should be ok', async function () {
      this.contract = await PermitAndCall.new();
      await this.contract.func(1);
    });
  });
});
