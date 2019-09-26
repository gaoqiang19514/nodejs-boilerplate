const axios = require("axios");

const instance = axios.create({
  timeout: 10000,
  responseType: "arraybuffer"
});

// 添加响应拦截器
instance.interceptors.response.use(undefined, function(error) {
  const { config, code } = error;
  if (code === "ECONNABORTED") {
    console.warn(`请求超时，等待重试 ${config.url}`);
    return new Promise(resolve => {
      setTimeout(async () => {
        resolve(await instance.request(config));
      }, 1000);
    });
  }
  return Promise.reject(error);
});

module.exports = instance;
