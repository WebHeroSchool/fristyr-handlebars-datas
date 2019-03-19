const env = require('gulp-env');
const glob = require('glob')
const clean = require('gulp-clean');
const rename = require('gulp-rename')
const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const cssnano = require('gulp-cssnano');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const handlebars = require('gulp-compile-handlebars')
const browserSync = require('browser-sync').create();
const autoprefixer = require('autoprefixer');
const nested = require('postcss-nested');
const postcssShort = require('postcss-short');
const assets  = require('postcss-assets');
const postcssPresetEnv = require('postcss-preset-env');

const templateContext = require('./src/test.json')

const paths = {
    src: {
        styles:'src/styles/*.css',
        scripts: 'src/scripts/*.js',
        dir: 'src/templates'
    },
    build: {
        dir: 'build/',
        styles: 'build/styles',
        scripts: 'build/scripts'
    },
    buildNames: {
        styles: 'index.min.css',
        scripts: 'index.min.js'
    },
    templates: 'src/templates/**/*.hbs'

};

env({
    file: '.env',
    type: 'ini',
  });

  gulp.task('compile', () => {
    glob(paths.templates, (err, files) => {
        if (!err) {
            const options = {
                ignorePartials: true,
                batch: files.map(item => item.slice(0, item.lastIndexOf('/'))),
            };

            gulp.src(`${paths.src.dir}/index.hbs`)
                .pipe(handlebars({ templateContext }, options))
                .pipe(rename('index.html'))
                .pipe(gulp.dest(paths.build.dir));
        }
    });
});

gulp.task('clean', () => {
    gulp.src('build', {read: false})
        .pipe(clean());
});

gulp.task('js', () => {
    return gulp.src([paths.src.scripts])
        .pipe(sourcemaps.init())
            .pipe(concat(paths.buildNames.scripts))
            .pipe(babel({
                presets: ['@babel/env']
            }))
            .pipe(gulpif(process.env.NODE_ENV === 'production', uglify()))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.build.scripts))
});

gulp.task('css', () => {
    const plugins = [
        autoprefixer({browsers: ['last 1 version']
    }),
        nested,
        postcssShort,
        assets({
            loadPaths: ['src/images/'],
        }),
        postcssPresetEnv,
    ];
    return gulp.src([paths.src.styles])
        .pipe(sourcemaps.init())
            .pipe(postcss(plugins))
            .pipe(concat(paths.buildNames.styles))
            .pipe(gulpif(process.env.NODE_ENV === 'production', cssnano()))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.build.styles))
});

gulp.task('build', ['js', 'css']);


gulp.task('browser-sync',() => {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
    gulp.task('watch', () => {
        gulp.watch(paths.src.scripts, ['js-watch']);
        gulp.watch(paths.src.styles, ['css-watch']);
    });
});

gulp.task('js-watch', ['js'], () => browserSync.reload());
gulp.task('css-watch', ['css'], () => browserSync.reload());


gulp.task('default', ['build']);
gulp.task('prod', ['build']);
gulp.task('dev', ['build', 'browser-sync'])