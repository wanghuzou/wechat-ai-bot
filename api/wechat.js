import type { VercelRequest, VercelResponse } from 'vercel';
import crypto from 'crypto';

// 你的 token，和测试号后台填写保持一致
const TOKEN = 'fzwltest';

function checkSignature(params: { signature: string, timestamp: string, nonce: string }) {
  const { signature, timestamp, nonce } = params;
  const tmpArr = [TOKEN, timestamp, nonce].sort();
  const tmpStr = crypto.createHash('sha1').update(tmpArr.join('')).digest('hex');
  return tmpStr === signature;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { signature, timestamp, nonce, echostr } = req.query as any;

  // 微信服务器验证
  if (req.method === 'GET') {
    if (checkSignature({ signature, timestamp, nonce })) {
      res.status(200).send(echostr);
    } else {
      res.status(401).send('Invalid signature');
    }
    return;
  }

  // 接收用户消息（xml）
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      const match = body.match(/<Content><!\[CDATA\[(.*?)\]\]><\/Content>/);
      const userMsg = match?.[1] || '你说什么？';

      const reply = `
<xml>
  <ToUserName><![CDATA[${body.match(/<FromUserName><!$begin:math:display$CDATA\\[(.*?)$end:math:display$\]><\/FromUserName>/)?.[1]}]]></ToUserName>
  <FromUserName><![CDATA[${body.match(/<ToUserName><!$begin:math:display$CDATA\\[(.*?)$end:math:display$\]><\/ToUserName>/)?.[1]}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[你刚刚说的是：“${userMsg}”]]></Content>
</xml>`.trim();

      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(reply);
    });
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
