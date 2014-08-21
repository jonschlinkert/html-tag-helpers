/*!
 * html-tag-helpers <https://github.com/jonschlinkert/html-tag-helpers>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var path = require('path');
var should = require('should');
var Handlebars = require('handlebars');
var Tags = require('..');

describe('Tag', function () {
  it('should generate a function for the given HTML tag.', function () {
    var html = new Tags();
    var a = html.addTag('a');

    a({href: 'foo'}).should.equal('<a href="foo"></a>');
  });

  it('should generate a helper', function () {
    var tag = new Tags();

    Handlebars.registerHelper('a', tag.addTag('a'));
    var html = Handlebars.compile('{{{a "This is text" href=link}}}');
    html({link: 'about/us.html'}).should.equal('<a href="about/us.html">This is text</a>');
  });

  it('should generate a helper for a void tag.', function () {
    var tag = new Tags();

    Handlebars.registerHelper('img', tag.addTag('img'));
    var html = Handlebars.compile('{{{img src=image}}}');
    html({image: 'a.png'}).should.equal('<img src="a.png">');
  });

  it('should use default attribute values in the generated HTML.', function () {
    var tag = new Tags();

    Handlebars.registerHelper('link', tag.addTag('link', {
      rel: 'stylesheet'
    }));

    var html = Handlebars.compile('{{{link href=styles}}}');
    html({styles: 'bootstrap.css'}).should.equal('<link rel="stylesheet" href="bootstrap.css">');
  });

  it('should override default attribute values with hash values.', function () {
    var tag = new Tags();

    Handlebars.registerHelper('link', tag.addTag('link', {
      rel: 'stylesheet'
    }));

    var html = Handlebars.compile('{{{link href=styles rel="foo"}}}');
    html({styles: 'bootstrap.css'}).should.equal('<link rel="foo" href="bootstrap.css">');
  });

  it('should accept a function as a second arg for modifying attributes.', function () {
    var tag = new Tags();

    Handlebars.registerHelper('img', tag.addTag('img', function (text, hash) {
      var name = path.basename(hash.src, path.extname(hash.src));
      return {
        height: hash.height || 10,
        width: hash.width || 20,
        alt: 'open iconic ' + (hash.alt || name)
      };
    }));

    var a1 = Handlebars.compile('{{{img src=icon alt="person"}}}');
    var a2 = '<img src="group.svg" alt="open iconic person" height="10" width="20">';
    a1({icon: 'group.svg'}).should.equal(a2);

    var b1 = Handlebars.compile('{{{img height="500" src=icon alt="person"}}}');
    var b2 = '<img src="group.svg" alt="open iconic person" height="500" width="20">';
    b1({icon: 'group.svg'}).should.equal(b2);
  });


  it('should change the sort order of attributes based on the given array.', function () {
    var tag = new Tags();

    Handlebars.registerHelper('img', tag.addTag('img', ['alt', 'src'], function (text, hash) {
      var name = path.basename(hash.src, path.extname(hash.src));
      return {
        height: hash.height || 10,
        width: hash.width || 20,
        alt: 'open iconic ' + (hash.alt || name)
      };
    }));

    var a1 = Handlebars.compile('{{{img src=icon alt="person"}}}');
    var a2 = '<img alt="open iconic person" src="group.svg" height="10" width="20">';
    a1({icon: 'group.svg'}).should.equal(a2);

    var b1 = Handlebars.compile('{{{img height="500" src=icon alt="person"}}}');
    var b2 = '<img alt="open iconic person" src="group.svg" height="500" width="20">';
    b1({icon: 'group.svg'}).should.equal(b2);
  });
});


describe('when a `pathFn` is given:', function () {
  it('should use it to recalculate `href`s.', function () {
    var tag = new Tags({
      pathFn: function  (url) {
        return 'assets/' + url;
      }
    });

    Handlebars.registerHelper('link', tag.addTag('link', {
      rel: 'stylesheet'
    }));

    var html = Handlebars.compile('{{{link href=styles}}}');
    html({styles: 'bootstrap.css'}).should.equal('<link rel="stylesheet" href="assets/bootstrap.css">');
  });

  it('should pass the current context to the path function.', function () {
    var tag = new Tags({
      pathFn: function  (url) {
        return this.assets + '/' + url;
      }
    });

    Handlebars.registerHelper('link', tag.addTag('link', {
      rel: 'stylesheet'
    }));

    var html = Handlebars.compile('{{{link href=styles}}}');
    var context = {styles: 'bootstrap.css', assets: '_gh_pages/assets'};
    html(context).should.equal('<link rel="stylesheet" href="_gh_pages/assets/bootstrap.css">');
  });
});


describe('custom tag', function () {
  it('should generate a function for a custom HTML void tag.', function () {
    var html = new Tags();
    var apple = html.addTag('apple');

    apple('b', {href: 'a'}).should.equal('<apple href="a">b</apple>');
  });

  it('should add close tag when the text node is `true` (Boolean).', function () {
    var html = new Tags();
    var c = html.addTag('c');

    c({href: 'bar', text: true}).should.equal('<c href="bar"></c>');
    c({href: 'bar'}).should.equal('<c href="bar">');
  });

  it('should add close tag when the text node is `true` (Boolean).', function () {
    var html = new Tags();
    var orange = html.addTag('orange');

    orange('hi', {href: 'bar'}).should.equal('<orange href="bar">hi</orange>');
    orange({href: 'bar', text: 'hi'}).should.equal('<orange href="bar">hi</orange>');
  });
});


describe('url array', function () {
  it('should generate a tag for each url in a given `href`.', function () {
    var html = new Tags();
    var styles = html.addTag('link');

    styles({href: ['a', 'b']}).should.equal('<link href="a">\n<link href="b">');
  });
});
