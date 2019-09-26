const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const fsExtra = require("fs-extra");
const Readable = require("stream").Readable;

const axios = require("./axios");

// 下载的目录
const DOWNLOAD_PATH = "./images";

/**
 * 获取文件名
 * @param {String} url
 */
function getFilename(dir, url) {
  if (!url) {
    return null;
  }
  const temp = url.split("/");
  const len = temp.length;
  const filename = temp[len - 1];
  return path.join(dir, filename);
}

/**
 * 将字符字符串转为数字字符串
 * @param {String} str 
 */
function str2Num(str) {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    let code = str[i].charCodeAt();
    result = result + code;
  }
  return String(result);
}

/**
 * 获取目录
 */
function getDir(url) {
  return path.join(DOWNLOAD_PATH, str2Num(url));
}

/**
 * 现将图片链接收到到数组中
 * @param {Cheerio Objecjt} $
 * @param {String} selector
 * @param {String} attr
 */
function getCurrPageImgPath($, selector, attr) {
  if (!attr) {
    return null;
  }
  const imgPathArr = [];
  $(selector).each((index, item) => {
    var src = $(item).attr(attr);
    imgPathArr.push(src);
  });
  return imgPathArr;
}

/**
 * 程序初始化
 * @param {String} url
 * @param {String} selector
 * @param {String} attr
 */
function init(url, selector, attr) {
  axios
    .get(url)
    .then(res => {
      console.log("获取网页");
      return cheerio.load(res.data);
    })
    .then($ => {
      const imgPathArr = getCurrPageImgPath($, selector, attr);

      console.log(`开始下载：`);
      const promises = [];
      imgPathArr.map(url => {
        promises.push(axios.get(url));
      });

      return Promise.all(promises).then(res => {
        return {
          resArr: res,
          imgPathArr: imgPathArr,
          totalCount: imgPathArr.length
        };
      });
    })
    .then(res => {
      let count = 0;

      const dir = getDir(url);
      fsExtra.ensureDir(dir).then(() => {
        res.resArr.forEach(item => {
          // 创建文件流
          let img = new Readable();
          img.push(item.data);
          img.push(null);
          img
            .pipe(fs.createWriteStream(getFilename(dir, item.config.url)))
            .on("close", () => {
              count = count + 1;
              if (count === res.totalCount) {
                console.log(`下载完成，共计：${res.totalCount}张。`);
              }
            });
        });
      });
    })
    .catch(err => {
      console.log("err", err);
    });
}

console.log("程序开始");
// init("https://www.yimg.net/sex/13178.html", "#masonry img", "data-original");

init(
  "http://www.mlito.com/photo/girl/g_model/194916.html",
  ".j_contl_main .alignnone",
  "src"
);
