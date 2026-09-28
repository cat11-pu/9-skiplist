# skiplist

跳表分层索引工作台（原生 ES 模块，零依赖）：左边按层画链表与查找路径，右边插入、查找、删除。层高由键的二进制末尾连续一的个数加一定，不用随机数。

## 起服务看页面

    python3 -m http.server 8000

浏览器打开 http://127.0.0.1:8000/ 即可操作。

## 测试

    node tests/run.js

## 场景自检

    node check_sample.js
