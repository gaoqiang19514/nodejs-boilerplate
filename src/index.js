const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const fsExtra = require("fs-extra");
const axios = require("./axios");
const util = require("./util");

// 下载的目录
const DOWNLOAD_PATH = "./images";

/**
 * 下载图片
 * @param {Array} imgPathList
 * @param {String} dir
 * @param {String} taskUrl
 */
function requestImg($, imgPathList, dir, taskUrl, done) {
  fsExtra.ensureDir(dir).then(() => {
    let imgTotalCount = imgPathList.length;
    let imgCount = 0;
    imgPathList.map(imgUrl => {
      const filePath = util.getFilePath(dir, imgUrl);

      // 对图片发起请求
      axios.get(imgUrl).then(res => {
        // 将字符串转换成文件流
        const file = util.createStream(res.data);
        // 保存文件到filePath中
        file.pipe(fs.createWriteStream(filePath)).on("close", () => {
          imgCount++;
          if (imgCount === imgTotalCount) {
            // 当前页面下载完成
            done();
          }
        });

        // 请求下一页
        // const nextPageUrl = util.getNextPageURL($, taskUrl);
        // if (nextPageUrl) {
        //   main(nextPageUrl);
        // }
      });
    });
  });
}

/**
 * 开始
 * @param {String} taskUrl
 */
function main(taskUrl) {
  console.log("开始处理页面地址：", taskUrl);
  return new Promise(resolve => {
    axios
      .get(taskUrl)
      .then(res => cheerio.load(util.decode(res.data)))
      .then($ => {
        // 获取目录
        const dir = util.getDir(DOWNLOAD_PATH, util.getTitle($, taskUrl));

        const params = util.getParams(taskUrl);

        //  获取页面中图片地址列表
        const imgPathList = util.getCurrPageImgPath(
          $,
          params.imgsSelector,
          params.attr,
          taskUrl
        );

        let taskCount = 0;
        requestImg($, imgPathList, dir, taskUrl, () => {
          taskCount++;
          resolve(taskCount);
        });
      });
  });
}

/**
 * 启动程序
 * @param {Array} tasks
 */
async function start(tasks) {
  const taskCount = tasks.length;

  for (const task of tasks) {
    const doneTaskCount = await main(task);
    if (taskCount === doneTaskCount) {
      console.log("任务完成");
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

  const URLList = filePathList.map(filePath => {
    const str = fs.readFileSync(filePath, "utf8");
    return util.getURL(str);
  });

  return URLList;
}

start(getURLList());
