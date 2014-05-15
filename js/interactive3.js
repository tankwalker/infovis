var coffeeCompUrl = "csv/coffees.csv",
	coffeeConsumeUrl = "csv/consume.csv",
	hotelsUrl = "csv/hotels2.csv",
	turistCompUrl = "csv/turist.csv",
	mapUrl = "json/ita2.json",
	rankingUrl = "csv/ranking.csv",
	sentimentUrl = "csv/sentiment2.csv";

var regionSelected = {id: 0, name: "Italia", focus: false, path: null};

var ita,
	coffeeFan,
	coffeeConsume,
	facilities,
	turist,
	ranking,
	sentiment,
	feedback;

var window = {};
window.w = $(window).width();
window.h = $(window).height();

var detailDim = {ratio:0.2, min:256, max:500};	// Min, max Width and ratio of the details section relative to the window's one
var mapDim = {ratio:0.45, min:320, max:800};		// Min, max Width and ratio of the map section relative to the window's one

var duration = 350;				// Duration of transitions
var barThickness = 20;			// Thickness of the bars in each bar chart

var dispatch;					// Dispatcher of events

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
	var width = 320,
		height = width;

	var projection = d3.geo.albers()
		.center([0, 42])
        .rotate([347, 0])
        .parallels([35, 45])
        .scale(height * 5)
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
	
	circles = gcircles.selectAll(".ranking")
		.data(ranking)
		.enter().append("circle")
			.attr("class", "ranking");
	
	function drawMap(){
		sub.selectAll(".region")
			.attr("d", path);
		
		gcircles.selectAll(".ranking")
			.attr("r", function(d){return 3/*d.values.value * 3*/;}) //TODO: area in funzione del feedback rate
			.attr("cx", function(d){return projection(d.values.coordinates)[0];})
			.attr("cy", function(d){return projection(d.values.coordinates)[1];});
	};
	drawMap();
	
	function selected(region){
		var x, y, zoom;
		var div = d3.select("#sentiment");
		
		// Select the region
		// If there is still a selected region or the current one has not a focus
		// and so it have not beening selected yet, then selects it (thus acquire the focus)
		if(regionSelected.path !== region || !regionSelected.focus){
			var center = path.centroid(region);
			var name = region.properties.name;
			var id = region.properties.id;

			x = center[0];
			y = center[1];
			zoom = 2;
			
			regionSelected.name = name.capitalize();
			regionSelected.path = region;
			regionSelected.id = id;
			regionSelected.focus = true;
			
			// List all the hotel for the selected region
			feedback.filterRegion(regionSelected.id)
				.filterHotel(null)
				.renderAll();
			
			// Show the sentiment section
			/*div.transition()
				.duration(duration)
				.style("opacity", 1);*/
			
			// Dispatch the stateChange event to update all the charts
			dispatch.regionChange(regionSelected.id);

			// otherwise clear the selections
		} else {
			x = width / 2;
			y = height / 2;
			zoom = 1;
			
			regionSelected.name = null;
			regionSelected.path = null;
			regionSelected.id = null;
			regionSelected.focus = false;
			
			// Hide the sentiment section
			/*div.transition()
				.duration(duration)
				.style("opacity", 0);*/
			
			// Clear sentiment analysis section
			feedback
				.filterRegion(null)
				.filterHotel(null)
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
			
			feedback.filterRegion(null)
				.filterHotel(null)
				.renderAll();
			
			regionSelected.name = "Italia";
			regionSelected.id = 0;
			
		} else {
		
		// Select the region
			var regionName = region.properties.name;
			var id = region.properties.id;

			regionSelected.name = regionName.capitalize();
			regionSelected.path = region;
			regionSelected.id = id;
			regionSelected.focus = false;

			sub.selectAll("path")
				.classed("highlight", regionSelected && function(d){ return d === regionSelected.path; });
	
			// List all the hotel for the selected region
			feedback.filterRegion(regionSelected.id)
				.filterHotel(null)
				.renderAll();
		}
			
			// Dispatch the stateChane event to update all the charts
			dispatch.regionChange(regionSelected.id);
	};
	
	
	function resize (w, h){
		var dim = Math.min(w, h);
		
		width = dim * mapDim.ratio,
		height = width * 3/4;
		
		svg.attr("width", width)
			.attr("height", height);
		
		projection
			.translate([width/2, height/2])
			.scale(height*4);
		
		drawMap();
	};
	
	feedback.filterRegion(null)
				.filterHotel(null)
				.renderAll();
	dispatch.regionChange(0);
	
//	dispatch.on("resize.map", resize);
}


/**
 * Builds the chart which represents the composition of coffee
 * consumption in the selected region
 */
function coffeeCompBuild(){
	var width = detailDim.min,
		height = width / 3,
		multiple = 10000;
	
	coffeeFan.forEach(function(d){
		d3.keys(d).forEach(function(k){
			if(!isNaN(d[k]))
				d[k] = +d[k];
		});
	});
	
	var xcoffee = crossfilter(coffeeFan);
	var coffeeByRegion = xcoffee.dimension(function(d){ return d.region; });
	
	var color = d3.scale.linear()
		.range(["#ffcc00", "#4c3300"])
		.domain([0, 10]);
	
	var bar = d3.scale.linear()
		.domain([0, 1000]);

	var numberFormat = d3.format(",.0f");
	var kgFormat = function(d){ return numberFormat(d) + " Kg"; };
	
	var chart = barChart("fan-chart")
		.width(width)
		.height(height)
		.bar(bar)
		.color(color)
		.formatText(kgFormat);
	
	function stateChange(region){
		var data = d3.entries(coffeeByRegion.filter(region).top(1)[0]).filter(function(d){ return d.key !== "region" && d.key !== "name"; });
		
		var max = d3.max(data, function(d){ return +d.value; });
		max = parseInt((max + multiple - 1) / multiple) * multiple;

		chart.bar().domain([0, max]);		
		chart.data(data)
			.clearSelection()
			.render();
		
		d3.select("#sold-magnitude").text(max);
	}
	
	function resize(w, h){
		chart.render();
	}

	dispatch.on("regionChange.coffee.fan", stateChange);
//	dispatch.on("resize.coffee.fan", resize);
	
	return chart;
};

;

/**
 * Build the chart representing the consume percentage of coffee
 * with respect to the state's total
 */
function coffeeConsumeBuild(){
	var width = detailDim.min,
		height = width / 3;
	
	coffeeConsume.forEach(function(d){
		d3.keys(d).forEach(function(k){
			if(!isNaN(d[k]))
				d[k] = +d[k];
		});
	});
	
	var xcoffee = crossfilter(coffeeConsume);
	 coffeeByRegion = xcoffee.dimension(function(d){ return d.region; }),
		coffeeTotal = coffeeByRegion.group(),
		procapita = xcoffee.dimension(function(d){ return d.procapita; });
	
	var bar = d3.scale.linear()
		.domain([0, 1]);
	
	var color = d3.scale.linear()
		.range(["#4c2511", "#cc6600"])
		.domain([0, 10]);

	var percentage = d3.format(".1%");

	var chart = barChart("consume-chart")
		.width(width)
		.height(height)
		.bar(bar)
		.color(color)
		.formatText(percentage);
	
	function stateChange(region){
		var total = coffeeByRegion.filter(0).top(1)[0].green;
		var data = d3.entries(coffeeByRegion.filter(region).top(1)[0]).filter(function(d){
			return d.key === "green" || d.key === "roasted" || d.key === "soluble" || d.key === "frozen";
		});
		
		var green = data.filter(function(d){ return d.key === "green"; })[0].value;
		/*data.forEach(function(d){ total += +d.value; });
		data.forEach(function(d){ d.value /= total; });*/
		data.forEach(function(d){
			d.value /= total;
			d.key = d.key.capitalize();
		});
		
		chart.data(data)
			.clearSelection()
			.render();
	}

	function resize(w, h){
		chart.render();
	}
	
	dispatch.on("regionChange.coffee.consume", stateChange);
//	dispatch.on("resize.coffee.consume", resize);
	
	return chart;
};


/**
 * ------- updateDetails --------
 * Updates static information (not driven by d3) of the detail
 * section in order to be aligned to d3's data displayed
 */
function updateDetails(){
	// Title
	d3.select("#region-name")
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
	dispatch = d3.dispatch("load", "regionChange", "updateFeedback","resize");	//TODO: da rivedere quali eventi lasciare

	// Registering events
	$(window).resize(onResize);		//TODO: da implementare
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
		.defer(d3.csv, hotelsUrl)
		.await(function(error, _coffeeConsume, _coffeeFan, _turist, _sentiment, _ita, _ranking, _hotels){
			if(error){
				console.err(error);
				return error;
			}
			
			// Binding data
			coffeeConsume = _coffeeConsume;
			coffeeFan = _coffeeFan;
			ita = _ita;
			ranking = _ranking;
			facilities = _hotels;

			feedback = feedback(_sentiment);
			
			// Once data is loaded, building up...
			dispatch.load();
		});
});
