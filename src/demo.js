const axios = require('axios')

const pageUrl = 'https://www.yeitu.com/meinv/xinggan/20190930_17604.html'

const task = {
  taskIsDone: false,
  getTaskStatus: () => {
    return this.taskIsDone
  },
  setTaskStatus: () => {
    this.taskIsDone = true
  }
}

function getNextPage() {
  return true
}

function func() {
  return new Promise((resolve, reject) => {
    axios.get(pageUrl)
      .then(res => {

        // 在这里循环发起请求
        let count = 0
        const imgUrlArr = [1, 2, 3]
        for(let i = 0; i < imgUrlArr.length; i++) {
          axios.get(imgUrlArr[i])
            .then(res => {
              // 任务数达到 如果这个任务错误了呢？
              if (count === imgUrlArr.length) {
                if (getNextPage()) {
                  resolve(func())
                } else {
                  // 当前任务结束
                  resolve(count)
                }
              }
            })
            .catch(err => {
              console.log('inner inner catch', err.message)
            })
            .finally(() => {
              count = count + 1
            })
        }
      })
      .catch(err => reject(err))
  })
}

func()
  .then(res => {
    console.log('out then', res)
  })
  .catch(err => {
    console.log('out catch', err.message)
  })



