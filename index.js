const express = require('express');
const app = express();
var cors = require('cors')
const port = process.env.PORT || 5000;
const datas = require('./data/datas.json');


app.use(cors());
app.get('/', (req, res) => {
    res.send('Server is running........')
});










app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})