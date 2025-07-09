import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { xml2js } from 'xml-js';

const TOKEN = 'fzwl'; // 你的 token

function checkSignature(query: any): boolean {
  const { signature, timestamp, nonce } = query;
  const tmpStr = [TOKEN, timestamp, nonce].sort().join('');
  const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');
  return hash === signature;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkSignature(req.query)) {
    return res.status(401).send('Invalid signature');
  }

  if (req.method === 'GET') {
    return res.status(200).send(req.query.echostr);
  }

  if (req.method === 'POST') {
    let rawBody = '';
    req.on('data', chunk => (rawBody += chunk));
    req.on('end', () => {
      const parsed = xml2js(rawBody, { compact: true }) as any;
      const toUser = parsed.xml.FromUserName._cdata;
      const fromUser = parsed.xml.ToUserName._cdata;
      const content = parsed.xml.Content._cdata;

      const reply = `
        <xml>
          <ToUserName><![CDATA[${toUser}]]></ToUserName>
          <FromUserName><![CDATA[${fromUser}]]></FromUserName>
          <CreateTime>${Date.now()}</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[你刚才说了：“${content}”]]></Content>
        </xml>
      `.trim();

      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(reply);
    });
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
