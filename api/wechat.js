const crypto = require('crypto')

const TOKEN = 'fzwltest' // 和微信测试号填写一致

module.exports.config = {
  api: {
    bodyParser: false,
  },
}

module.exports = async (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query

  // 处理微信 GET 验证请求
  if (req.method === 'GET') {
    const arr = [TOKEN, timestamp, nonce].sort()
    const str = arr.join('')
    const sha1 = crypto.createHash('sha1').update(str).digest('hex')

    if (sha1 === signature) {
      return res.status(200).send(echostr)
    } else {
      return res.status(401).send('Invalid signature')
    }
  }

  // 简化的 POST 回复（后续再加 AI）
  if (req.method === 'POST') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      const contentMatch = body.match(/<Content><!\[CDATA\[(.*?)\]\]><\/Content>/)
      const fromUser = body.match(/<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/)?.[1]
      const toUser = body.match(/<ToUserName><!\[CDATA\[(.*?)\]\]><\/ToUserName>/)?.[1]

      const reply = `
<xml>
  <ToUserName><![CDATA[${fromUser}]]></ToUserName>
  <FromUserName><![CDATA[${toUser}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[你刚刚说的是：“${contentMatch?.[1] || '空'}”]]></Content>
</xml>`.trim()

      res.setHeader('Content-Type', 'application/xml')
      res.status(200).send(reply)
    })
  } else {
    res.status(405).send('Method Not Allowed')
  }
}
