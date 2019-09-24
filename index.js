var fs = require("fs");
var cheerio = require("cheerio");
var request = require("request");

var dir = "./images";
var url = "https://www.yimg.net/sex/13154.html";

function processPath(src) {
  return src;
}

function saveImage(url, filename, callback) {
  console.log("开始保存图片至：" + filename);
  // 这里的额request.head是设置请求类型吗？
  request.head(url, function(err, res, body) {
    if (err) {
      return console.log("下载出错", err);
    }
    request(url)
      .pipe(fs.createWriteStream(filename))
      .on("close", callback);
  });
}

request(url, function(error, response, body) {
  if (error) {
    return console.log("error", error);
  }
  var $ = cheerio.load(body);
  $("#masonry .post-item-img").each(function() {
    var src = processPath($(this).attr("data-original"));
    saveImage(
      src,
      dir + "/" + src.substr(src.indexOf(".jpg") - 10, 14),
      function() {
        console.log("下载完成");
      }
    );
  });
});
