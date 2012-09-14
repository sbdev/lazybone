Lazybone
========

@@@@@@ WORK IN PROGRESS! @@@@@@

Model relationship for Backbone.js

```javascript

var User = Backbone.Model.extend({});
var Post = Backbone.Model.extend({});

var user = new User({name:'John', phone: '123456'});

var post = new Post({title:'Hello'});
post.addChild('user', user);
post.save(); // stores JSON { title: 'Hello', user: 'b1f4f9a523e36fd969f4573e25af4540' }

```

```javascript

var post = new Post({id:'someid'});
post.fetch();
post.toJSON(); // returns JSON { id: '...', title: 'Hello', user: { id: 'b1f4f9a523e36fd969f4573e25af4540' } }

post.fetchChildren();
post.toJSON(); // returns JSON { id: '...', title: 'Hello', user: { id: 'b1f4f9a523e36fd969f4573e25af4540', name: 'John', phone: '123456' } }

```
