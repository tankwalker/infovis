window.pack = function (){
	pack.load = function(data){	
		// Loads data
		pack.keys = d3.keys(data[0]).filter(function(obj){return obj !== "region";});
	
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
	};
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
}();

function packSentiment(data, filters){
	pack = {
			name : "sentiment",
			objects : {}
	};
	
	// Loads data
	pack.keys = d3.keys(data[0]).filter(function(obj){
		var res = true;
		filters.forEach(function(f){res &= obj !== f;});
		return res;
	});
	
	data.forEach(function(obj){
		var feedback = {};
		
		var min = {},
			max = {},
			avg = {};
		
		var region,
			hotel;
		
		// Extract only the feddback's keys packing them into a 'feedback' object
		pack.keys.forEach(function(key){
			var value;
			value = isFinite(key) ? +obj[key] : obj[key]; 
			feedback[key] = value;
			
			// Keep the minimum value for the specific key
			if((!min[key] || min[key] > value) && isFinite(value))
				min[key] = value;
			
			// Keep the maximum value for the specific key
			if((!max[key] || max[key] < value) && isFinite(value))
				max[key] = value;
			
			// Keep the mean value for the specific key
			if(!avg[key])
				avg[key] = 0;
			avg[key] += value;
//			if(isFinite(value)){
//				if(!avg[key])
//					avg[key] = 0;
//				avg[key] += value;
//			}
//			else{
//				if(!avg[key])
//					avg[key] = [];
//				avg[key].push(value);
//			}
		});
		
		/* Adds the feedback object to the correct region and hotel entry */
		region = obj.region;
		hotel = obj.hotel;
		if(!pack.objects[region])
			pack.objects[region] = {total:{}};
		
		if(!pack.objects[region][hotel])
			pack.objects[region][hotel] = [];
		
		pack.objects[region][hotel].push(feedback);
		
		pack.objects[region].min = min;
		pack.objects[region].max = max;
		pack.keys.forEach(function(key){
			if(!pack.objects[region].total[key])
				pack.objects[region].total[key] = 0;
			pack.objects[region].total[key] += avg[key];
		});
		
	});
	
	pack.ranges(region, hotel){
		var ranges = pack.objects[region][hotel].ranges;
		var min = {},
		max = {};

		if(ranges)
			return ranges;
		
		pack.keys.forEach(function(key){
			min[key] = max[key] = 0;
		});
		
		pack.objects[region][hotel].forEach(function(feedback){
			pack.keys.forEach(function(key){
				if(min[key] > feedback[key])
					min[key] = feedback[key];

				if(max[key] < feedback[key])
					max[key] = feedback[key];
			});
		});
		return pack.objects[region][hotel].ranges = [min, max];
	};
	
	pack.measures(region, hotel){
		var measures = pack.objects[region][hotel].measures;
		var mean = {};
		var count = 0;
		
		if(measures)
			return measures;
		
		pack.keys.forEach(function(key){
			mean[key] = 0;
		});
		
		pack.objects[region][hotel].forEach(function(feedback){
			pack.keys.forEach(function(key){
				if(min[key] > feedback[key])
					min[key] = feedback[key];

				if(max[key] < feedback[key])
					max[key] = feedback[key];
			});
		});
		return pack.objects[region][hotel].ranges = [min, max];
	}
	
	return pack;
}