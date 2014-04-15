(function() {

// Chart design based on the recommendations of Stephen Few. Implementation
// based on the work of Clint Ivy, Jamie Love, and Jason Davies.
// http://projects.instantcognition.com/protovis/bulletchart/
d3.bullet = function() {
  var duration = 0,
      ranges = bulletRanges,
      markers = bulletMarkers,
      measures = bulletMeasures,
      width = 380,
      height = 30,
      scaleTop = 5,
      tickFormat = null;
      plotTick = false;

  // For each small multiple…
  function bullet(g) {
    g.each(function(d, i) {
      var rangez = ranges.call(this, d, i).slice().sort(d3.descending),
          markerz = markers.call(this, d, i).slice().sort(d3.descending),
          measurez = measures.call(this, d, i).slice().sort(d3.descending),
          g = d3.select(this);

      var bar = d3.scale.linear()
          .domain([0, scaleTop])
          .range([0, width]);
      
//      var bg = g.append("rect")
//          .attr("class", "bg")
//          .attr("x", 0)
//          .attr("width", width)
//          .attr("height", height);
      
      // Update the range rects.
      var range = g.selectAll("rect.range")
          .data(rangez)
          .enter().append("rect")
		      .attr("class", function(d, i) { return "range r" + i; })
		      .attr("height", height)
		      .attr("width", 0)
		      .attr("x", 0);
		      
      g.selectAll("rect.range")
        .data(rangez)
        .transition()
      	  .duration(duration)
      	  .attr("width", function(d){return bar(d);});

      // Update the measure rects.
      var measure = g.selectAll("rect.measure")
          .data(measurez)
          .enter().append("rect")
          	.attr("class", function(d, i){return "measure m" + i;})
          	.attr("height", height / 3)
          	.attr("width", 0)
          	.attr("x", 0)
          	.attr("y", height / 3);
      
      g.selectAll("rect.measure")
        .data(measurez)
        .transition()
          .duration(duration)
          .attr("width", function(d){return bar(d);});
      
      
      // Update the marker lines.
      var marker = g.selectAll("line.marker")
      	.data(markerz)
        .enter().append("line")
	      .attr("class", "marker")
	      .attr("y1", height / 6)
	      .attr("y2", height * 5 / 6);
      
      g.selectAll("line.marker")
        .data(markerz)
        .transition()
	      .duration(duration)
	      .attr("x1", function(d){return bar(d);})
	      .attr("x2", function(d){return bar(d);});

      if(plotTick){
	      // Compute the tick format.
	      var format = tickFormat || bar.tickFormat(scaleTop);
	
	      // Update the tick groups.
	      var tick = g.selectAll("g.tick")
	          .data(bar.ticks(scaleTop), function(d) {
	            return this.textContent || format(d);
	          });
	
	      // Transition the updating ticks to the new scale, x1.
	      var tickUpdate = tick.transition()
	          .duration(duration)
	          .attr("transform", bulletTranslate(bar))
	          .style("opacity", 1);
	
	      tickUpdate.select("line")
	          .attr("y1", height)
	          .attr("y2", height * 7 / 6);
	
	      tickUpdate.select("text")
	          .attr("y", height * 7 / 6);
      }
    });
    d3.timer.flush();
  }

  // ranges (bad, satisfactory, good)
  bullet.ranges = function(x) {
    if (!arguments.length) return ranges;
    ranges = x;
    return bullet;
  };

  // markers (previous, goal)
  bullet.markers = function(x) {
    if (!arguments.length) return markers;
    markers = x;
    return bullet;
  };

  // measures (actual, forecast)
  bullet.measures = function(x) {
    if (!arguments.length) return measures;
    measures = x;
    return bullet;
  };

  bullet.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return bullet;
  };

  bullet.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return bullet;
  };

  bullet.plotTick = function(x) {
	  if (!arguments.length) return plotTick;
	  plotTick = x;
	  return bullet;
  };
  
  bullet.tickFormat = function(x) {
    if (!arguments.length) return tickFormat;
    tickFormat = x;
    return bullet;
  };

  bullet.duration = function(x) {
    if (!arguments.length) return duration;
    duration = x;
    return bullet;
  };
  
  bullet.scale = function(x) {
    if (!arguments.length) return scaleTop;
    scaleTop = x;
    return bullet;
  };

  return bullet;
};

function bulletRanges(d) {
  return d.ranges;
}

function bulletMarkers(d) {
  return d.markers;
}

function bulletMeasures(d) {
  return d.measures;
}

function bulletTranslate(x) {
  return function(d) {
    return "translate(" + x(d) + ",0)";
  };
}

function bulletWidth(x) {
  var x0 = x(0);
  return function(d) {
    return Math.abs(x(d) - x0);
  };
}

})();
