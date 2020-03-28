const fs = require("fs");
const URL = require("url");
const path = require("path");
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

/**
 * 启动程序
 * @param {Array} tasks
 */
async function start(tasks) {
  for (const task of tasks) {
    try {
      const res = await main(task);
      console.log(`${tasks}下载完成`);
    } catch (err) {
      console.log("err", err);
    }
  }

  // console.log("\n");
  // console.log("任务信息：");
  // console.log(`- ${tasks.length}个任务`);
  // console.log(`- ${tasks.length - failCount}个成功`);
  // console.log(`- ${failCount}个失败`);
  // console.log(`- ${imgTotalCount}张图片`);
}

/**
 * 获取指定目录内.url文件的地址列表
 */
function getURLList() {
  const dir = "C:/Users/Administrator/Desktop/待下载壁纸";
  const files = fs.readdirSync(dir);
  const filePathList = files.map(filename => path.join(dir, filename));

  return filePathList.map(filePath => {
    const str = fs.readFileSync(filePath, "utf8");
    return util.getURL(str);
  });
}

start(getURLList()).then(res => {
  console.log("所有任务完成");
});
