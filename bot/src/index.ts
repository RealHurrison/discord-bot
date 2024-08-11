import { REST } from '@discordjs/rest'
import { WebSocketManager } from '@discordjs/ws'
import { GatewayDispatchEvents, GatewayIntentBits, Client } from '@discordjs/core'
import { Request, Response, NextFunction } from 'express'
import express from 'express'

const CLIENT_TOKEN = process.env.CLIENT_TOKEN!
const DISCORD_TOKEN = process.env.DISCORD_TOKEN!

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)
const gateway = new WebSocketManager({
    token: DISCORD_TOKEN,
    intents: GatewayIntentBits.Guilds,
    rest
})

const client = new Client({ rest, gateway })

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const asyncHandler = func => (req: Request, res: Response, next: NextFunction) => {
    return Promise
        .resolve(func(req, res, next))
        .catch(next)
};


const main = async () => {

    const app = express()

    app.use(express.json())

    app.use((req, res, next) => {
        if (req.headers.authorization !== CLIENT_TOKEN) {
            return res.status(403).send({ status: 'error', message: 'Unauthorized' })
        }
        next()
    });

    app.post('/channels/:channelId', asyncHandler(async (req, res) => {
        const { channelId } = req.params
        let { files } = req.body
        files = files.map(file => file.data = Buffer.from(file.data, 'base64'))
        const response = await client.api.channels.createMessage(channelId, req.body)
        res.send({ status: 'success', data: { id: response.id } })
    }))

    app.delete('/channels/:channelId/:messageId', asyncHandler(async (req, res) => {
        const { channelId, messageId } = req.params
        await client.api.channels.deleteMessage(channelId, messageId)
        res.send({ status: 'success' })
    }))


    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).send({ status: 'error', message: 'Internal Server Error' })
    })

    client.once(GatewayDispatchEvents.Ready, () => {
        console.log('Bot is ready')

        app.listen(3000, () => {
            console.log('Server is running on port 3000')
        })
    })

    gateway.connect()

}

main()