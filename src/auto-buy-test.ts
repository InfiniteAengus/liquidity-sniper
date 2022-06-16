import { ethers } from 'ethers'

import { BNB_AMOUNT_TO_BUY } from './utils/setup'
import { approve } from './utils/uniswap/approve'
import { swapExactTokensForTokens } from './utils/uniswap/buy'

// Perepare enviroment and setup variables

const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC, 56)

const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'.toLowerCase()

const main = async () => {
  try {
    let token = '0x2b3f34e9d4b127797ce6244ea341a83733ddd6e4'.toLowerCase()
    let path = [WBNB_ADDRESS, token]

    let gasPrice = 50 * 10 ** 9
    let gasLimit = 500000
    let nonce = await provider.getTransactionCount(process.env.WALLET_ADDRESS!)

    await swapExactTokensForTokens(
      1,
      BNB_AMOUNT_TO_BUY,
      path,
      gasPrice,
      gasLimit,
      nonce
    )
  } catch (error) {
    console.log('========== We did not make a BUY========:', error)
  }
}
main()
