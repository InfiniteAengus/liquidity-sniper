import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import Web3 from 'web3'
import { ChainId, Fetcher } from '@pancakeswap/sdk'
import { wait, walletNonce } from './utils/common'
import { swapExactETHForTokens } from './utils/uniswap/buy'
import { BNB_AMOUNT_TO_BUY, token } from './utils/setup'
import { approve } from './utils/uniswap/approve'

const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC!, {
  name: 'binance',
  chainId: 56,
})
const WBNB_ADDRESS = ethers.utils.getAddress(
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
)
const web3 = new Web3(process.env.JSON_RPC!)
const tokenAddress = '0x2b3f34e9d4b127797ce6244ea341a83733ddd6e4'.toLowerCase()

//reading data from the uniswap ABI
var tokenABI = JSON.parse(readFileSync(`src/utils/abiUniswap.json`, 'utf8'))

//method that calculates token balance
const tokenBalance = async (token: string) => {
  const tokenContract = new web3.eth.Contract(tokenABI, token)
  return tokenContract.methods.balanceOf(process.env.WALLET_ADDRESS!).call()
}

const main = async () => {
  while (true) {
    try {
      let newToken = await Fetcher.fetchTokenData(
        ChainId.MAINNET,
        tokenAddress,
        provider
      )
      let WBNB = await Fetcher.fetchTokenData(
        ChainId.MAINNET,
        WBNB_ADDRESS,
        provider
      )

      let pair = await Fetcher.fetchPairData(newToken, WBNB)
      pair
      break
    } catch (error) {
      console.log('Pair was not found', error)
    }
  }

  let tokenAmounts = await tokenBalance(tokenAddress)

  wait(70000)

  const tokensInWallet = await tokenBalance(tokenAddress)

  if (tokenAmounts == tokensInWallet) {
    let path = [token, WBNB_ADDRESS]
    let gasLimit = 300000
    let gasPrice = 15 * 10 ** 9
    let currentNonce: any = await walletNonce()
    //buy
    await swapExactETHForTokens(
      0,
      BNB_AMOUNT_TO_BUY,
      path,
      gasPrice,
      gasLimit,
      currentNonce
    )
    //approve
    await approve(token, gasPrice - 1, gasLimit, currentNonce + 1)
  }
}

main()
