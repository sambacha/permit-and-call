import { use } from 'chai'
import { solidity, MockProvider, createFixtureLoader } from 'ethereum-waffle'
import { Contract, BigNumber, constants, utils, ContractInterface } from 'ethers'

import { fixture } from './shared/fixture'
import { GAS_LIMIT, expandTo18Decimals, getPermitSignature } from './shared/utils'

use(solidity)

describe('PermitAndCall', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      gasLimit: GAS_LIMIT.toString(),
    },
  })
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader([wallet], provider)

  let token: Contract
  let WETH: Contract
  let router: Contract
  let permitAndCall: Contract
  beforeEach(async function () {
    const loadedFixture = await loadFixture(fixture)
    token = loadedFixture.token
    WETH = loadedFixture.WETH
    router = loadedFixture.router
    permitAndCall = loadedFixture.permitAndCall

    // add liquidity
    const liquidityAmount = expandTo18Decimals(50)
    await token.approve(router.address, liquidityAmount)
    await WETH.deposit({ value: liquidityAmount })
    await WETH.approve(router.address, liquidityAmount)
    await router.addLiquidity(
      token.address,
      WETH.address,
      liquidityAmount,
      liquidityAmount,
      constants.Zero,
      constants.Zero,
      wallet.address,
      constants.MaxUint256
    )
  })

  const swapAmount = expandTo18Decimals(1)

  it('works if allowance has been granted', async () => {
    const permitSelector = utils.hexDataSlice(constants.HashZero, 0, 4)
    const permitData = '0x'

    const routerFunctionName = 'swapExactTokensForTokens'
    const routerFunctionFragment = router.interface.fragments.filter(({ name }) => name === routerFunctionName)[0]
    const routerFunctionSelector = utils.hexDataSlice(
      utils.id(`${routerFunctionName}(${routerFunctionFragment.inputs.map(({ type }) => type).join(',')})`),
      0,
      4
    )
    const routerFunctionData = utils.defaultAbiCoder.encode(routerFunctionFragment.inputs, [
      swapAmount,
      constants.Zero,
      [token.address, WETH.address],
      wallet.address,
      constants.MaxUint256,
    ])

    await token.approve(permitAndCall.address, swapAmount)
    await permitAndCall.permitAndCall(
      token.address,
      swapAmount,
      permitSelector,
      permitData,
      routerFunctionSelector,
      routerFunctionData,
      { gasLimit: GAS_LIMIT }
    )
  })

  it('works if allowance has not been granted', async () => {
    const permitName = 'permit'
    const permitInputs = ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32']
    const permitSelector = utils.hexDataSlice(utils.id(`${permitName}(${permitInputs.join(',')})`), 0, 4)
    const { v, r, s } = await getPermitSignature(wallet, token, {
      owner: wallet.address,
      spender: permitAndCall.address,
      value: swapAmount,
    })
    const permitData = utils.defaultAbiCoder.encode(permitInputs, [
      wallet.address,
      permitAndCall.address,
      swapAmount,
      constants.MaxUint256,
      v,
      r,
      s,
    ])

    const routerFunctionName = 'swapExactTokensForTokens'
    const routerFunctionFragment = router.interface.fragments.filter(({ name }) => name === routerFunctionName)[0]
    const routerFunctionSelector = utils.hexDataSlice(
      utils.id(`${routerFunctionName}(${routerFunctionFragment.inputs.map(({ type }) => type).join(',')})`),
      0,
      4
    )
    const routerFunctionData = utils.defaultAbiCoder.encode(routerFunctionFragment.inputs, [
      swapAmount,
      constants.Zero,
      [token.address, WETH.address],
      wallet.address,
      constants.MaxUint256,
    ])

    await permitAndCall.permitAndCall(
      token.address,
      swapAmount,
      permitSelector,
      permitData,
      routerFunctionSelector,
      routerFunctionData,
      { gasLimit: GAS_LIMIT }
    )
  })

  it('works with ETH as an output', async () => {
    const permitSelector = utils.hexDataSlice(constants.HashZero, 0, 4)
    const permitData = '0x'

    const routerFunctionName = 'swapExactTokensForETH'
    const routerFunctionFragment = router.interface.fragments.filter(({ name }) => name === routerFunctionName)[0]
    const routerFunctionSelector = utils.hexDataSlice(
      utils.id(`${routerFunctionName}(${routerFunctionFragment.inputs.map(({ type }) => type).join(',')})`),
      0,
      4
    )
    const routerFunctionData = utils.defaultAbiCoder.encode(routerFunctionFragment.inputs, [
      swapAmount,
      constants.Zero,
      [token.address, WETH.address],
      wallet.address,
      constants.MaxUint256,
    ])

    await token.approve(permitAndCall.address, swapAmount)
    await permitAndCall.permitAndCall(
      token.address,
      swapAmount,
      permitSelector,
      permitData,
      routerFunctionSelector,
      routerFunctionData,
      { gasLimit: GAS_LIMIT }
    )
  })
})
