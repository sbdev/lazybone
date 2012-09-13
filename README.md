lazybone
========

Model relationship for Backbone.js


``` javascript

var MyClass = Backbone.Model.extend({

	setUser: function(user) {
		this.relationship('user', user);
	},

	toJSON: function() {
		return _.extend( _.clone(this.attributes), {
			user: this.rel.user.toJSON(),
		});
	}

});

```
