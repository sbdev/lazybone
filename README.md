Lazybone
========

@@@@@@ BETA! @@@@@@

Model relationship for Backbone.js

```javascript

var User = Backbone.Model.extend({
	urlRoot : '/user'
});
var Post = Backbone.Model.extend({
	urlRoot : '/post',
	rel: ['user']
});

var user = new User({name:'John', phone: '123456'});
user.save(); // assigned ID: 'b1f4f9a523e36fd969f4573e25af4540'

var post = new Post({title:'Hello'});
post.child('user', user);
post.save(); // stores { title: 'Hello', user: 'b1f4f9a523e36fd969f4573e25af4540' }

```

```javascript

var post = new Post({id: '84c48d8e8dae6241ec61766c0e44282e'});
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

post.child('user').toJSON()
/* returns JSON {
	id: 'b1f4f9a523e36fd969f4573e25af4540', 
	name: 'John',
	phone: '123456'
} */

```
