const min = function (array) {
    return Math.min(...array);
}
const max = function (array) {
    return Math.max(...array);
}
export function Map(canvas, data, properties) {
    let map = {
        draw: function() {
            const { width, height } = properties;
            let centered;
            const interpolators = [
                // These are from d3-scale.
                "Viridis",
                "Inferno",
                "Magma",
                "Plasma",
                "Warm",
                "Cool",
                "Rainbow",
                "CubehelixDefault",
                // These are from d3-scale-chromatic
                "Blues",
                "Greens",
                "Greys",
                "Oranges",
                "Purples",
                "Reds",
                "BuGn",
                "BuPu",
                "GnBu",
                "OrRd",
                "PuBuGn",
                "PuBu",
                "PuRd",
                "RdPu",
                "YlGnBu",
                "YlGn",
                "YlOrBr",
                "YlOrRd"
            ];
            const svg = d3.select(canvas).append('svg')
                            .attr('width', width)
                            .attr('height', height);
            const pathGenerator = d3.geoPath();
            const g = svg.append('g');
            d3.json(data, function(error, il) {
                if(error) { throw error; }

                const tracts = il.features;

                const densities = tracts.map(e => e.properties.density);
                const color = d3.scaleSequential(d3.interpolateBlues).domain([1.0, 30.0]);
                console.log(tracts[10].properties.density)
                g.attr('class', 'tracts')
                    .selectAll('path')
                    .data(tracts).enter()
                    .append('path')
                    .attr('d', pathGenerator)
                    .attr('fill', d => color(d.properties.density % 30))
                    .on('mouseover', doMouseover)
                    .on('mouseout', doMouseout)
                    .on('click', doClicked);
                function doMouseover(d, i) {
                    d3.select(this).classed('selected', true);
                }
                function doMouseout(d, i) {
                    d3.select(this).classed('selected', false);
                }
                function doClicked(d) {
                    let x, y, k;

                    if (d && centered !== d) {
                        let centroid = pathGenerator.centroid(d);
                        x = centroid[0];
                        y = centroid[1];
                        k = 20;
                        centered = d;
                    } else {
                        x = width / 2;
                        y = height / 2;
                        k = 1;
                        centered = null;
                    }

                    g.selectAll('path')
                        .classed('active', centered && (d => d === centered));

                    g.transition()
                        .duration(800)
                        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ') scale(' + k + ') translate(' + -x + ',' + -y + ')')
                        .style('stroke-width', 1.5 / k);
                }
            });
        }
    }
    return map;
}