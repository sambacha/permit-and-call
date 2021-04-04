import { Wallet, Contract } from 'ethers'
import { providers, constants } from 'ethers'
import { deployContract } from 'ethereum-waffle'

import ERC20 from '@uniswap/v2-periphery/build/ERC20.json'
import WETH9 from '@uniswap/v2-periphery/build/WETH9.json'
import UniswapV2Factory from '@uniswap/v2-core/build/UniswapV2Factory.json'
import UniswapV2Router02 from '@uniswap/v2-periphery/build/UniswapV2Router02.json'

import PermitAndCall from '../../build/PermitAndCall.json'

import { expandTo18Decimals, GAS_LIMIT } from './utils'

interface Fixture {
  token: Contract
  WETH: Contract
  router: Contract
  permitAndCall: Contract
}

export async function fixture([wallet]: Wallet[], provider: providers.Web3Provider): Promise<Fixture> {
  // deploy tokens
  const token = await deployContract(wallet, ERC20, [expandTo18Decimals(100)])
  const WETH = await deployContract(wallet, WETH9)

  // deploy factory
  const factory = await deployContract(wallet, UniswapV2Factory, [constants.AddressZero], {
    gasLimit: GAS_LIMIT,
  })

  // deploy router
  const router = await deployContract(wallet, UniswapV2Router02, [factory.address, WETH.address], {
    gasLimit: GAS_LIMIT,
  })

  // deploy permitAndCall
  const permitAndCall = await deployContract(wallet, PermitAndCall, [router.address], {
    gasLimit: GAS_LIMIT,
  })

  return {
    token,
    WETH,
    router,
    permitAndCall,
  }
}
