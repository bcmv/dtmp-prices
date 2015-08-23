var Shopify = require('shopify-node');

var shopify = new Shopify({
    shop_name: 'detempo',
    id: 'c8eaabcbdb0798a70b3d9913f822af0d',
    secret: 'aab5fb8bea557ab56bc123eb3b0cd781',
    redirect: 'http://localhost:9000/#/oauth',
    access_token:'eae2415087ca3b9ed4e2d756e45ac272'
});
shopify.get('/admin/orders.json', function(err, resp) {
  if(err) {
    return console.log(err);
  }
  console.log(resp);
});