/**
 * Serializer.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function(tinymce) {
	/**
	 * This class is used to serialize down the DOM tree into a string using a Writer instance.
	 *
	 *
	 * @example
	 * new tinymce.html.Serializer().serialize(new tinymce.html.DomParser().parse('<p>text</p>'));
	 * @class tinymce.html.Serializer
	 */

	/**
	 * Constructs a new Serializer instance.
	 *
	 * @constructor
	 * @method Serializer
	 * @param {Object} settings Name/value settings object.
	 * @param {tinymce.html.Schema} schema Schema instance to use.
	 */
	tinymce.html.Serializer = function(settings, schema) {
		var self = this, writer = new tinymce.html.Writer(settings);

		settings = settings || {};
		settings.validate = true;

		self.schema = schema = schema || new tinymce.html.Schema();
		self.writer = writer;

		/**
		 * Serializes the specified node into a string.
		 *
		 * @example
		 * new tinymce.html.Serializer().serialize(new tinymce.html.DomParser().parse('<p>text</p>'));
		 * @method serialize
		 * @param {tinymce.html.Node} node Node instance to serialize.
		 * @return {String} String with HTML based on DOM tree.
		 */
		self.serialize = function(node) {
			var handlers, validate;

			validate = settings.validate || true;

			handlers = {
				'#text' : function(node, raw) {
					writer.text(node.value, node.raw);
				},

				'#comment' : function(node) {
					writer.comment(node.value);
				},

				'#pi' : function(node) {
					writer.pi(node.value);
				},

				'#doctype' : function(node) {
					writer.doctype(node.value);
				},

				'#cdata' : function(node) {
					writer.cdata(node.value);
				},

 				'#frag' : function(node) {
					if ((node = node.firstChild)) {
						do {
							walk(node);
						} while (node = node.next);
					}
				}
			};

			writer.reset();

			function walk(node) {
				var handler = handlers[node.name], name, isEmpty, attrs, attrName, attrValue, sortedAttrs, i, l, elementRule;

				if (!handler) {
					name = node.name;
					isEmpty = node.shortEnded;

					// Sort attributes
					attrs = node.attributes;
					if (validate && attrs && attrs.length > 1) {
						sortedAttrs = [];
						sortedAttrs.map = {};

						elementRule = schema.getElementRule(node.name);
						for (i = 0, l = elementRule.attributesOrder.length; i < l; i++) {
							attrName = elementRule.attributesOrder[i];

							if (attrName in attrs.map) {
								attrValue = attrs.map[attrName];
								sortedAttrs.map[attrName] = attrValue;
								sortedAttrs.push({name: attrName, value: attrValue});
							}
						}

						for (i = 0, l = attrs.length; i < l; i++) {
							attrName = attrs[i].name;

							if (!(attrName in sortedAttrs.map)) {
								attrValue = attrs.map[attrName];
								sortedAttrs.map[attrName] = attrValue;
								sortedAttrs.push({name: attrName, value: attrValue});
							}
						}

						attrs = sortedAttrs;
					}

					writer.start(node.name, attrs, isEmpty);

					if (!isEmpty) {
						if ((node = node.firstChild)) {
							do {
								walk(node);
							} while (node = node.next);
						}

						writer.end(name);
					}
				} else
					handler(node);
			}

			// Serialize element and treat all non elements as fragments
			if (node.type == 1)
				walk(node);
			else
				handlers['#frag'](node);

			return writer.getContent();
		};
	}
})(tinymce);