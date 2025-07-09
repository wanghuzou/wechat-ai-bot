// /api/wechat.mjs
import crypto from "crypto";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const signature = searchParams.get("signature");
  const timestamp = searchParams.get("timestamp");
  const nonce = searchParams.get("nonce");
  const echostr = searchParams.get("echostr");

  const token = "fzwl";
  const tmpArr = [token, timestamp, nonce].sort();
  const tmpStr = crypto.createHash("sha1").update(tmpArr.join("")).digest("hex");

  if (tmpStr === signature) {
    return new Response(echostr);
  } else {
    return new Response("Invalid signature", { status: 401 });
  }
}

export async function POST(req) {
  const xml = await req.text();
  console.log("收到微信消息：", xml);

  // 简单解析 FromUserName 和 ToUserName（真实项目应使用 xml2js）
  const from = xml.match(/<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/)?.[1] || "";
  const to = xml.match(/<ToUserName><!\[CDATA\[(.*?)\]\]><\/ToUserName>/)?.[1] || "";

  const response = `
    <xml>
      <ToUserName><![CDATA[${from}]]></ToUserName>
      <FromUserName><![CDATA[${to}]]></FromUserName>
      <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[你好，我是放着我来的AI助手！]]></Content>
    </xml>
  `;

  return new Response(response, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
