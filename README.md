Lazybone
========

- - - - WORK IN PROGRESS! - - -

Model relationship for Backbone.js

```javascript

var Post = Backbone.Model.extend({

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

```javascript

var post = new Post({...});
post.setUser(userObj);

[...]

post.fetchChildren();
post.toJSON();

```
