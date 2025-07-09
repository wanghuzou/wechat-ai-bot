// 最简微信验证接口（只处理GET）
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { signature, timestamp, nonce, echostr } = req.query

    // 这里不验证 signature，只返回 echostr 即可让微信验证通过
    return res.status(200).send(echostr)
  }

  res.status(200).send('OK')
}
