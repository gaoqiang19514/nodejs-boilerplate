const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const cheerio = require("cheerio");
const Readable = require("stream").Readable;

const axios = require("./axios");

const DIR = "./images";
const url = "https://www.yimg.net/sex/13272.html"; // 壁纸 getCurrPageImgPath($, '#masonry img', "data-original");
// const url = "http://www.mlito.com/photo/girl/g_model/157573.html"; // 美女 getCurrPageImgPath($, '.alignnone', "src");

function getFilename(url) {
  const filename = url.split("/");
  const lastIndex = filename.length - 1;
  return path.join(DIR, getShortUUID() + filename[lastIndex]);
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

function getShortUUID() {
  const lastIndex = uuid().split("-").length - 1;
  return uuid().split("-")[lastIndex];
}

console.log("程序开始");
axios
  .get(url)
  .then(res => {
    console.log("获取网页");
    console.log(res.data);
    return cheerio.load(res.data);
  })
  .then(async $ => {
    const imgPathArr = getCurrPageImgPath($, "#masonry img", "data-original");
    const imgCount = imgPathArr.length;
    // 组装ajax请求
    let successTotal = 0;
    const imgDataArr = [];

    console.log(`开始下载：`);
    // 这里待会修改为每次请求从数组中取出来 然后失败的再次加入数组末尾 使其可以重试 但要注意最后一个元素的情况
    for (let i = 0; i < imgPathArr.length; i++) {
      try {
        const res = await axios.get(imgPathArr[i]);
        imgDataArr.push(res);
        successTotal++;
        console.log(`进度：${parseInt((successTotal / imgCount) * 100)}%`);
      } catch (err) {
        console.log("err in for Loop：", err.code);
      }
    }
    console.log("图片抓取全部完成，等待保存至磁盘");

    return {
      total: imgCount,
      successTotal: successTotal,
      imgDataArr: imgDataArr
    };
  })
  .then(res => {
    // 这里需要得到上一步的文件流 然后使用fs写入到指定文件夹
    console.log(`共计：${res.total}张，成功下载${res.successTotal}`);

    let count = 0;
    res.imgDataArr.forEach(item => {
      getFilename(item.config.url);
      let img = new Readable();
      img.push(item.data);
      img.push(null);
      img
        .pipe(fs.createWriteStream(getFilename(item.config.url)))
        .on("close", () => {
          ++count;
          if (count === res.successTotal) {
            console.log("任务完成");
          }
        });
    });
  })
  .catch(err => {
    console.log("err in 98 line", err.code);
  });
