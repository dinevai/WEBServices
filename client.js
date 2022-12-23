var soap = require('soap');
var url = 'http://localhost:5000/wsdl?wsdl';

soap.createClient(url, function (err, client) {
  if (err){
    throw err;
  }

  var args = {
    message: "id1:12:34:56:out42",
    splitter: ":"
  };

  client.MessageSplitter(args, function (err, res) {
    if (err)
      throw err;
    console.log(res); 
  });
});