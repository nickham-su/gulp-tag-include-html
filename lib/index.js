var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var cheerio = require('cheerio');
var doT = require('dot');
var PluginError = gutil.PluginError;

//设置doT不要删除空格
doT.templateSettings.strip=false;

// 常量
const PLUGIN_NAME = 'gulp-tag-include-html';

// 插件级别的函数（处理文件）
function publicFun() {

	// 创建一个 stream 通道，以让每个文件通过
	var stream = through.obj(function (file, enc, cb) {
		if (file.isStream()) {
			this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
			return cb();
		}

		if (file.isBuffer()) {
			try{
				file = gulpTagInclude(file);
			}catch (err){
				console.error(PLUGIN_NAME,':', err.message);
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

function gulpTagInclude(file) {
	//文件内容
	var content = file.contents.toString();
	//文件路径
	var basePath = file.path.replace(/[^\/\\]*$/,'');

	//查找include标签的正则表达式
	var reg = /(<include [^>]*[^\/]>[\s\S]*?<\/include>)|(<include [^>]*\/>)/g;
	//查找include标签
	var arrIncludeTag = content.match(reg);

	//根据include标签的数量，循环执行
	for (var i in arrIncludeTag) {
		var $ = cheerio.load(arrIncludeTag[i],{
			decodeEntities:false
		});
		var includeTag = $('include');
		var data = includeTag.attr();

		if(data.src && data.src !== ''){
			//获取被包含的文件路径
			try {
				var filePath = path.join(basePath, data.src);
			} catch (err) {
				console.error(PLUGIN_NAME,':', err.message);
				return file;
			}
			delete data.src;

			//创建file对象，读入文件buffer
			var incFile = null;
			try {
				incFile = new gutil.File({
					base: filePath.replace(/[^\/\\]*$/,''),
					cwd: __dirname,
					path: filePath,
					contents:fs.readFileSync(filePath)
				});
			} catch (err) {
				console.error(PLUGIN_NAME,':', err.message);
				return file;
			}

			//递归
			incFile = gulpTagInclude(incFile);

			//把字符串参数，转换成js数据类型
			for(var key in data){
				try{
					data[key] = eval('('+data[key]+')');
				}catch (err){}
			}

			//获得include标签的子元素
			data.children = includeTag.html().replace(/(^[\n\r]*)|([\n\r]*$)/g,'');

			//被包含的内容
			var includeContent = '';
			try {
				//文件内容
				var fileStr = incFile.contents.toString();
				//使用doT渲染
				if(fileStr !== ''){
					var tempFn = doT.template(fileStr);
					includeContent = tempFn(data);
				}
			} catch (err) {
				console.error(PLUGIN_NAME,':', err.message);
				return file;
			}

			//用被包含的内容，替换include标签
			content = content.replace(arrIncludeTag[i],includeContent);
		}else{
			throw new Error('<include> must have "src" attribute');
		}
	}

	//返回替换后的file
	file.contents = new Buffer(content);
	return file;
}

// 导出插件主函数
module.exports = publicFun;