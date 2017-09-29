const express = require('express');
const app = express();

app.use(express.static('public'));
app.get('/', function (req, res) {
  res.render('index');
})

app.listen(process.env.PORT || 3000, function () {
  console.log('IcoWall running on port 3000!');
})