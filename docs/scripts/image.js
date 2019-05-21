export function Image(canvas, person, properties) {
    let image = {
        draw: function() {
            const { width, height } = properties;
            const images = {'nardos': './images/1.png', 'yanning': '2.png', 'mouhamad': '3.png' };
            const svg = d3.select(canvas).append('svg')
                .attr('width', width)
                .attr('height', height);
            console.log(images[person])
            svg
                .append("defs")
                .append("pattern")
                .attr("id", person)
                .attr("x", 0)
                .attr("y", 0)
                .attr("patternUnits", "objectBoundingBox")
                .attr("height", 1)
                .attr("width", 1)
                .append("image")
                .attr("xlink:href", images[person])
                .attr("height", height)
                .attr("width", width);
            svg.append('rect')
                    .attr('width', width)
                    .attr('height', height)
                    .attr('x', 0)
                    .attr('y', 0)
                    .style('fill', person);
        }
    }
    return image;
}