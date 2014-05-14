/**
 * ============================================
 *  Enable the management of the feedbacks.
 *  
 *  Allow to render charts, bullet charts and
 *  the list of all the feedback.
 *  It is based on the crossfilter library
 * ============================================
 */

var hlist = false;

function tableChart(divname){
	var feedlist = {};
	
	var dateFormat = d3.time.format("%e %b %Y");
	
	var data = [],
		keys = [];
	
	var table = d3.select("#" + divname);
	
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
		
		table.select("tbody").selectAll("tr").remove();
		var feeds = table.select("tbody").selectAll("tr").data(data);
		
		// create rows
		var tr = feeds.enter().append("tr");
		 
		// cells
		var td = tr.selectAll("td")
			.data(function(d, i){ return d; })
			.enter().append("td")
			.text(function(d) {
				if(d.key === "date") return dateFormat(d.value);
				if(d.value == undefined) return "Unavailable";
				if(!isNumeric(d.value)) return +d.value;
				return d.value; });
		
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
		
	var headers = ["rank", "stars", "facilities", "feeds"];
	var tabname = "hotel-table";
	
	var table = tableChart(tabname).keys(headers);
	
	var limit = 50,
		dimension = null,
		group = null,
		data = [],
		updateCallback = null,
		selected = false,
		thickness = 40;
	
	var x = d3.scale.linear()
		.domain([0, 5])
		.range([0, width]);
	
	var y = d3.scale.ordinal()
		.rangeRoundBands([0, height], .5);
	
	var div = d3.select("#hotels").append("div");
	
	var floatFormat = d3.format(".2r");
	
	var countDiv = d3.select("#hotels-number");
	
	function clicked(hotel, div){
		var id = hotel.stars;

		if(selected === id || id === null){
			selected = null;
			d3.selectAll("tr").classed("active", false);
			return;
		}
		
		selected = id;
		d3.selectAll("tr").classed("active", function(d) { return d[1].value === id; });
		updateCallback(hotel, div);
	}
	
	list.render = function(){
		// Retrieve only the hotel whose value is != 0, so they belong to selected region
		var hotelInRegion = data.filter(function(d){ return d.value.count; })
			.map(function(d){ return {rank:floatFormat(d.value.rank), stars: d.key, facilities:0, feeds:d.value.count}; });
		
		table.data(hotelInRegion).render();
		
		var entry = d3.select("#"+tabname).selectAll("tr");
		
		entry
			.on("mouseover", function(d){
				if(!selected){
					hlist = true;
					updateCallback({rank: d[0].value, stars: d[1].value}, this);
				}
			})
			.on("mouseout", function(d){
				if(!selected){
					hlist = true;
					updateCallback({rank: 0, stars: null}, this);
				}
			})
			.on("click", function(d){
				hlist = true;
				clicked({rank: d[0].value, stars: d[1].value}, this);
			});
		
		countDiv.text(hotelInRegion.length);
	};
	
	list.show = function(visible){
		if(visible){
			div.transition()
			.duration(100)
			.style("opacity", 1)
			.each("start", function(){
				div.style("display", "block");
			});
		} else {
			div.transition()
			.duration(100)
			.style("opacity", 0)
			.each("end", function(){
				div.style("display", "none");
			});
		}
		
		countDiv.text("NA");
		
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
	
	list.clearSelection = function(){
		selected = false;
		return list;
	};
	
	return list;
}

function isNumeric(obj) {
    return obj - parseFloat(obj) >= 0;
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
	
	var keys = ["flavor", "freshness", "temperature", "service"],
		tableHeaders = ["date", "flavor", "freshness", "temperature", "service", "country"],
		limit = Infinity,
		region = null,
		hotel = null,
		country = null;
		
	var turistDiv = "turist-chart",
		sentimentDiv = "feedback",
		feedListDiv = "feedback-table",
		trendDiv = "trend-analysis";
	
	var hotels = hotelList()
		.update(hotelChange);
	
	var turistChart = verticalBarChart(turistDiv)
		.height(100).width(256)
		.color(d3.scale.linear()
			.range(["#6685e0", "#001a4c"])
			.domain([0, 10]))
		.formatText(d3.format("Kg"))
		.callback(function(d, c){
			//d3.select(c).classed("over", d != null);
			fb.filterCountry(d).renderAll();
		});
	
	var sentiment = bulletChart(sentimentDiv)
		.thickness(15)
		.width(200)
		.heigth(50);
	
//	var feedList = tableChart(feedListDiv).keys(tableHeaders);
	
	var trend = lineChart(trendDiv)
		.x(function(d){ return d.key; })
		.y(function(d){ return d.value.rank; })
		.filter(function(e){ fb.filterDate(e).renderAll(); });
	
//	var rank = rankChart("rank");
	var formatDate = d3.time.format("%Y-%m-%d");
	
	// Parses records to cast fields
	data.forEach(function(d){
		d.date = formatDate.parse(d.date);
		d.stars = +d.stars;
		d.rooms = +d.rooms;
		d.region = +d.region;
		keys.forEach(function(k){
			d[k] = +d[k];
		});
	});
	
	// Create crossfilter and dimensions to filter feedbacks
	 feedback = crossfilter(data),
		feedbackByRegion = feedback.dimension(function(d){ return d.region; }),
//		feedbackByHotel = feedback.dimension(function(d){ return d.hotel; }),
//		feedbackByHotelFilter = feedback.dimension(function(d){ return d.hotel; }),
		feedbackByCountry = feedback.dimension(function(d){ return d.country; }),
		feedbackByDate = feedback.dimension(function(d){ return d.date; }),
		feedbackByStars = feedback.dimension(function(d){ return d.stars; }),
//		feedbackByRooms = feedback.dimension(function(d){ return d.rooms; }),
		
		feedbackByKey = {},
		groupByKey = {},
		keys.forEach(function(key){
			feedbackByKey[key] = feedback.dimension(function(d){ return d[key]; });
			groupByKey[key] = feedbackByKey[key].groupAll();
		}),
		feedbackByKey.group = function(){
			var res = [];
			
			keys.forEach(function(key, idx){
				var sum = groupByKey[key].reduceSum(function(d){ return +d[key]; }).value();
				var count = groupByKey[key].reduceCount().value();
				var extent = d3.extent(feedbackByKey[key].top(Infinity), function(d){ return +d[key]; });
				res.push({key:key, sum:sum, count:count, mean:sum/count, ranges:extent});
			});

			return res;
	 };
		groupByCountry = feedbackByCountry.group(),
//		groupByHotel = feedbackByHotel.group(),
		groupByStars = feedbackByStars.group(),
		groupBullet = feedbackByStars.groupAll(),
//		groupAllHotelFiltered = feedbackByHotelFilter.groupAll();
//		groupAllHotel = feedbackByHotel.groupAll(),
		groupByRegion = feedbackByRegion.group(),
		groupAllRegion = feedbackByRegion.groupAll(),
		groupByDate = feedbackByDate.group(d3.time.day);
		
	groupBullet.reduce(reduceBulletAdd, reduceBulletRemove, reduceBulletInit);
//	groupAllHotelFiltered.reduce(reduceBulletAdd, null, reduceBulletInit);
//	groupByHotel.reduce(reduceToRankAdd, reduceToRankRemove, reduceToRankInit).order(function(p){ return p.rank; });
	groupByStars.reduce(reduceToRankAdd, reduceToRankRemove, reduceToRankInit).order(function(p){ return p.rank; });
	groupByCountry.reduceCount();
	groupByDate.reduce(reduceToRankAdd, reduceToRankRemove, reduceToRankInit).order(function(p){ return +p.key; });
	regionRank = feedbackByRegion.groupAll().reduce(reduceToRankAdd, reduceToRankRemove, reduceToRankInit);
	
	/* ---- reduce functions ----*/
	function reduceToRankAdd(p, v){
		var mean = 0;
		keys.forEach(function(key){
			var a = +v[key];
			mean += a;
		});
		
		mean /= keys.length;
		p.rank += (mean - p.rank) / ++p.count;
		return p;
	}
	
	function reduceToRankRemove(p, v){
		var mean = 0;
		keys.forEach(function(key){
			var a = +v[key];
			mean += a;
		});
		
		mean /= keys.length;
		p.count--;
		if(!p.count){
			p.rank = 0;
			return p;
		}
		p.rank = (((p.count+1) * p.rank) - mean) / p.count;
		return p;
	}
	
	function reduceToRankInit(){
		return {rank:0, count:0};
	}
	
	function reduceBulletAdd(p, v){
		keys.forEach(function(key){
			var obj = p[key];
			var m = obj.bullet.measures;
			var r = obj.bullet.ranges;
			var a = +v[key];
			
			m[0] += (a - m[0]) / ++obj.count;	// mean

			if (a <= obj.min())
				obj.extents.unshift(a);
			if (a >= obj.max())
				obj.extents.push(a);

			r[0] = obj.min();
			r[1] = obj.max();
		});

		return p;
	}

	function reduceBulletRemove(p, v){
		keys.forEach(function(key){
			var obj = p[key];
			var m = obj.bullet.measures;
			var r = obj.bullet.ranges;
			var a = +v[key];

			m[0] = (obj.count * m[0]) - a / --obj.count;	// mean

			var index = obj.extents.indexOf(a);
			if (index >= 0)
				obj.extents.splice(index, 1);

			r[0] = obj.min();
			r[1] = obj.max();
		});

		return p;
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
				count: 0,
				extents: [],
				max: function() {
				      return (this.extents.length > 0) ? this.extents[this.extents.length - 1] : null;
				    },
			    min: function() {
			      return (this.extents.length > 0) ? this.extents[0] : null;
			    }
			};
		});
		
		return p;
	}
	/* ---- ---------------- ----*/
	
	function sentimentBullets(){
		var regionValue,
			hotelValue;

		// Get region values
		feedbackByStars.filterAll();
		regionValue = feedbackByKey.group();
		
		// Filter feedbacks by hotel type
		feedbackByStars.filter(hotel);
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
	
	fb.filterDate = function(extent){
		if(!extent){
			feedbackByDate.filterAll();
			extent = d3.extent(feedbackByDate.top(Infinity), function(d){ return d.date; });
		} else
			feedbackByDate.filterRange(extent);
		
		d3.select("#date-extent")
			.text(function(){ return extent[0].toLocaleDateString() + " - " + extent[1].toLocaleDateString(); });
		
		return fb;
	};
	
	fb.renderAll = function(){
		sentiment
			.data(sentimentBullets())
			.render();
		
		/*feedList
			.data(feedbackByHotel.top(limit)
					.sort(function(a, b){ return +a.date - +b.date; }))
			.render();*/
		
		turistChart
			.data(groupByCountry.all())
			.render();
		
		trend
			.data(groupByDate.all()
					.filter(function(d){ return d.value.count + d.value.rank; })
					.sort(function(a, b){ return a.key.getTime() - b.key.getTime(); }))
			.render();
		
		/*rank.data(regionRank.value().rank)
			.render();*/
		
		if(!hlist) {
			hotels.clearSelection()
				.data(groupByStars.top(5))
				.render();
		}
		hlist = false;
		
		return fb;
	};
	
	fb.renderHList = function(){
		hotels
			.data(groupByStars.top(5))
			.render();
		return fb;
	};
	
	function hotelChange(hotel, context){
		var stars = hotel.stars;
		
		fb.filterHotel(stars);
		fb.renderAll();
	}
	
	function regionChange(name){
		fb.filterRegion(name);
		fb.filterHotel(null);
		fb.renderAll();
	}
	
	// Init filters
	fb.filterRegion(null);
	fb.filterHotel(null);
	fb.filterCountry(null);
	fb.filterDate(d3.extent(feedbackByDate.top(Infinity), function(d){ return d.date; }));
	
	return fb;
}
