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
 * 获取目录 针对一页只有一张图的 采用图片的路径进行md5 丢弃mark部分
 * @param {String} url
 * @param {String} mark
 */
function getDirByMultiPage(url, mark) {
  const lastIndex = url.lastIndexOf(mark);
  const prefix = url.substring(0, lastIndex);
  return path.join(DOWNLOAD_PATH, md5(prefix));
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

function nextPage($, options) {
  // 当前页面下载完成后 再请求下一页
  const nextPageUrl = options.getNextPageUrl($, options.pageUrl);
  if (options.hasNextPage(nextPageUrl)) {
    initMultiPage({
      ...options,
      pageUrl: nextPageUrl
    });
  } else {
    console.log("任务完成!");
  }
}

// 初始化
function initMultiPage(options) {
  console.log("开始处理页面地址：", options.pageUrl);
  axios
    .get(options.pageUrl)
    .then(res => cheerio.load(res.data))
    .then($ => {
      let count = 0;
      // 获取目录
      const dir = getDirByMultiPage(options.pageUrl, options.mark);
      //  获取上文页面中的图片地址列表
      const imgPathArr = getCurrPageImgPath($, options.selector, options.attr);
      //  当前页面请求数量
      const imgTotalCount = imgPathArr.length;

      imgPathArr.map(imgUrl => {
        fsExtra.ensureDir(dir).then(() => {
          const filepath = getFilePath(dir, imgUrl);

          // 对图片发起请求
          axios.get(imgUrl).then(res => {
            // 将字符串转换成文件流
            const file = createStream(res.data);
            file.pipe(fs.createWriteStream(filepath)).on("close", () => {
              count = count + 1;
              console.log(
                `下载：${getFilename(imgUrl)}, 进度：${parseInt(
                  (count / imgTotalCount) * 100
                )}%`
              );
              if (count === imgTotalCount) {
                console.log(`当前页面下载完成，共计：${imgTotalCount}张。`);
                nextPage($, options);
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

console.log("程序启动");
const startUrl = "https://www.baituji.com/detail/3237.html";
initMultiPage({
  pageUrl: startUrl,
  selector: "#show-area-height img",
  attr: "src",
  mark: ".html",
  // 获取下一页地址
  getNextPageUrl: ($, currentUrl) => {
    let href = "";
    const lastIndex = currentUrl.lastIndexOf("/detail");
    const prefix = currentUrl.substring(0, lastIndex);

    const href = $(".pagination")
      .children()
      .last()
      .children()
      .eq(0)
      .attr("href");

    if (href.indexOf("http") !== -1) {
      href = prefix + href;
    }
    return href;
  },
  // 结束条件 判断是否还有页面需要请求 hasNextPage
  hasNextPage: pageUrl => {
    // 如果地址包含undefind 说明是最没有下一页了
    if (pageUrl.indexOf("undefined") !== -1) {
      return false;
    }
    return true;
  }
});
