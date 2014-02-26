TT.crossfilter = function() {
	
	if(!TT.crossfilter.id) TT.crossfilter.id = 0;
	
	var cf,
		charts = [],
		data,
		div ,
		filters = [],
		id = TT.crossfilter.id++,
		initialised = false,
		me = {};
		
	var p = {
		view: {
			width: 400,
			height: 200
		}
	};
	
	try {
		
		cf = crossfilter();
		
	} catch(e) {
		
		console.error("Crossfilter is not loaded. Get Crossfilter from http://square.github.io/crossfilter/");
		return false;
		
	}	
	
	// Private functions

	function drawChart(filter) {
		
		var chart = new BarChart()
			.dimension(filter.dimension)
			.group(filter.group)
			.title(filter.title);
		
		
		if(filter.isDate) {
		
			chart.x(
				d3.time.scale()
					.domain([filter.min, filter.max])
					.rangeRound( [0, p.view.width] )
			);
			
		} else {
			
			chart.x( d3.scale.linear()
				.domain( [filter.min, filter.max] )
				.rangeRound( [0, p.view.width] ) 
			);
			
		}
		
		charts.push(chart);

		div.call(chart);

		chart.on("brush", renderAll)
			.on("brushend", renderAll);
			
	}
	
	function renderAll() {
	
		for( var i = 0; i < charts.length; i++) {
			charts[i].drawChart();
		}
		
		publishUpdate();
	}
	
	function publishUpdate() {
		
		if(me.hasOwnProperty("publish") && charts[0]) {	
			
			me.publish( charts[0].dimension().top(999999) );
			
		}
		
	}

	// Initialiser
	
	me.apply = function() {
		
		div = arguments[0];
		
		for( var i = 0; i < filters.length; i++ ) {
		
			drawChart( filters[i] );
			
		}
		
		initialised = true;
		
	};
	
	// Methods
	
	me.addFilter = function(params) {
		
		var filter = {};
		
		filter.title = params.title || params.dimension.toString();
		
		if(typeof params.dimension === "string") {
		
			filterFunction = function(d) {
				return d[params.dimension];
			};
			
		} else if (typeof params.dimension === "function") {

			filterFunction = params.dimension;

		} else {
		
			return false;
			
		}
	
		filter.dimension = cf.dimension(filterFunction);
		
		filter.group = filter.dimension.group(params.group);

		filter.min = d3.min( data, filterFunction );
		filter.max = d3.max( data, filterFunction );
		
		filter.isDate = (filter.min instanceof Date);
		
		filters.push(filter);
		
		if(initialised) {
			drawChart(filter);
		}
		
		return me;
	};
	
	me.forcePublish = function() {
		
		publishUpdate();
		
	};
	
	me.reset = function() {
		
		charts[i].filter(null);
		renderAll();
		
	};
	
	// Accessors
	
	me.charts = function() {
		
		return charts;
		
	};
	
	me.data = function(_) {
		if( !arguments.length ) return data;
		
		data = _;
		
		cf.remove();
		cf.add(data);
		
		for(var i = 0; i < charts.length; i++) {
			
			charts[i].redrawChart();
			
		}
		
		publishUpdate();
		
		return me;
	};
	
	me.filters = function() {
		
		return filters;
		
	};
	
	return me;
	
	
	// -- BarChart


	function BarChart() {
		
		if(!BarChart.id) BarChart.id = 0;
		
		var div,
			me = {},
			x,
			y = d3.scale.linear().range([100, 0]),
			id = BarChart.id++,
			axis = d3.svg.axis().orient("bottom"),
			axisHeight = 20,
			brush = d3.svg.brush(),
			brushDirty,
			dimension,
			group,
			round,
			title,
			svg;
	
		// Brush
		function initBrush() {
		
		brush.on( "brushstart.chart", function() {
			
			var div = d3.select(this.parentNode.parentNode.parentNode);
			
			div.select(".title a")
				.style("display", null);
			
		} );
		
		brush.on( "brush.chart", function() {
			
			var g = d3.select(this.parentNode),
				extent = brush.extent();
				
			if(round) {
				g.select(".brush")
					.call(brush.extent(extent = extent.map(round)));
			}		
			
			g.select("#clip-" + id + " rect")
				.attr("x", x(extent[0]))
				.attr("width", x(extent[1]) - x(extent[0]));
				
			dimension.filterRange(extent);
			
		} );
		
		brush.on( "brushend.chart", function() {
				
				if(brush.empty()) {
					
					var div = d3.select(this.parentNode.parentNode.parentNode);
					
					div.select(".title a")
						.style("display", "none");
						
					div.select("#clip-" + id + " rect")
						.attr("x", null)
						.attr("width", "100%");
						
					dimension.filterAll();
					
				}
				
			} );
		}
	
		// Initialiser
		
		me.apply = function() {
			
			div = arguments[0];
			
			div = div.append("div")
				.attr("id", "barChart_" + id)
				.attr("class", "chart");
				
			initBrush();
			me.drawChart();
			
		};
	
		// Methods
		me.drawChart = function(redraw) {
		
			function barPath(groups) {
					
				var path = [],
					i = -1,
					n = groups.length,
					d;
					
				// Generate path part per value				
				while (++i < n) {
					
					d = groups[i];
					
					path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
					
				}
				
				return path.join("");
				
			}
			
			function drawChartSkeleton() {
				// Add title 
				div.append("div")
					.attr("class", "title")
					.text(title)		
					
				// Add reset link
				.append("a")
					.attr("class", "reset")
					.text("reset")
					.style("display", "none")
					.on("click", me.reset);
					
				// Append SVG element
				g = div.append("svg")
						.attr("width", width)
						.attr("height", height + axisHeight)
					.append("g");
					
				// Append clipping path for highlighting selection
				g.append("clipPath")
					.attr("id", "clip-" + id)
					.append("rect")
					.attr("width", width)
					.attr("height", height);
					
				// Append paths for data
				g.selectAll(".bar")
					.data( ["background", "foreground"] )
				.enter()
					.append("path")
					.attr("class", function(d) {
							return d + " bar";
						})
					.datum(group.all());
					
				// Apply clipping path to foreground path
				g.selectAll(".foreground.bar")
					.attr("clip-path", "url(#clip-" + id + ")");
					
				// Append axis
				g.append("g")
					.attr("class", "axis")
					.attr("transform", "translate(0, " + height + ")")
					.call(axis);
					
				// Initialise brush component
				var gBrush = g.append("g")
					.attr("class", "brush")
					.call(brush);
					
				gBrush.selectAll("rect")
					.attr("height", height);
			}
					
			var width = x.range()[1];
			var height = y.range()[0];
			
			y.domain( [0, group.top(1)[0].value] );
			
			var g = div.select("g");
			
			// Create the skeletal chart
			if( g.empty() || redraw) {
				
				drawChartSkeleton();
				
			}
			
			if(brushDirty) {
			
				brushDirty = false;
				g.selectAll(".brush")
					.call(brush);
				
				// Display reset button if brush is usde
				div.select(".title a")
					.style("display", brush.empty() ? "none" : null);
				
				// Adjust clipping area
				if( brush.empty() ) {
				
					g.selectAll("#clip-" + id + " rect")
						.attr("x", 0)
						.attr("width", width);
						
				} else {
					
					var extent = brush.extent();
					g.selectAll("#clip-" + id + " rect")
						.attr( "x", x(extent[0]) )
						.attr( "width", x(extent[1]) - x(extent[0]) );
							
				}
			}
			
			g.selectAll(".bar").attr("d", barPath);
		
			
		};
		
		me.redrawChart = function() {
			
			div.select("svg").remove();
			div.select(".title").remove();
			me.drawChart(true);
			
		};
		
		// Accessors
		
		me.dimension = function(_) {
			if (!arguments.length) return dimension;
			dimension = _;
			return me;
		};
		
		me.filter = function(_) {
			if (_) {
				brush.extent(_);
				dimension.filterRange(_);
			} else {
				brush.clear();
				dimension.filterAll();
			}
			brushDirty = true;
			return me;
		};
		
		me.group = function(_) {
			if (!arguments.length) return group;
			group = _;
			return me;
		};
			
		me.round = function(_) {
			if (!arguments.length) return round;
			round = _;
			return me;
		};
		
		me.title = function(_) {
			if (!arguments.length) return title;
			title = _;
			return me;
		};
		
		me.x = function(_) {
			if(!arguments.length) return x;
			x = _;
			axis.scale(x);
			brush.x(x);
			return me;
		};
		
		me.y = function(_) {
			if (!arguments.length) return y;
			y = _;
			return me;
		};
		
		
		return d3.rebind(me, brush, "on");
	}
};
