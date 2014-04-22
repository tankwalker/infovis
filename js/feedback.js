/**
 * ============================================
 *  Enable the management of the feedbacks.
 *  
 *  Allow to render charts, bullet charts and
 *  the list of all the feedback.
 *  It is based on the crossfilter library
 * ============================================
 */

function tableChart(divname){
	var feedlist = {};
	
	var numberFormat = d3.format(".2r"),
		dateFormat = d3.time.format("%e %b %Y");
	
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
		
		var feeds = table.select("tbody").selectAll("tr").data(data);
		
		// create rows
		var tr = feeds.enter().append("tr");
		 
		// cells
		var td = tr.selectAll("td")
			.data(function(d, i){ return d;})
			.enter().append("td")
			.text(function(d) {
				if(d.key === "date") return dateFormat(d.value);
				if(d.value == undefined) return "Unavailable";
				if(!isNaN(d.value)) return numberFormat(+d.value);
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
		
	var headers = ["nome", "rank", "feeds"];
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
	
	var format = d3.format(".2r")
	
	var countDiv = d3.select("#hotels-number");
	var hotelNameDiv = d3.select("#hotel-name");
	
	function clicked(hotel, div){
		var name = hotel.name;

		if(selected === name || name === null){
			selected = null;
			d3.selectAll(".entry").classed("active", false);
			return;
		}
		
		selected = name;
		d3.selectAll(".entry").classed("active", function(d) { return d.key === name; });
		updateCallback(hotel, div);
	}
	
	list.render = function(){
		// Retrieve only the hotel whose value is != 0, so they belong to selected region
		var hotelInRegion = data.filter(function(d){ return d.value.count; })
			.map(function(d){ return {nome: d.key, rank:d.value.rank, feeds:d.value.count}; });
		
		table.data(hotelInRegion).render();
		
		var entry = d3.select("#"+tabname).selectAll("tr");
		
		entry
			.on("mouseover", function(d){
				if(!selected){
					updateCallback({name: d[0].value, rank: d[1].value}, this);
					hotelNameDiv.text(d[0].value);
				}
			})
			.on("mouseout", function(d){
				if(!selected){
					updateCallback({name: null, rank:0}, this);
					hotelNameDiv.text("Regione");
				}
			})
			.on("click", function(d){
				clicked({name: d[0].value, rank: d[1].value}, this);
				hotelNameDiv.text(d[0].value);
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
			d3.select(c).classed("over", d != null);
			fb.filterCountry(d).renderAll();
		});
	
	var sentiment = bulletChart(sentimentDiv)
		.thickness(15)
		.width(200)
		.heigth(50);
	
	var feedList = tableChart(feedListDiv).keys(tableHeaders);
	
	var trend = lineChart(trendDiv)
		.x(function(d){ return d.key; })
		.y(function(d){ return d.value.rank; })
		.filter(function(e){ fb.filterDate(e).renderAll(); });
	
	var formatDate = d3.time.format("%Y-%m-%d %H:%M:%S");

	var rank = rankChart("rank");
	
	// Parses records to cast fields
	data.forEach(function(d){
		d.date = formatDate.parse(d.date);
		keys.forEach(function(k){
			d[k] = +d[k];
		});
	});
	
	// Create crossfilter and dimensions to filter feedbacks
	 feedback = crossfilter(data),
		feedbackByRegion = feedback.dimension(function(d){ return d.region; }),
		feedbackByHotel = feedback.dimension(function(d){ return d.hotel; }),
		feedbackByHotelFilter = feedback.dimension(function(d){ return d.hotel; }),
		feedbackByCountry = feedback.dimension(function(d){ return d.country; }),
		feedbackByDate = feedback.dimension(function(d){ return d.date; }),
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
		groupAllRegion = feedbackByRegion.groupAll(),
		groupByDate = feedbackByDate.group(d3.time.day);
		
	groupAllHotel.reduce(reduceBulletAdd, null, reduceBulletInit);
	groupAllHotelFiltered.reduce(reduceBulletAdd, null, reduceBulletInit);
	groupByHotel.reduce(reduceToRankAdd, reduceToRankRemove, reduceToRankInit).order(function(p){ return p.rank; });
	groupByCountry.reduceCount();
	groupByDate.reduce(reduceToRankAdd, reduceToRankRemove, reduceToRankInit).order(function(p){ return +p.key; });
	regionRank = feedbackByHotelFilter.groupAll().reduce(reduceToRankAdd, reduceToRankRemove, reduceToRankInit);
	
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
			p.count--;
			if(!p.count){
				p.rank = 0;
				return p;
			}
			p.rank = (((p.count+1) * p.rank) - a) / p.count;
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
			
			m[0] = (p.count * m[0]) - a / --p[key].count;	// mean
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
	
	fb.filterDate = function(extent){
		if(!extent)
			feedbackByDate.filterAll();
		else
			feedbackByDate.filterRange(extent);
		
		return fb;
	};
	
	fb.renderAll = function(){
		sentiment
			.data(sentimentBullets())
			.render();
		
		feedList
			.data(feedbackByHotel.top(limit)
					.sort(function(a, b){ return +a.date - +b.date; }))
			.render();
		
		turistChart
			.data(groupByCountry.all())
			.render();
		
		trend
			.data(groupByDate.all()
					.filter(function(d){ return d.value.count + d.value.rank; })
					.sort(function(a, b){ return a.key.getTime() - b.key.getTime(); }))
			.render();
		
		rank.data(regionRank.value().rank)
			.render();
		
		return fb;
	};
	
	fb.renderHList = function(){
		hotels
			.data(groupByHotel.all())
//			.show(true)
			.render();
		return fb;
	};
	
	fb.renderHotelRank = function(r){
		rank.data(r).render();
	};
	
	fb.visible = function(_bool){
		// Show/hide the sentiment section
		d3.select(sentimentDiv).transition()
			.duration(duration)
			.style("opacity", _bool ? 1 : 0)
			.each("start", function(){
				div.style("display", _bool ? "block" : "none");
		});
		
//		hotels.clearSelection();
//		hotels.show(_bool);
		return fb;
	};
	
	function hotelChange(hotel, context){
		var name = hotel.name;
		var rank = hotel.rank;
		
		fb.filterHotel(name);
		fb.renderHotelRank(rank);
		fb.renderAll();
	}
	
	function regionChange(name){
		fb.filterRegion(name);
		fb.filterHotel(null);
		fb.renderAll();
	}
	
	fb.filterDate([d3.time.year.offset(new Date(), -2), new Date()]);		//FIXME: da integrare
//	dispatch.on("regionChange.feedback", regionChange);
	
	return fb;
}
