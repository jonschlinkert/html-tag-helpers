/*!
 * html-tag-helpers <https://github.com/jonschlinkert/html-tag-helpers>
 *
 * Copyright (c) 2014 Jon Schlinkert
 * Licensed under the MIT License (MIT).
 */

'use strict';

/**
 * Module dependencies.
 */

var tag = require('html-tag');
var _ = require('lodash');
var extend = _.extend;
var elements = require('./ele.js');
var propOrder = require('./order.js');
var sortObj = require('sort-object');


/**
 * ```js
 * var Tag = require('html-tag-helpers');
 * ```
 *
 * @param {Object} `options`
 * @api public
 */

function Tags(options) {
  this.options = options || {};
  this.cache = {};
}


/**
 * Create a new HTML tag _helper_, optionally passing default
 * attributes to use as a second paramter.
 *
 * **Example:**
 *
 * ```js
 * html.addTag('link', {rel: 'stylesheet'});
 * ```
 *
 * @param  {String} `name` The name of the HTML tag to create.
 * @param  {Array} `sortProps` Default sort order to use for generated attributes.
 * @param  {Object} `defaults` Default attributes to use.
 * @return  {Function} Helper function for the given HTML tag.
 * @api public
 */

Tags.prototype.addTag = function (name, sortOrder, defaults) {
  var pathFn = this.options.pathFn || null;
  var self = this;

  if (_.isObject(sortOrder) && !Array.isArray(sortOrder)) {
    defaults = sortOrder;
    sortOrder = [];
  }

  /**
   * @param  {String} `text` If the first value passed to the helper is a string it will be
   *   used to create a text node in the generated HTML name.
   * @param  {Object} `context`
   * @return {String} Rendered HTML.
   */

  return function (text, context) {
    var args = [].slice.call(arguments);
    var attributes = _.last(args);
    var resolvePath = true;

    if (typeof text !== 'string') {
      context = text;
      text = null;
    }

    var ctx = extend({}, attributes);
    var hash = {};

    if (ctx.hasOwnProperty('hash')) {
      _.extend(hash, ctx.hash);
    } else {
      _.extend(hash, ctx);
    }

    // Allow `defaults` to be a function to extend the hash
    if (typeof defaults === 'function') {
      extend(hash, defaults.call(this, text, hash));
    } else {
      hash = extend({}, defaults, hash);
    }

    if (hash.hasOwnProperty('resolvePath') && hash.resolvePath === false) {
      resolvePath = false;
      delete hash.resolvePath;
    }

    if (!text && elements.hasOwnProperty(name)) {
      if (elements[name].hasOwnProperty('text')) {
        text = elements[name].text;
        delete elements[name].text;
      }
      _.forIn(elements[name], function(value, key) {
        if (!hash.hasOwnProperty(key)) {
          hash[key] = value;
        }
      });
    }

    if (hash.hasOwnProperty('text')) {
      text = hash.text;
      delete hash.text;
    }

    if (resolvePath) {
      hash = self.resolvePaths(this, hash, pathFn);
    }
    hash = self.sortHash(hash, sortOrder);

    var makeArray = false;
    var arr = [];

    _.forIn(hash, function (value, key) {
      if (/src|href|url|rel/.test(key) && Array.isArray(value)) {
        makeArray = true;
        value.forEach(function (url) {
          hash[key] = url;
          arr.push(tag(name, hash, text));
        });
      }
    });

    if (makeArray) {
      return arr.join('\n');
    }

    return tag(name, hash, text);
  };
};


/**
 * Resolve URLs or filepaths that are passed on certain attributes,
 * but only if a `pathFn` is provided.
 *
 * @param  {Object} `thisArg` The context to use.
 * @param  {Object} `hash` Hash object to process.
 * @param  {Function} `pathFn` function to use on URLs.
 * @return {Object}
 */

Tags.prototype.resolvePaths = function (thisArg, hash, pathFn) {
  _.forIn(hash, function (value, key) {
    if (/src|href|url/.test(key)) {
      var dest = value;
      if (pathFn) {
        if (Array.isArray(value)) {
          dest = value.map(function(url) {
            return  pathFn.call(this, url);
          }.bind(this));
        } else {
          dest = pathFn.call(this, value);
        }
      }
      hash[key] = dest;
    }
  }.bind(thisArg));
  return hash;
};


/**
 * Sort properties in the order of the keys in the
 * given array.
 *
 * @param  {Object} `hash` The hash object.
 * @param  {Array} `props` Array with attributes in the desired order.
 * @return {Object} Sorted hash object.
 */

Tags.prototype.sortHash = function (hash, props) {
  // Concat all of the keys from the hash, to ensure
  // they are included in the sorted object.
  var order = _.union([], propOrder, _.keys(hash));
  if (props) {
    order = _.union([], props, order);
  }

  order = order.filter(function (attr) {
    if (hash.hasOwnProperty(attr)) {
      return true;
    }
  });

  return _.omit(sortObj(hash, order));
};


/**
 * Export `tags`
 */

module.exports = Tags;
