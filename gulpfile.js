// ////////////////////////////////////////////////
//
// EDIT CONFIG OBJECT BELOW !!!
//
// jsConcatFiles => list of javascript files (in order) to concatenate
// buildFilesFoldersRemove => list of files to remove when running final build
// // //////////////////////////////////////////////

var config = {
	jsConcatFiles: [
		'./src/ipviking.js',
        './src/presentations.js'
	],
	buildFilesFoldersRemove:[
		// 'build/scss/',
		'build/*.js',
        '!build/*.min.js',
		// 'build/bower.json',
		// 'build/bower_components/',
		'build/*.map'
	]
};


// ////////////////////////////////////////////////
// Required taskes
// gulp build
// bulp build:serve
// // /////////////////////////////////////////////

var gulp = require('gulp'),
	// sass = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps'),
	// autoprefixer = require('gulp-autoprefixer'),
	browserSync = require('browser-sync'),
	reload = browserSync.reload,
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	del = require('del'),
    proxy = require('http-proxy-middleware');


// ////////////////////////////////////////////////
// Log Errors
// // /////////////////////////////////////////////

function errorlog(err){
	console.error(err.message);
	this.emit('end');
}


// ////////////////////////////////////////////////
// Scripts Tasks
// ///////////////////////////////////////////////

gulp.task('scripts', function() {
  return gulp.src(config.jsConcatFiles)
	.pipe(sourcemaps.init())
		.pipe(concat('temp.js'))
		.pipe(uglify())
		.on('error', errorlog)
		.pipe(rename('app.min.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./src'))

    .pipe(reload({stream:true}));
});


// ////////////////////////////////////////////////
// Styles Tasks
// ///////////////////////////////////////////////
//
// gulp.task('styles', function() {
// 	gulp.src('src/scss/style.scss')
// 		.pipe(sourcemaps.init())
// 			.pipe(sass({outputStyle: 'compressed'}))
// 			.on('error', errorlog)
// 			.pipe(autoprefixer({
// 	            browsers: ['last 3 versions'],
// 	            cascade: false
// 	        }))
// 		.pipe(sourcemaps.write('../maps'))
// 		.pipe(gulp.dest('src/css'))
// 		.pipe(reload({stream:true}));
// });


// ////////////////////////////////////////////////
// HTML Tasks
// // /////////////////////////////////////////////

gulp.task('html', function(){
    gulp.src('src/**/*.html')
    .pipe(reload({stream:true}));
});


// ////////////////////////////////////////////////
// HTML Tasks
// // /////////////////////////////////////////////
gulp.task('css', function(){
    gulp.src('scr/**/*.css')
    .pipe(reload({stream:true}));
});


// ////////////////////////////////////////////////
// Browser-Sync Tasks
// // /////////////////////////////////////////////

/**
 * Configure proxy middleware
 */
var EsProxy = proxy('/elasticsearch/', {
    target: 'http://localhost:9200',
    changeOrigin: true,             // for vhosted sites, changes host header to match to target's host
    pathRewrite: {
            '^/elasticsearch/' : '/'
    },
    logLevel: 'debug'
});

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: "./src/",
            middleware: [EsProxy]
        }
    });
});

// task to run build server for testing final app
gulp.task('build:serve', function() {
    browserSync({
        server: {
            baseDir: "./build/",
            middleware: [EsProxy]
        }
    });
});


// ////////////////////////////////////////////////
// Build Tasks
// // /////////////////////////////////////////////

// clean out all files and folders from build folder
gulp.task('build:cleanfolder', function () {
	return del([
		'build/**'
	]);
});

// task to create build directory of all files
gulp.task('build:copy', ['build:cleanfolder'], function(){
    return gulp.src('src/**/*/')
    .pipe(gulp.dest('build/'));
});

// task to removed unwanted build files
// list all files and directories here that you don't want included
gulp.task('build:remove', ['build:copy'], function () {
	return del(config.buildFilesFoldersRemove);
});

gulp.task('build', ['build:copy', 'build:remove']);


// ////////////////////////////////////////////////
// Watch Tasks
// // /////////////////////////////////////////////

gulp.task ('watch', function(){
	// gulp.watch('src/scss/**/*.scss', ['styles']);
	gulp.watch(['src/**/*.js', '!src/**/*.min.js'], ['scripts']);
  	gulp.watch('src/**/*.html', ['html']);
    gulp.watch('src/**/*.css', ['css']);
});


gulp.task('default', ['scripts', 'css', 'html', 'browser-sync', 'watch']);
