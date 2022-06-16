import { readFileSync } from 'fs'
import { ethers, providers } from 'ethers'
import WebSocket from 'ws'
import { BNB_AMOUNT_TO_BUY, NO_OF_BUYS, TOKENS_TO_MONITOR } from './utils/setup'

import { swapExactETHForTokens } from './utils/uniswap/buy'
import { wait, walletNonce } from './utils/common'
import { approve } from './utils/uniswap/approve'
import { sendNotification } from './utils/telegram/bot'
const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC, 56)

const PANCAKE_SWAP = '0x10ed43c718714eb63d5aa57b78b54704e256024e'
const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
const exoticMethods = [
  '0xe8078d94',
  '0xc9567bf9',
  '0x293230b8',
  '0x8a8c523c',
  '0x0bd05b69',
  '0x0f15f4c0',
  '0x58780a82',
]
function subscribe() {
  ws.send(
    `{"jsonrpc": "2.0", "id": 1, "method": "subscribe", "params": ["newTxs", {"duplicates":false,"include": ["tx_hash", "tx_contents.to", "tx_contents.from", "tx_contents.value", "tx_contents.gas_price", "tx_contents.gas", "tx_contents.input"],"filters":"method_id in [f305d719,422f1043,e8e33700,e8078d94,c9567bf9,293230b8,8a8c523c,0bd05b69,0f15f4c0,58780a82]"}]}`
  )
}

const openWebsocketConnection = () => {
  console.log('Creating a connection ...')
  const ws = new WebSocket(process.env.ENTERPRISE_BLOXROUTE!, {
    cert: readFileSync(`src/utils/certs/external_gateway_cert.pem`),
    key: readFileSync(`src/utils/certs/external_gateway_key.pem`),
    rejectUnauthorized: false,
  })

  return ws
}

let ws = openWebsocketConnection()

var abi = JSON.parse(readFileSync(`${__dirname}/utils/abiUniswap.json`, 'utf8'))

const boughtTokens: string[] = []

const inter = new ethers.utils.Interface(abi)

const main = async () => {
  if (
    !process.env.JSON_RPC &&
    !process.env.ENTERPRISE_BLOXROUTE &&
    !process.env.WALLET_ADDRESS &&
    !process.env.PRIVATE_KEY
  ) {
    throw new Error(
      'APP_NAME && JSON_RPC && WALLET_ADDRESS && PRIVATE_KEY  Must be defined in your .env FILE'
    )
  }

  try {
    let count = 0

    let tokensToMonitor = TOKENS_TO_MONITOR.map((token: string) =>
      token.toLowerCase()
    )

    console.log(tokensToMonitor)

    const mempoolData = async (notification: string) => {
      try {
        let JsonData = JSON.parse(notification)
        let tx = JsonData.params.result
        let routerAddress = tx.txContents.to.toLowerCase()

        if (routerAddress == PANCAKE_SWAP) {
          count++
          const decodedInput = inter.parseTransaction({
            data: tx.txContents.input,
          })

          console.log('\n\nTransaction data ')
          console.log(tx)

          let gasLimit = parseInt(tx.txContents.gas, 16)
          let gasPrice = parseInt(tx.txContents.gasPrice, 16)
          let methodName = decodedInput.name
          let currentNonce: any = await walletNonce()

          console.log('\nNonce', currentNonce)
          console.log('\n')
          if (methodName == 'addLiquidity') {
            let token
            let tokenA = decodedInput.args.tokenA
            let tokenB = decodedInput.args.tokenB

            console.log('Token A ', tokenA.toLowerCase())
            console.log('Token B', tokenB.toLowerCase())

            if (tokensToMonitor.includes(tokenA.toLowerCase())) {
              token = tokenA
            } else if (tokensToMonitor.includes(tokenB.toLowerCase())) {
              token = tokenB
            }
            console.log('The token extracted', token)

            if (token) {
              let path = [WBNB_ADDRESS, token]

              //if (!boughtTokens.includes(token)) {

              count++

              // buy

              let buyTx: any

              // Broadcast transactions using spraygun feature
              for (let index = 0; index < 2; index++) {
                console.log(
                  'No of buys, nonce',
                  index + 1,
                  currentNonce + index
                )
                buyTx = await swapExactETHForTokens(
                  0,
                  BNB_AMOUNT_TO_BUY,
                  path,
                  gasPrice,
                  gasLimit,
                  currentNonce + index
                )
              }

              if (buyTx?.success == true) {
                console.log('BUY txn broadcast successfully')
                const startTime = Date.now()
                while (true) {
                  console.log('Starting the loop')

                  const tx = await provider.getTransactionReceipt(buyTx.data)

                  if (tx && tx.status == 1) {
                    console.log('Approve after successful buy')
                    await approve(
                      token,
                      gasPrice - 1,
                      gasLimit,
                      currentNonce + 1
                    )
                    break
                  } else if (Date.now() - startTime > 30000) {
                    console.log(
                      'Timeout ... Quiting querrying transaction and approve '
                    )
                    await approve(
                      token,
                      gasPrice - 1,
                      gasLimit,
                      currentNonce + 1
                    )
                    break
                  }
                }
              }

              let message = 'Token Listing Notification'
              message += '\n\n  Token:'
              message += `https://bscscan.com/token/${token}`
              ;(message += `\n\n Tx Hash`),
                (message += `\n https://bscscan.com/tx/${buyTx.data}`)
              message += `\n\n\n Tx Logs data`
              message += `\n ${buyTx.data}`

              await sendNotification(message)

              // } else {
              // 	console.log("Already bought this token ... Skipping ,,,,", token, boughtTokens)
              // }
            }
          } else if (methodName == 'addLiquidityETH') {
            let token = decodedInput.args.token

            console.log(decodedInput)

            console.log('here is a token we got', token)

            let path = [WBNB_ADDRESS, token]

            if (tokensToMonitor.includes(token.toLowerCase())) {
              //if (!boughtTokens.includes(token.toLowerCase())) {

              console.log(
                'it is inside out tokens to monitor',
                token.toLowerCase()
              )

              let buyTx: any

              // Broadcast transactions using spraygun feature
              for (let index = 0; index < NO_OF_BUYS; index++) {
                console.log(
                  'No of buys, nonce',
                  index + 1,
                  currentNonce + index
                )
                buyTx = await swapExactETHForTokens(
                  0,
                  BNB_AMOUNT_TO_BUY,
                  path,
                  gasPrice,
                  gasLimit,
                  currentNonce + index
                )
              }

              if (buyTx?.success == true) {
                console.log('BUY txn broadcast successfully')
                const startTime = Date.now()
                while (true) {
                  console.log('Starting the loop')

                  const tx = await provider.getTransactionReceipt(buyTx.data)

                  if (tx && tx.status == 1) {
                    console.log('Approve after successful buy')
                    // await wait(30000)
                    const nonce = await walletNonce()
                    await approve(token, gasPrice - 1, gasLimit, nonce!)
                    break
                  } else if (tx && tx.status != 0) {
                    const nonce = await walletNonce()
                    await swapExactETHForTokens(
                      0,
                      BNB_AMOUNT_TO_BUY,
                      path,
                      gasPrice,
                      gasLimit,
                      nonce!
                    )
                  } else if (Date.now() - startTime > 30000) {
                    console.log(
                      'Timeout ... Quiting querrying transaction and approve '
                    )
                    const nonce = await walletNonce()
                    await approve(token, gasPrice - 1, gasLimit, nonce!)
                    break
                  } else {
                    console.log(
                      'Transaction not yet confirmed and timeout not yet reached ',
                      Date.now() - startTime
                    )
                  }
                }
              }

              let message = 'Token Listing Notification'
              message += '\n\n  Token:'
              message += `https://bscscan.com/token/${token}`
              message += `\n\n Tx Hash`
              message += `\n https://bscscan.com/tx/${buyTx.data}`
              message += `\n\n\n Tx Logs data`
              message += `\n ${buyTx.data}`

              await sendNotification(message)

              //	}
              //  else {
              // 	console.log("Already bought this token ... Skipping ,,,,", token, boughtTokens)
              // }
            }
          }
        } else if (tokensToMonitor.includes(tx.txContents.to.toLowerCase())) {
          const decodedInput = inter.parseTransaction({
            data: tx.txContents.input,
          })

          console.log('Tx ', tx.txHash)
          console.log('TO ', tx.txContents.to)
          console.log('input ', tx.txContents.input)
          console.log('Router : ', routerAddress)

          let gasLimit = parseInt(tx.txContents.gas, 16)
          let gasPrice = parseInt(tx.txContents.gasPrice, 16)
          let methodName = decodedInput.name
          let currentNonce: any = await walletNonce()

          console.log(currentNonce)

          let message = `Captured addLiquidity exotic Function`
          message += `\n\n Now Trying to Buy Token`
          sendNotification(message)

          if (methodName == 'addLiquidity') {
            let token
            let tokenA = decodedInput.args.tokenA
            let tokenB = decodedInput.args.tokenB

            console.log('Token A ', tokenA.toLowerCase())
            console.log('Token B', tokenB.toLowerCase())

            if (tokensToMonitor.includes(tokenA.toLowerCase())) {
              token = tokenA
            } else if (tokensToMonitor.includes(tokenB.toLowerCase())) {
              token = tokenB
            }

            if (token.toLowerCase()) {
              let path = [WBNB_ADDRESS, token]

              if (!boughtTokens.includes(token)) {
                count++

                // buy
                let buyTx: any

                // Broadcast transactions using spraygun feature
                for (let index = 0; index < 2; index++) {
                  console.log(
                    'No of buys, nonce',
                    index + 1,
                    currentNonce + index
                  )
                  buyTx = await swapExactETHForTokens(
                    0,
                    BNB_AMOUNT_TO_BUY,
                    path,
                    gasPrice,
                    gasLimit,
                    currentNonce + index
                  )
                }
                //check if the buyTxHash is true for a successful buy
                if (buyTx?.success == true) {
                  console.log('BUY txn broadcast successfully')

                  const startTime = Date.now()
                  //check for looping through the BUYS and approving
                  while (true) {
                    console.log('Starting the loop')

                    const tx = await provider.getTransactionReceipt(buyTx.data)

                    console.log(tx.status)

                    if (tx.status == 1) {
                      console.log('Approve after successful buy')
                      //approve
                      await approve(
                        token,
                        gasPrice - 1,
                        gasLimit,
                        currentNonce + 1
                      )
                      break
                    } //this checks incase we had made a BUY(s) and timed-out so this check approves the BUYs
                    else if (Date.now() - startTime > 30000) {
                      console.log(
                        'Timeout ... Quiting querrying transaction and approve '
                      )
                      //approve
                      await approve(
                        token,
                        gasPrice - 1,
                        gasLimit,
                        currentNonce + 1
                      )
                      break
                    }
                  }
                }
                //TG notification to user after we made a successfull BUY and APPROVE
                let message = 'Token Listing Notification'
                message += '\n\n  Token:'
                message += `https://bscscan.com/token/${token}`
                ;(message += `\n\n Tx Hash`),
                  (message += `\n https://bscscan.com/tx/${buyTx.data}`)
                message += `\n\n\n Tx Logs data`
                message += `\n ${buyTx.data}`

                await sendNotification(message)
              } else {
                console.log(
                  'Already bought this token ... Skipping ,,,,',
                  token,
                  boughtTokens
                )
              }
            }
          } else if (methodName == 'addLiquidityETH') {
            let token = decodedInput.args.token

            console.log('here is a token we got', token)

            let path = [WBNB_ADDRESS, token]

            if (tokensToMonitor.includes(token.toLowerCase())) {
              //if (!boughtTokens.includes(token.toLowerCase())) {

              let buyTx: any

              // Broadcast transactions using spraygun feature
              for (let index = 0; index < NO_OF_BUYS; index++) {
                console.log(
                  'No of buys, nonce',
                  index + 1,
                  currentNonce + index
                )
                //BUY function
                buyTx = await swapExactETHForTokens(
                  0,
                  BNB_AMOUNT_TO_BUY,
                  path,
                  gasPrice,
                  gasLimit,
                  currentNonce + index
                )
              }

              if (buyTx?.success == true) {
                console.log('BUY txn broadcast successfully')
                const startTime = Date.now()
                while (true) {
                  console.log('Starting the loop')

                  const tx = await provider.getTransactionReceipt(buyTx.data)

                  if (tx && tx.status == 1) {
                    console.log('Approve after successful buy')
                    // await wait(30000)
                    const nonce = await walletNonce()

                    await approve(token, gasPrice - 1, gasLimit, nonce!)
                    break
                  } else if (tx && tx.status != 0) {
                    const nonce = await walletNonce()

                    await swapExactETHForTokens(
                      0,
                      BNB_AMOUNT_TO_BUY,
                      path,
                      gasPrice,
                      gasLimit,
                      nonce!
                    )
                  } else if (Date.now() - startTime > 30000) {
                    console.log(
                      'Timeout ... Quiting querrying transaction and approve '
                    )

                    const nonce = await walletNonce()
                    await approve(token, gasPrice - 1, gasLimit, nonce!)
                    break
                  } else {
                    console.log(
                      'Transaction not yet confirmed and timeout not yet reached ',
                      Date.now() - startTime
                    )
                  }
                }
              }

              let message = 'Token Listing Notification'
              message += '\n\n  Token:'
              message += `https://bscscan.com/token/${token}`
              message += `\n\n Tx Hash`
              message += `\n https://bscscan.com/tx/${buyTx.data}`
              message += `\n\n\n Tx Logs data`
              message += `\n ${buyTx.data}`

              await sendNotification(message)
            }
            // else {
            // 	console.log("Already bought this token ... Skipping ,,,,", token, boughtTokens)
            // }
            // //}
          }
        }
      } catch (error) {
        console.log('Error: ', error)
      }
    }

    const processMempooldata = (nextNotification: string) => {
      // if (count < 1) {
      mempoolData(nextNotification)
      // }
    }

    ws.on('open', subscribe)
    ws.on('message', processMempooldata)
    ws.on('close', async () => {
      console.log('Websocket closed')
      console.log('Terminating connection ... ')
      ws.terminate()
      await wait(2000) // Wait for 2 secs before establishing a connection again
      ws = openWebsocketConnection() // Reconnect the websocket
    })
  } catch (error) {
    console.log('Error: ', error)
  }
}

main()
