const URL = require("url");
const path = require("path");
const Readable = require("stream").Readable;

// 下载的目录
const DOWNLOAD_PATH = "./images";

// 各网站的规则映射
const WEBSITE_SCHEMA = {
  "www.xsnvshen.com": {
    imgsSelector: ".gallery .origin_image",
    attr: "src",
    nextPage: () => {
      return false
    },
    getPageTitle: $ => {
      let title = $(".swp-tit.layout h1 a").text();
      title = title.trim();
      return title;
    }
  },

  "www.bobohdy.com": {
    imgsSelector: ".playpic img",
    attr: "src",
    nextPage: ($, currentUrl) => {
      let next = false;
      let nextPageUrl = "";
      let currentIndex = 0;
      // 很可能当前页面是动态加载的 所以无法通过获取高亮class来知道当前是在哪个页面
      // 暂时只能用当前页面的地址 到页面中去遍历了
      let pages = $("ul.dslist-group").children();

      pages.each((index, item) => {
        let href = $(item)
          .find("a")
          .attr("href");
        if (currentUrl.indexOf(href) !== -1) {
          currentIndex = index;
          return false;
        }
      });

      try {
        next = pages.eq(currentIndex + 1);
      } catch (err) {
        return false;
      }

      nextPageUrl = $(next)
        .find("a")
        .attr("href");

      if (nextPageUrl && nextPageUrl.indexOf("http") === -1) {
        const prefix = getUrlPrefix(currentUrl, "/play");
        nextPageUrl = prefix + nextPageUrl;
      }

      if (isUrl(nextPageUrl)) {
        return nextPageUrl;
      }
      return false;
    },
    getPageTitle: $ => {
      let title = $(".movie-title").text();
      const lastIndex = title.lastIndexOf("-");
      title = title.substring(0, lastIndex).trim();
      return title;
    }
  },

  "www.7160.com": {
    imgsSelector: ".picsbox img",
    attr: "src",
    nextPage: ($, currentUrl) => {
      let nextPageUrl = $(".itempage")
        .children(".current")
        .next()
        .attr("href");

      if (nextPageUrl === "#") {
        return false;
      }

      if (nextPageUrl && nextPageUrl.indexOf("http") === -1) {
        const prefix = getUrlPrefix(currentUrl, "/");
        nextPageUrl = prefix + "/" + nextPageUrl;
      }

      if (isUrl(nextPageUrl)) {
        return nextPageUrl;
      }
      return false;
    },
    getPageTitle: $ => {
      let title = $(".picmainer h1").text();
      const lastIndex = title.lastIndexOf("(");
      if (lastIndex !== -1) {
        title = title.substring(0, lastIndex).trim();
      }
      return title;
    }
  },

  "www.yeitu.com": {
    imgsSelector: ".img_box img",
    attr: "src",
    nextPage: ($, currentUrl) => {
      if (
        $("#pages")
          .children("span")
          .next()
          .hasClass("a1")
      ) {
        return false;
      }

      let nextPageUrl = $("#pages")
        .children("span")
        .next()
        .attr("href");

      return nextPageUrl;
    },
    getPageTitle: $ => {
      let title = $("#title h1").text();
      return title;
    }
  },

  "www.ligui.org": {
    imgsSelector: ".article-content img",
    attr: "src",
    nextPage: ($, currentUrl) => {
      let nextPageUrl = $(".article-paging")
        .children("span")
        .next()
        .attr("href");
      console.log("www.ligui.org nextPageUrl", nextPageUrl);

      if (isUrl(nextPageUrl)) {
        return nextPageUrl;
      }
      return false;
    },
    getPageTitle: $ => {
      let title = $(".article-title").text();
      return title;
    }
  },

  "www.baituji.com": {
    imgsSelector: "#show-area-height img",
    attr: "src",
    nextPage: ($, currentUrl) => {
      let nextPageUrl = $(".pagination")
        .children(".active")
        .next()
        .find("a")
        .attr("href");

      if (nextPageUrl && nextPageUrl.indexOf("http") === -1) {
        const prefix = getUrlPrefix(currentUrl, "/detail");
        nextPageUrl = prefix + nextPageUrl;
      }

      if (isUrl(nextPageUrl)) {
        return nextPageUrl;
      }
      return false;
    },
    getPageTitle: $ => {
      let title = $("title").text();
      return title;
    }
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
 * 现将图片链接收到到数组中
 * @param {Cheerio Objecjt} $
 * @param {String} selector
 * @param {String} attr
 */
function getCurrPageImgPath($, selector, attr, pageUrl) {
  if (!attr) {
    return null;
  }
  const imgPathArr = [];
  let urlObj = URL.parse(pageUrl, true);

  $(selector).each((index, item) => {
    let src = $(item).attr(attr);
    if (src && src.indexOf("http") === -1) {
      src = "http://" + urlObj.host + src;
    }
    imgPathArr.push(src);
  });
  return imgPathArr;
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
function getPageTitle($, url) {
  let urlObj = URL.parse(url, true);
  const website = WEBSITE_SCHEMA[urlObj.host];
  return website.getPageTitle($);
}

/**
 * 获取下一页的函数
 * @param {Object} $ 
 * @param {String} url 
 */
function getNextPageURL($, url) {
  let urlObj = URL.parse(url, true);
  const website = WEBSITE_SCHEMA[urlObj.host];
  let nextPageUrl = website.nextPage($, url);
  return nextPageUrl;
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
    imgsSelector: website.imgsSelector,
    attr: website.attr
  };
}

module.exports = {
  isUrl,
  getDir,
  getParams,
  getFilename,
  getFilePath,
  getUrlPrefix,
  getPageTitle,
  createStream,
  getNextPageURL,
  getCurrPageImgPath
}