

(function( Backbone, _ ) {

	var root = this; //window

	var Model = Backbone.Model.extend({

		toPlain: function() {
			return this.toJSON( {expand: true} );
		},

		toJSON: function( plain ) {

			var attrs = _.clone(this.attributes);
			var rel = this.child();
			Object.keys( rel  ).forEach( function(key) {
				attrs[key] = plain ? rel[key].toPlain() : rel[key].toJSON();
			});

			return attrs;
		},
		
		parse: function( rec, xhr ) {
			// parse/sanitize
			rec || (rec={});
			this.rel || (this.rel=[]);

			// require MyClass = LazyBone.extend({... rel:['user','category'] })
			this.rel.forEach( function(key) {
				if (!rec.hasOwnProperty(key)) return;
				self.child(rec[key]);
				rec[key] = self.getChild(key);
			});

			return rec;
		},

		child: function( name, obj ) {

			// getter/setter/getAll
			this._rel || (this._rel={});

			if (!arguments.length) return this._rel;
			if (arguments.length === 2) return (this._rel[name] = new Model.Lazy(obj));

			// if model has been fetched return it otherwise return Lazy instance
			if (this._rel[name]) return this._rel[name].model || this._rel[name];
			return null;
		},

		fetchChildren: function( options ) {

			var self = this;

			var done = function(err) {

				if (err) return options.error && options.error(self,{});

				options.success && options.success();

			};

			if (!this._rel) return done();

			var allRels = Object.keys( this._rel );

			var fetchNext = function() {

				if (!allRels.length) return done();
				var key = allRels.shift();
				var child = self.child(key);

				if ( child instanceof Model.Lazy ) {

					var options = _.extend({}, options, {
						success: function() { fetchNext(); },
						error: function(err) { done(err); }
					});

					return child.fetch(options);
				}

				return fetchNext();

			};

			fetchNext();

		}

	});

	// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
	// Collection

	var Collection = Backbone.Collection.extend({

		fetchChildren: function(options) {

			var self = this;

			var done = function(err) {

				if (err) return options.error && options.error(self,{});

				options.success && options.success();

			};

			if (!this.models || !this.models.length) return done();

			//shallow copy
			var allModels = this.models.slice();

			var fetchNext = function() {

				if (!allModels.length) return done();
				var model = allModels.shift();

				var options = _.extend({}, options, {
					success: function() { fetchNext(); },
					error: function(err) { done(err); }
				});

				model.fetchChildren( options );

				return fetchNext();

			};

			fetchNext();

		}

	});

	// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
	// Model placeholder (lazy loading)

	Model.Lazy = function Lazy( idModel ) {

		if (typeof idModel === 'string' || typeof idModel === 'number') {
			this.id = idModel;
			this.model = null;
			return;
		}

		this.id = idModel.get('id');
		this.model = idModel;
	};

	Model.Lazy.prototype = {

		fetch: function(options) {
			var self = this;
			this.model = new this.Parent({id: this.id}); //TODO:
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

		toPlain: function() {
			return this.model ? this.model.toJSON() : { id: this.id };
		},

		toJSON: function() {
			return this.id;
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

	root.LazyBone = {
		Model: Model,
		Collection: Collection
	};

})( Backbone, _ );
