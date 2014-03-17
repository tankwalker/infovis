/**
 * ============================================
 *  Enable the management of the feedbacks.
 *  
 *  Allow to render charts, bullet charts and
 *  the list of all the feedback.
 *  It is based on the crossfilter library
 * ============================================
 */

function feedbackList(){
	var feedlist = {};
	
	var numberFormat = d3.format(".2r"),
		dateFormat = d3.time.format("%e / %m / %Y");
	
	var data = [],
		keys = [];
	
	var table = d3.select("#feedback-table");
	
	feedlist.keys = function(_keys)	{
		if(!arguments.length)
			return keys;

		keys = _keys;
		return feedlist;
	};
	
	feedlist.render = function(){
		// create the table header
		var thead = table.select("thead").selectAll("th")
			.data(keys)
			.enter().append("th").append("span")
				.text(function(d){ return d.capitalize(); });
		
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
		
		return feedlist;
	};
	
	feedlist.data =  function(_data){
		if(!arguments.length)
			return data;
		
		data = _data.map(function(d){
			return d3.entries(subObject(d, keys));
		});
		return feedlist;
	};
	
	return feedlist;
}

/**
 * Returns the list of all available hotels in the
 * selected region.
 */
function hotelList(){
	var list = {};
	
	var width = 200,
		height = 400,
		margin = {left:10, top:10, right:10, bottom:10};
	
	var limit = 50,
		dimension = null,
		group = null,
		data = [],
		updateCallback = null,
		selected = false;
	
	var svg = d3.select("#hotels").append("div");
	var countDiv = d3.select("#hotels-number");
	
	function clicked(name, div){
		if(selected === name){
			selected = null;
			d3.selectAll(".entry").classed("active", false);
			return;
		}
		
		selected = name;
		d3.selectAll(".entry").classed("active", function(d) { return d.key === name; });
		updateCallback(name, div);
	}
	
	list.render = function(){
		// Retrieve only the hotel whose value is != 0, so they belong to selected region
		var hotelInRegion = data.filter(function(d){ return d.value.count; });
		
		var entry = svg.selectAll(".entry").data(hotelInRegion, function(d){ return d.key; });
		
		// Adds new hotel names into the list belonging to the choosed region
		entry.enter().append("div")
			.attr("class", "entry")
			.text(function(d){ return d.key.capitalize(); })
			.on("mouseover", function(d){ if(!selected) updateCallback(d.key, this); })
			.on("mouseout", function(d){ if(!selected) updateCallback(null, this); })
			.on("click", function(d){ clicked(d.key, this); });
		
		countDiv
			.text(hotelInRegion.length);
		
		// And removes the old one that do not belong to the selected region
		entry.exit().remove();
	};
	
	list.show = function(visible){
		if(visible){
			svg.transition()
			.duration(100)
			.style("opacity", 1)
			.each("start", function(){
				svg.style("display", "block");
			});
		} else {
			svg.transition()
			.duration(100)
			.style("opacity", 0)
			.each("end", function(){
				svg.style("display", "none");
			});
		}
		
		countDiv
			.text("NA");
		
		return list;
	};
	
	list.update = function(_method){
		if(!_method)
			return list;
		
		updateCallback = _method;
		return list;
	};
	
	list.limit = function(_limit){
		if(!arguments.length)
			return limit;
		
		limit = _limit;
		return list;
	};
	
	list.group = function(_group){
		if(!arguments.length)
			return group;
		
		group = _group;
		return list;
	};
	
	list.data = function(_data){
		if(!arguments.length)
			return data;
		
		data = _data;
		return list;
	};
	
	list.dimension = function(_dimension){
		if(!arguments.length)
			return dimension;
		
		dimension = _dimension;
		return list;
	};
	
	list.filter = function(_filter){
		if(!arguments.length || !_filter)
			dimension.filterAll();
		else
			dimension.filter(_filter);
		return list;
	};
	
	return list;
}

function subObject(obj, keys){
	var res = {};
	keys.forEach(function(key){
		res[key] = obj[key];
	});
	return res;
}

function feedback(data){
	var fb = {};
	
	var keys = ["flavour", "freshness", "temperature", "service"],
		tableHeaders = ["date", "flavour", "freshness", "temperature", "service", "country"],
		limit = Infinity,
		region = null,
		hotel = null,
		country = null;
		
	var turistDiv = "turist-chart",
		sentimentDiv = "feedback",
		feedListDiv = "feedback-table";
	
	var hotels = hotelList()
		.update(hotelChange);
	var turistChart = barChart(turistDiv)
		.bar(d3.scale.linear()
			.domain([0, 1000]))
		.pos(d3.scale.ordinal()
			.domain([0, 10]))
		.color(d3.scale.linear()
			.range(["#6685e0", "#001a4c"])
			.domain([0, 10]));
	var sentiment = bulletChart(sentimentDiv);
	var feedList = feedbackList(feedListDiv).keys(tableHeaders);
	
	// Create crossfilter and dimensions to filter feedbacks
	var feedback = crossfilter(data),
		feedbackByRegion = feedback.dimension(function(d){ return d.region; }),
		feedbackByHotel = feedback.dimension(function(d){ return d.hotel; }),
		feedbackByHotelFilter = feedback.dimension(function(d){ return d.hotel; }),
		feedbackByCountry = feedback.dimension(function(d){ return d.country; }),
		feedbackByKey = {
			group:function(){
				var res = [];

				keys.forEach(function(key, idx){
					var sum = feedbackByKey[key].groupAll().reduceSum(function(d){ return +d[key]; }).value();
					var count = feedbackByKey[key].groupAll().reduceCount().value();
					var extent = d3.extent(feedbackByKey[key].top(Infinity), function(d){ return +d[key]; });
					res.push({key:key, sum:sum, count:count, mean:sum/count, ranges:extent});
				});

				return res;
			},
		};
		keys.forEach(function(key){
			feedbackByKey[key] = feedback.dimension(function(d){ return d[key]; });
		}),
		groupByCountry = feedbackByCountry.group(),
		groupByHotel = feedbackByHotel.group(),
		groupAllHotelFiltered = feedbackByHotelFilter.groupAll();
		groupAllHotel = feedbackByHotel.groupAll(),
		groupByRegion = feedbackByRegion.group(),
		groupAllRegion = feedbackByRegion.groupAll();
		
	groupAllHotel.reduce(reduceBulletAdd, null, reduceBulletInit),
	groupAllHotelFiltered.reduce(reduceBulletAdd, null, reduceBulletInit),
	groupByHotel.reduce(reduceToRankAdd, reduceToRankRemove, reduceToRankInit).order(function(p){ return p.rank; }),
	groupByCountry.reduceCount();
	
	/* ---- reduce functions ----*/
	function reduceToRankAdd(p, v){
		keys.forEach(function(key){
			var a = +v[key];
			p.rank += (a - p.rank) / ++p.count;
		});
		
		return p;
	}
	
	function reduceToRankRemove(p, v){
		keys.forEach(function(key){
			var a = +v[key];
			p.rank = ((p.count * p.rank) - a) / --p.count;
		});
		
		return p;
	}
	
	function reduceToRankInit(){
		return {rank:0, count:0};
	}
	
	function reduceBulletAdd(p, v){
		keys.forEach(function(key){
			var m = p[key].bullet.measures;
			var r = p[key].bullet.ranges;
			var a = +v[key];
			
			m[0] += (a - m[0]) / ++p[key].count;	// mean
			if(r[0] > a || !r[0]) r[0] = a;			// min
			if(r[1] < a) r[1] = a;					// max
		});
		
		return p;
	}

	function reduceBulletRemove(p, v){
		keys.forEach(function(key){
			var m = p[key].bullet.measures;
			var r = p[key].bullet.ranges;
			var a = +v[key];
			
			m[0] = (p.count * m[0]) - a/ --p[key].count;	// mean
			if(r[0] > a || !r[0]) r[0] = a;					// min
			if(r[1] < a) r[1] = a;							// max
		});
		
		return null;
	}

	function reduceBulletInit(){
		var p = {};
		
		keys.forEach(function(key){
			p[key] = {
				bullet: {
					measures: [0],
					ranges: [0, 0, 5],
					markers: [0]
				},
				count: 0
			};
		});
		
		return p;
	}
	/* ---- ---------------- ----*/
	
	function sentimentBullets(){
		var regionValue,
			hotelValue;

		// To get region values
		feedbackByHotel.filterAll();
		regionValue = feedbackByKey.group();
		
		// Filter feedbacks by hotel
		feedbackByHotel.filter(hotel);
		hotelValue = feedbackByKey.group();
		
		var bullets = {};
		keys.forEach(function(key, idx) {
			hotelValue[idx].ranges.push(5);
			var bullet = {
					measures:[hotelValue[idx].mean],
					ranges:hotelValue[idx].ranges,
					markers:[regionValue[idx].mean]
				};
			bullets[key] = {
				bullet: bullet,
				count: hotelValue[idx].count
			};
		});
		return bullets;
	}
	
	/*function sentimentBullets2(){
		var bRegion,
			bHotel;
		
		bRegion = groupAllHotel.value();
		bHotel = groupAllHotelFiltered.value();
		
		d3.keys(bHotel).forEach(function(key){
			bHotel[key].bullet.markers[0] = bRegion[key].bullet.measures[0];
		});
		
		return bHotel;
	}*/
	
	function feedbacks(){
		return feedbackByHotel.top(limit);
	}
	
//	function hotelRanks(){
//		return groupByHotel.reduce(reduceToRankAdd, null, reduceToRankInit).all();
//	}
	
	fb.keys = function(_keys){
		if(!arguments.length)
			return keys;
		keys = _keys;
		return fb;
	};
	
	fb.filterRegion = function(_filter){
		if(!arguments.length){
			region = null;
		}
		region = _filter;
		feedbackByRegion.filter(region);
		return fb;
	};
	
	fb.filterHotel = function(_filter){
		if(!arguments.length){
			hotel = null;
		}
		hotel = _filter;
//		feedbackByHotel.filter(hotel);
//		feedbackByHotelFilter.filter(hotel);
		return fb;
	};
	
	fb.filterCountry = function(_filter){
		if(!arguments.length){
			country = null;
		}
		country = _filter;
		feedbackByCountry.filter(country);
		return fb;
	};
	
	fb.renderAll = function(){
		sentiment
			.data(sentimentBullets())
			.render();
		
		feedList
			.data(feedbacks())
			.render();
		return fb;
	};
	
	fb.renderHList = function(){
		hotels
			.data(groupByHotel.all())
			.show(true)
			.render();
		return fb;
	};
	
	fb.renderTurist = function(){
		turistChart
			.data(groupByCountry.all())
			.render();
	};
	
	fb.visible = function(_bool){
		// Show/hide the sentiment section
		d3.select(sentimentDiv).transition()
			.duration(duration)
			.style("opacity", _bool ? 1 : 0)
			.each("start", function(){
				div.style("display", _bool ? "block" : "none");
		});
		
		hotels.show(_bool);
		return fb;
	};
	
	function hotelChange(name, context){
		console.log(name);
		fb.filterHotel(name);
		fb.renderAll();
	}
	
	function regionChange(name){
		fb.filterRegion(name);
		fb.filterHotel(null);
		fb.renderAll();
	}
	
//	dispatch.on("regionChange.feedback", regionChange);
	
	return fb;
}