import { BigNumber, utils, constants, Wallet, Contract } from 'ethers'
import { ecsign, ECDSASignature } from 'ethereumjs-util'

export const GAS_LIMIT = BigNumber.from(Number.MAX_SAFE_INTEGER.toString())

export function expandTo18Decimals(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}

const PERMIT_TYPEHASH = utils.keccak256(
  utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

function getDomainSeparator(tokenName: string, tokenAddress: string) {
  return utils.keccak256(
    utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        utils.keccak256(
          utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
        ),
        utils.keccak256(utils.toUtf8Bytes(tokenName)),
        utils.keccak256(utils.toUtf8Bytes('1')),
        constants.One,
        tokenAddress,
      ]
    )
  )
}

export async function getPermitSignature(
  wallet: Wallet,
  token: Contract,
  permit: {
    owner: string
    spender: string
    value: BigNumber
  }
): Promise<ECDSASignature> {
  const tokenName = await token.name()
  const DOMAIN_SEPARATOR = getDomainSeparator(tokenName, token.address)

  const nonce = await token.nonces(wallet.address)

  const digest = utils.keccak256(
    utils.solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        utils.keccak256(
          utils.defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_TYPEHASH, permit.owner, permit.spender, permit.value, nonce, constants.MaxUint256]
          )
        ),
      ]
    )
  )

  return ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))
}
