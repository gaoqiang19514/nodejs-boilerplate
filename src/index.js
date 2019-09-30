import fs from "fs";
import cheerio from "cheerio";
import fsExtra from "fs-extra";

import axios from "./axios";
import { getFilename, getFilePath, getDirByMultiPage, getCurrPageImgPath, createStream } from './util'

/**
 * 开始
 * @param {Object} options 
 */
function initMultiPage(options) {
  console.log("开始处理页面地址：", options.pageUrl);
  return new Promise(resolve => {
    axios
      .get(options.pageUrl)
      .then(res => cheerio.load(res.data))
      .then($ => {
        let count = 0;
        // 获取目录
        const dir = getDirByMultiPage(options.pageUrl, options.mark, $);
        //  获取上文页面中的图片地址列表
        const imgPathArr = getCurrPageImgPath(
          $,
          options.selector,
          options.attr
        );
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
                  // 当前页面下载完成后 再请求下一页
                  const nextPageUrl = options.getNextPageUrl(
                    $,
                    options.pageUrl
                  );
                  if (options.hasNextPage(nextPageUrl)) {
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
            });
          });
        });
      })
      .catch(err => {
        console.log("err", err);
      });
  });
}

const start = async tasks => {
  let imgTotalCount = 0;

  console.log("程序启动");

  for (let i = 0; i < tasks.length; i++) {
    try {
      const res = await initMultiPage({
        pageUrl: tasks[i],
        selector: ".img_box img",
        attr: "src",
        mark: ".",
        // 获取下一页地址
        getNextPageUrl: ($, currentUrl) => {
          let href = "";
          const lastIndex = currentUrl.lastIndexOf("/detail");
          const prefix = currentUrl.substring(0, lastIndex);

          // href = $(".article-paging")
          //   .find("span")
          //   .next()
          //   .attr("href");
          if (
            $("#pages")
              .find("span")
              .next()
              .hasClass("a1")
          ) {
            return null;
          }
          href = $("#pages")
            .find("span")
            .next()
            .attr("href");

          if (!href) {
            return null;
          }

          if (href.indexOf("http") === -1) {
            href = prefix + href;
          }
          return href;
        },
        // 结束条件 判断是否还有页面需要请求 hasNextPage
        hasNextPage: pageUrl => {
          // 如果地址包含undefind 说明是最没有下一页了
          if (!pageUrl || pageUrl.indexOf("undefined") !== -1) {
            return false;
          }
          return true;
        }
      });
      imgTotalCount = imgTotalCount + res;
    } catch (err) {
      console.log("err", err);
    }
  }

  console.log(`批量任务完成，共计：${imgTotalCount}张，${tasks.length}个任务`);
};

const tasks = ["https://www.yeitu.com/meinv/xinggan/20190915_17486.html"];
start(tasks);
