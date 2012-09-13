var	Backbone = require('backbone');
var h = require('../lib/helpers'); //h.u is Underscore.js
var async = require('async');

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// Generic

var Entity = exports.Entity = function() {};
Entity.extend = function(props) {
	//http://nodejs.org/api/util.html#util_util_inherits_constructor_superconstructor
	var child = function(){this.initialize && this.initialize.apply(this,arguments);};
	h.util.inherits(child, this); //util.inherits(ctor, superCtor)
	h.u.extend(child.prototype,props);
	child.extend = this.extend;
	return child;
};

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// Model

exports.Model = Backbone.Model.extend({

	/* TODO: build a 
	
		validation: {
			createdAt: {required:false, default: function() { return new h.Moment() }, type: ['isMoment'], message: 'This must be that' }
			leaderboardId: {required:true, type: ['isAlphanumeric',['len',2,60]] }
			userId: {required:true, type: ['isStrictCode'] }
		}

		then create generic defaults and validate methods that use these configuration and behave as Backbone expects
		
	*/
	
	defaults: function() {
		return {
			createdAt: new h.Moment()
		};
	},

	initialize: function( attributes, options ) {

		options || (options={});
		this.ctx = options.ctx;

		var initOpts = {
			checkRequired: options.checkRequired, // force attribute validation
			checkCriteria: options.checkCriteria // force attribute validation
		};

		this.applyDefaults({condition: 'undefined'});
		if (!options.silent) this.validate(this.attributes, { 
			checkRequired: true, // force attribute validation
			checkCriteria: options.checkCriteria // switch between validation criteria if multiple
		});
		//this.applyDefaults({condition: 'null'});

		if (options.eagerLoad) this.fetchChildren();
	},

	applyDefaults: function( options ) {

		if (!this.defaults) return;

		options || (options={});

		var defaults = h.u.isFunction(this.defaults) ? this.defaults() : this.defaults;

		var conds = {
			'null': function(val) { return typeof val === 'undefined' || val==='' || val===null; },
			'undefined': function(val) { return typeof val === 'undefined'; }
		};

		var valCheck = options.condition && conds[options.condition] ? conds[options.condition] : conds['null'];
	
		for (var attr in defaults) {
			if (valCheck(this.attributes[attr])) {
				this.attributes[attr] = defaults[attr];
			}
		}

	},

	validate: function( attrs, options ) {
		// called by initialize and set

		options || (options={});
		var validator = new h.Validator();

		// i.e.
		// attrs.hasOwnProperty('phone') && validator.check(attrs.name,'name is required').notEmpty(); // optional
		// (attrs.hasOwnProperty('name') || options.checkRequired) && validator.check(attrs.name,'name is required').notEmpty(); //req
		attrs.hasOwnProperty('createdAt') && validator.check(attrs.createdAt,'createdAt must be a date').isMoment();

		var errors = validator.getErrors();
		if (errors.length) {
			console.log('VALIDATION ISSUE:',attrs,errors);
			var err = new Error(errors.join(','));
			throw err;
			//return err;
		}

	},

	toJSON: function( secure ) {
		// called by controller when returning object to User

		var fmt = {};
		this.attributes.hasOwnProperty('createdAt') && ( fmt.createdAt=this.get('createdAt').format() ); //iso8601

		var ret = h.u.extend( h.u.clone(this.attributes), fmt );

		if (!secure) {
			// secure sensible info!

			// i.e.
			// delete ret['apiSecret'];
		}
		delete ret['$ItemName'];

		return ret;
	},
	
	toStorageJSON: function() {
		// called by resource manager when saving to DB

		var fmt = {};
		this.attributes.hasOwnProperty('createdAt') && ( fmt.createdAt=this.get('createdAt').format() ); //iso8601

		return h.u.extend( h.u.clone(this.attributes), fmt );
	
	},

	update: function( rec, options ) {

		var self = this;

		options || (options = {});
		
		options = h.u.extend({
			forceSetAttribute: false, //set to true to add new attributes
			parse: true
		},options);

		var attrs = {};
		Object.keys(rec).forEach( function(key){
			// make sure they don't inject new attributes
			if (!options.forceSetAttribute && !self.attributes.hasOwnProperty(key)) return;
			attrs[key] = rec[key];
		});
		delete attrs.id;

		options.parse && (attrs=this.parse(attrs));

		this.set( attrs );

	},

	parse: function( rec, xhr ) {
		// parse/sanitize
		// -  called by constructor if options.parse (when creating object from DB and from user input)
		// -  called on this.update (when updating attributes with an object literal)

		if (!rec.hasOwnProperty('createdAt')) return;

		rec.createdAt = h.u.isString(rec.createdAt) ? new h.Moment(rec.createdAt) : rec.createdAt;

		return rec;
	},

	relationship: function(name, obj) {
		this.rel || (this.rel={});
		this.rel[name] = obj;
	},

	fetchChildren: function(ctx, callback) {
		var self = this;
		if (!this.rel) return callback(null, self);

		ctx || (ctx = this.ctx);
		async.forEach( Object.keys( this.rel ), function(key, cb) {

			return ( self.rel[key] instanceof Lazy ) ? self.rel[key].fetch(ctx, cb) : cb();

		}, function(err) {

			if (err) return callback(err);
			callback(null, self);

		});
	}

});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// Collection

exports.Collection = Backbone.Collection.extend({

	compact: function(testFn) {
		if (typeof testFn == 'string') { testFn = function(item) {return item.get(testFn) > 0;}; }
		if (!h.u.isFunction(testFn)) return;
		this.models = h.u.filter( this.models, testFn );
	},

	fetchChildren: function(ctx) {
		async.forEach( this.models, function(model, callback){
			model.fetchChildren(ctx, callback);
		});
	}

});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// Model placeholder (lazy loading)

var Lazy = exports.Lazy = Entity.extend({

	initialize: function(id, ctx) {
		this.id = id;
		this.ctx = ctx; //optional
		this.model = null;
	},

	fetch: function(ctx, callback) {
		var self = this;

		ctx || (ctx = this.ctx);
		if (!ctx) throw Error('Lazy.fetch require ctx for ' + this.className + ' resource');

		//usage: this.rel.user.fetch(ctx, cb);
		ctx.getResourceManager(this.className).get(this.id, function(err, model) {
			if (err) return callback(err);
			self.model = model;
			self.model.fetchChildren(ctx, function() {
				if (err) return callback(err);
				callback(null, self.model);
			});
		});
	},

	toJSON: function() {
		return this.model ? this.model.toJSON() : { id: this.id };
	},

	//use this.rel.aircraft.get('id')
	//toStorageJSON: function() {
	//	return this.id;
	//},

	get: function(key) {
		if (key=='id') return this.id;
		//if (this.model) return this.model.get(key);
	}

});
