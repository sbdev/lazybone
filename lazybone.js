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

	parse: function( rec, xhr ) {
		// parse/sanitize
		// -  called by constructor if options.parse (when creating object from DB and from user input)
		// -  called on this.update (when updating attributes with an object literal)

		if (!rec.hasOwnProperty('createdAt')) return;

		rec.createdAt = h.u.isString(rec.createdAt) ? new h.Moment(rec.createdAt) : rec.createdAt;

		return rec;
	},

	getChild: function( name ) {
		this.rel || (this.rel={});
		return this.rel[name] || null;
	},

	setChild: function( name, obj ) {
		this.rel || (this.rel={});
		if (typeof obj === 'string' || typeof obj === 'number') {
			obj = new Lazy(obj);
		}
		this.rel[name] = obj;
	},

	fetchChildren: function( options ) {

		var self = this;
		if (!this.rel) return options.success && options.success(self,{});

		ctx || (ctx = this.ctx);
		async.forEach( Object.keys( this.rel ), function(key, cb) {

			if ( self.rel[key] instanceof Lazy ) {

				var options = _.extend({}, options, {
					success: function() { cb(); },
					error: function(err) { cb(err); }
				});

				return self.rel[key].fetch(options);
			}

			return cb();

		}, function(err) {

			if (err) return options.error && options.error(self,{});

			options.success && options.success(self,{});

		});
	}

});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// Collection

exports.Collection = Backbone.Collection.extend({

	fetchChildren: function(ctx) {
		async.forEach( this.models, function(model, callback){
			model.fetchChildren(ctx, callback);
		});
	}

});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// Model placeholder (lazy loading)

Backbone.Model.extend = function(){
	var child = ext.apply(this,arguments);
	child.Lazy.prototype = _.extend(
		{},
		child.Lazy.prototype,
		{Parent: child}
	); 
	return child;
};

var Lazy = exports.Lazy = Backbone.Model.Lazy = function Lazy(id) {
	this.id = id;
	this.ctx = ctx; //optional
	this.model = null;
};

Lazy.prototype = {

	fetch: function(options) {
		var self = this;
		this.model = new this.Parent({id: this.id});
		onSuccess = options.success;
		options = _.extend({}, options, {
			success: function(model){
				var options = _.extend({}, options, {
					success: function() { onSuccess && onSuccess.apply(onSuccess, arguments); }
				});
				model.fetchChildren(options);
			}
		});
		this.model.fetch(options);
	},

	toJSON: function() {
		return this.model ? this.model.toJSON() : { id: this.id };
	},

	get: function(key) {
		if (key=='id') return this.id;
	},

	acquire: function(callback) {
		if (!this.model) return this.fetch({
			success: callback, 
			error: function(err) { callback( new Error(err) ); }
		});
		return this.model;
	}

};
