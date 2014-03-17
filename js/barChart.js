function barChart(){
	var width = 200,
		height = 200;

		name = "bar";
		thickness = 20;				// height of a single bar
		labelWidth = 50;				// width of the label
		margin = {left:10, top:0, right:70, bottom:0};

		color = d3.scale.ordinal();
		pos = d3.scale.ordinal();
		bar = d3.scale.linear();
		svg = d3.select("#"+name).append("svg");

		pack = null;

	barChart.prototype.data = function(data){
		if(!arguments.lenght)
			return this.pack;
		
		this.pack = data;
		return this;
	};
	
	barChart.prototype.setBoundaries = function(width, height){
		pos.rangeRoundBands([0, height], .5, 1)
		.domain([0, pack.keys.length]);

		bar.range([0, d3.max([100, width - labelWidth - margin.left - margin.right])])
		.domain([0, pack.top]);

		svg.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate(" + 10 + "," + 50  + ")");

		return this;
	};

	function chart(){
		svg.selectAll(".bar").data(pack.keys)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("x", labelWidth)
		.attr("y", function(d, i){return i * pos.rangeBand();})
		.attr("width", 0)
		.attr("height", thickness);


		svg.selectAll(".label").data(pack.keys)
		.enter().append("text")
		.attr("class", "label")
		.attr("x", 0)
		.attr("y", function(d, i){return i * pos.rangeBand();})
		.attr("dy", 15)
		.style("fill", "white")
		.style("font-weight", "bold")
		.style("opacity", 0)
		.text(function(d){return d;});

		svg.selectAll(".textbar").data(pack.keys)
		.enter().append("text")
		.attr("class", "textbar")
		.attr("x", 0)
		.attr("y", function(d, i){return i * pos.rangeBand();})
		.attr("dy", 15)
		.style("fill", "white")
		.style("opacity", 0)
		.style("font-weight", "bold");

		return this;
	};

	/**
	 * Updates data
	 * @returns
	 */
	barChart.prototype.stateChange = function (data){
		if(!data){
			rect.transition()
			.duration(duration)
			.attr("width", 0);

			label.style("opacity", 0);

			text.style("opacity", 0);

			error = new Warning("No data");
			console.warn(error);
			return error;
		}

		var rect = svg.selectAll(".bar");
		var label = svg.selectAll(".label");
		var text = svg.selectAll(".textbar");

		bar.range([0, d3.max([100, width - labelWidth - margin.left - margin.right])])
		.domain([0, pack.top]);

		rect.transition()
		.duration(duration)
		.attr("width", function(d){ return bar(data[d]); })
		.style("fill", function(d){ return color(d); });

		label.style("opacity", 1);

		text.transition()
		.duration(duration)
		.text(function(d){ return data[d] + " Kg"; })
		.attr("x", function(d){ return bar(data[d]) + labelWidth + 10; })
		.style("text-align", "center")
		.style("opacity", 1)
		.style("fill", "#777");

		return this;
	};

	barChart.prototype.resize = function (width, height){
		setBoundaries(width, heigth);
		stateChange();
	};

	barChart.prototype.event = function (dispatch, event, func){
		dispatch.on(event, func);
		return this;
	};

	return this;
}