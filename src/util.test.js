const util = require("./util");
const cheerio = require("cheerio");

describe("test isUrl", () => {
  test("baidu.com is a valid url", () => {
    expect(util.isUrl("baidu.com")).toBe(true);
  });

  test("asdg. not a valid url", () => {
    expect(util.isUrl("asdg.")).toBe(false);
  });
});

describe('test createStream', () => {
  test('is return an file stream', () => {
    expect(util.createStream('123').readable).toBe(true)
  })
})

// getFilename
describe('test getFilname', () => {
  test('It will get filename test.png', () => {
    expect(util.getFilename('23423/234234/234/test.png')).toBe('test.png')
  })

  test('https://img.lovebuy99.com/uploads/allimg/190924/15-1Z924213Q4.jpg will get filename 15-1Z924213Q4.jpg', () => {
    expect(util.getFilename('https://img.lovebuy99.com/uploads/allimg/190924/15-1Z924213Q4.jpg')).toBe('15-1Z924213Q4.jpg')
  })

  test('It will get filename test.gif', () => {
    expect(util.getFilename('www.baidu.com/uploads/23423/234234/234/test.gif')).toBe('test.gif')
  })

  test('It will get filename test.svg', () => {
    expect(util.getFilename('www.baidu.com/test.svg')).toBe('test.svg')
  })
})

// getFilePath
describe('test getFilePath', () => {
  test('https://img.lovebuy99.com/uploads/allimg/190924/15-1Z924213Q4.jpg will get filename img\\loveby\\15-1Z924213Q4.jpg', () => {
    expect(util.getFilePath('./img/loveby/', 'https://img.lovebuy99.com/uploads/allimg/190924/15-1Z924213Q4.jpg')).toBe('img\\loveby\\15-1Z924213Q4.jpg')
  })
})

// getDir
describe('test getDir', () => {
  test('It will get dir is img\\loveby\\巴厘岛合辑', () => {
    expect(util.getDir('./img/loveby/', '巴厘岛合辑')).toBe('img\\loveby\\巴厘岛合辑')
  })
})

// getCurrPageImgPath
describe('test getCurrPageImgPath', () => {
  test('It will get dir is img\\loveby\\巴厘岛合辑', () => {
    const html = `
    <div class="img_box">
      <a href="https://www.yeitu.com/meinv/xinggan/20191003_17619_2.html">
        <img class="img" alt="秀人网养眼美女艺儿拿铁大花长裙修长美腿首套性感写真" src="https://img.yeitu.com/2019/1003/20191003010905601.jpg">
      </a>
    </div>
    `
    const $ = cheerio.load(html)

    const result = [
      'https://img.yeitu.com/2019/1003/20191003010905601.jpg'
    ]
    expect(util.getCurrPageImgPath($, '.img', 'src', 'https://www.yeitu.com/meinv/xinggan/20191003_17619.html')).toEqual(result)
  })

    test('It will get dir is img\\loveby\\巴厘岛合辑', () => {
    const html = `
    <div class="img_box">
      <a href="https://www.yeitu.com/meinv/xinggan/20191003_17619_2.html">
        <img class="img" alt="秀人网养眼美女艺儿拿铁大花长裙修长美腿首套性感写真" src="/2019/1003/20191003010905601.jpg">
      </a>
    </div>
    `
    const $ = cheerio.load(html)

    const result = [
      'http://www.yeitu.com/2019/1003/20191003010905601.jpg'
    ]
    expect(util.getCurrPageImgPath($, '.img', 'src', 'http://www.yeitu.com/meinv/xinggan/20191003_17619.html')).toEqual(result)
  })
})

