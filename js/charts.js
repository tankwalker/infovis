var id = 0;
function barChart(div){
	var _id = id++;
	var chart = {};
	
	var width = 256,
		height = 86,
		margin = {left:10, top:0, right:0, bottom:0},
		thickness = 8,
		labelWidth = 80,
		name = null,
		data = [],
		bar = null,
		pos = null,
		color = null,
		formatText = d3.format(""),
		callback = function(d, c){ return; };
	
	pos = d3.scale.ordinal()
		.rangeRoundBands([0, height], .1, .2);
		
	var svg = d3.select("#"+div).append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	function setBoundaries() {
		width = window.w * .25;
		height = width / 3;

		svg.attr("width", width)
			.attr("height", height)
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	};
	
	chart.render = function(){
		var rectData = svg.selectAll(".bar").data(data);
		var labelData = svg.selectAll(".label").data(data);
		var textData = svg.selectAll(".textbar").data(data);

		pos.domain(data.map(function(d){ return d.key; }));
		
		bar.range([0, width]);
		
		// Build skeleton for current data
		rectData.enter().append("rect")
			.attr("class", "bar")
			.attr("x", labelWidth)
			.attr("y", function(d){return pos(d.key);})
			.attr("width", 0)
			.attr("height", thickness)
			.on("mouseover", function(d){ callback(d.key, this); })
			.on("mouseout", function(d){ callback(null, this); });

		labelData.enter().append("text")
			.attr("class", "label")
			.attr("x", 0)
			.attr("y", function(d){return pos(d.key);})
			.attr("dy", 10)
			.style("fill", "white")
			.style("font-weight", "bold")
			.style("opacity", 0)
			.text(function(d){return d.key;});

		textData.enter().append("text")
			.attr("class", "textbar")
			.attr("x", 0)
			.attr("y", function(d){return pos(d.key);})
			.attr("dy", 10)
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
			.attr("width", function(d){ return bar(d.value); });
//			.attr("fill", function(d, i){ return color(i); });

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
	
	chart.callback = function(_call){
		if(!arguments.length)
			return;
		callback = _call;
		return chart;
	};
	
	return chart;
}

function verticalBarChart(div){
	var _id = id++;
	var chart = {};
	
	var width = 256,
		height = 120,
		margin = {left:20, top:10, right:10, bottom:50},
		thickness = 12,
		name = null,
		data = [],
		bar = null,
		pos = null,
		color = null,
		formatText = d3.format(""),
		callback = function(d, c){ return; };
	
	pos = d3.scale.ordinal()
		.domain([0, 10])
		.rangeRoundBands([0, width], .1, .2);
	
	bar = d3.scale.linear()
		.domain([0, 100]);
	
	var xAxis = d3.svg.axis()
		.scale(pos)
		.orient("bottom");
	
	var yAxis = d3.svg.axis()
		.scale(bar)
		.ticks(5)
		.tickSize(-width)
		.orient("left");
	
	var svg = d3.select("#"+div).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	var gxAxis = svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0 , " + height + ")");
	
	var gyAxis = svg.append("g")
		.attr("class", "y axis minor");
	
	chart.render = function(){
		var rectData = svg.selectAll(".bar").data(data);
		var labelData = svg.selectAll(".label").data(data);
		var textData = svg.selectAll(".textbar").data(data);
		var maxValue = d3.max(data, function(d){ return d.value; });
		
		maxValue = parseInt((maxValue + 100 - 1)/100) * 100;
		
		pos.domain(data.map(function(d){ return d.key; }));
		bar.range([height, 0])
			.domain([0, maxValue]);
		
		gxAxis.call(xAxis)
			.selectAll("text")
			.attr("transform", "rotate(-65)")
			.attr("dx", "-5px")
			.attr("dy", "-5px")
			.style("text-anchor", "end");
		
		gyAxis.call(yAxis);
		
		// Build skeleton for current data
		rectData.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d){ return pos(d.key); })
			.attr("y", 0)
			.attr("width", thickness)
			.attr("height", 0)
			.on("mouseover", function(d){ callback(d.key, this); })
			.on("mouseout", function(d){ callback(null, this); });

		textData.enter().append("text")
			.attr("class", "textbar")
			.attr("x", function(d){ return pos(d.key); })
			.attr("y", 0)
			.attr("dy", 10)
			.style("fill", "white")
			//.style("opacity", 0)
			.style("font-weight", "bold");
		
		rectData.exit().remove();
		labelData.exit().remove();
		textData.exit().remove();
		
		// Update values
		if(!data || !data.length){
			data = [];
			
			error = {name: "warning", message: "No data"};
			console.warn(error.message);
			return error;
		}
		
		svg.selectAll(".bar").transition()
			.duration(duration)
			.attr("y", function(d){ return bar(d.value); })
			.attr("height", function(d){ return height - bar(d.value); });
//			.attr("fill", function(d, i){ return color(i); });

		svg.selectAll(".textbar").transition()
			.duration(duration)
			.text(function(d){ return formatText(d.value); })
			.attr("y", function(d){ return bar(d.value) - 20; })
			.style("text-align", "center")
			//.style("opacity", 1)
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
	
	chart.callback = function(_call){
		if(!arguments.length)
			return;
		callback = _call;
		return chart;
	};
	
	return chart;
}

function bulletChart(divname){
	var chart = {};
	
	var width = 150,
		height = 15,
		margin = {top:20, right:10, bottom:15, left:10};
	
	var keys = ["flavor", "freshness", "temperature", "service"],
		thickness = 9,
		length = width,
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
			.attr("id", function(d){ return d; })
//			.attr(!vertical ? "width" : "height", width + margin.left + margin.right)
//			.attr(!vertical ? "heigth" : "width", height + margin.top + margin.bottom)
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
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
	      	.attr(vertical ? "dx" : "dy", 6)
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
			var bullet = data[k].bullet;
			
			// Import data and sort it to properly display each layer
			// otherwise the biggest rect will cover the smallest in the DOM
			var rangez = bullet.ranges.sort(d3.descending);
			var measurez = bullet.measures.sort(d3.descending);
			var markerz = bullet.markers.sort(d3.descending);
			
			var g = d3.select("#" + k + " g");
			
			// Update the range rects.
			g.selectAll("rect.range").data(rangez)
				.enter().append("rect")
				.attr("class", function(d, i) { return "range r" + i; })
				.attr("height", vertical ? 0 : thickness)
				.attr("width", vertical ? thickness : 0)
				.attr("x", 0)
				.attr("y", vertical ? length : 0);

			g.selectAll("rect.range").transition()
				.duration(duration)
				.attr(vertical ? "height" : "width", function(d){return isNaN(d) ? 0 : bar(d);})
				.attr("y", vertical ? function(d){ return length - bar(d); } : 0);


			// Update the measure rects.
			g.selectAll("rect.measure").data(measurez)
				.enter().append("rect")
				.attr("class", function(d, i){ return "measure m" + i; })
				.attr("height", vertical ? 0 : thickness / 3)
				.attr("width", vertical ? thickness / 3 : 0)
				.attr("x", vertical ? thickness / 3 : 0)
				.attr("y", vertical ? length : thickness / 3);

			g.selectAll("rect.measure").transition()
				.duration(duration)
				.attr(vertical ? "height" : "width", function(d){ return isNaN(d) ? 0 : bar(d); })
				.attr("y", vertical ? function(d){ return length - bar(d); } : thickness / 3);

			
			// Update the marker lines.
			g.selectAll("line.marker").data(markerz)
				.enter().append("line")
				.attr("class", "marker")
				.attr(vertical ? "x1" : "y1", thickness / 6)
				.attr(vertical ? "x2" : "y2", thickness * 5 / 6);

			g.selectAll("line.marker").transition()
				.duration(duration)
				.attr(vertical ? "y1" : "x1", function(d){ return isNaN(d) ? 0 : bar(d); })
				.attr(vertical ? "y2" : "x2", function(d){ return isNaN(d) ? 0 : bar(d); });

			
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

	chart.width = function(_){
		if(!arguments.length)
			return width;
		
		width = _;
		return chart;
	};

	chart.heigth = function(_){
		if(!arguments.length)
			return heigth;
		
		heigth = _;
		return chart;
	};
	
	chart.keys = function(_keys){
		if(!arguments.length)
			return keys;
		keys = _keys;
		return chart;
	};
	
	return chart;
}

function lineChart(divName){
	var chart = {};
	
	var width = 450,
		height = 180,
		margin = {left:20, top:25, right:20, bottom:25},
		thickness = 1.5,
		name = null,
		color = "#fff";
		data = [],
		xAxisLabel = [],
		yAxisLabel = [],
		getX = function(d){ return d.key; },
		getY = function(d){ return d.value; },
		formatText = d3.format(""),
		brushFilter = null;
	
	var x = d3.time.scale()
		.range([0, width]);
	
	var y = d3.scale.linear()
		.range([height, 0]);
	
	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.ticks(d3.time.month, 3)
		.tickFormat(d3.time.format("%b %Y"))
		.tickPadding(8)
		.tickSize(3)
		.tickSubdivide(true);

	var yAxis = d3.svg.axis()
		.scale(y)
		.tickSize(-width)
		.ticks(4)
		.orient("left");
	
	var svg = d3.select("#"+divName).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	var line = d3.svg.line()
		.interpolate("cardinal")
		.x(function(d){ return x(getX(d)); })
		.y(function(d){ return y(getY(d)); });
	
	var area = d3.svg.area()
		.interpolate("cardinal")
		.x(function(d){ return x(getX(d)); })
		.y0(height)
		.y1(function(d){ return y(getY(d)); });
	
	var brush = d3.svg.brush()	
		.x(x)
		.on("brush", brushmove)
		.on("brushend", brushend);
	
	function brushmove() {
		var rawExtent = brush.extent(),
			extent = rawExtent.map(d3.time.month.round);
		
		d3.select(this)
			.call(brush.extent(extent))
		
		// update filtering if enabled
		if(brushFilter){
			brushFilter(extent);
		}
	}
	
	function brushend(){
		if(brush.empty())
			brushFilter(null);
	}
	
//	x.domain(d3.extent(data, getX));
	x.domain([d3.time.year.offset(new Date(), -2), new Date()]);
	y.domain([0, 5]);
	
	// Build skeleton
	// x axis
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

	// y axis
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
	
	// area
	svg.append("path")
		.attr("class", "area");
	
	// line
	svg.append("path")
		.attr("class", "line");
	
	// markers
	var dots = svg.append("g")
		.attr("class", "markers");
	
	// line marker position
	var maker = svg.append("line")
		.attr("class", "marker");
	
	// brush selector
	var gBrush = svg.append("g")
		.attr("class", "brush")
		.call(brush);
	
	gBrush.selectAll("rect")
		.attr("height", height);
	
	gBrush.selectAll(".resize").append("rect")
		.attr("transform", "translate(-5," +  (height - 80) / 2 + ")")
		.attr("width", 10)
		.attr("height", 80);
	
	
	chart.render = function(){
		// Update data
		if(!data || !data.length){
			error = {name: "warning", message: "No data"};
			console.warn(error.message);
			return error;
		}
		
		// line
		svg.select(".line").datum(data)
//			.transition()
//			.duration(duration)
			.attr("d", line);
		
		// markers
		dots.selectAll(".dot").remove();
		dots.selectAll(".dot").data(data)
			.enter().append("circle")
			.attr("class", "dot")
			.attr("r", 3)
			.attr("cx", function(d) { return x(getX(d)); })
			.attr("cy", function(d) { return y(getY(d)); });

		// area
		svg.select(".area").datum(data)
			.attr("d", area);
			
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
		line.y(function(d){ return y(_y(d)); });
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
	
	chart.filter = function(_bfilter){
		if(!arguments.length)
			return brushFilter;
		brushFilter = _bfilter;
		return chart;
	};
	
	return chart;
}

function rankChart(divName){
	var chart = {};
	
	var width = 120,
		height = 80,
		pi = Math.PI,
		radius = 50,
		data = 0;
	
	var empty = -pi / 2,
		full = pi / 2;
	
	var linear = d3.scale.linear()
		.range([empty, full])
		.domain([0, 5]);
	
	var format = d3.format(".2r");

	var arc = d3.svg.arc()
		.startAngle(-pi/2)
		.outerRadius(radius - 10)
		.innerRadius(radius - 30);
	
	var svg = d3.select("#"+divName).append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	var meter = svg.append("g")
		.attr("class", "progress-meter");

	meter.append("path")
		.datum({endAngle: full})
		.attr("class", "background")
		.attr("d", arc);

	var foreground = meter.append("path")
		.datum({endAngle: empty})
		.attr("class", "foreground")
		.attr("d", arc);

	var text = meter.append("text")
		.attr("text-anchor", "middle")
		.attr("dy", ".35em")
		.style("stroke", "#ccc")
		.style("fill", "#fff");

	function arcTween(transition, newAngle) {
		transition.attrTween("d", function(d) {
			var interpolate = d3.interpolate(d.endAngle, newAngle);
			return function(t) {
				d.endAngle = interpolate(t);
				return arc(d);
			};
		});
	}
	
	chart.render = function() {
		if(data == null)
			data = 0;
		
		foreground.transition()
			.duration(duration)
			.call(arcTween, linear(data));

		text.text(format(data));
		
		return chart;
	};

	chart.width = function(_){
		if(!arguments.length)
			return width;
		width = _;
		return chart;
	};
	
	chart.height = function(_){
		if(!arguments.length)
			return height;
		height = _;
		return chart;
	};
	
	chart.radius = function(_){
		if(!arguments.length)
			return radius;
		radius = _;
		return chart;
	};
	
	chart.data = function(_){
		if(!arguments.length)
			return data;
		data = _;
		return chart;
	};
	
	return chart;
}
