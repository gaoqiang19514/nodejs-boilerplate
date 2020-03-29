const fs = require("fs");
const URL = require("url");
const cheerio = require("cheerio");
const fsExtra = require("fs-extra");

const util = require("./util");
const axios = require("./axios");

// 下载的目录
const DOWNLOAD_PATH = "./images";

function download(imgURL, filePath) {
  return new Promise((resolve, reject) => {
    // 对图片发起请求
    axios
      .get(imgURL)
      .then(res => {
        // 将字符串转换成文件流
        const file = util.createStream(res.data);
        // 保存文件到filePath中
        file.pipe(fs.createWriteStream(filePath)).on("close", () => {
          // 图片下载完成
          resolve(filePath);
        });
      })
      .catch(err => reject(err));
  });
}

/**
 * 下载图片
 * @param {Array} imgPathList
 * @param {String} dir
 */
async function requestImages(imgPathList, dir) {
  const promises = [];

  await fsExtra.ensureDir(dir);

  imgPathList.map(imgURL => {
    const filePath = util.getFilePath(dir, imgURL);
    promises.push(download(imgURL, filePath));
  });

  return Promise.all(promises);
}

/**
 * 开始
 * @param {String} taskUrl
 */
async function main(taskUrl) {
  console.log("开始处理页面地址：", taskUrl);

  // 读取页面
  const { data } = await axios.get(taskUrl);
  // 将页面加载为cheerio对象
  const $ = cheerio.load(util.decode(data));
  // 获取目录
  const dir = util.getDir(DOWNLOAD_PATH, util.getTitle($, taskUrl));
  // 获取网站的配置参数
  const params = util.getParams(taskUrl);
  //  获取页面中图片地址列表
  const imgPathList = util.getPageImgPath({
    $,
    attr: params.attr,
    selector: params.selector,
    host: URL.parse(taskUrl, true)
  });

  // 读取是否有下一页
  // const nextPage = util.getNextPage($, taskUrl);
  // if (nextPage) {
  //   main(nextPage)
  // }

  return requestImages(imgPathList, dir);
}

// 启动程序
async function startup() {
  const tasks = getURLList("C:/Users/Administrator/Desktop/待下载壁纸");

  if (!tasks && !tasks.length) {
    console.log("未发现可供运行的任务。");
    return;
  }

  for (const task of tasks) {
    try {
      const res = await main(task);
      console.log(`${tasks}下载完成`);
    } catch (err) {
      console.log("err", err);
    }
  }

  console.log("所有任务完成");
}

startup();
