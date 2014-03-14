var coffeeCompUrl = "csv/coffees.csv",
	coffeeConsumeUrl = "csv/consume.csv",
	turistCompUrl = "csv/turist.csv",
	mapUrl = "json/ita2.json",
	rankingUrl = "csv/ranking.csv",
	sentimentUrl = "csv/sentiment2.csv";

var regionSelected = {};

var ita,
	coffeeFan,
	coffeeConsume,
	turist,
	ranking,
	sentiment,
	feedback;

var window = {};
window.w = $(window).width();
window.h = $(window).height();

var detailDim = {ratio:0.2, min:100, max:500};	// Min, max Width and ratio of the details section relative to the window's one
var mapDim = {ratio:0.45, min:200, max:800};		// Min, max Width and ratio of the map section relative to the window's one

var duration = 350;				// Duration of transitions
var barThickness = 20;			// Thickness of the bars in each bar chart

var dispatch;					// Dispatcher of events

/**
 * Packs the csv file into a structured object, featuring some utility functions 
 * @param data
 * @returns {___pack0}
 */
function packInfo(data, filters){
	var pack = new Object();

	// Loads data
	pack.keys = d3.keys(data[0]).filter(function(obj){
		var res = true;
		filters.forEach(function(f){res &= obj !== f;});
		return res;
	});

	/* 
	 * Format properly the object as an array of 2-dim objs: {type, quantity}
	 * and initializes the coffee.fan object in order to match the correct value
	 * once the changestate event is dispatched
	 */ 
	/*pack.objects = [];
	data.forEach(function(obj){
		var region = obj.region;
		var value = pack.keys.map(function(key){
			return {type:key, quantity:+obj[key]}; 
		});
		pack.objects.push({region:region, values:value});
	});*/
	
	pack.objects = [];
	pack.top = 0;
	data.forEach(function(obj){
		var object = {region:obj.region, total:0, max:0};
		
		pack.keys.map(function(key){
			object[key] = +obj[key];
			object.total += object[key];
			if(object.max < object[key])
				object.max = object[key];
		});
		
		pack.objects.push(object);
		
		if(pack.top < object.max)
			pack.top = object.max;
	});

	/*
	 * Structures data to be used in a stacked bar chart
	 */
	pack.toStack = function(){
		pack.objects.forEach(function(obj){
			var y0 = 0;
	
			obj.stack = pack.keys.map(function(key){
				return {name:key, y0:y0, y:y0 += +obj[key]};
			});
		});
		
		return pack;
	};
	
	/*
	 * Allows to extract only the relevant information for the selected region
	 */
	pack.extract = function(region){
		return pack.objects.filter(function(obj){
			return obj.region === region;
		}).pop();
	};
	
	return pack;
}

function packSentiment(data, filters){
	var pack = {
			name : "sentiment",
			objects : {}
	};
	
	// Loads data
	pack.keys = d3.keys(data[0]).filter(function(obj){
		var res = true;
		filters.forEach(function(f){res &= obj !== f;});
		return res;
	});
	
	// For each object in the csv
	// (which is a simple feedback entry comprising the inline indication of region and hotel)
	data.forEach(function(obj){
		var feedback = {};
		
		var region,
			hotel;
		
		// Extract only the feedback's keys packing them into a 'feedback' object
		pack.keys.forEach(function(key){
			feedback[key] = +obj[key];
		});
		
		/* Adds the feedback object to the correct region and hotel entry */
		region = obj.region;
		hotel = obj.hotel;
		if(!pack.objects[region])
			pack.objects[region] = {};
		
		if(!pack.objects[region][hotel])
			pack.objects[region][hotel] = [];
		
		pack.objects[region][hotel].push(feedback);
	});
	
	pack.bullet = function(region, hotel){
		var tregion = pack.objects[region]; 		// Assumed that 'target' exists!
		var thotel;
		
		if(tregion[hotel].bullets)
			return tregion[hotel].bullets;
		
		var hotels = d3.keys(tregion);
		
		// For each hotel listed in the region, compute its bullets
		hotels.forEach(function(h){
			var top = 5;
			var mean = {};
			tregion.mean = mean;
			thotel = tregion[h];
		
			// For each key, create a new object representing a bullet bar
			var bullets = pack.keys.map(function(key){
				var min = -1,
					max = -1;
				
				mean[key] = 0;	// initialize totals objects that is required later to calculate region's mean
				
				// then iterate on each feedback entry for each of the interesting key (a bit wasteful, i know...)
				thotel.forEach(function(feedback){
					if(!isFinite(feedback[key]))
						return null;
					
					// Min
					if(min > feedback[key] || min < 0)
						min = feedback[key];
	
					// Max
					if(max < feedback[key])
						max = feedback[key];
					
					// Mean
					mean[key] += feedback[key];
				});
				
				// Finalize mean
				mean[key] /= thotel.length;
				
				// Returns the 'bullet' object
				return {
					title:key,
					measures:[mean[key]],
					ranges:[min, max, top],
					markers:[]			// Needs all hotel's bullets to be computed, to calculate overall mean value
				};
			});
			
			// Add bullet object to the current hotel
			thotel.bullets = bullets;
		});
		
		/*
		 * Now, since each hotel's bullets are computed, it is possible
		 * to calculate the overall region's mean values from the 'measures'
		 * of each single hotel by dividing 'mean'by each of the key 
		 * which represent a bullet (again, should be optimized!)
		 */ 
		pack.keys.forEach(function(key){
			tregion.mean[key] /= hotels.length;
		});
		
		// Now, update each hotel 'markers' element inside bullet object
		hotels.forEach(function(h){
			thotel = tregion[h];
			pack.keys.forEach(function(key, index){
				thotel.bullets[index].markers.push(tregion.mean[key]);
			});
		});
		
		return tregion[hotel].bullets;
	};
	
	pack.ranges = function(region, hotel){
		if(!pack.objects[region][hotel].bullet)
			pack.objects[region][hotel].bullet = {};
		
		pack.objects[region][hotel].bullet.ranges = pack.keys.map(function(key){
			var bullet = {title:key};
			var min = -1, max = -1;
			
			pack.objects[region][hotel].forEach(function(feedback){
				console.log(feedback[key]);
					if(min > feedback[key] || min < 0)
						min = feedback[key];

					if(max < feedback[key])
						max = feedback[key];
			});
			
			bullet.ranges = [min, max];
			return bullet;
		});
		
		return pack.objects[region][hotel].bullet.ranges;
	};
	
	pack.measures = function(region, hotel){
		var mean = 0;
		var count = 0;
		var bullet = {};
		
		if(!pack.objects[region][hotel].bullet)
			pack.objects[region][hotel].bullet = {};
		
		pack.objects[region][hotel].bullet.measures = pack.keys.map(function(key){
			mean = 0;
			count = 0;
			
			pack.objects[region][hotel].forEach(function(feedback){
				pack.keys.forEach(function(key){
					mean += feedback[key];
					count++;
				});
			});
			
			bullet.measures = [mean/count];
		});
		
		
		pack.objects[region][hotel].bullet.measures.forEach(function(obj){
			pack.keys.forEach(function(key){
				obj[key] /= count;
			});
		});
		
		return pack.objects[region][hotel].bullet.measures;
	};
	
	return pack;
}

/**
 * Capitalize the first character of a string
 * @returns String
 */
String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

/**
 * Builds main map which allow to select regions
 */
function mapBuild(){
	var width = window.w * mapDim.ratio,
		height = width * 3/4;				// 4:3 screen ratio

	var projection = d3.geo.albers()
		.center([0, 42])
        .rotate([347, 0])
        .parallels([35, 45])
        .scale(height * 4)
        .translate([width/2, height/2]);

	var path = d3.geo.path()
		.projection(projection);

	var svg = d3.select("#map").append("svg")
			.attr("width", width)
			.attr("height", height);

	var sub = svg.append("g")
		.attr("id", "subunits");

//	svg.append("rect")
//		.attr("class", "background")
//		.attr("width", width)
//		.attr("height", height);
	
	var gcircles = svg.append("g")
		.attr("class", "ranking");

	var subunits = topojson.feature(ita, ita.objects.regions);
	var features = subunits.features;
//		var boundaries = topojson.mesh(ita, ita.objects.regions, function(a, b){return a!==b;});
	ranking = d3.nest().key(function(d){ return d.region; })
		.rollup(function(d, i){ return {coordinates:[+d[0].lon, +d[0].lat], value:+d[0].value}; })
		.entries(ranking);

	sub.selectAll(".region")
		.data(features)
		.enter().append("path")
			.attr("class", "region")
			.attr("id", function(d, i){ return d.properties.name.toLowerCase().split("/")[0]; })
			.on("click", selected)
			.on("mouseover", function(d){ highlight(d); })
			.on("mouseout", function(d){ highlight(null); });

//		sub.selectAll(".region-border")
//			.datum(boundaries)
//			.enter().append("borders")
//			.attr("class", "region-border")
//			.attr("d", path);
	
	circles = gcircles.selectAll(".ranking")
		.data(ranking)
		.enter().append("circle")
			.attr("class", "ranking");
	
	var hotels = hotelList();
	
	function drawMap(){
		sub.selectAll(".region")
			.attr("d", path);
		
		gcircles.selectAll(".ranking")
			.attr("r", function(d){return d.values.value * 3;})
			.attr("cx", function(d){return projection(d.values.coordinates)[0];})
			.attr("cy", function(d){return projection(d.values.coordinates)[1];});
	};
	
	function selected(region){
		var x, y, zoom;
		
		// Select the region
		// If there is still a selected region or the current one has not a focus
		// and so it have not beening selected yet, then selects it (thus acquire the focus)
		if(regionSelected.path !== region || !regionSelected.focus){
			var center = path.centroid(region);
			var name = region.properties.name;

			x = center[0];
			y = center[1];
			zoom = 2;
			
			regionSelected.name = name.capitalize();
			regionSelected.path = region;
			regionSelected.focus = true;
			
			console.log("list hotel for '" + regionSelected.name);
			
			// List all the hotel for the selected region
			hotels.draw(regionSelected.name);
			
			// Dispatch the stateChane event to update all the charts
			dispatch.regionChange(regionSelected.name);

			// otherwise clear the selections
		} else {
			x = width / 2;
			y = height / 2;
			zoom = 1;
			
			regionSelected.name = null;
			regionSelected.path = null;
			regionSelected.focus = false;
			
			// Clear hotel list
			hotels.draw(null);
			
			// Clear all the charts
//			dispatch.regionChange(null);
		}
		
		// Center and zoom the map
		sub.transition()
		.duration(duration)
		.attr("transform", "translate(" + width/2 + "," + height/2 + ")scale(" + zoom + ")translate(" + -x + "," + -y + ")")
		.style("stroke-width", "3px");
	
		gcircles.selectAll("circle").transition()
			.duration(duration)
	//		.attr("r", function(d){ return d.values.value * zoom; })
			.attr("transform", "translate(" + width/2 + "," + height/2 + ")scale(" + zoom + ")translate(" + -x + "," + -y + ")");
		
		// Update classes
		sub.selectAll("path")
			.classed("highlight", false)
			.classed("active", regionSelected && function(d){ return d === regionSelected.path; });
	};
	
	function highlight(region){
		console.log("highlight '" + regionSelected.name + "' region data");

		if(regionSelected.focus)
			return;
		
		// Mouse is exited from map and no selectino was made
		if(region == null){
			sub.selectAll("path")
				.classed("highlight", false);
			
			// Restore mean values of the state TODO: to implement
		} else {
		
		// Select the region
			var regionName = region.properties.name;

			regionSelected.name = regionName.capitalize();
			regionSelected.path = region;
			regionSelected.focus = false;

			sub.selectAll("path")
				.classed("highlight", regionSelected && function(d){ return d === regionSelected.path; });
	
			// Dispatch the stateChane event to update all the charts
			dispatch.regionChange(regionSelected.name);
		}
	};
	
//	function highlight(region){
//		// Highlight the current region
//		sub.selectAll("path")
//			.classed("active", function(d){return region;});
//	};
	
	function resize (w, h){
		width = w * mapDim.ratio,
		height = width * 3/4;
		
		svg.attr("width", width)
			.attr("height", height);
		
		projection
			.translate([width/2, height/2])
			.scale(height*4);
		
		drawMap();
	};
	
	drawMap();
	
	dispatch.on("resize.map", resize);
}

//TODO: implementare il cambio di informazioni su tutti i grafici
/**
 * Builds the donuts graph which represents the composition of coffee
 * consumption in the selected region
 */
function coffeeCompBuild(){
	var width = detailDim.min,
		height = 150;
	
	var thickness = 20;			// height of a single bar
	var labelWidth = 60;		// width of the label
	var margin = {left:10, top:0, right:70, bottom:0};
	
	var color = d3.scale.ordinal()
		.range(["#ffcc00", "#cc9900", "#664c00", "#523d00", "#cc6600", "#8f4700", "#4c3300"]);

	var pack = packInfo(coffeeFan, ["region"]);

	var pos = d3.scale.ordinal()
		.domain([0, pack.keys.length]);
	
	var bar = d3.scale.linear()
		.domain([0, pack.top]);
	
	var svg = d3.select("#fan-chart").append("svg");
	
	
	function setBoundaries(w, h){
		width = w * detailDim.ratio;

		pos.rangeRoundBands([0, height], .5, .7);
		bar.range([0, width - labelWidth - margin.left - margin.right]);
		
		svg.attr("width", width)
			.attr("height", height)
			.attr("transform", "translate(" + margin.left + "," + margin.top  + ")");
	}
	
	function draw(){
		svg.selectAll(".bar").data(pack.keys)
			.enter().append("rect")
				.attr("class", "bar")
				.attr("x", labelWidth)
				.attr("y", function(d, i){ return i * pos.rangeBand(); })
				.attr("width", 0)
				.attr("height", thickness)
				.style("fill", function(d){	return color(d); });
		
		
		svg.selectAll(".label").data(pack.keys)
			.enter().append("text")
				.attr("class", "label")
				.attr("x", 0)
				.attr("y", function(d, i){ return i * pos.rangeBand(); })
				.attr("dy", 15)
				.style("fill", "#777")
				.style("font-weight", "bold")
				.text(function(d){ return d; });
		
		svg.selectAll(".textbar").data(pack.keys)
			.enter().append("text")
				.attr("class", "textbar")
				.attr("x", 0)
				.attr("y", function(d, i){ return i * pos.rangeBand(); })
				.attr("dy", 15)
				.style("fill", "#fff")
				.style("opacity", 0)
				.style("font-weight", "bold");
	};
	
	/**
	 * Updates data
	 * @returns
	 */
	function stateChange(region){
//		var region = regionSelected.name;
		var data = pack.extract(region);
		
		var rect = svg.selectAll(".bar");
		var label = svg.selectAll(".label");
		var text = svg.selectAll(".textbar");

		if(!data){
			rect.transition()
				.duration(duration)
				.attr("width", 0);
			
//			label.transition()
//				.duration(duration)
//				.style("opacity", 0);

			text.transition()
				.duration(duration)
				.attr("x", 0)
				.style("opacity", 0);
			
			error = new Error("No region data for '" + region + "'");
			console.warn(error);
			return error;
		}
		
		rect.transition()
			.duration(duration)
			.attr("width", function(d){ return bar(data[d]); });
			
//		label.style("opacity", 1);
		
		text.transition()
			.duration(duration)
			.text(function(d){ return data[d] + " Kg"; })
			.attr("x", function(d){ return bar(data[d]) + labelWidth + 10; })
			.style("text-align", "center")
			.style("opacity", 1);
	};
		
	function resize(w, h){
		setBoundaries(w, height);
		stateChange();
	};
	
	setBoundaries(window.w, window.h);
	draw();
	
	dispatch.on("regionChange.coffee.fan", stateChange);
	dispatch.on("resize.coffee.fan", resize);
};

/**
 * Build the chart representing the consume percentage of coffee
 * with respect to the state's total
 */
function coffeeConsumeBuild(){
	var width = detailDim.min,
		height = 70;
	var labelWidth = 10;
	var margin = {left:10, top:0, right:70, bottom:0};
	
	// Loads data
	var pack = packInfo(coffeeConsume, ["region"]);
	pack.toStack();

	var bar = d3.scale.linear();
	
	var pos = d3.scale.ordinal()
		.domain([0, pack.keys.length]);
	
	var color = d3.scale.ordinal()
		.range(["#4c2511", "#8f4700", "#cc6600"]);

	var percentage = d3.format(".1%");
	
	var svg = d3.select("#consume-chart").append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate(5, 10)");

	function setBoundaries(w, h){
		width = w * detailDim.ratio;
		
		pos.rangeRoundBands([0, height], .5, .7);
		bar.range([0, width - margin.left - margin.right]);
		
		svg.attr("width", width)
			.attr("height", height)
			.attr("transform", "translate(" + margin.left + "," + margin.top  + ")");
	};
	
	function draw(){
 		svg.selectAll(".bar").data(pack.keys)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", 0)
			.attr("y", 25)
			.attr("width", 0)
			.attr("height", barThickness)
			.style("fill", function(d, i){ return color(i); });

		svg.selectAll(".label").data(pack.keys)
			.enter().append("text")
			.attr("class", "label")
			.attr("x", 0)
			.attr("y", 0)
			.attr("dy", 15)
			.style("fill", "#777")
			.style("font-weight", "bold")
			.style("opacity", 0)
			.text(function(d){ return d.capitalize(); });
		
		svg.selectAll(".textbar").data(pack.keys)
			.enter().append("text")
				.attr("class", "textbar")
				.attr("x", 0)
				.attr("y", 40)
				.style("font-weight", "bold")
				.style("fill", "#fff");
		
		svg.selectAll(".chord").data(pack.keys)
			.enter().append("path")
				.attr("class", "chord");
	};
		
	// Updates data
	function stateChange(region){
		var data = pack.extract(region);
		
		var rect = svg.selectAll(".bar");
		var label = svg.selectAll(".label");
		var text = svg.selectAll(".textbar");
//			var chord = svg.selectAll(".chord");
		
		if(!data){
			rect.transition()
				.duration(duration)
				.attr("x", 0)
				.attr("width", 0);
			
			label.transition()
				.duration(duration)
				.attr("x", 0)
				.style("opacity", 0);
			
			text.transition()
				.duration(duration)
				.attr("x", 0)
				.style("opacity", 0);
			
			error = new Error("No region data for '" + region + "'");
			console.warn(error);
			return error;
		}
		
		bar.domain([0, data.total]);
		
		rect.data(data.stack).transition()
			.duration(duration)
			.attr("x", function(d){ return bar(d.y0); })
			.attr("width", function(d){ return (bar(d.y) - bar(d.y0)); });
		
		label.data(data.stack).transition()
			.duration(duration)
			.attr("x", function(d){ return bar(d.y0) + labelWidth; })
			.style("opacity", 1);
		
		text.data(data.stack).transition()
			.duration(duration)
			.attr("x", function(d){ return bar(d.y0) + labelWidth; })
			.style("opacity", 1)
			.text(function(d){ return percentage((bar(d.y) - bar(d.y0)) / data.total); });
		
//				chord.data(data.stack)transition()
//					.duration(duration)
//					.attr("d", function(d){
//						
//					});
	};
		
	function resize(w, h){
		setBoundaries(w, height);
		stateChange();
	};
	
	setBoundaries(window.w, window.h);
	draw();
	
	dispatch.on("regionChange.coffee.consume", stateChange);
	dispatch.on("resize.coffee.consume", resize);
};

function buildChord(data){
	p = [];
	
	data.forEach(function(e, i){
		var obj = {};
		
		obj.x = bar(data.y) - bar(data.y0);
		obj.y = i * pos.rangeBand() + barHeight;
		
		p.push(obj);
	});

	return "M" + p[0].x + "," + p[0].y + "L" + p[1].x + "," + p[1].y +
		"q" + p[2].x + "," + p[2].y + " " + "10,5" + "L" + p[3].x + "," + p[3].y +
		"q" + p[3].x + "," + p[3].y + "-10, -5";
}

/**
 * Builds the pie chart that represents nationality composition
 * of the turists in the selected region
 */
function turistNationalityBuild() {
	var width = detailDim.min,
		height = 150;
	
	var labelWidth = 70;		// width of the label
	var margin = {left:10, top:0, right:70, bottom:0};

	var pack = packInfo(turist, ["region"]);

	var color = d3.scale.linear()
		//.range(["#0033cc", "#003399", "#3366cc", "#000066", "#003366"]);
		.range(["#6685e0", "#001a4c"])
		.domain([0, pack.keys.length]);
	
	var svg = d3.select("#turist-chart").append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	var bar = d3.scale.linear()
		.domain([0, pack.top]);

	var pos = d3.scale.ordinal()
		.domain([0, pack.keys.length]);

	function setBoundaries(w, h){
		width = w * detailDim.ratio;
		
		pos.rangeRoundBands([0, height], .5, .7);
		bar.range([0, width - labelWidth - margin.left - margin.right]);
		
		svg.attr("width", width)
			.attr("height", height)
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	};
	
	function draw(){
		svg.selectAll(".bar").data(pack.keys)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", labelWidth)
			.attr("y", function(d, i){return pos.rangeBand() * i;})
			.attr("width", 0)
			.attr("height", 20)
			.style("fill", function(d, i){return color(i);});
	
		svg.selectAll(".label").data(pack.keys)
			.enter().append("text")
				.attr("class", "label")
				.attr("x", -100)
				.attr("y", function(d, i){ return i * pos.rangeBand(); })
				.attr("dy", 15)
				.style("fill", "#777")
				.style("font-weight", "bold")
				.text(function(d){return d.capitalize();});
		
		svg.selectAll(".textbar").data(pack.keys)
			.enter().append("text")
			.attr("class", "textbar")
			.attr("x", 0)
			.attr("y", function(d, i){ return i * pos.rangeBand(); })
			.attr("dy", 15)
			.style("fill", "#fff")
			.style("font-weight", "bold");
	};
	
	function stateChange(region){
		var data = pack.extract(region);
		
		var rect = svg.selectAll(".bar");
		var label = svg.selectAll(".label");
		var text = svg.selectAll(".textbar");
		
		if(!data){
			rect.transition()
			.duration(duration)
			.attr("width", 0);
		
//			label.transition()
//				.duration(duration)
//				.style("opacity", 0);
			
			text.transition()
				.duration(duration)
				.attr("x", 0)
				.style("opacity", 0);
			
			error = new Error("No region data for '" + region + "'");
			console.warn(error);
			return error;
		}
		
		rect.transition()
			.duration(duration)
			.attr("width", function(d){return bar(data[d]);});
		
		svg.selectAll(".label")
			.attr("x", 0)
			.style("opacity", 1);
		
		svg.selectAll(".textbar").transition()
			.duration(duration)
			.attr("x", function(d){return bar(data[d]) + labelWidth + 10;})
			.style("text-align", "center")
			.style("opacity", 1)
			.text(function(d){return data[d];});
	};
	
	function resize(w, h){
		setBoundaries(w, h);
		stateChange();
	};
	
	setBoundaries(window.w, window.h);
	draw();
	
	dispatch.on("regionChange.turist", stateChange);
	dispatch.on("resize.turist", resize);
}

/**
 * Returns the list of all available hotels in the
 * selected region.
 */
function hotelList(){
	var list = {};
	
	var width = 200,
		height = 400;
	
	var margin = {left:10, top:10, right:10, bottom:10};
	
	var pos = d3.scale.ordinal();
	
	var svg = d3.select("#hotels").append("div");
	
	// Key set. All the headers of the input file are listed here
	var keys = ["flavour", "freshness", "temperature", "service"];
	
	// Create new dimensions in the crossfilter to filter feedbacks
	feedbackByRegion = feedback.dimension(function(d){ return d.region; });
	feedbackByHotel = feedback.dimension(function(d){ return d.hotel; });
	feedbackByHotelFilter = feedback.dimension(function(d){ return d.hotel; });
	feedbackByKey = {
			group:function(){
				var res = [];
				
				keys.forEach(function(key, idx){
					var sum = feedbackByKey[key].groupAll().reduceSum(function(d){ return d[key]; }).value();
					var count = feedbackByKey[key].groupAll().reduceCount().value();
					var extent = d3.extent(feedbackByKey[key].top(Infinity), function(d){ return +d[key]; });
					res.push({key:key, sum:sum, count:count, mean:sum/count, ranges:extent});
				});
				
				return res;
			},
	};
	keys.forEach(function(key){
		feedbackByKey[key] = feedback.dimension(function(d){ return d[key]; });
	});
	
	// Group distinct hotel names
	var groupByRegion = feedbackByRegion.group();
	var groupByHotel = feedbackByHotel.group();

	function computeBullets(hotelName){
		
		var regionValue = feedbackByKey.group();

		// Filter feedbacks by hotel
		feedbackByHotel.filter(hotelName);
		
		var hotelValue = feedbackByKey.group();
		
		var bullets = [];
		keys.forEach(function(key, idx) {
			var bullet = {
					measures:[hotelValue[idx].mean],
					ranges:hotelValue[idx].ranges,
					markers:[regionValue[idx].mean]
				};
			bullets.push(bullet);
		});
		
		return bullets;
//		feedbackByHotelFilter.filterAll();
		
//		// Grouped value at level of region (selected)
//		// in this array are stored mean value and extent of
//		// the feedback of all the hotels within the region 
//		var regionBullets = groupByRegion.reduce(
//				function(p,v){
//					p.present = true;
//					keys.forEach(function(k){
//						var value = +v[k];
//						p[k].sum += value;
//						p[k].mean = p[k].sum / ++p[k].count;
//						p.rank = p[k].mean / keys.length;
//						if(value < p[k].ranges[0]) p[k].ranges[0]= value;
//						if(value > p[k].ranges[1]) p[k].ranges[1]= value;
//					});
//					return p;
//				},
//				function(p, v){},
//				function(){
//					var topValue = 5;
//					var p = {present:false, rank:0};
//					keys.forEach(function(k){
//						p[k] = {sum:0, count:0, mean:0, ranges:[topValue, 0, topValue]};
//					}); return p;
//				})
//			.top(Infinity)
//			.filter(function(d){ return d.value.present; });
//		
//		// Filter feedbacks by hotel
//		feedbackByHotel.filter(hotelName);
//		feedbackByHotelFilter.filter(hotelName);
//		
//		// So that in this array are stored bullets values
//		// only for the selected hotel.
//		// This is the final returned object
//		var hotelBullets = groupByHotel.reduce(
//					function(p,v){
//						p.present = true;
//						keys.forEach(function(key, idx){
//							var value = +v[k];
//							var obj = p.bullest[idx];
//							
//							obj.sum += value;
//							obj.measures[0] = obj.sum / ++obj.count;
//							if(value < obj.ranges[0]) obj.ranges[0]= value;
//							if(value > obj.ranges[1]) obj.ranges[1]= value;
//						});
//						return p;
//					},
//					function(p, v){},
//					function(){
//						var topValue = 5;
//						var p = {present:false, bullets:[]};
//						keys.forEach(function(k){
//							p.bullets.push({key:k, sum:0, count:0, measures:[], ranges:[topValue, 0, topValue], markers:[]});
//						}); return p;
//					})
//				.top(Infinity)
//				.filter(function(d){ return d.value.present; });
//		
//		// Adds the markers to the hotel's bullet taken the value from
//		// the regionBullet's mean value computed before
//		keys.forEach(function(key){
//			hotelBullets[0].value[key].markers = [regionBullets[0].value[key].mean];
//		});
//		
//		return hotelBullets;
	}
	
	function setBoundaries(w, h){
		width = w * 0.2;
		
		pos.rangeBands([0, height], .2, .5);
		
//		svg.attr("width", width)
//			.attr("height", height)
//			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
//		background.attr("width", width)
//			.attr("height", height)
//			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	}
	
	list.feedback = function() {
		var limit = 50;
		
		var feedbacks = feedbackByHotel.top(limit);

		var table = d3.select("#feedback-table");
		
		var header = table.select("thead tr");
		
		header.data(keys)
			.enter().append("th")
				.text(function(d){ return d; });
		
		var row = table.data(feedbacks)
			.enter().append("tr");
		
		
		var data = row.data().text(function(d){
					keys.forEach(function(d){ this.append("td").text(d[keys]); });
				});
		
	};
	
	list.draw = function(regionName){
		if(!regionName){
			svg.selectAll(".entry").remove();
			return;
		}
		
		var limit = 50;
		
		// Filter all the feedbacks in the selected region
		feedbackByRegion.filter(regionName);
		feedbackByHotel.filterAll();
		
		// Retrieve only the hotel whose value is != 0, so they belong to selected region
		var hotelInRegion = feedbackByHotel.group()
			.order(function(d){ return d.value; })
			.top(limit)
			.filter(function(d){ return d.value; });
		
		var entry = svg.selectAll(".entry").data(hotelInRegion, function(d){ return d.key; });
		
		var tableHeaders = ["date", "flavour", "freshness", "temperature", "service", "country"];
		var feedList = feedbackList();
		feedList.keys(tableHeaders);
		feedList.render(feedbackByHotel.top(limit));
		
//		var topValue = 5;
//		var hotelBullets = d3.nest()
//			.key(function(d){ return d.region; })
//			.key(function(d){ return d.hotel; })
//			.rollup(function(d){
//				var bullet={};
//				
//				keys.forEach(function(k){
//					bullet[k] = {count:0, sum:0, mean:0};
//				});
//				
//				d.forEach(function(feed){
//					keys.forEach(function(k){
//						bullet[k].count += +feed.count;
//						bullet[k].sum += +feed[k] * +feed.count;
//						bullet[k].measures = [bullet[k].sum / bullet[k].count];
//					});
//				});
//				
//				keys.forEach(function(k){
//					bullet[k].ranges = [+feedbackByHotel.top(1)[0][k], +feedbackByHotel.bottom(1)[0][k], topValue];
//				});
//				
//				keys.forEach(function(k){
//					var feedbackByRegion
//					bullet[k].markers = [feedbackByRegion.top(1)];
//				});
//				
//				return bullet;
//			})
//			.map(feedbackByHotel.top(Infinity), d3.map);
		
//		pos.domain([0, groupByHotel.size()]);
		
		// Adds new hotel names into the list belonging to the choosed region
		entry.enter().append("div")
			.attr("class", "entry")
			.text(function(d){ return d.key.capitalize(); })
			.on("mouseover", updateFeedback);
		
		// And removes the old one that do not belong to the selected region
		entry.exit().remove();
	};
	
	list.show = function(visible){
		if(visible){
			svg.transition()
				.duration(100)
				.attr("display", "block");
		} else {
			svg.transition()
			.duration(100)
			.attr("display", "none");
		}
	};
	
	function updateFeedback(data){
		var hotelName = data.key;
		var bullets = computeBullets(hotelName);
		
		if(!bullets){
			console.warn("No feedback are found for '" + hotelName +"'");
			return;
		}
	
		dispatch.updateFeedback(bullets);
	}
	
	function resize(w, h){
		setBoundaries(w, h);
		draw();
	}
	
	setBoundaries(window.w, window.h);
	
	dispatch.on("resize.hotels", resize);
	
	return list;
}

/**
 * Builds the charts relative to the sentiment analisys
 * of the selected hotel within the selected region.
 */
function sentimentBuild(){
	var margin = {top:20, right:10, bottom:10, left:10};
	
	var width = 80,
		height = 250;
	
	var thickness = 20;
	var length = 250;
	
	var vertical = false;
	var plotTick = true;

	var keys = ["flavour", "freshness", "temperature", "service"];
	
	var bar = d3.scale.linear()
        .domain([0, 5])
        .range([0, length]);
	
	var svg = d3.select("#feedback").selectAll("svg")
		.data(keys)
		.enter().append("svg")
			.attr("class", "bullet")
			.attr("width", vertical ? width + margin.left + margin.right : 400)
			.attr("height", vertical ? height + margin.top + margin.bottom: 60)
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
	      	.style("text-anchor", "middle");
      }
	
	function stateChange(data){
		data.forEach(function(bullet){
			// Adds the top value for the sentiment analisys to be consistent 
			var topValue = 5;
			bullet.ranges.push(topValue);
			
			
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
			var tickUpdate = tick.transition()
				.duration(duration + 100)
				.style("opacity", 1);
		}
	}
	
	dispatch.on("updateFeedback", stateChange);
}

function feedbackList(){
	var feedlist = {
		keys: []
	};
	
	var numberFormat = d3.format(".2r");
	var dateFormat = d3.time.format("%e / %m / %Y");
	
	var table = d3.select("#feedback-table");
	
	feedlist.keys = function(_keys)	{
		if(arguments.length > 0){
			feedlist.keys = _keys;
			return feedlist;
		}
		
		return feedlist.keys;
	};
	
	feedlist.render = function(_data){
//		var data = d3.entries(_data).filter(function(d){
//					var f = ['region', 'hotel', 'count'];
//					return f.every(function(k){
//						return d.key !== k;
//					});
//				});

		var data = _data.map(function(d){
			return d3.entries(subObject(d, feedlist.keys));
		});
		console.log(data);
		
		// create the table header
		var thead = table.select("thead").selectAll("th")
			.data(feedlist.keys)
			.enter().append("th").text(function(d){ return d.capitalize(); });
		
		var feeds = table.select("tbody").selectAll("tr").data(data);
		
		// create rows
		var tr = feeds.enter().append("tr");
		 
		// cells
		var td = tr.selectAll("td")
			.data(function(d, i){ return d;})
			.enter().append("td")
			.text(function(d) {
				if(d.value == undefined) return "Unavailable";
				if(isFinite(d.value)) return numberFormat(+d.value);
				if(d.key === "date") return dateFormat(d.value);
				return d.value; });
	
		feeds.exit().remove();
		
		/*var feeds = table.selectAll(".feed").data(_data);
		
		var feedEnter = feeds.enter().append("div")
			.attr("class", "feed");
		
		feedEnter.append("div")
			.attr("class", "date")
			.text(function(d){ return d.sendtime; });

		feedEnter.append("div")
			.attr("class", "flavour")
			.text(function(d){ return d.flavour; });
			
		feedEnter.append("div")
			.attr("class", "freshness")
			.text(function(d){ return d.freshness; });
			
		feedEnter.append("div")
			.attr("class", "temperature")
			.text(function(d){ return d.temperature; });
			
		feedEnter.append("div")
			.attr("class", "service")
			.text(function(d){ return d.service; });
			
		feedEnter.append("div")
			.attr("class", "country")
			.text(function(d){ return d.country; });
		
		feeds.exit().remove();*/
		
		return feedlist;
	};
	
	return feedlist;
}

function subObject(obj, keys){
	var res = {};
	keys.forEach(function(key){
		res[key] = obj[key];
	});
	return res;
}

/**
 * ------- updateDetails --------
 * Updates static information (not driven by d3) of the detail
 * section in order to be aligned to d3's data displayed
 */
function updateDetails(){
	var title = d3.select("#name")
		.text(regionSelected.name);
}


/**
 * ------- onResize --------
 * Function called to each resize of the main windows to scale
 * all the elements to the new dimensions
 */
function onResize(){
	// Update new dimensions
	var width = $(window).width();
	var height = $(window).height();
	
	// Dispatch a resize event to all the elements
	dispatch.resize(width, height);
	
	// If a region was selected, updates also each chart
//	if(regionSelected.name)
//		dispatch.regionChange();
	
	//TODO: completare
}

/**
 * ------- Entry point --------
 * Function invoked at the end of asynchronous script
 * and object fetches through the network.
 */
$(document).ready(function(){
	// Declering dispatch possible events
	dispatch = d3.dispatch("load", "regionChange", "updateFeedback","resize");

	// Registering events
//	$(window).resize(onResize);
	dispatch.on("load.map", mapBuild);
	dispatch.on("load.coffee.fun", coffeeCompBuild);
	dispatch.on("load.coffee.consume", coffeeConsumeBuild);
	dispatch.on("load.turist", turistNationalityBuild);
	dispatch.on("load.sentiment", sentimentBuild);
	dispatch.on("regionChange.details", updateDetails);
	
	// Loading all data TODO: aggiungere progress bar?
	queue()
		.defer(d3.csv, coffeeConsumeUrl)
		.defer(d3.csv, coffeeCompUrl)
		.defer(d3.csv, turistCompUrl)
		.defer(d3.csv, sentimentUrl)
		.defer(d3.json, mapUrl)
		.defer(d3.csv, rankingUrl)
		.await(function(error, _coffeeConsume, _coffeeFan, _turist, _sentiment, _ita, _ranking){
			if(error){
				console.err(error);
				return error;
			}

			feedback = crossfilter(_sentiment);
			
			
			// Binding data
			coffeeConsume = _coffeeConsume;
			coffeeFan = _coffeeFan;
			turist = _turist;
			sentiment = _sentiment;
			ita = _ita;
			ranking = _ranking;
			
			// Once data is loaded, building up...
			dispatch.load();
		});
});
