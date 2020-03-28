const axios = require("axios");
const https = require('https')

axios.defaults.headers.common["retry"] = 10;
axios.defaults.headers.common["retryDelay"] = 1000;
axios.defaults.headers.common["retryCount"] = 0;

const instance = axios.create({
  timeout: 20000, // 超时时间
  responseType: "arraybuffer",
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    requestCert: true,
    keepAlive: true
  })
});

instance.interceptors.request.use(function (config) {
  // config.headers["Connection"] = "keep-alive"
  // config.headers["Cookie"] = "1569577635970"
  // config.headers["Referer"] = 'http://www.o26.net/XIUREN/8833_34.html'
  // config.headers["User-Agent"] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36'
  return config;
}, function (error) {
  return Promise.reject(error);
});


// 添加响应拦截器 针对异常情况
instance.interceptors.response.use(undefined, function axiosRetryInterceptor(
  error
) {
  const { config, code } = error;

  // If config does not exist or the retry option is not set, reject
  if (!config || !config.headers.retry) {
    return Promise.reject(error);
  }

  // Check if we've maxed out the total number of retries
  if (config.headers.retryCount >= config.headers.retry) {
    // Reject with the error
    return Promise.reject(error);
  }

  // Increase the retry count
  config.headers.retryCount += 1;

  return new Promise(resolve => {
    setTimeout(async () => {
      // console.warn(`请求失败，重试 ${config.url}`);
      resolve(await instance.request(config));
    }, config.headers.retryDelay || 1);
  });
});

module.exports = instance;
