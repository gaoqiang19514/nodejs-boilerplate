const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const axios = require("axios");
var Readable = require("stream").Readable;
const uuid = require("uuid");

const DIR = "./download";
// const url = "https://www.yimg.net/sex/13142.html"; // 未下载
const url = "https://www.yimg.net/sex/13142.html";

//在main.js设置全局的请求次数，请求的间隙
axios.defaults.retry = 10;
axios.defaults.retryDelay = 500;

axios.interceptors.response.use(undefined, function axiosRetryInterceptor(err) {
  var config = err.config;
  // If config does not exist or the retry option is not set, reject
  if (!config || !config.retry) return Promise.reject(err);

  // Set the variable for keeping track of the retry count
  config.__retryCount = config.__retryCount || 0;

  // Check if we've maxed out the total number of retries
  if (config.__retryCount >= config.retry) {
    // Reject with the error
    return Promise.reject(err);
  }

  // Increase the retry count
  config.__retryCount += 1;

  // Create new promise to handle exponential backoff
  var backoff = new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, config.retryDelay || 1);
  });

  // Return the promise in which recalls axios to retry the request
  return backoff.then(function() {
    return axios(config);
  });
});

var instance = axios.create({
  timeout: 10000,
  responseType: "arraybuffer"
});

function processPath(src) {
  return src;
}

function getFilename(url) {
  const filename = url.split("/");
  const lastIndex = filename.length - 1;
  return path.join(DIR, getShortUUID() + filename[lastIndex]);
}

function saveImage(url, filename) {
  console.log("开始保存图片至：" + filename);
  return new Promise(resolve => {
    axios(url)
      .pipe(fs.createWriteStream(filename))
      .on("close", () => {
        resolve();
      });
  });
}

/**
 * 现将图片链接收到到数组中
 * @param {Cheerio Objecjt} $
 * @param {String} selector
 */
function getCurrPageImgPath($, selector) {
  if (!selector) {
    return null;
  }
  const imgPathArr = [];
  $("#masonry .post-item-img").each((index, item) => {
    var src = processPath($(item).attr(selector));
    imgPathArr.push(src);
  });
  return imgPathArr;
}

function getShortUUID() {
  const lastIndex = uuid().split("-").length - 1;
  return uuid().split("-")[lastIndex];
}

console.log("程序开始");

instance
  .get(url)
  .then(res => {
    console.log("获取网页");
    return cheerio.load(res.data);
  })
  .then(async $ => {
    const imgPathArr = getCurrPageImgPath($, "data-original");
    const imgCount = imgPathArr.length;
    // 组装ajax请求
    let successTotal = 0;
    const imgDataArr = [];
    for (let i = 0; i < imgPathArr.length; i++) {
      console.log(`开始下载：${imgPathArr[i]}`);
      try {
        const res = await instance.get(imgPathArr[i]);
        imgDataArr.push(res);
        successTotal++;
        console.log("下载完成。");
      } catch (err) {
        console.log("err：", err.code);
      }
    }
    console.log("图片抓取全部完成，等待保存至磁盘");

    return {
      total: imgCount,
      successTotal: successTotal,
      imgDataArr: imgDataArr
    };
  })
  .then(res => {
    // 这里需要得到上一步的文件流 然后使用fs写入到指定文件夹
    console.log(`共计：${res.total}张，成功下载${res.successTotal}`);

    let count = 0;
    res.imgDataArr.forEach(item => {
      getFilename(item.config.url);
      let img = new Readable();
      img.push(item.data);
      img.push(null);
      img
        .pipe(fs.createWriteStream(getFilename(item.config.url)))
        .on("close", () => {
          ++count
          if (count === res.successTotal) {
            console.log("任务完成");
          }
        });
    });
  });
