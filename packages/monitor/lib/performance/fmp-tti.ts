import { storage } from '../utils'

// 源码https://www.npmjs.com/package/fmp-tti
const FT = (function () {
  const { getItem, setItem, removeItem } = storage
  const doc = document
  const win = window;

  let windowHeight = win.innerHeight, performance = win.performance, setTimeout = win.setTimeout, MutationObserver = win.MutationObserver
  let timing = performance && performance.timing
  /** 开始时间 */
  let START_TIME = timing && timing.navigationStart
  /** 页面周期，超过10秒强制上报 */
  let DURATION = win.TTI_LIMIT || 10000
  /** FMP计算区间 */
  let FMP_DURATION = 50
  /** 用来存储检测结果 */
  let cacheKey = "ft-" + location.pathname
  /** 是否开启统计 */
  let enabled = !!(START_TIME && MutationObserver)
  /** 是否已经完成检测 */
  let ended = !enabled
  /** 用于存放检测完成的回调方法 */
  let thenActionList: any[] = []
  /** FCP（首次内容渲染） */
  let fcp
  /** FMP（首次有意义渲染） */
  let fmp
  let currentPaintPoint
  let result
  let lastResult
  /** 是否已经出发DomReady */
  let isReady
  /** DomReady时要执行的方法 */
  let onReady
  let observer
  let timer = 0
  let ttiDuration = 1

  /**
   * 获取从 navigationStart 到当前的时间
   * @returns {number}
   */
  function getNow () {
    return Date.now() - START_TIME
  }
  /**
   * 提取检测结果
   * @param {number} tti tti时间
   */
  function setResult (tti) {
    result = {
      fcp: fcp ? fcp.t : tti,
      fmp: fmp ? fmp.t : tti,
      tti: tti
    }
  }

  /**
   * 测试节点得分
   * @param {HTMLElement} node 待检测节点
   * @returns {number} 得分
   */
  function checkNodeScore (node) {
    let score = 0
    let domReac
    let childNodes
    if (node !== doc.body) {
      // 只看一屏内的标签
      domReac = node.getBoundingClientRect()
      if (domReac.top < windowHeight) {
        if (domReac.width > 0 && domReac.height > 0) {
          if (node.tagName !== 'IMG') {
            if (getText(node) || getComputedStyle(node).backgroundImage !== 'none') {
              // 只统计首屏内元素，不再需要根据top值来计算得分
              // score += top > windowHeight ? (windowHeight / top) * (windowHeight / top) : 1;
              score = 1
              // 加上子元素得分
              childNodes = node.childNodes
              if (childNodes && childNodes.length) {
                score += checkNodeList(childNodes)
              }
            }
          } else if (!!node.src) {
            score = 1
          }
        }
      }
    }
    return score
  }

  /**
   * 检测可交互时间
   */
  function checkTTI () {
    clearTimeout(timer);
    // 标记开始计算TTI
    let startTime
    let lastLongTaskTime
    let lastFrameTime
    let currentFrameTime
    let taskTime
    function checkLongTask() {
      if (enabled && !ended) {
        lastFrameTime = getNow()
        if (!startTime) {
          startTime = lastLongTaskTime = lastFrameTime
        }
        // ios 不支持 requestIdleCallback，所以都使用 setTimeout
        timer = setTimeout(function () {
          currentFrameTime = getNow()
          taskTime = currentFrameTime - lastFrameTime
          // 模仿tcp拥塞控制方式，根据耗时变化动态调整检测间隔，减少CPU消耗
          if (taskTime - ttiDuration < 10) {
            if (ttiDuration < 16) {
              ttiDuration = ttiDuration * 2
            }
            else if (ttiDuration < 25) {
              ttiDuration = ttiDuration + 1
            }
            else {
              ttiDuration = 25
            }
          }
          else if (taskTime > 50) {
            ttiDuration = Math.max(1, ttiDuration / 2)
          }
          if (currentFrameTime - lastFrameTime > 50) {
            lastLongTaskTime = currentFrameTime
          }
          if (currentFrameTime - lastLongTaskTime > 1000 || currentFrameTime > DURATION) {
            // 记录下来，如果页面被关闭，下次打开时可以使用本次结果上报
            setResult(lastLongTaskTime)
            setItem(cacheKey, JSON.stringify(result))
          }
          else {
            checkLongTask()
          }
        }, ttiDuration)
      }
    }
    checkLongTask()
  }

  /**
   * 记录每阶段得分变化
   * @param {number} score 本次得分
   */
  function addScore (score) {
    if (score > 0) {
      const time = getNow()
      let paintPoint = {
        t: getNow(),
        s: score,
        m: 0,
        p: currentPaintPoint
      }
      currentPaintPoint = paintPoint
      if (!fcp) {
        fcp = paintPoint
      }
      // 选取得分变化最大的区间中得分变化最大的点作为FMP
      let targetFmp = paintPoint
      while (paintPoint = paintPoint.p) {
        if (time - paintPoint.t > FMP_DURATION) {
          // 超过判断区间，中断链表遍历
          delete paintPoint.p
        }
        else {
          score += paintPoint.s
          if (paintPoint.s > targetFmp.s) {
            targetFmp = paintPoint
          }
        }
      }
      var fmpScore = fmp ? fmp.m : 0
      if (score >= fmpScore) {
        targetFmp.m = score
        if (fmp !== targetFmp) {
          fmp = targetFmp
          // 计算TTI
          if (isReady) {
            checkTTI()
          }
          else {
            onReady = checkTTI
          }
        }
      }
    }
  }

  /**
   * 计算并记录图片节点得分
   * @param {Event} event
   */
  function addImgScore () {
    // @ts-ignore
    addScore(checkNodeScore(this))
    // @ts-ignore
    this && this.removeEventListener('load', addImgScore)
  }

  /**
   * 测试节点列表得分
   * @param {NodeList} nodes 节点列表
   * @returns {number} 得分
   */
  function checkNodeList(nodes) {
    let score = 0
    for (let i = 0, l = nodes.length; i < l; i++) {
      let node = nodes[i]
      if (node.tagName === 'IMG') {
        node.addEventListener('load', addImgScore);
      }
      else if (isContentElement(node)) {
        score += checkNodeScore(node)
      }
      else if (isContentText(node)) {
        score += 1
      }
    }
    return score
  }

  if (enabled) {
    doc.addEventListener('DOMContentLoaded', function () {
      isReady = true
      if (onReady) {
        onReady()
      }
    });
    observer = new MutationObserver(function (records) {
      // 等到body标签初始化完才开始计算
      if (enabled && doc.body) {
        let score_1 = 0
        records.forEach(function (record) {
          score_1 += checkNodeList(record.addedNodes)
        });
        addScore(score_1);
      }
    });
    observer.observe(doc, {
      childList: true,
      subtree: true
    });
    // 上报统计结果
    setTimeout(function () {
      if (!ended) {
        removeItem(cacheKey)
        ended = true;
        if (!result) {
          setResult(getNow())
        }
        observer.disconnect()
        if (enabled) {
          thenActionList.forEach(function (item: any) { return item(result) })
        }
      }
    }, DURATION)
    // 读取上次检测结果
    lastResult = getItem(cacheKey)
  }

  return {
    /** navigationStart时间 */
    startTime: START_TIME,
    /**
     * 获取从 navigationStart 到当前的时间
     * @returns {number}
     */
    now: getNow,
    /** 停止检测 */
    stop: function () {
      enabled = false
    },
    /**
     * 检测是否有上次未完成的检测结果，有结果时会触发回调
     * @param {Function} callback({ fcp, fmp, tti })
     */
    last: function (callback) {
      if (lastResult) {
        try {
          callback(JSON.parse(lastResult))
        }
        // eslint-disable-next-line no-empty
        catch (error) { }
        removeItem(cacheKey)
      }
    },
    /**
     * 检测完成后触发
     * @param {Function} callback({ fcp, fmp, tti })
     */
    then: function (callback) {
      if (enabled && typeof callback === 'function') {
        if (ended) {
          callback(result)
        }
        else {
          thenActionList.push(callback)
        }
      }
    }
  }
})()

export default FT

/**
 * 获取节点文本内容
 * @param {Node} node 元素节点
 * @returns {string} 文本内容
 */
function getText (node) {
  const text = node.textContent
  return text && text.trim()
}

/**
 * 是否是有效的内容标签
 * @param {HTMLElement} node 元素节点
 */
function isContentElement (node) {
  const tagName = node && node.tagName
  return tagName && !/^(?:HEAD|META|LINK|STYLE|SCRIPT)$/.test(tagName)
}

/**
 * 是否是有内容的文本标签
 * @param {Node} node 元素节点
 */
function isContentText (node) {
  return node && node.nodeType === 1 && getText(node) && isContentElement(node.parentElement)
}