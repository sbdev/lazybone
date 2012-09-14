Lazybone
========

@@@@@@ WORK IN PROGRESS! @@@@@@

Model relationship for Backbone.js

```javascript

var User = Backbone.Model.extend({});
var Post = Backbone.Model.extend({});

var user = new User({name:'John', id: '123456'});

var post = new Post({id:'98765'});
post.addChild('user', user);
post.save(); // stores JSON { id: '98765', user: '123456' }

```

```javascript

var post = new Post({id:'someid'});
post.fetch();
post.toJSON(); // returns JSON { id: '98765', user: {id: '123456' } }

post.fetchChildren();
post.toJSON(); // returns JSON { id: '98765', user: {id: '123456', name: 'John'} }

```
