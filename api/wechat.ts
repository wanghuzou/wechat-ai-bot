// api/wechat.ts

import type { VercelRequest, VercelResponse } from '@vercel/node'
import xml2js from 'xml2js'
import fetch from 'node-fetch'

export const config = {
  api: {
    bodyParser: false,
  },
}

const TOKEN = 'fzwl'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

async function parseXML(xml: string): Promise<any> {
  return await xml2js.parseStringPromise(xml, { explicitArray: false })
}

function buildTextReply(to: string, from: string, content: string): string {
  const now = Date.now()
  return `
    <xml>
      <ToUserName><![CDATA[${to}]]></ToUserName>
      <FromUserName><![CDATA[${from}]]></FromUserName>
      <CreateTime>${now}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
    </xml>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { echostr } = req.query
    return res.status(200).send(echostr)
  }

  if (req.method === 'POST') {
    const buffers = []
    for await (const chunk of req) {
      buffers.push(chunk)
    }
    const xml = Buffer.concat(buffers).toString('utf-8')
    const parsed = await parseXML(xml)
    const msg = parsed.xml

    const userMsg = msg.Content || '你好'
    const userId = msg.FromUserName
    const publicId = msg.ToUserName

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMsg }]
      })
    })

    const data = await aiResponse.json()
    const reply = data.choices?.[0]?.message?.content || '我还没学会怎么回答这个问题~'

    const xmlReply = buildTextReply(userId, publicId, reply)
    res.setHeader('Content-Type', 'application/xml')
    return res.status(200).send(xmlReply)
  }

  res.status(200).send('OK')
}
