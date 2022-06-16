// Enter the BNB amount to use
const BNB_AMOUNT_TO_BUY = 0.0000001 * 10 ** 18

// Enter the tokens to monitor so that the bot can buy them
const TOKENS_TO_MONITOR = ['0x2b3f34e9d4b127797ce6244ea341a83733ddd6e4']
//token we address
const token = '0x937a580dcA21E3519AC5A66B7be55090d87B7C18'
// Slippage: to be used
const SLIPPAGE = 10

//specify the number of times the bot should buy (spray gunning )

const NO_OF_BUYS = 1

export { SLIPPAGE, TOKENS_TO_MONITOR, BNB_AMOUNT_TO_BUY, NO_OF_BUYS, token }
