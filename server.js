const https = require("https");
const axios = require("axios");

const options = {
  hostname: "xsnvshen.com",
  path: "/album/27684",
  method: "GET",
  rejectUnauthorized: false
};

function main() {
  axios({
    type: "GET",
    url: "https://www.xsnvshen.com/album/27684",
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      requestCert: true,
      keepAlive: true
    })
  })
    .then(res => {
      const { data } = res
      console.log(data)
      debugger;
    })
    .catch(err => {
      debugger;
    });
}

main();
