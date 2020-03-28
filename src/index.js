const fs = require("fs");
const cheerio = require("cheerio");
const fsExtra = require("fs-extra");
var iconv = require("iconv-lite");
const axios = require("./axios");
const util = require("./util");
const path = require("path");

// 下载的目录
const DOWNLOAD_PATH = "./images";

/**
 * 开始
 * @param {Object} options
 */
function initMultiPage(options) {
  console.log("开始处理页面地址：", options.pageUrl);
  return new Promise((resolve, reject) => {
    axios
      .get(options.pageUrl)
      .then(res => {
        if (iconv.decode(res.data, "gb2312").indexOf("�") >= 0) {
          return cheerio.load(res.data);
        }
        return cheerio.load(iconv.decode(res.data, "gb2312"));
      })
      .then($ => {
        let count = 0;
        // 获取目录
        const dir = util.getDir(
          DOWNLOAD_PATH,
          util.getPageTitle($, options.pageUrl)
        );

        const params = util.getParams(options.pageUrl);

        //  获取上文页面中的图片地址列表
        const imgPathArr = util.getCurrPageImgPath(
          $,
          params.imgsSelector,
          params.attr,
          options.pageUrl
        );
        //  当前页面请求数量
        const imgTotalCount = imgPathArr.length;

        imgPathArr.map(imgUrl => {
          fsExtra.ensureDir(dir).then(() => {
            const filepath = util.getFilePath(dir, imgUrl);

            // 对图片发起请求
            axios
              .get(imgUrl)
              .then(res => {
                // 将字符串转换成文件流
                const file = util.createStream(res.data);
                file.pipe(fs.createWriteStream(filepath)).on("close", () => {
                  count = count + 1;
                  console.log(
                    `下载：${util.getFilename(imgUrl)}, 进度：${parseInt(
                      (count / imgTotalCount) * 100
                    )}%`
                  );
                  if (count === imgTotalCount) {
                    console.log(`当前页面下载完成，共计：${imgTotalCount}张。`);
                    // 当前页面下载完成后 再请求下一页
                    const nextPageUrl = options.getNextPageUrl(
                      $,
                      options.pageUrl
                    );
                    if (nextPageUrl) {
                      resolve(
                        initMultiPage({
                          ...options,
                          pageUrl: nextPageUrl
                        })
                      );
                    } else {
                      console.log("任务完成!");
                      resolve(imgTotalCount);
                    }
                  }
                });
              })
              .catch(err => reject(err));
          });
        });
      })
      .catch(err => reject(err));
  });
}

const start = async tasks => {
  let count = 0;
  console.log("程序启动");
  for (let i = 0; i < tasks.length; i++) {
    try {
      const res = await initMultiPage({
        pageUrl: tasks[i],
        // 获取下一页地址
        getNextPageUrl: util.getNextPageURL
      });
      count = count + res;
    } catch (err) {
      console.log("err", err);
    }
  }
  console.log(`批量任务完成，共计：${count}张，${tasks.length}个任务`);
};

function getURL(str) {
  if (!str) {
    return "";
  }
  // https://www.nvshens.net/g/31933/3.html
  return str.match(/http.*?\s/g)[0].replace("\r", "");
}

function getURLList() {
  const dir = "C:/Users/Administrator/Desktop/待下载壁纸";

  const files = fs.readdirSync(dir);

  const filePathPool = files.map(filename => path.join(dir, filename));

  const URLList = filePathPool.map(filePath => {
    const str = fs.readFileSync(filePath, "utf8");
    return getURL(str);
  });

  return URLList;
}

start(getURLList());
