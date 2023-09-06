const express = require('express');
const app = express();
var cors = require('cors')
const port = process.env.PORT || 5000;
const datas = require('./data/rooms.json');

app.use(cors());
app.get('/', (req, res) => {
    res.send('Server is running........')
});


app.get('/rooms', (req, res) => {
    res.send(datas);
})



app.get('/rooms/:id', (req, res) => {
    const {id} = req.params;
    const selectedData = datas.find(n => n.id ==id) || {} ;
    res.send(selectedData);
})








app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})