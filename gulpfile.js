// ////////////////////////////////////////////////
//
// EDIT CONFIG OBJECT BELOW !!!
//
// jsConcatFiles => list of javascript files (in order) to concatenate
// buildFilesFoldersRemove => list of files to remove when running final build
// // //////////////////////////////////////////////

var config = {
	jsConcatFiles: [
		'./src/js/d3.v3.js',
		'./src/js/queue.v1.js',
		'./src/js/topojson.v1.js',
        './src/js/moment.js',
		'./src/js/pym.js',
		'./src/js/ipviking.js',
        './src/js/presentations.js'
	],
    workerConcatFiles:[
        './src/js/elasticsearch.js',
        './src/js/courier.js'
    ],
    cssConcatFiles: [
        './src/styles/flags.css',
        './src/styles/fonts.css',
        './src/styles/ipviking.css'
    ],
	buildFilesFoldersRemove:[
		'dist/scss/',
		'dist/js/',
        'dist/styles/',
		// 'build/bower.json',
		// 'build/bower_components/',
		'dist/maps/',
		'dist/china.html'
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
    cleanCSS = require('gulp-clean-css'),
	del = require('del'),
    proxy = require('http-proxy-middleware'),
	runSequence = require('run-sequence');


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

gulp.task('js', function() {
  return gulp.src(config.jsConcatFiles)
	.pipe(sourcemaps.init())
		.pipe(concat('temp.js'))
		.pipe(uglify())
		.on('error', errorlog)
		.pipe(rename('app.min.js'))
    .pipe(sourcemaps.write('./maps/'))
    .pipe(gulp.dest('./src/'))
    .pipe(reload({stream:true}));
});

gulp.task('worker', function () {
    return gulp.src(config.workerConcatFiles)
        .pipe(sourcemaps.init())
        .pipe(concat('worker.js'))
        .pipe(uglify())
        .on('error', errorlog)
        .pipe(rename('worker.min.js'))
        .pipe(sourcemaps.write('./maps/'))
        .pipe(gulp.dest('./src/'))
        .pipe(reload({stream:true}));
});

gulp.task('scripts', ['js', 'worker']);

// ////////////////////////////////////////////////
// Styles Tasks
// ///////////////////////////////////////////////

gulp.task('styles', function() {
  return gulp.src(config.cssConcatFiles)
	.pipe(sourcemaps.init())
		.pipe(concat('temp.css'))
		.pipe(cleanCSS())
		.on('error', errorlog)
		.pipe(rename('app.min.css'))
    .pipe(sourcemaps.write('./maps/'))
    .pipe(gulp.dest('./src/'))
    .pipe(reload({stream:true}));
});


// ////////////////////////////////////////////////
// Styles Tasks for SASS
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
    return gulp.src('src/**/*.html')
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
            baseDir: "./dist/",
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
		'dist/**'
	]);
});

// task to create build directory of all files
gulp.task('build:copy', ['build:cleanfolder'], function(){
    return gulp.src('src/**/*/')
    .pipe(gulp.dest('dist/'));
});

// task to removed unwanted build files
// list all files and directories here that you don't want included
gulp.task('build:remove', ['build:copy'], function () {
	return del(config.buildFilesFoldersRemove);
});

gulp.task('build:make', ['scripts', 'styles', 'html']);

gulp.task('build:move', ['build:copy', 'build:remove']);

gulp.task('build', function (callback) {
	runSequence(['scripts', 'styles', 'html'],'build:copy', 'build:remove',callback);
})

// ////////////////////////////////////////////////
// Watch Tasks
// // /////////////////////////////////////////////

gulp.task ('watch', function(){
	// gulp.watch('src/scss/**/*.scss', ['styles']);
	gulp.watch(['src/**/*.js', '!src/**/*.min.js'], ['scripts']);
  	gulp.watch('src/**/*.html', ['html']);
    gulp.watch(['src/**/*.css', '!src/**/*.min.css'], ['styles']);
});


gulp.task('default', ['scripts', 'styles', 'html', 'browser-sync', 'watch']);
