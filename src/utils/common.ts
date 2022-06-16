import { readFileSync } from 'fs'

import Web3 from 'web3'
import { ethers } from 'ethers'
import { SLIPPAGE } from './setup'
import {
  ChainId,
  Fetcher,
  Percent,
  Route,
  TokenAmount,
  Trade,
  TradeType,
} from '@pancakeswap/sdk'
const web3 = new Web3(process.env.JSON_RPC!)

/**
 * This was the issue all along, was using this to get wallet nonce but as you can see it was crap, but fuck it we have slayed it!!!!!!!!!!!! cheers Jay, Dennoh
 */
//const provider = ethers.getDefaultProvider(process.env.ENTERPRISE_BLOXROUTE!)

const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC!, {
  name: 'binance',
  chainId: 56,
})

// const provider = ethers.getDefaultProvider(process.env.JSON_RPC!, { name: "bsc-mainnet", chainId: 56 })

const WBNB_ADDRESS = ethers.utils.getAddress(
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
)

let walletAddress = ethers.utils.getAddress(process.env.WALLET_ADDRESS!)

//reading data from the uniswap ABI
var tokenABI = JSON.parse(readFileSync(`src/utils/abiUniswap.json`, 'utf8'))

function toHex(currencyAmount: any) {
  if (currencyAmount.toString().includes('e')) {
    let hexedAmount = currencyAmount.toString(16)

    return `0x${hexedAmount}`
  } else {
    let parsedAmount = parseInt(currencyAmount)
    let hexedAmount = parsedAmount.toString(16)
    return `0x${hexedAmount}`
  }
}

/**
 *
 * @param token
 * @returns tokens in wallet
 */
const tokenBalance = async (token: string) => {
  const tokenContract = new web3.eth.Contract(tokenABI, token)
  return tokenContract.methods.balanceOf(process.env.WALLET_ADDRESS!).call()
}

/**
 * 
 * @param tokenAddress: of the token which we are calculating 
 * @param amount; the ammount of BNB to use/buy with
 * @returns the exact tokens based on the BNB amount input
//  */
// const calculateTokensAmount = async (tokenAddress: string, amount: string) => {
//     try {

//         let newToken = await Fetcher.fetchTokenData(ChainId.MAINNET, tokenAddress, provider);

//         let WBNB = await Fetcher.fetchTokenData(ChainId.MAINNET, WBNB_ADDRESS, provider);

//         let pair = await Fetcher.fetchPairData(newToken, WBNB, provider);

//         let route = new Route([pair], WBNB);

//         let trade = new Trade(route, new TokenAmount(newToken, amount), TradeType.EXACT_OUTPUT)

//         const slippageTolerance = new Percent(`${SLIPPAGE}`, "10000");

//         const amountOutMin = toHex(trade.minimumAmountOut(slippageTolerance).toFixed(4))

//         return amountOutMin

//     } catch (error) {
//         console.log(error);

//     }
// }

const walletNonce = async () => {
  try {
    let nonce = await web3.eth.getTransactionCount(walletAddress)

    if (nonce) {
      return nonce
    } else {
      let nonce = await web3.eth.getTransactionCount(walletAddress)
      return nonce
    }
  } catch (error) {
    console.log('Error fetching Wallet nonce ', error)
  }
}

const wait = async (ms: number) => {
  console.log('\n\n Waiting ... \n\n')
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export { toHex, tokenBalance, walletNonce, wait }
