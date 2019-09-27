const axios = require("axios");
const https = require("https");

axios.defaults.headers.common["retry"] = 10;
axios.defaults.headers.common["retryDelay"] = 1000;
axios.defaults.headers.common["retryCount"] = 0;

const instance = axios.create({
  timeout: 10000, // 超时时间
  responseType: "arraybuffer",
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    requestCert: true,
    keepAlive: true
  })
});

instance.interceptors.request.use(
  function(config) {
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);

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
      console.warn(`请求失败，重试 ${config.url}`);
      resolve(await instance.request(config));
    }, config.headers.retryDelay || 1);
  });
});

module.exports = instance;
