// Approve token
import { ethers } from 'ethers'

const abi = [
  'function approve(address _spender, uint256 _value) public returns (bool success)',
]

const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC, 56)

const signer = new ethers.Wallet(process.env.PRIVATE_KEY!)
const account = signer.connect(provider)

const MAX_INT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const approve = async (
  tokenToapprove: string,
  gasPrice: number,
  gasLimit: number,
  nonce: number
) => {
  console.log('Here is our Nonce', nonce)

  try {
    let contract = new ethers.Contract(tokenToapprove, abi, account)

    console.log(
      `Gas price : ${gasPrice} \n\n GasLimit ${gasLimit} \n\n Nonce ${nonce}`
    )

    const tx = await contract.approve(
      '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      MAX_INT,
      {
        nonce,
        gasPrice: 20 * 10 ** 9,
        gasLimit: 500000,
      }
    )

    console.log('\n\n\n ************** APPROVE ***************')
    console.log('Transaction hash: ', tx.hash)
    console.log('*********************************************')
  } catch (error) {
    console.log('Error => ', error)
  }
}

export { approve }
