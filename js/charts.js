var id = 0;
function barChart(div){
	var _id = id++;
	var chart = {};
	
	var width = 300,
		height = 150,
		margin = {left:10, top:0, right:0, bottom:0},
		aspectRatio = .4,
		thickness = 20,
		labelWidth = 80,
		name = null,
		data = [],
		bar = null,
		pos = null,
		color = null,
		formatText = d3.format("");
	
	var svg = d3.select("#"+div).append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	function setBoundaries(w, h){
		width = w * aspectRatio;

		pos.rangeRoundBands([0, height], .5, .7);
		bar.range([0, width - labelWidth - margin.left - margin.right]);

		svg.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	};
	
	chart.render = function(){
		var rectData = svg.selectAll(".bar").data(data);
		var labelData = svg.selectAll(".label").data(data);
		var textData = svg.selectAll(".textbar").data(data);
		
		setBoundaries(window.w, window.h);
		
		// Build skeleton for current data
		rectData.enter().append("rect")
			.attr("class", "bar")
			.attr("x", labelWidth)
			.attr("y", function(d, i){return i * pos.rangeBand();})
			.attr("width", 0)
			.attr("height", thickness);

		labelData.enter().append("text")
			.attr("class", "label")
			.attr("x", 0)
			.attr("y", function(d, i){return i * pos.rangeBand();})
			.attr("dy", 15)
			.style("fill", "white")
			.style("font-weight", "bold")
			.style("opacity", 0)
			.text(function(d){return d.key;});

		textData.enter().append("text")
			.attr("class", "textbar")
			.attr("x", 0)
			.attr("y", function(d, i){return i * pos.rangeBand();})
			.attr("dy", 15)
			.style("fill", "white")
			.style("opacity", 0)
			.style("font-weight", "bold");
		
		rectData.exit().remove();
		labelData.exit().remove();
		textData.exit().remove();
		
		// Update values
		if(!data || !data.length){
//			svg.selectAll(".bar").transition()
//			.duration(duration)
//			.attr("width", 0);

//			svg.selectAll(".label").style("opacity", 0);
//
//			svg.selectAll(".textbar").style("opacity", 0);

			data = [];
			
			error = {name: "warning", message: "No data"};
			console.warn(error.message);
			return error;
		}
		
		svg.selectAll(".bar").transition()
			.duration(duration)
			.attr("width", function(d){ return bar(d.value); })
			.style("fill", function(d, i){ return color(i); });

		svg.selectAll(".label").style("opacity", 1);

		svg.selectAll(".textbar").transition()
			.duration(duration)
			.text(function(d){ return formatText(d.value); })
			.attr("x", function(d){ return bar(d.value) + labelWidth + 10; })
			.style("text-align", "center")
			.style("opacity", 1)
			.style("fill", "#777");
	};
	
	/**
	 * Set chart's data
	 * @param _data an array of {key, value} pairs
	 * @returns the data object if no arguments are provided, the chart otherwise
	 */
	chart.data = function(_data){
		if(!arguments.length)
			return data;
		data = _data;
		return chart;
	};
	
	/**
	 * Set chart's name
	 * @param _bar An identifier for the chart
	 * @returns the name if no arguments are provided, the chart otherwise
	 */
	chart.name = function(_name){
		if(!arguments.length)
			return name;
		name = _name;
		return chart;
	};
	
	/**
	 * Set horizontal scaler
	 * @param _bar A d3.scale object
	 * @returns d3.scale if no arguments are provided, the chart otherwise
	 */
	chart.bar = function(_bar){
		if(!arguments.length)
			return bar;
		bar = _bar;
		return chart;
	};
	
	/**
	 * Set vertical scaler
	 * @param _bar A d3.scale object
	 * @returns d3.scale if no arguments are provided, the chart otherwise
	 */
	chart.pos = function(_pos){
		if(!arguments.length)
			return pos;
		pos = _pos;
		return chart;
	};
	
	/**
	 * Set the thickness of the bars
	 * @param _bar An integer value
	 * @returns the actual thickness if no arguments are provided, the chart otherwise
	 */
	chart.thickness = function(_thickness){
		if(!arguments.length)
			return thickness;
		thickness = _thickness;
		return chart;
	};
	/**
	 * Set the formatter for the text appearing after the values in the chart
	 * @param _bar A d3.format object
	 * @returns d3.format if no arguments are provided, the chart otherwise
	 */
	chart.formatText = function(_format){
		if(!arguments.length)
			return formatText;
		formatText = _format;
		return chart;
	};
	
	/**
	 * Set the formatter for the text appearing after the values in the chart
	 * @param _bar A d3.color object
	 * @returns d3.color if no arguments are provided, the chart otherwise
	 */
	chart.color = function(_color){
		if(!arguments.length)
			return color;
		color = _color;
		return chart;
	};
	
	chart.id = function(){
		return _id;
	};
	
	chart.width = function(_width){
		if(!arguments.length)
			return width;
		width = _width;
		return chart;
	};
	
	chart.height = function(_height){
		if(!arguments.length)
			return height;
		height = _height;
		return chart;
	};
	
	return chart;
}

function bulletChart(divname){
	var chart = {};
	
	var width = 80,
		height = 250,
		margin = {top:30, right:10, bottom:10, left:10};
	
	var keys = ["flavour", "freshness", "temperature", "service"],
		thickness = 20,
		length = 250,
		vertical = false,
		plotTick = true,
		data = null,
		div = d3.select("#"+divname);

	var bar = d3.scale.linear()
        .domain([0, 5])
        .range([0, length]);
	
	var svg = div.selectAll("svg")
		.data(keys)
		.enter().append("svg")
			.attr("class", "bullet")
			.attr("width", vertical ? width + margin.left + margin.right : 400)
			.attr("height", vertical ? height + margin.top + margin.bottom: 80)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var title = svg.append("g")
		.attr("transform", function(){ var x=0, y=0;
				x = vertical ? 0 : 0;
				y = vertical ? height : -10;
				return "translate(" + x + "," + y + ")";
			})
		.append("text")
			.attr("class", "title")
			.attr("x", 0)
			.attr("opacity", 0)
			.text(function(d){ return d.capitalize(); });
	
	var tick = null;
	
	if(plotTick){
	      // Compute the tick format.
	      var format = bar.tickFormat(5);
	
	      // Update the tick groups.
	      tick = svg.selectAll("tick")
		      .data(bar.ticks(5), function(d){ return format(d); })
		      .enter().append("g")
		      .attr("transform", function(d){ 
		    	  var x = vertical ? 7 : bar(d);
		    	  var y = vertical ? bar(d) : 7;
		    	  return "translate(" + x + "," + y + ")";
		    	  })
		      .attr("class", "tick")
		      .style("opacity", 0);
	      
	      tick.append("line")
	      	.attr(vertical ? "x1" : "y1", thickness)
	      	.attr(vertical ? "x2" : "y2", thickness / 7 * 6);
	      
	      tick.append("text")
	      	.attr(vertical ? "dx" : "dy", 5)
	      	.attr(vertical ? "x" : "y", thickness * 7 / 6)
	      	.style("text-anchor", "middle")
	      	.text(function(d, i){ return i; });
      }
	
	chart.render = function(){
		if(!data){
			div.transition()
				.duration(100)
				.style("opacity", 0);
			return;
		} else {
			div.transition()
				.duration(100)
				.style("opacity", 1);
		}
		
		d3.keys(data).forEach(function(k){
			// Adds the top value for the sentiment analisys to be consistent 
//			var topValue = 5;
			var bullet = data[k].bullet;
			console.log(bullet);	//FIXME: debug
//			bullet.ranges.push(topValue);
			
			// Import data and sort it to properly display each layer
			// otherwise the biggest rect will cover the smallest in the DOM
			var rangez = bullet.ranges.sort(d3.descending);
			var measurez = bullet.measures.sort(d3.descending);
			var markerz = bullet.markers.sort(d3.descending);
			
			// Update the range rects.
			var range = svg.selectAll("rect.range");

			range.data(rangez)
				.enter().append("rect")
				.attr("class", function(d, i) { return "range r" + i; })
				.attr("height", vertical ? 0 : thickness)
				.attr("width", vertical ? thickness : 0)
				.attr("x", 0)
				.attr("y", vertical ? length : 0);

			range.data(rangez)
				.transition()
				.duration(duration)
				.attr(vertical ? "height" : "width", function(d){return bar(d);})
				.attr("y", vertical ? function(d){ return length - bar(d); } : 0);


			// Update the measure rects.
			var measure = svg.selectAll("rect.measure");

			measure.data(measurez)
				.enter().append("rect")
				.attr("class", function(d, i){ return "measure m" + i; })
				.attr("height", vertical ? 0 : thickness / 3)
				.attr("width", vertical ? thickness / 3 : 0)
				.attr("x", vertical ? thickness / 3 : 0)
				.attr("y", vertical ? length : thickness / 3);

			measure.data(measurez)
				.transition()
				.duration(duration)
				.attr(vertical ? "height" : "width", function(d){ return bar(d); })
				.attr("y", vertical ? function(d){ return length - bar(d); } : thickness / 3);

			
			// Update the marker lines.
			var marker = svg.selectAll("line.marker");

			marker.data(markerz)
				.enter().append("line")
				.attr("class", "marker")
				.attr(vertical ? "x1" : "y1", thickness / 6)
				.attr(vertical ? "x2" : "y2", thickness * 5 / 6);

			marker.data(markerz)
				.transition()
				.duration(duration)
				.attr(vertical ? "y1" : "x1", function(d){ return bar(d); })
				.attr(vertical ? "y2" : "x2", function(d){ return bar(d); });

			
			title.transition()
				.duration(duration)
				.attr("opacity", 1);
		});

		if(plotTick){
			// Transition the updating ticks to the new scale, x1.
			tick.transition()
				.duration(duration + 100)
				.style("opacity", 1);
		}
	};
	
	chart.data = function(_data){
		if(!arguments.length)
			return data;
		
		data = _data;
		return chart;
	};
	
	chart.thickness = function(_thickness){
		if(!arguments.length)
			return thickness;
		
		thickness = _thickness;
		return chart;
	};

	chart.length = function(_length){
		if(!arguments.length)
			return length;
		
		length = _length;
		return chart;
	};
	
	chart.vertical = function(_bool){
		if(!arguments.length)
			return vertical;
		
		vertical = _bool;
		return chart;
	};
	
	chart.plotTick = function(_bool){
		if(!arguments.length)
			return plotTick;
		
		plotTick = _bool;
		return chart;
	};
	
	return chart;
}

function lineChart(divName){
	var chart = {};
	
	var width = 800,
		height = 300,
		margin = {left:40, top:25, right:40, bottom:25},
		thickness = 1.5,
		name = null,
		color = "#fff";
		data = [],
		xAxisLabel = [],
		yAxisLabel = [],
		getX = function(d){ return d.key; },
		getY = function(d){ return d.value; },
		formatText = d3.format("");
	
	var x = d3.time.scale()
		.range([0, width]);
	
	var y = d3.scale.linear()
		.range([height, 0]);
	
	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.ticks(d3.time.month, 3)
		.tickFormat(d3.time.format("%b %Y"))
		.tickPadding(8);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
	
	var svg = d3.select("#"+divName).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	var line = d3.svg.line()
		.interpolate("monotone")
		.x(function(d){ return x(getX(d)); })
		.y(function(d){ return y(getY(d)); });
	
	function initAxis(){
		// Build skeleton
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.data(xAxisLabel)
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text(function(d){ return d; });

		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.data(yAxisLabel)
	//		.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text(function(d){ return d; });
		
		svg.append("path")
			.attr("class", "line")
			.style("stroke-width", thickness + "px")
			.style("stroke", color);
	}
	
	chart.render = function(){
		// Update data
		if(!data || !data.length){
			svg.selectAll(".line").transition()
			.duration(duration)
			.style("opacity", 0);
			
			error = {name: "warning", message: "No data"};
			console.warn(error.message);
			return error;
		}

		x.domain(d3.extent(data, getX));
		y.domain([0, 5]);
		
		svg.select(".x.axis").call(xAxis);
		svg.select(".y.axis").call(yAxis);
		
		svg.select(".line").data([data])
			.transition()
			.duration(duration)
			.attr("d", line);

		return chart;
	};
	
	/**
	 * Set chart's data
	 * @param _data an array of {key, value} pairs
	 * @returns the data object if no arguments are provided, the chart otherwise
	 */
	chart.data = function(_data){
		if(!arguments.length)
			return data;
		data = _data;
		return chart;
	};
	
	/**
	 * Set chart's name
	 * @param _bar An identifier for the chart
	 * @returns the name if no arguments are provided, the chart otherwise
	 */
	chart.name = function(_name){
		if(!arguments.length)
			return name;
		name = _name;
		return chart;
	};
	
	/**
	 * Set the accessor function invoked to retrieve
	 * the x component to plot the line.
	 * By deafult the identity function is used.
	 * 
	 * @param _x Accessor function
	 * @returns the chart
	 */
	chart.x = function(_x){
		if(!arguments.length)
			return;
		getX = _x;
		line.x(function(d){ return x(_x(d)); });
		return chart;
	};
	
	/**
	 * Set the accessor function invoked to retrieve
	 * the y component to plot the line.
	 * 
	 * @param _y Accessor function
	 * @returns the chart
	 */
	chart.y = function(_y){
		if(!arguments.length)
			return;
		getY = _y;
		line.y(function(d){/*console.log(d); console.log("d = " + d.value.rank + "| y(d) = " + y(_y(d)));*/ return y(_y(d)); });
		return chart;
	};
	
	/**
	 * Set horizontal text axis
	 * @param _bar A d3.scale object
	 * @returns d3.scale if no arguments are provided, the chart otherwise
	 */
	chart.xAxis = function(_xAxis){
		if(!arguments.length)
			return xAxis;
		xAxis = _xAxis;
		return chart;
	};
	
	/**
	 * Set vertical text axis
	 * @param _bar A d3.scale object
	 * @returns d3.scale if no arguments are provided, the chart otherwise
	 */
	chart.yAxis = function(_yAxis){
		if(!arguments.length)
			return yAxis;
		yAxis = _yAxis;
		return chart;
	};
	
	/**
	 * Set the thickness of the bars
	 * @param _bar An integer value
	 * @returns the actual thickness if no arguments are provided, the chart otherwise
	 */
	chart.thickness = function(_thickness){
		if(!arguments.length)
			return thickness;
		thickness = _thickness;
		return chart;
	};
	
	
	/**
	 * Set the formatter for the text appearing after the values in the chart
	 * @param _bar A d3.format object
	 * @returns d3.format if no arguments are provided, the chart otherwise
	 */
	chart.formatText = function(_format){
		if(!arguments.length)
			return formatText;
		formatText = _format;
		return chart;
	};
	
	/**
	 * Set the formatter for the text appearing after the values in the chart
	 * @param _bar A d3.color object
	 * @returns d3.color if no arguments are provided, the chart otherwise
	 */
	chart.color = function(_color){
		if(!arguments.length)
			return color;
		color = _color;
		return chart;
	};
	
	chart.width = function(_width){
		if(!arguments.length)
			return width;
		width = _width;
		return chart;
	};
	
	chart.height = function(_height){
		if(!arguments.length)
			return height;
		height = _height;
		return chart;
	};
	
	initAxis();
	
	return chart;
}