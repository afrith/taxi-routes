var express = require('express');
var pgclient = require('connect-pgclient');

var app = express();
app.use(express.static('static'));

var connectDb = pgclient({
  config: {
    database: 'taxis'
  }
});

app.get('/point/:z/:x/:y', connectDb, function (req, res, next) {
  var x = +req.params.x,
    y = +req.params.y,
    z = +req.params.z;

  var bufx = 3 * 360 / Math.pow(2, z + 8),
    bufy = 3 * 170.1022 / Math.pow(2, z + 8);

  var xmin = x - bufx,
    xmax = x + bufx,
    ymin = y - bufy,
    ymax = y + bufy;

  var query = 'SELECT id, name, orgn, dstn FROM route WHERE ST_Intersects(geom, ST_SetSRID(ST_MakeBox2D(ST_Point($1, $2), ST_Point($3, $4)), 4326)) ORDER BY name;';
  req.db.client.query(query, [xmin, ymin, xmax, ymax], function (err, result) {
    if (err) {
      res.status(500).send('Internal server error');
      console.log('PG error:', err);
      return;
    }
    
    res.status(200).json({routes: result.rows}).end();
  });
});

app.listen(3000, function () {
  console.log('Listening on port 3000.');
});
