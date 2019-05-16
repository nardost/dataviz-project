curl 'http://www2.census.gov/geo/tiger/GENZ2014/shp/cb_2014_06_tract_500k.zip' -o cb_2014_06_tract_500k.zip
unzip -o cb_2014_06_tract_500k.zip
npm install -g shapefile
shp2json cb_2014_06_tract_500k.shp -o ca.json
npm install -g d3-geo-projection
geoproject 'd3.geoConicEqualArea().parallels([34, 40.5]).rotate([120, 0]).fitSize([960, 960], d)' < ca.json > ca-albers.json
geo2svg -w 960 -h 960 < ca-albers.json > ca-albers.svg
npm install -g ndjson-cli
ndjson-split 'd.features' \
  < ca-albers.json \
  > ca-albers.ndjson
ndjson-map 'd.id = d.properties.GEOID.slice(2), d' \
  < ca-albers.ndjson \
  > ca-albers-id.ndjson
curl 'http://api.census.gov/data/2014/acs5?get=B01003_001E&for=tract:*&in=state:06' -o cb_2014_06_tract_B01003.json
ndjson-cat cb_2014_06_tract_B01003.json \
  | ndjson-split 'd.slice(1)' \
  | ndjson-map '{id: d[2] + d[3], B01003: +d[0]}' \
  > cb_2014_06_tract_B01003.ndjson
ndjson-join 'd.id' \
  ca-albers-id.ndjson \
  cb_2014_06_tract_B01003.ndjson \
  > ca-albers-join.ndjson
ndjson-map 'd[0].properties = {density: Math.floor(d[1].B01003 / d[0].properties.ALAND * 2589975.2356)}, d[0]' \
  < ca-albers-join.ndjson \
  > ca-albers-density.ndjson
ndjson-reduce \
  < ca-albers-density.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > ca-albers-density.json
ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' \
  < ca-albers-density.ndjson \
  > ca-albers-density.json
npm install -g d3
ndjson-map -r d3 \
  '(d.properties.fill = d3.scaleSequential(d3.interpolateViridis).domain([0, 4000])(d.properties.density), d)' \
  < ca-albers-density.ndjson \
  > ca-albers-color.ndjson
geo2svg -n --stroke none -p 1 -w 960 -h 960 \
  < ca-albers-color.ndjson \
  > ca-albers-color.svg
