const URL = require("url");
const path = require("path");
const iconv = require("iconv-lite");
const Readable = require("stream").Readable;

// 各网站的规则映射
const WEBSITE_SCHEMA = {
  "www.xsnvshen.com": {
    selector: ".gallery .origin_image",
    attr: "src",
    nextPage: () => {
      return false;
    },
    getTitle: $ =>
      $("title")
        .text()
        .trim()
  },
  "www.nvshens.net": {
    attr: "src",
    selector: "#hgallery img",
    nextPage: $ => $("#pages a:last-child").attr("href"),
    getTitle: $ =>
      $("title")
        .text()
        .trim()
  }
};

/**
 * 获取文件名
 * @param {String} imgUrl
 */
function getFilename(imgUrl) {
  if (!imgUrl) {
    throw "缺少图片imgUrl，getFilename(imgUrl)";
  }
  const temp = imgUrl.split("/");
  const filename = temp[temp.length - 1];
  return filename;
}

/**
 * 获取文件路径
 * @param {String} imgUrl
 */
function getFilePath(dir, imgUrl) {
  if (!imgUrl) {
    throw "缺少图片地址，getFilePath(dir, imgUrl)";
  }
  const temp = imgUrl.split("/");
  const len = temp.length;
  const filename = temp[len - 1];
  return path.join(dir, filename);
}

/**
 * 获取目录 使用目录 + 页面标题
 * @param {String} title
 */
function getDir(dir, title) {
  if (!title) {
    throw "缺少页面标题，getDir(title)";
  }
  return path.join(dir, title);
}

/**
 * 先将图片链接收集到数组中
 * @param {Cheerio} $
 * @param {String} attr
 * @param {String} selector
 * @param {String} host
 */
function getPageImgPath({ $, attr, selector, host }) {
  const imgPathList = [];

  if (!$ || !attr || !selector || !host) {
    return [];
  }

  // 这里需要处理不同的地址前缀 类似这样https://img.xsnvshen.com/album/22162/31347/003.jpg
  $(selector).each((index, item) => {
    let src = $(item).attr(attr);
    if (host === "www.xsnvshen.com") {
      src = "http:" + src;
      src = src.replace("/thumb_600x900/", "/");
    } else if (src && src.indexOf("http") === -1) {
      src = "http:" + src;
    }

    imgPathList.push(src);
  });

  return imgPathList;
}

/**
 * 创建文件流
 * @param {String} data
 */
function createStream(data) {
  if (!data) {
    throw "缺少内容，createStream(data)";
  }
  const stream = new Readable();
  stream.push(data);
  stream.push(null);
  return stream;
}

/**
 * 检查是否为一个url
 * @param {Sting} string
 */
function isUrl(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return pattern.test(str);
}

/**
 * 获取地址指定位置前的前缀
 */
function getUrlPrefix(url, prefixPosition) {
  const lastIndex = url.lastIndexOf(prefixPosition);
  const prefix = url.substring(0, lastIndex);
  return prefix;
}

/**
 * 获取指定网站的标题
 * @param {Object} $
 * @param {String} url
 */
function getTitle($, url) {
  console.log("url", url);
  let urlObj = URL.parse(url, true);
  const website = WEBSITE_SCHEMA[urlObj.host];
  return website.getTitle($);
}

/**
 * 获取下一页的函数
 * @param {Object} $
 * @param {String} url
 */
function getNextPage($, url) {
  let urlObj = URL.parse(url, true);
  const website = WEBSITE_SCHEMA[urlObj.host];
  return website.nextPage($, url);
}

/**
 * 获取指定网站的参数配置
 * @param {Object} $
 * @param {String} url
 */
function getParams(url) {
  let urlObj = URL.parse(url, true);
  const website = WEBSITE_SCHEMA[urlObj.host];
  return {
    selector: website.selector,
    attr: website.attr
  };
}

/**
 * 从字符串中获取http地址
 * @param {String} str
 */
function getURL(str) {
  if (!str) {
    return "";
  }
  return str.match(/http.*?\s/g)[0].replace("\r", "");
}

/**
 * 解码
 * @param {Object} data
 */
function decode(data) {
  const decodeData = iconv.decode(data, "gb2312");
  if (decodeData.indexOf("�") < 0) {
    return decodeData;
  }
  return data;
}

module.exports = {
  isUrl,
  decode,
  getDir,
  getURL,
  getParams,
  getFilename,
  getFilePath,
  getUrlPrefix,
  getTitle,
  createStream,
  getNextPage,
  getPageImgPath
};
