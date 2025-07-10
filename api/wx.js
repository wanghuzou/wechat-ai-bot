const crypto = require("crypto");
const xml2js = require("xml-js");

module.exports = async (req, res) => {
  const TOKEN = "fzwltest";

  if (req.method === "GET") {
    const { signature, timestamp, nonce, echostr } = req.query;
    const tmpArr = [TOKEN, timestamp, nonce].sort();
    const tmpStr = crypto.createHash("sha1").update(tmpArr.join("")).digest("hex");

    if (tmpStr === signature) {
      return res.status(200).send(echostr);
    } else {
      return res.status(401).send("Invalid signature");
    }
  }

  if (req.method === "POST") {
    let xmlData = "";
    req.on("data", chunk => {
      xmlData += chunk;
    });

    req.on("end", () => {
      const json = xml2js.xml2js(xmlData, { compact: true });

      const toUser = json.xml.FromUserName._cdata;
      const fromUser = json.xml.ToUserName._cdata;
      const content = json.xml.Content._cdata;

      const reply = `
        <xml>
          <ToUserName><![CDATA[${toUser}]]></ToUserName>
          <FromUserName><![CDATA[${fromUser}]]></FromUserName>
          <CreateTime>${Date.now()}</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[你说的是：“${content}”]]></Content>
        </xml>
      `;

      res.setHeader("Content-Type", "application/xml");
      res.status(200).send(reply);
    });
  }
};
