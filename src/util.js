import md5 from "md5";
import path from "path";
import { Readable } from "stream";

// 下载的目录
const DOWNLOAD_PATH = "./images";

/**
 * 获取文件名
 * @param {String} url
 */
export function getFilename(url) {
  if (!url) {
    return null;
  }
  const temp = url.split("/");
  const filename = temp[temp.length - 1];
  return filename;
}

/**
 * 获取文件路径
 * @param {String} url
 */
export function getFilePath(dir, url) {
  if (!url) {
    return null;
  }
  const temp = url.split("/");
  const len = temp.length;
  const filename = temp[len - 1];
  return path.join(dir, filename);
}

/**
 * 获取目录 针对一页只有一张图的 采用图片的路径进行md5 丢弃mark部分
 * @param {String} url
 * @param {String} mark
 */
export function getDirByMultiPage(url, mark, $) {
  return path.join(DOWNLOAD_PATH, $("#title h1").text());
  const lastIndex = url.lastIndexOf(mark);
  const prefix = url.substring(0, lastIndex);
  // const lastSecondIndex = prefix.lastIndexOf(mark);

  // const prefix2 = prefix.substring(0, lastSecondIndex);

  return path.join(DOWNLOAD_PATH, md5(prefix));
}

/**
 * 现将图片链接收到到数组中
 * @param {Cheerio Objecjt} $
 * @param {String} selector
 * @param {String} attr
 */
export function getCurrPageImgPath($, selector, attr) {
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
export function createStream(data) {
  const stream = new Readable();
  stream.push(data);
  stream.push(null);
  return stream;
}
