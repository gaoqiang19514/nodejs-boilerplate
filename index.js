const fs = require("fs");
const md5 = require("md5");
const path = require("path");
const cheerio = require("cheerio");
const fsExtra = require("fs-extra");
const Readable = require("stream").Readable;

const axios = require("./axios");

// 下载的目录
const DOWNLOAD_PATH = "./images";

/**
 * 获取文件路径
 * @param {String} url
 */
function getFilePath(dir, url) {
  if (!url) {
    return null;
  }
  const temp = url.split("/");
  const len = temp.length;
  const filename = temp[len - 1];
  return path.join(dir, filename);
}

/**
 * 获取文件名
 * @param {String} url
 */
function getFilename(url) {
  if (!url) {
    return null;
  }
  const temp = url.split("/");
  const filename = temp[temp.length - 1];
  return filename;
}

/**
 * 获取目录
 */
function getDir(url) {
  return path.join(DOWNLOAD_PATH, md5(url));
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
 * 创建文件流
 * @param {String} data
 */
function createStream(data) {
  const stream = new Readable();
  stream.push(data);
  stream.push(null);
  return stream;
}

/**
 * 程序初始化
 * @param {String} url
 * @param {String} selector
 * @param {String} attr
 */
function init(pageUrl, selector, attr) {
  axios
    .get(pageUrl)
    .then(res => {
      console.log("成功获取网页内容。");
      return cheerio.load(res.data);
    })
    .then($ => {
      let count = 0;
      // 获取目录
      const dir = getDir(pageUrl);
      //  获取上文页面中的图片地址列表
      const imgPathArr = getCurrPageImgPath($, selector, attr);
      //  当前页面请求数量
      const imgTotalCount = imgPathArr.length;

      console.log(`开始下载：`);
      imgPathArr.map(imgUrl => {
        // 创建文件夹
        fsExtra.ensureDir(dir).then(() => {
          const filepath = getFilePath(dir, imgUrl);
          const filename = getFilename(imgUrl);

          // 对图片发起请求
          axios.get(imgUrl).then(res => {
            // 将字符串转换成文件流
            const file = createStream(res.data);
            file.pipe(fs.createWriteStream(filepath)).on("close", () => {
              count = count + 1;
              console.log(
                `下载完成：${filename}, 进度：${parseInt(
                  (count / imgTotalCount) * 100
                )}%`
              );
              if (count === imgTotalCount) {
                console.log(`下载完成，共计：${imgTotalCount}张。`);
              }
            });
          });
        });
      });
    })
    .catch(err => {
      console.log("err", err);
    });
}

console.log("程序开始");

// yimg
// init("https://www.yimg.net/sex/13178.html", "#masonry img", "data-original");

// mlito
init(
  "http://www.mlito.com/photo/girl/g_model/148974.html",
  ".j_contl_main .alignnone",
  "src"
);
