任务:

- 初始化仓库, 阅读分析任务和已有文件和结构, 分解并逐步完成工作, 每一小步都要提交git
- 完成 config.yaml, 包括更多的 apps: pdfcraft(pdf), vectorcraft(Illustrator), filmcraft(Premier), lightcraft(Lightroom), photocraft(Photoshop), gridcraft(Excel), designcraft(InDesign), effectcraft(AfterEffects), cadcraft(AutoCAD), soundcraft(Audition)
  - 你可能需要参考 https://github.com/storytold/ 下的不同的仓库的readme
- 完成 readme.md, 作为项目介绍
- 完成 deploy/index.html, 作为网页入口
- 完成 src/main.ts, src/\*.ts, src/utils/\*.ts
  - src/utils/\*.ts: 一些功能性函数, 共用的函数...
  - src/\*.ts: 不同的子步骤, 写到独立的文件中
  - src/main.ts: 入口, 按顺序调用子步骤
     - 加载配置文件, 
     - 逐个访问最新的 github releases 文件列表, 匹配对应的 web 发布版, 并获取版本号,
     - 根据 cache 判断是否需要更新, 无更新则退出程序
     - 下载需要更新的文件, 解压, 进入正确的文件夹层级, 将主入口改为 index.html,
     - 将解压后的入口和必要的文件复制到 cache 文件夹内(先清理旧的文件),
     - 将各个 app 拷贝到 deploy 目录下
- 完成其余相关工作

