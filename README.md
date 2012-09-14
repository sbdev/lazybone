Lazybone
========

@@@@@@ WORK IN PROGRESS! @@@@@@

Model relationship for Backbone.js

```javascript

var User = Backbone.Model.extend({});
var lazy = {
	User: Backbone.Lazy.extend({})
}

var Post = Backbone.Model.extend({

	parse: function(attrs, xhr) {

		if (typeof attrs.user === 'string') this.relationship( 'user', new lazy.User(attrs.user) );

		return attrs;
	},

	toJSON: function() {
		return _.extend( _.clone(this.attributes), {
			user: this.relationship( 'user' ).toJSON(),
		});
	}

});

```

```javascript

var post = new Post({id:'someid'});
post.fetch();
post.toJSON(); // user id only

post.fetchChildren();
post.toJSON(); // full User object

```
