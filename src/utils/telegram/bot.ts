const { Telegraf } = require('telegraf')
require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx: { reply: (arg0: string) => any }) =>
  ctx.reply('Welcome To Liquidity Front-Runner Kedar')
)

const sendNotification = async (message: any) => {
  console.log('\n\nSending Tg notification...')
  const chatIDs = ['1610178949']
  console.log(typeof chatIDs)
  chatIDs.forEach((chat) => {
    bot.telegram
      .sendMessage(chat, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
      .catch((error: any) => {
        console.log('Encouterd an error while sending notification to ', chat)
        console.log('==============================')
        console.log(error)
      })
  })
  console.log('Done!')
}

bot.launch()

export { sendNotification }
