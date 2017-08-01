var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var cheerio = require('cheerio');
var dot = require('dot');
var PluginError = gutil.PluginError;

//设置dot不要删除空格
dot.templateSettings.strip = false;

// 常量
const PLUGIN_NAME = 'gulp-tag-include-html';

var beginTag = '', endTag = '';

// 插件级别的函数（处理文件）
function publicFun(options) {

  setDoT(options)

  // 创建一个 stream 通道，以让每个文件通过
  var stream = through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }

    if (file.isBuffer()) {
      try {
        file = gulpTagInclude(file);
      } catch (err) {
        console.error(PLUGIN_NAME, ':', err.message);
        return cb();
      }
    }

    // 确保文件进入下一个 gulp 插件
    this.push(file);

    // 告诉 stream 引擎，我们已经处理完了这个文件
    cb();
  });

  // 返回文件 stream
  return stream;
};

//导入文件
function gulpTagInclude(file, parentData) {
  //文件内容
  var content = file.contents.toString();
  //文件路径
  var basePath = file.path.replace(/[^\/\\]*$/, '');

  //查找include标签的正则表达式
  var reg = /<!--[\s\S]*?-->|<include(?:[^>]*\/>|[\s\S]*?<\/include>)/g;
  //查找include标签
  var arrIncludeTag = content.match(reg);

  //根据include标签的数量，循环执行
  for (var i in arrIncludeTag) {

    //跳过注释
    if (/^<!--/.test(arrIncludeTag[i])) {
      continue
    }

    var $ = cheerio.load(arrIncludeTag[i], {
      decodeEntities: false
    });
    var includeTag = $('include');
    var data = Object.assign({}, parentData, includeTag.attr());

    if (data.src && data.src !== '') {
      //获取被包含的文件路径
      try {
        var filePath = path.join(basePath, data.src);
      } catch (err) {
        console.error(PLUGIN_NAME, ':', err.message);
        return file;
      }
      delete data.src;

      //创建file对象，读入文件buffer
      var incFile = null;
      try {
        incFile = new gutil.File({
          base: filePath.replace(/[^\/\\]*$/, ''),
          cwd: __dirname,
          path: filePath,
          contents: fs.readFileSync(filePath)
        });
      } catch (err) {
        console.error(PLUGIN_NAME, ':', err.message);
        return file;
      }

      //递归
      incFile = gulpTagInclude(incFile, data);

      //替换文件路径
      incFile = cssReplaceUrl(incFile, basePath)
      incFile = replaceLinkScript(incFile, basePath)


      //把字符串参数，转换成js数据类型
      for (var key in data) {
        try {
          data[key] = eval('(' + data[key] + ')');
        } catch (err) {
        }
      }

      //获得include标签的子元素
      data.children = includeTag.html().replace(/(^[\n\r]*)|([\n\r]*$)/g, '');

      //被包含的内容
      var includeContent = '';
      try {
        //文件内容
        var fileStr = incFile.contents.toString();
        //使用dot渲染
        if (fileStr !== '') {
          var tempFn = dot.template(fileStr);
          includeContent = tempFn(data);
        }
      } catch (err) {
        console.error(PLUGIN_NAME, ':', err.message);
        return file;
      }

      //用被包含的内容，替换include标签
      content = content.replace(arrIncludeTag[i], includeContent);
    } else {
      throw new Error('<include> must have "src" attribute');
    }
  }

  //返回替换后的file
  file.contents = new Buffer(content);
  return file;
}

//设置模板语法
function setDoT(options) {
  if (!(options && options.begin && options.end)) {
    return
  }

  beginTag = options.begin;
  endTag = options.end;

  beginTag = beginTag.replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\\$')
    .replace(/\(/g, '\\\(')
    .replace(/\)/g, '\\\)')
    .replace(/\*/g, '\\\*')
    .replace(/\+/g, '\\\+')
    .replace(/\./g, '\\\.')
    .replace(/\[/g, '\\\[')
    .replace(/\]/g, '\\\]')
    .replace(/\?/g, '\\\?')
    .replace(/\//g, '\\\/')
    .replace(/\^/g, '\\\^')
    .replace(/\{/g, '\\\{')
    .replace(/\}/g, '\\\}');

  endTag = endTag.replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\\$')
    .replace(/\(/g, '\\\(')
    .replace(/\)/g, '\\\)')
    .replace(/\*/g, '\\\*')
    .replace(/\+/g, '\\\+')
    .replace(/\./g, '\\\.')
    .replace(/\[/g, '\\\[')
    .replace(/\]/g, '\\\]')
    .replace(/\?/g, '\\\?')
    .replace(/\//g, '\\\/')
    .replace(/\^/g, '\\\^')
    .replace(/\{/g, '\\\{')
    .replace(/\}/g, '\\\}');

  for (var key in dot.templateSettings) {
    if (dot.templateSettings[key].source && /^\\\{\\\{/.test(dot.templateSettings[key].source)) {
      dot.templateSettings[key] = new RegExp(dot.templateSettings[key].source.replace(/^\\\{\\\{/, beginTag).replace(/\\\}\\\}$/, endTag), 'g')
    }
  }
}

//替换css中的url
function cssReplaceUrl(file, parentPath) {
  var content = file.contents.toString()

  var reg = /<style[\s\S]*?<\/style>/g;
  var styleTags = content.match(reg);


  var sep = '\\' === path.sep ? /\\/g : /\//g

  if (styleTags) {
    for (var i in styleTags) {
      var cssText = styleTags[i]
      var newCssText = cssText
      var replaceUrls = []

      var urls = cssText.match(/url\(.+\)/g)
      if (urls) {
        for (var n in urls) {
          try {
            var url = urls[n].match(/url\((.+)\)/)[1]
            if (!/^(http|\/|javascript)/.test(url)) {
              var filePath = path.dirname(file.path)
              var resourcePath = path.join(filePath, url)
              var newUrl = path.relative(parentPath, resourcePath).replace(sep, '/')
              replaceUrls.push({
                oldUrl: urls[n],
                newUrl: 'url(' + newUrl + ')'
              })
            }
          } catch (error) {
            console.error(PLUGIN_NAME, ':', error.message);
          }
        }
      }
      for (var m in replaceUrls) {
        newCssText = newCssText.replace(replaceUrls[m].oldUrl, replaceUrls[m].newUrl)
      }
      content = content.replace(cssText, newCssText)
    }
  }

  //返回替换后的file
  file.contents = new Buffer(content);
  return file;
}

//替换link和script的href、src
function replaceLinkScript(file, parentPath) {
  var content = file.contents.toString()

  var reg = /<.*?src=.*?>|<.*?href=.*?>/g;
  var scriptTags = content.match(reg);

  var sep = '\\' === path.sep ? /\\/g : /\//g

  if (scriptTags) {
    for (var i in scriptTags) {
      var scriptText = scriptTags[i]
      var newScriptText = scriptText
      var oldSrc = ''
      var newSrc = ''

      var urls = scriptText.match(/(src|href)="(.+?)"/)
      if (urls && urls[2]) {

        try {
          var url = urls[2]
          if (!/^(http|\/|javascript)/.test(url)) {
            var filePath = path.dirname(file.path)
            var resourcePath = path.join(filePath, url)
            var newUrl = path.relative(parentPath, resourcePath).replace(sep, '/')
            oldSrc = url
            newSrc = newUrl
          }
        } catch (error) {
          console.error(PLUGIN_NAME, ':', error.message);
        }

      }

      if (oldSrc && newSrc) {
        newScriptText = newScriptText.replace(oldSrc, newSrc)
      }

      content = content.replace(scriptText, newScriptText)
    }
  }

  //返回替换后的file
  file.contents = new Buffer(content);
  return file;
}

// 导出插件主函数
module.exports = publicFun;