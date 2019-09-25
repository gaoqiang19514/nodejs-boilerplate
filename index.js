const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const cheerio = require("cheerio");
const Readable = require("stream").Readable;

const axios = require("./axios");

const DIR = "./images";
const url = "https://www.yimg.net/sex/13272.html"; // 壁纸 getCurrPageImgPath($, '#masonry img', "data-original");
// const url = "http://www.mlito.com/photo/girl/g_model/157573.html"; // 美女 getCurrPageImgPath($, '.alignnone', "src");

function getFilename(url) {
  const filename = url.split("/");
  const lastIndex = filename.length - 1;
  return path.join(DIR, getShortUUID() + filename[lastIndex]);
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

function getShortUUID() {
  const lastIndex = uuid().split("-").length - 1;
  return uuid().split("-")[lastIndex];
}

console.log("程序开始");
axios
  .get(url)
  .then(res => {
    console.log("获取网页");
    console.log(res.data);
    return cheerio.load(res.data);
  })
  .then($ => {
    const imgPathArr = getCurrPageImgPath($, "#masonry img", "data-original");

    console.log(`开始下载：`);
    const promises = [];
    imgPathArr.map(url => {
      promises.push(axios.get(url));
    });

    return Promise.all(promises).then(res => {
      return {
        resArr: res,
        totalCount: imgPathArr.length
      };
    });
  })
  .then(res => {
    const total = res.resArr.length;
    let count = 0;
    res.resArr.forEach(item => {
      getFilename(item.config.url);
      let img = new Readable();
      img.push(item.data);
      img.push(null);
      img
        .pipe(fs.createWriteStream(getFilename(item.config.url)))
        .on("close", () => {
          ++count;
          if (count === res.totalCount) {
            console.log(`下载完成，共计：${res.totalCount}张。`);
          }
        });
    });
  })
  .catch(err => {
    console.log("err", err.code);
  });
