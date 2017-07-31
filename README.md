# gulp-tag-include-html
is a gulp plugin,used to include html.

github: https://github.com/nickham-su/gulp-tag-include-html

## feature
	Using the <include> tag that include the HTML fragment in other files;
	Using the doT.js template engine, rendering include content;
	Using the tag attributes and child elements, two ways to transfer data;
	doT.js document：http://olado.github.io/doT/


## install
```bash
npm install gulp-tag-include-html
```

## example

gulpfile.js
```js
var gulp = require('gulp');
var include = require('gulp-tag-include-html');
gulp.task('default', function() {
    gulp.src('./views/index.html')
      .pipe(include())
	    .pipe(include({
        begin:'<%',
        end:'%>'
      }))
      .pipe(gulp.dest('dest'));
});
```

/views/index.html
```html
<include src="./partials/head.html" title="home">
  <link rel="stylesheet" href="1.css">
  <link rel="stylesheet" href="2.css">
</include>
<div><h1>this is body</h1></div>
<include src="./partials/footer.html" js="['1.js','2.js']" />
```

/views/partials/head.html
```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{{=it.title}}</title>
  {{=it.children}}
</head>
<body>
```

/views/partials/footer.html
```html
<h2>this is footer</h2>
{{~it.js:item:index}}
  <script src="{{=item}}"></script>
{{~}}
</body>
</html>
```

result:
/dest/index.html
```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>home</title>
  <link rel="stylesheet" href="1.css">
  <link rel="stylesheet" href="2.css">
</head>
<body>
<div><h1>this is body</h1></div>
<h2>this is footer</h2>

  <script src="1.js"></script>

  <script src="2.js"></script>

</body>
</html>
```

## Author
nickham-su
Email:50793247@qq.com

Thank you

