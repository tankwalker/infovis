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

var feedbackByRegion,
	feedbackByHotel,
	feedbackByHotelFilter,
	feedbackByCountry,
	feedbackByKey;

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
		var div = d3.select("#sentiment");
		
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
			
			// List all the hotel for the selected region
			feedback.filterRegion(regionSelected.name)
				.filterHotel(null)
				.visible(true)
				.renderAll()
				.renderHList();
			
			// Show the sentiment section
			div.transition()
				.duration(duration)
				.style("opacity", 1)
				.each("start", function(){
					div.style("display", "block");
				});
			
			// Dispatch the stateChange event to update all the charts
			dispatch.regionChange(regionSelected.name);

			// otherwise clear the selections
		} else {
			x = width / 2;
			y = height / 2;
			zoom = 1;
			
			regionSelected.name = null;
			regionSelected.path = null;
			regionSelected.focus = false;
			
			// Hide the sentiment section
			div.transition()
				.duration(duration)
				.style("opacity", 0)
				.each("end", function(){
					div.style("display", "none");
				});
			
			// Clear sentiment analysis section
			feedback
				.filterRegion(null)
				.filterHotel(null)
				.visible(false);
			dispatch.updateFeedback(null);
			
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
		if(regionSelected.focus)
			return;
		
		// Mouse is exited from map and no selection was made
		if(region == null){
			sub.selectAll("path")
				.classed("highlight", false);
			
			feedback.filterRegion(null);
		} else {
		
		// Select the region
			var regionName = region.properties.name;

			regionSelected.name = regionName.capitalize();
			regionSelected.path = region;
			regionSelected.focus = false;

			sub.selectAll("path")
				.classed("highlight", regionSelected && function(d){ return d === regionSelected.path; });
	
			// List all the hotel for the selected region
			feedback.filterRegion(regionSelected.name)
				.filterHotel(null)
				.renderTurist();
			
			// Dispatch the stateChane event to update all the charts
			dispatch.regionChange(regionSelected.name);
		}
	};
	
	
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
	
	var pack = packInfo(coffeeFan, ["region"]); // TODO: come è fatto l'oggetto?

	var color = d3.scale.linear() //TODO: colori!
		//.range(["#ffcc00", "#cc9900", "#664c00", "#523d00", "#cc6600", "#8f4700", "#4c3300"])
		.range(["#ffcc00", "#4c3300"])
		.domain([0, pack.keys.length]);

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

;

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
	
	var color = d3.scale.linear()
		//.range(["#4c2511", "#8f4700", "#cc6600"])
		.range(["#4c2511", "#cc6600"])
		.domain([0, pack.keys.length]);

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
 		/*svg.selectAll(".bar").data(pack.keys)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", 0)
			.attr("y", 25)
			.attr("width", 0)
			.attr("height", barThickness)
			.style("fill", function(d, i){ return color(i); });*/
 		
 		svg.selectAll(".bar").data(pack.keys)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", 0)
			.attr("y", 0)
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
			.text(function(d){ return percentage(((d.y) - (d.y0)) / data.total); });
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
			
//			feedbacksInit(_sentiment);
			feedback = feedback(_sentiment);
			
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
