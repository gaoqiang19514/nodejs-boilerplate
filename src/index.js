const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const fsExtra = require("fs-extra");
const axios = require("./axios");
const util = require("./util");
const URL = require("url");

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
async function requestImg(imgPathList, dir) {
  await fsExtra.ensureDir(dir);
  const promises = [];

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
  const { data } = await axios.get(taskUrl);

  const $ = cheerio.load(util.decode(data));

  // 获取目录
  const dir = util.getDir(DOWNLOAD_PATH, util.getTitle($, taskUrl));

  const params = util.getParams(taskUrl);

  //  获取页面中图片地址列表
  const imgPathList = util.getCurrPageImgPath(
    $,
    params.imgsSelector,
    params.attr,
    URL.parse(taskUrl, true)
  );

  return requestImg(imgPathList, dir);
}

/**
 * 启动程序
 * @param {Array} tasks
 */
async function start(tasks) {
  for (const task of tasks) {
    try {
      const res = await main(task);
      console.log(`${tasks}下载完成`)
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
  console.log('所有任务完成')
});
