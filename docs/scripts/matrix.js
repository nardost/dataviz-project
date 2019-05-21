export function Matrix(canvas, data, canvasProperties) {
    let matrix = {

        dispatch: d3.dispatch('cellClicked'),
        
        draw: function(options) {
            const selected = (options.selected != null) ? options.selected.index : null;
            const { width, height, flags} = canvasProperties;
            const margin = { bottom: 10, top: 10, right: 10, left: 10 };
            const w = width - margin.right - margin.left;
            const h = height - margin.bottom - margin.top;
            const svg = d3.select(canvas).attr('width', width).attr('height', height);
            const matrix = [];
            function min(array) {
                return Math.min(...array);
            }
            function max(array) {
                return Math.max(...array);
            }
            d3.json(data, (error, adjacency) => {
                if(error) throw error;
                const nodes = adjacency.nodes;
                const links = adjacency.links;
                const common = links.map(link => link.commonFriends);
                const colorScale = d3.scaleSequential(d3.interpolateReds).domain([min(common), max(common)]);
                const dimension = nodes.length;
                const horizontalLabelHeight = 50;
                const verticalLabelWidth = 50;
                const cellWidth = (w - verticalLabelWidth) / dimension;
                const cellHeight = (h - horizontalLabelHeight) / dimension;

                const chart = svg.append('g').attr('class', 'matrix');
                const labels = svg.append('g').attr('class', 'labels');
                const verticalLabels = labels.append('g').attr('class', 'vertical-label');
                const horizontalLabels = labels.append('g').attr('class', 'horizontal-label');

                nodes.forEach((node, i) => {
                    node.index = i;
                    let r = d3.range(dimension).map(j => ({ x: j, y: i, z: false }) );
                    r.forEach((cell, j) => {
                        matrix[i * dimension + j] = cell;
                    })
                });

                links.forEach((link) => {
                    matrix[link.source * dimension + link.target].commonFriends = link.commonFriends;
                    matrix[link.target * dimension + link.source].commonFriends = link.commonFriends;
                    matrix[link.source * dimension + link.target].z = true;
                    matrix[link.target * dimension + link.source].z = true;
                });
                svg
                  .append("defs")
                  .append("pattern")
                  .attr("id", "refresh")
                  .attr("x", 0)
                  .attr("y", 0)
                  .attr("patternUnits", "objectBoundingBox")
                  .attr("height", 1)
                  .attr("width", 1)
                  .append("image")
                  .attr("xlink:href", "./images/refresh.svg")
                  .attr("height", verticalLabelWidth)
                  .attr("width", horizontalLabelHeight);

                chart.append('g')
                    .selectAll('rect').data(matrix).enter()
                    .append('rect')
                        .attr('class', (d, k) => 'cell r-' + d.y + ' c-' + d.x + ' c-'+ d.y + '-' + d.x)
                        .attr('width', cellWidth)
                        .attr('height', cellHeight)
                        .attr('stroke', 'lightgray')
                        .attr('x', (d, k) => d.x * cellWidth)
                        .attr('y', (d, k) => d.y * cellHeight)
                        .style('fill', cellColor)
                        .on('click', d => cellClicked(this, d));

                svg
                    .append('rect')
                        .attr('class', 'cell-t-l')
                        .attr('stroke', 'lightgray')
                        .attr('x', 0)
                        .attr('y', 0)
                        .style('fill', 'url(#refresh)')
                        .attr('width', verticalLabelWidth)
                        .attr('height', horizontalLabelHeight)
                        .on('click', d => refresh(this));

                verticalLabels
                    .selectAll("rect").data(matrix.filter(cell => cell.x == 0)).enter()
                    .append("rect")
                        .attr("stroke", "lightgray")
                        .attr('id', d => 'row-' + d.y)
                        .attr("x", 0)
                        .attr("y", d => d.y * cellHeight)
                        .attr("width", verticalLabelWidth)
                        .attr("height", cellHeight)
                        .attr("class", "vertical-label-cell")
                        .on('mouseover', d => mouseoverRow(this, d))
                        .on('mouseout', d => mouseoutRow(this, d))
                        .on('click', d => rowClicked(this, d));

                verticalLabels
                    .selectAll('text').data(matrix.filter(cell => cell.x == 0)).enter()
                    .append("text")
                        .attr("class", d => "label r-" + d.y)
                        .attr("x", verticalLabelWidth)
                        .attr("y", d => d.y * cellHeight)
                        .attr("text-anchor", "end")
                        .attr('textLength', verticalLabelWidth)
                        .text((d, i) => nodes[i].name)
                        .attr('transform', d => 'translate(' + (-3) + ' ' + (cellHeight - 3) + ')');

                horizontalLabels
                    .selectAll('rect').data(matrix.filter(cell => cell.y == 0)).enter()
                    .append('rect')
                        .attr('stroke', 'lightgray')
                        .attr('id', d => 'col-' + d.x)
                        .attr('x', d => d.x * cellWidth)
                        .attr('y', 0)
                        .attr('width', cellWidth)
                        .attr('height', horizontalLabelHeight)
                        .attr('class', 'horizontal-label-cell')
                        .on('mouseover', d => mouseoverCol(this, d))
                        .on('mouseout', d => mouseoutCol(this, d))
                        .on('click', d => colClicked(this, d))

                horizontalLabels
                    .selectAll('text').data(matrix.filter(cell => cell.y == 0)).enter()
                    .append('text')
                        .attr('class', d => 'label c-' + d.x)
                        .attr('x', d => d.x * cellWidth)
                        .attr('y', horizontalLabelHeight)
                        .attr('textLength', horizontalLabelHeight)
                        .attr('text-anchor', 'start')
                        .text((d, i) => nodes[i].name)
                        .attr('transform', (d, i) => {
                            return 'rotate(-90 ' + (d.x * cellWidth) + ' ' + (horizontalLabelHeight) + ') translate (' + (3) + ' ' + (cellWidth - 2) + ')';
                        });

                horizontalLabels.attr('transform', 'translate(' + verticalLabelWidth + ' 0)');
                verticalLabels.attr('transform', 'translate(0 ' + horizontalLabelHeight + ')');
                chart.attr('transform', 'translate(' + horizontalLabelHeight + ' ' + verticalLabelWidth + ')')

                function cellColor(d) {
                    if(selected == null) {
                        return (d.z) ? colorScale(d.commonFriends) : 'none';
                    }
                    if(d.x == selected || d.y == selected) return (d.z) ? colorScale(d.commonFriends) : 'darkgray';
                    return (d.z) ? colorScale(d.commonFriends) : 'none';
                }

                function refresh(obj) {
                    obj.dispatch.call('cellClicked', this, null);
                    d3.select(canvas).selectAll('g').remove();
                    obj.draw({selected: null});
                }
                function cellClicked(obj, d) {
                    obj.dispatch.call('cellClicked', this, d)
                }
                function mouseoverRow(obj, d) {
                    verticalLabels.selectAll("#row-" + d.y).classed("row-selected", true);
                    horizontalLabels.selectAll("#col-" + d.y).classed("row-selected", true);
                    verticalLabels.selectAll("text.r-" + d.y).classed("row-selected-txt", true);
                    chart.selectAll('rect.r-'+ d.y).style('fill', 'rgba(70,70,70,.1)');
                    chart.selectAll('rect.c-' + d.y).style('fill', 'rgba(70,70,70,.1)');
                }
                function mouseoutRow(obj, d) {
                    verticalLabels.selectAll("#row-" + d.y).classed("row-selected", false);
                    horizontalLabels.selectAll("#col-" + d.y).classed("row-selected", false);
                    verticalLabels.selectAll("text.r-" + d.y).classed("row-selected-txt", false);
                    chart.selectAll('rect.r-' + d.y).style('fill', cellColor);
                    chart.selectAll('rect.c-' + d.y).style('fill', cellColor);
                }
                function mouseoverCol(obj, d) {
                    horizontalLabels.selectAll("#col-" + d.x).classed("row-selected", true);
                    verticalLabels.selectAll("#row-" + d.x).classed("row-selected", true);
                    horizontalLabels.selectAll("text.c-" + d.x).classed("row-selected-txt", true);
                    chart.selectAll('rect.r-' + d.x).style('fill', 'rgba(70,70,70,.1)');
                    chart.selectAll('rect.c-' + d.x).style('fill', 'rgba(70,70,70,.1)');
                }
                function mouseoutCol(obj, d) {
                    horizontalLabels.selectAll("#col-" + d.x).classed("row-selected", false);

                    verticalLabels.selectAll("#row-" + d.x).classed("row-selected", false);
                    horizontalLabels.selectAll("text.c-" + d.x).classed("row-selected-txt", false);

                    chart.selectAll('rect.r-' + d.x).style('fill', cellColor);
                    chart.selectAll('rect.c-' + d.x).style('fill', cellColor);
                }
                function rowClicked(obj, d) {
                    obj.dispatch.call('cellClicked', this, d.y)
                }

                function colClicked(obj, d) {
                    obj.dispatch.call("cellClicked", this, d.x);
                }
            });
        }
    }
    return matrix;
}