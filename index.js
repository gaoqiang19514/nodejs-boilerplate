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
function getFilename(url) {
  const filename = url.split("/");
  const lastIndex = filename.length - 1;
  return path.join(DOWNLOAD_PATH, filename[lastIndex]);
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
      console.log(res.data);
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
          totalCount: imgPathArr.length
        };
      });
    })
    .then(res => {
      let count = 0;
      res.resArr.forEach(item => {
        // 创建文件流
        let img = new Readable();
        img.push(item.data);
        img.push(null);
        img
          .pipe(fs.createWriteStream(getFilename(item.config.url)))
          .on("close", () => {
            count = count + 1;
            if (count === res.totalCount) {
              console.log(`下载完成，共计：${res.totalCount}张。`);
            }
          });
      });
    })
    .catch(err => {
      console.log("err", err.code);
    });
}

fsExtra.emptyDir("./images", err => {
  if (err) return console.error(err);

  console.log("程序开始");
  init("https://www.yimg.net/sex/13018.html", "#masonry img", "data-original");
});
// const url = "https://www.yimg.net/sex/13251.html"; // 壁纸 getCurrPageImgPath($, '#masonry img', "data-original");
// const url = "http://www.mlito.com/photo/girl/g_model/194916.html"; // 美女 getCurrPageImgPath($, '.j_contl_main .alignnone', "src");
