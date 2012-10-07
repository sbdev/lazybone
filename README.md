Lazybone
========

@@@@@@ BETA! @@@@@@

Model relationship for Backbone.js

```javascript

var User = Backbone.Model.extend({});
var Post = Backbone.Model.extend({
	rel: ['user']
});

var user = new User({name:'John', phone: '123456'});
user.save(); // assigned ID: 'b1f4f9a523e36fd969f4573e25af4540'

var post = new Post({title:'Hello'});
post.child('user', user);
post.save(); // stores { title: 'Hello', user: 'b1f4f9a523e36fd969f4573e25af4540' }

```

```javascript

var post = new Post({url: 'http://api.foo.com/post/84c48d8e8dae6241ec61766c0e44282e'});
post.fetch();
post.toJSON();
/* returns JSON {
	id: '84c48d8e8dae6241ec61766c0e44282e', 
	title: 'Hello', 
	user: 'b1f4f9a523e36fd969f4573e25af4540'
} */

post.toJSON({expand: true});
/* returns JSON {
	id: '84c48d8e8dae6241ec61766c0e44282e', 
	title: 'Hello', 
	user: {
		id: 'b1f4f9a523e36fd969f4573e25af4540'
	}
} */

post.fetchChildren();
post.toJSON({expand: true});
/* returns JSON {
	id: '84c48d8e8dae6241ec61766c0e44282e', 
	title: 'Hello', 
	user: {
		id: 'b1f4f9a523e36fd969f4573e25af4540',
		name: 'John',
		phone: '123456'
	}
} */

```
