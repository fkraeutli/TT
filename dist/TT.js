var  TT = {
	name: "Timeline Tools",
	author: {
		name: "Florian Kräutli",
		email: "florian@kraeutli.com",
		twitter: "@fkraeutli",
		url: "http://www.kraeutli.com"
	},
	version: "0.0.1"
};;TT.crossfilter = function() {
	
	var FILTER_TYPE_CONTINUOUS		= "continuous",
		FILTER_TYPE_TAGS			= "tags",
		FILTER_TYPE_UNIQUE			= "unique";
	
	if(!TT.crossfilter.id) TT.crossfilter.id = 0;

	var	cf,
		charts = [],
		data,
		div ,
		filters = [],
		id = TT.crossfilter.id++,
		initialised = false,
		selectedChart = false,
		me = {};
		
	var p = {
		view: {
			width: 400,
			height: 30
		}
	};
	
	try {
		
		cf = crossfilter();		
		test_cf = cf; // REMOVE THIS, only for testing expose cf to global namespace
		
	} catch(e) {
		
		console.error("Crossfilter is not loaded. Get Crossfilter from http://square.github.io/crossfilter/");
		return false;
		
	}	
	
	// Private functions

	function drawChart(filter) {
		
		var chart;
		
		switch(filter.type) {
		
			case FILTER_TYPE_CONTINUOUS:
				chart = new BarChart()
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

					chart.on("brush", renderAll)
						.on("brushend", renderAll);
					
					break;
					
			case FILTER_TYPE_TAGS:
				chart = new WordCloud()
					.dimension(filter.dimension)
					.group(filter.group)
					.title(filter.title);
					break;
					
			default:
				console.error("Invalid filter " + filter.type);
				break;
		}
		
		charts.push(chart);
		div.call(chart);
			
		return chart;
			
	}
	
	function renderAll() {
	
		for( var i = 0; i < charts.length; i++) {
			charts[i].drawChart();
		}
		
		publishUpdate();
	}
	
	function publishUpdate() {
		
		if(me.hasOwnProperty("publish") && charts.length) {	
			
			// Publish all records, ordered according to selected chart
			publishFrom = selectedChart || charts[0];
			me.publish( publishFrom.dimension().top( Infinity ) );
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
	
		/*
		
			params {
				
				dimension: 
					- Dimension to filter as String or function
					
				(optional)
				group:
					- Grouping function for dimension
				title:
					- Title. If none given, dimension string will be used
			
			}
		
		*/
		
		var filter = {};
	
		filter.title = params.title || params.dimension.toString();
		
		var filterFunction;
		
		if (typeof params.dimension === "function") {

			filterFunction = params.dimension;

		} else {
		
			filterFunction = function(d) {
				return d[params.dimension];
			};
			
		}
	
		filter.dimension = cf.dimension(filterFunction);

		// Group filter (if no function provided, identity function is used)	
		if( params.group ) {
			
			filter.group = filter.dimension.group(params.group);
			
		} else {
			
			filter.group = filter.dimension.group( function(d) {return d;} );
			
		}
		
		filter.min = d3.min( data, filterFunction );
		filter.max = d3.max( data, filterFunction );
		
		filter.isDate = (filter.min instanceof Date);
		
		// determine filter type based on data
		var allNumeric = true;
		var groupValues = filter.group.all();
		
		for( var i = 0; i < groupValues.length; i++ ) {
		
			if( isNaN( +groupValues[i].key.valueOf() ) ) {
			
				allNumeric = false;
				break;
				
			}	
		}
		
		if ( allNumeric ) {
			
			filter.type = FILTER_TYPE_CONTINUOUS;
			
		}
		
		else if ( filter.group.all().length == filter.dimension.top(Infinity).length ) {

			filter.type = FILTER_TYPE_UNIQUE;

		} else {
			
			filter.type = FILTER_TYPE_TAGS;
			
		}
		
		filters.push(filter);
		
		if (initialised) {
		
			drawChart(filter);
		
		}
		
		return me;
	};
	
	me.forcePublish = function() {
		
		publishUpdate();
		
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
		
		var div,
			me = {},
			x,
			y = d3.scale.linear().range([p.view.height, 0]),
			id = charts.length, // CHANGE THIS dangerous to use index as unique identifier
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
			
			div.select(".title a.reset")
				.style("display", "block");
			
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
					
					div.select(".title a.reset")
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
			
			try {
			
				div = arguments[0];
				
			} catch(e) {
			
				console.error("No DOM element specified");
				
			}
			
			div = div.append("div")
				.attr("id", "barChart_" + id)
				.attr("class", "chart barchart");
				
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
				var div_title = div.append("div")
					.attr("class", "title")
					.text(title);
					
				// Add reset link
				div_title.append("a")
					.attr("class", "reset")
					.text("Reset")
					.on("click", me.reset );
					
				// Add sort by link
				div_title.append("a")
					.attr("class", "sort")
					.text("Sort by")
					.style("display", id === 0 ? "none" : "")
					.on("click", function() { me.sortBy( id ); } );
					
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
				div.select(".title a.reset")
					.style("display", brush.empty() ? "" : "block");
				
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
		
		me.reset = function() {
			
			charts[id].filter(null);
			renderAll();
			
		};
		
		me.redrawChart = function() {
			
			div.select("svg").remove();
			div.select(".title").remove();
			me.drawChart(true);
			
		};
		
		me.sortBy = function(id) {
			
			d3.selectAll(".title .sort")
				.style("display", "block");
				
			d3.select("#barChart_" + id + " .sort")
				.style("display", "none");
			
			selectedChart = charts[id];
			publishUpdate();
			
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
	
	// -- WordCloud
	function WordCloud() {
	
		if ( !WordCloud.id ) WordCloud.id = 0;

		var activeTerms = [],
			dimension,
			div,
			group,
			me = {},
			id = charts.length, // CHANGE THIS dangerous to use index as unique identifier
			title;
		
		// Initialiser
		
		me.apply = function() {
			
			try {
			
				div = arguments[0];
				
			} catch(e) {
			
				console.error("No DOM element specified");
				return false;
			}
			
			div = div.append("div")
				.attr("id", "wordCloud_" + id)
				.attr("class", "chart wordCloud");
				
			me.drawChart();
			
		};
		
		// Methods
		
		me.drawChart = function( redraw ) {
		
			function drawChartSkeleton() {
				
				// Add title
				var div_title = div.append("div")
					.attr("class", "title")
					.text(title);
				
				// Add reset link
				div_title.append("a")
					.attr("class", "reset")
					.text("Reset")
					.on("click", me.reset );
					
				// Add sort by link
				div_title.append("a")
					.attr("class", "sort")
					.text("Sort by")
					.style("display", id === 0 ? "none" : "")
					.on("click", function() { me.sortBy( id ); } );
					
				// Append element for wordCloud
				g = div.append("div")
					.attr("width", width)
					.attr("class", "wordcloud_container");
				
			}
			
			function filterFunction(d) {
				
				return activeTerms.indexOf( d ) !== -1;
				
			}
			
			var width = p.view.width;
			
			var g = div.select("div.wordcloud_container");
			
			if ( g.empty() || redraw ) {
				
				drawChartSkeleton();
				
			}
			
			
			var words_update = g.selectAll("span")
				.data( group.all()
					.filter( function(d) { 
					if( d.value > 0) {
						return d;
					}
				}), function(d) { return d.key; } )
					.sort( function (a,b) {
						return b.key < a.key;	
					}),
				words_enter = words_update.enter(),
				words_exit = words_update.exit(),
				words_scale = d3.scale.linear()
					.domain( [ 0, Math.min( d3.max( group.all(), function(d) { return d.value; }), 10 ) ] ) // Manual maximum of 500 (not very elegant, CHANGE)
					.range( [ 0, 1 ]);
					
				words_attributes = {
					
					fontSize: function(d) {
						
						return Math.min( words_scale( d.value ), 1) * 9 + 8 + "px";
						
					}
					
				};
			
			words_update.style("font-size", words_attributes.fontSize);
			
			words_enter.append("span")
				.text( function(d) { return d.key; } )
				.style("font-size", words_attributes.fontSize)
				.attr("class", function(d) {
					return "term term_" + d.key + " " + ( activeTerms.indexOf( d.key ) !== -1 ? "selected" : "");
				})
				.on( "click", function(d) {
					
					if ( activeTerms.indexOf( d.key ) === -1) {
						
						activeTerms.push( d.key );
						d3.select(this).classed("selected", 1);
						
					} else {
						
						activeTerms.splice( activeTerms.indexOf( d.key) , 1);
						d3.select(this).classed("selected", 0);

					}
					
					if( activeTerms.length ) {
					
						dimension.filterFunction( filterFunction );
						d3.select( this.parentNode ).classed("filtered", 1);
						div.select(".title a.reset")
							.style("display", "block");			
						
					} else {	
					
						me.reset();
						
					}
					
					
					renderAll();
					
				});
				
			words_exit.remove();
			
		};
		
		me.redrawChart = function() {
			
			div.select("div.wordcloud_container").remove();
			div.select(".title").remove();
			me.drawChart(true);
			
		};
		
		me.reset = function() {
			
			activeTerms = [];
			dimension.filterAll();
			
			div.selectAll(".term")
				.style("color", "");
			
			div.select(".filtered")
				.classed("filtered" , 0);
				
			div.selectAll(".selected")
				.classed("selected" , 0);
				
			div.select(".title a.reset")
			.style("display", null);
							
			renderAll();
			
		};	
		
		me.sortBy = function(id) {
			
			console.log("Hello" + id);
			
			d3.selectAll(".title .sort")
				.style("display", "block");
				
			d3.select("#wordCloud_" + id + " .sort")
				.style("display", "none");
			
			selectedChart = charts[id];
			publishUpdate();
			
		};
		
		// Accessors
		
		me.dimension = function(_) {
			if (!arguments.length) return dimension;
			dimension = _;
			return me;
		};
		
		me.group = function(_) {
			if (!arguments.length) return group;
			group = _;
			return me;
		};
	
		me.title = function(_) {
			if (!arguments.length) return title;
			title = _;
			return me;
		};
	
		return me;
		
	}
	
};

String.prototype.ucfirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
;TT.layout = {};;/*

Generates Bars view on array of data

data format: {

	id: "",
	from: Date(),
	to: Date(),
	title: "",
	weight: #

}


*/

TT.layout.bars = function() {
	
	if(!TT.layout.bars.id) TT.layout.bars.id = 0;
	
	var	initialised = false,
		id = TT.layout.bars.id++,
		nmsp = "tl_" + id,
		me = {},
		bars = this,
		zoom;
		
	var p = {
		
		axis: {},
		
		data: [],
		
		displayData: [],
		
		elements: {},
		
		format: {
			
			year: d3.time.format("%Y"),
			date: d3.time.format("%d %b %Y")
			
		},
		
		scales: {
			
			minMax: {
				
				// Used for semantic zooming
				
				weight: d3.scale.linear()
					.domain( [0, 1] )
					.range( [0, 1] ),
				
				// Update zoom extent here
				
				zoom: d3.scale.linear()
					.domain( [0.01, 120] ) 
					.range( [0, 1] )
				
			}
			
		},
		
		styles: {
			
			events: {
				height: 12,
				collapsedHeight: 2,
				fontSize: 12,
				margin: 1,
				collapsedMargin: 1,
				padding: 2
			}
		},
		
		thresholds: {
			
			collapse: 0.5,
			display: 0.1,
			showAll: 10 // Show all events below if total number is below this	
			
		},
		
		view: {
			
			from: new Date( 1900 , 0, 1 ),
			to: new Date( 2000 , 0, 1 ),
			
			width: 800,
			height: 600,
			padding: 40,
			
			ys: [0]
			
		}
		
		
	};
	
	// REMOVE
	test_bars_p = p;
	
	var attr = {
		
		axis: {
		
			tickFormat: function (d) {
				if( Math.round( (p.axis.scale().domain()[1].getFullYear() - p.axis.scale().domain()[0].getFullYear()) / p.axis.ticks()) >= 1 ) { // If there is not more than one tick per year represented
					return p.format.year(d);
				} else {
					return p.format.date(d);
				}
			}
		},
		
		event: {
		
			rect: {
			
				fill: function (d) {
					return d.color || null;	
				},
			
				height: function (d) {
						return Math.min(d[nmsp].height * zoom.scale(), d[nmsp].height) + "px";	
				},
				
				width: function (d) {
				
					return (d[nmsp].width * zoom.scale()) + "px";
					
				}
			},
			
			text: {
			
				anchor: function (d) {		
					return zoom.scale() >= p.thresholds.collapse && d[nmsp].width * zoom.scale() > d.title.length * p.styles.events.fontSize ? "start" : "end";	
				},
				
				display: function (d) {
					return d[nmsp].renderLevel > p.thresholds.collapse ? "block" : "none";	
				},
				
				fontSize: p.styles.events.fontSize + "px",
				
				x: function (d) {
					return (d[nmsp].width * zoom.scale() > d.title.length * p.styles.events.fontSize) ? (x(d[nmsp].x) < 0 && x(d[nmsp].x) + d[nmsp].width * zoom.scale() > 0 ? p.styles.events.padding + -1*x(d[nmsp].x) : p.styles.events.padding) : -p.styles.events.padding;
				},
				
				y: p.styles.events.height * 0.75
			},
			
			transform: function (d)  {
				return "translate(" + x(d[nmsp].x) + "," + (d[nmsp].y + y(0)) + ")";
			}
		},

	};
			
	// Init scales used for panning and zooming
	var x = d3.scale.linear()
		.domain([0, p.view.width])
		.range([0, p.view.width ]);
	
	var y = d3.scale.linear()
		.domain([0, p.view.height])
		.range([0, p.view.height]);
		
	// Private functions
	
	function doZoom() {
		
		var events = p.elements.events.selectAll("g.bars_event");
		var ax = p.svg.select(".bars_axis");
		
		p.scales.axis.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] );
		
		update();
		
		ax.call(p.axis);
		
	}
	
	function update() {
		
		function createEventsAppearance(events) {
			
			// Rectangle
			events.append("rect")
				.attr("class", "eventRect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("height", attr.event.rect.height)
				.attr("width", attr.event.rect.width)
				.style("fill", attr.event.rect.fill);
					
			// Add event text
			events.append("text")
				.attr("class", "title")
				.text( function(d) { return d.title; } )
				.attr("x", attr.event.text.x)
				.attr("y", attr.event.text.y)
				.attr("text-anchor", attr.event.text.anchor)
				.attr("display", attr.event.text.display);
				
		}
		
		function filterEvents(d) { 
		
			/*
			
			Remove data
			- If the render level is below the display level
			- If the item is completely outside of the viewable area
			
			*/
		
			return d[nmsp].renderLevel >= p.thresholds.display  &&
				x(d[nmsp].x) + d[nmsp].width * zoom.scale() >= 0 &&
				x(d[nmsp].x) <= p.view.width &&
				d[nmsp].y + y(0) > -p.styles.events.height && 
				d[nmsp].y + y(0) < p.view.height;
				
		}
				
		function updateDataValues() {
				
			function computeRenderLevel(data, attribute) {
				
				if(data.weight) {
					return Math.pow( p.scales.minMax.weight(data.weight), 0.01 / p.scales.minMax.zoom(zoom.scale()) ) + p.scales.minMax.zoom(zoom.scale()); 
				} else {
					return 0;
				}
		
			}

			p.data.forEach(function(d) {
				
				d[nmsp].renderLevel = computeRenderLevel(d);
					
			});
			
			// If only a defined number of items are visible or all have the same level they should automatically get displayed
			
			if( p.data.length <= p.thresholds.showAll || d3.min( p.data, function(d) {return d[nmsp].renderLevel;} ) == d3.max( p.data, function(d) {return d[nmsp].renderLevel;} ) ) {
			
				p.data.forEach( function(d) {
					d[nmsp].renderLevel = 1;		
				} );
			
			}				
			
			var count = 0;
			
			p.data.forEach(function(d) {	
			
				if( d[nmsp].renderLevel >= p.thresholds.display ) {
				
					d[nmsp].x = p.scales.dateToPx(d.from.valueOf());
					d[nmsp].width = ( p.scales.dateToPx(d.to.valueOf()) - p.scales.dateToPx(d.from.valueOf()) );
					
					d[nmsp].height = d[nmsp].renderLevel < p.thresholds.collapse ? p.styles.events.collapsedHeight : p.styles.events.height;
					d[nmsp].margin = d[nmsp].renderLevel < p.thresholds.collapse ? p.styles.events.collapsedMargin : p.styles.events.margin;
					
					if(count === 0) {
					
						d[nmsp].y = p.view.padding;
						
					} else {
					
						d[nmsp].y = p.view.ys[count - 1] + d[nmsp].margin;
						
					}
					
					p.view.ys[count] = d[nmsp].y + d[nmsp].height;
					
					count++;
					
				} 
				

			});
		}
		
		function updateEventsAppearance(events) {
			
			events.select("rect.eventRect")
				.attr("width", attr.event.rect.width)
				.attr("height", attr.event.rect.height)
				.style("fill", attr.event.rect.fill);
				
			events.select("text.title")
				.attr("x", attr.event.text.x)
				.attr("y", attr.event.text.y)
				.attr("text-anchor", attr.event.text.anchor)
				.attr("display", attr.event.text.display)
				.style("font-size", attr.event.text.fontSize);
				
		}
		
		if( !initialised) return false;
		
		updateDataValues();
		
		p.displayData = p.data.filter( filterEvents );
		
		var events = p.elements.events.selectAll("g.bars_event")
			.data( p.displayData, function(d) { return d.id; } );
						
		// Update events
		events.attr("transform", attr.event.transform);
		
		// Update event appearace
		updateEventsAppearance(events);
		
		// Add new events
		var eventsEnter = events.enter()
			.append("g")
				.attr("id", function(d) {
					return "tl" + id + "_event_" + d.id;
				})
			.attr("class", "bars_event")
			.attr("transform", attr.event.transform)
			.on("click", function(d) { 
				console.log(d); 
			})
			.on("dblclick", function(d) {
				
				if(d.url) {
					window.open( d.url );
				}
				
			});
	
		// Add event appearance
		createEventsAppearance(eventsEnter);
			
		// Remove events
		events.exit().remove();
		
		publishUpdate();
	}
	
	function updateMinMax() {
		
		// Updates the scales used for semantic zooming
		p.scales.minMax.weight.domain([ d3.min( p.data, function(d) {return d.weight ? d.weight : 0;} ), Math.min(300, d3.max( p.data, function(d) {return d.weight ? d.weight : 0;} )) ]);
		
	}

	function publishUpdate() {
		
		if(me.hasOwnProperty("publish")) {	
			
			me.publish( p.displayData );

		}
		
	}

	// Initialiser
	me.apply = function () {
		
		function initBars() {
			
			function initAxis() {
			
				p.scales.axis = d3.time.scale()
					.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] )
					.range( [0, p.view.width] );
				
				p.axis = d3.svg.axis()
					.scale(p.scales.axis)
					.tickSize(p.view.height - p.view.padding)
					.tickFormat(attr.axis.tickFormat)
					.orient("top");
					
				p.elements.axis = p.svg.append("g")
					.attr("class", "bars_axis")
					.attr("id","tl" + id + "_axis")
					.call(p.axis)
					.attr("transform", "translate(0," + ( p.view.height - p.view.padding / 2 ) + ")");
					
			}
			
			function initEvents() {
			
				p.elements.events = p.svg.insert("g")
					.attr("class", "bars_events")
					.attr("id", "tl" + id + "_events");
					
			}
				
			function initScales() {
			
				p.scales.dateToPx = d3.scale.linear()
					.domain( [ p.view.from.valueOf(), p.view.to.valueOf() ] )
					.range( [ p.view.padding, p.view.width - p.view.padding ] );
					
				p.scales.pxToDate = d3.scale.linear()
					.domain( [ p.view.padding, p.view.width - p.view.padding ] )
					.range( [ p.view.from.valueOf(), p.view.to.valueOf() ] );
					
			}	
			
			function initZoom() {						
				
				zoom = d3.behavior.zoom()
					.x(x)
					.y(y)
					.scaleExtent( p.scales.minMax.zoom.domain() );
									
				p.svg.select(".bars_events").insert("rect",":first-child")
					.attr("width", p.view.width)
					.attr("height", p.view.height)
					.attr("class","overlay");
					
				p.svg.select(".bars_events").call( zoom.on("zoom", doZoom) ).on("dblclick.zoom", null);
				
			}
			
							
			initScales();
			initEvents();
			initAxis();
			initZoom();	
			
		}
		
		// Update parameters
		
		p.svg = arguments[0];

		p.view.width = p.svg.attr("width");
		p.view.height = p.svg.attr("height");
		
		if(p.data) {
			
			// Initialise visible range with 20% buffer
			
			var minFrom = d3.min( p.data, function(d) { return d.from; } ),
				maxTo = d3.max( p.data, function(d) { return d.to; } );
				
			p.view.from = new Date( minFrom.valueOf() - 0.2 * (maxTo.valueOf() - minFrom.valueOf()) );//d3.min( p.data, function(d) { return d.from; } );
			p.view.to = new Date( maxTo.valueOf() + 0.2 * (maxTo.valueOf() - minFrom.valueOf()) );//d3.max( p.data, function(d) { return d.to; } );
			
		}
		
		initBars();
		
		initialised = true;
		
		update();
		
	};

	// Accessors
	me.data = function(_) {
		if( !arguments.length ) return p.data;
		p.data = _;
				
		p.data.forEach( function(d) {
			if( !d.hasOwnProperty(nmsp) ) {
				d[nmsp] = {};
			}
		});
		
		updateMinMax();
		update();
		
		return me;
	};

	me.displayData = function() {
		
		return p.displayData;

	};
	
	me.update = function() {
		update();
	};
	
	// Linking accessors
	me.x = function(_) {
		if( !arguments.length ) return x;
		x = _;
		
		return me;
	};
		
	me.y = function(_) {
		if( !arguments.length ) return y;
		y = _;
		
		return me;
	};
	
	me.zoom = function(_) {
		if( !arguments.length ) return zoom;
		zoom = _;
		
		return me;
	};
	
	me.styles = {};
	
	me.styles.events = function(name, value) {
		
		if (arguments.length < 2) {
		
			if(typeof name === "string") {
				return p.styles.events[name];
			} else if (typeof name === "object") {
			
				for(var i in name) {				
					p.styles.events[i] = name[i];
				}
				
			}
		
		} else {
			
			p.styles.events[name] = value;
		}
		
		update();
		
		return me;
		
	};

	me.threshold = function(name, value) {
		
		if (arguments.length < 2) {
		
			if(typeof name === "string") {
				return p.thresholds[name];
			} else if (typeof name === "object") {
			
				for(var i in name) {				
					p.thresholds[i] = name[i];
				}
				
			}
		
		} else {
			
			p.thresholds[name] = value;
		}
		
		update();
		
		return me;
		
	};
	
	return me;
	
};;/*

Generates heap view on array of data

data format: {

	id: "",
	from: Date(),
	to: Date()

}


*/

TT.layout.heap = function() {
	
	if(!TT.layout.heap.id) TT.layout.heap.id = 0;
	
	var	initialised = false,
		id = TT.layout.heap.id++,
		me = {},
		heap = this,
		nmsp = "hp_" + id,
		x,
		y,
		zoom;
	
	var p = {
		
		data: [],
		
		elements: {
			
		},
				
		grid: {
			
			availableWidth: null,
			maxRow: 0,
			numCols: null,
			initialised: false,
			range: null,
			resolution: null,
			table: []
			
		},
		
		parent: false,
		
		styles: {
			
			events: {
				diameter: 1
			},
			
			images: {
				factor: 1
			}
		},
		
		thresholds: {
			
			display: 2000, // amount of events
			images: 50 // zoom factor
			
		},
		
		translate: [0, 0],
		
		view: {}
	};
	
	// REMOVE
	test_heap_p  = p;
	
	var attr = {
		
		event: {
			
			circle: {
				
				cx: -p.styles.events.diameter / 2,
				
				cy: -p.styles.events.diameter / 2,
				
				fill: function (d) {
					return d.color || null;	
				},
			
				r: function() { return Math.min( 10, zoom.scale()) * p.styles.events.diameter / 2; }
				
			},
			
			transform: function (d)  {
			
				return "translate(" + _x(d[nmsp].x) + "," + _y(d[nmsp].y) + ")";
				
			}
			
		}

	};		
		
	function update() {		
	
		function computeDisplaceForColumn( column ) {
			
			return p.grid.table[ column ].length * p.styles.events.diameter / 2  + p.view.height / 2 ;
			
		}
		
		function computeGridXForColumn( column ) {
			
			return p.scales.dateToPx( column * p.grid.resolution + p.view.from.valueOf() );
			
		}
		
		function createEventsAppearance(events) {
			
			// Circle
			events.append("circle")
				.attr("class", "event_circle")
				.attr("cx", attr.event.circle.cx)
				.attr("cy", attr.event.circle.cy)
				.attr("r", attr.event.circle.r)
				.style("fill", attr.event.circle.fill);
				
		}
		
		function filterEvents(d) { 

			/*
			
			Remove data
			- If the item is completely outside of the viewable area
			
			*/
		
			return _x(d[nmsp].x)  >= 0 &&
				_x(d[nmsp].x) <= p.view.width &&
				_y(d[nmsp].y) > -p.styles.events.diameter && 
				_y(d[nmsp].y) < p.view.height;
				
		}
		
		function updateDataValues() {
		
			if (p.grid.initialised) return false;
					
			function makeGrid() {
				
				p.grid.availableWidth = p.scales.dateToPx( p.view.to ) - p.scales.dateToPx( p.view.from );
				p.grid.numCols = Math.floor( p.grid.availableWidth / p.styles.events.diameter );
					
				p.grid.range = p.view.to - p.view.from;
				p.grid.resolution = p.grid.range / p.grid.numCols;
				
				p.grid.table = [];
				
				for( var i = 0; i < p.grid.numCols; i++ ) {
					
					p.grid.table[i] = Array();
					
				}
				
				p.grid.maxRow = 0;
						
				// Set initial parameters
				p.data.forEach( function(d) {
					
					// Select initial column and row
					d[nmsp].col = d[nmsp].initCol = Math.min( Math.floor( ( (d.from.valueOf() + ( d.to.valueOf() - d.from.valueOf() ) / 2) - p.view.from.valueOf() ) / p.grid.resolution ), p.grid.numCols - 1);		

					// Define tolerance columns based on from/to dates;
					d[nmsp].minCol = Math.max( Math.floor( ( d.from.valueOf() - p.view.from.valueOf() ) / p.grid.resolution ), 0); // Lowest possible column or zero
					d[nmsp].maxCol = Math.min( Math.ceil( ( d.to.valueOf() - p.view.from.valueOf() ) / p.grid.resolution ), p.grid.numCols - 1); // Highest possible column or maxiumum
					
					// Generate array for candidate column selection
					d[nmsp].candidateCols = d3.range( d[nmsp].initCol, d[nmsp].minCol - 1, -1 ).concat( d3.range( d[nmsp].initCol + 1, d[nmsp].maxCol + 1 ) );
				
					// Add item to row smallest row
					var minRow = p.grid.maxRow;
					
					for( var i = 0; i < d[nmsp].candidateCols.length; i++ ) {	
					
						if ( p.grid.table[ d[nmsp].candidateCols[i] ].length  < minRow) {
						
							d[nmsp].col = d[nmsp].candidateCols[i];
							minRow = p.grid.table[ d[nmsp].candidateCols[i] ].length;
							
						}
						
					}
					d[nmsp].row = minRow;
					
					// Add to grid
					p.grid.table[ d[nmsp].col ][ d[nmsp].row ] = d;
					
					if (minRow == p.grid.maxRow) {
					
						p.grid.maxRow++;
						
					}

				} );
				
				
			}
		
			// Initialise heap grid
			makeGrid();	
			
			// Translate columns and rows to x,y coordinates
			p.data.forEach( function(d) {
				
				d[nmsp].x = computeGridXForColumn( d[nmsp].col ); 
				
				var displace = computeDisplaceForColumn( d[nmsp].col );
				d[nmsp].y = -d[nmsp].row * p.styles.events.diameter + displace - displace % p.styles.events.diameter;
				
			});
			
			p.grid.initialised = true;
		}
		
		function updateEventsAppearance(events) {
		
			events.select("circle.event_circle")
				.attr("r", attr.event.circle.r)
				.style("fill", attr.event.circle.fill);
						
		}		
		
		function updateEventsImages(events) {
			
			if(zoom.scale() > p.thresholds.images) {
				
				var imagesEnter = events.filter( function(d) { return !d.hasImage && d.thumbnailUrl; });
				
				imagesEnter.append("image")
					.attr("xlink:href", function(d) {
						
						d3.select("#hs" + id + "_event_" + d.id + " image").on("error", function(event) {
							d3.select(this).style("display", "none");
						});
					
						d.hasImage = true;
						
						if ( typeof d.thumbnailUrl == "function" ) {
							
							var element = this,
								datum = d;
							
							d.thumbnailUrl( function( url ) {
								
								d3.select( element )
									.attr( "xlink:href", url );
								
								d.thumbnailUrl = url;
								
							} );
							
						} else {
						
							return d.thumbnailUrl;
							
						}
					});
				
					
				events.selectAll("image")
					.attr("x", -zoom.scale() / 2 * p.styles.images.factor)
					.attr("y", -zoom.scale() / 2 * p.styles.images.factor)
					.attr("width", zoom.scale() * p.styles.images.factor + "px")
					.attr("height", zoom.scale() * p.styles.images.factor + "px")
					.attr("xlink:href", function(d) {
					
						if ( typeof d.thumbnailUrl != "function" ) {
						
							return d.thumbnailUrl;
							
						}
						
					});
					
				
			} else {
			
				events.selectAll( "image" ).remove();
				events.each( function(d) { d.hasImage = false; } );
				
			}
			
		}
		
		if ( !initialised ) return false;
	
		updateDataValues();
		
		// Draw events
		var eventData = p.data.filter(filterEvents);
		var drawOutline = false;
		
		// Draw no events if too many would be visible
		if(eventData.length > p.thresholds.display) {
		
			drawOutline = true;
		
			eventData = eventData.filter( function(d) {
				
				return d.color;
				
			});
		}
		
		var events = p.elements.events.selectAll("g.heap_event")
			.data( eventData, function(d) {return d.id;} );
		
		// Add new events
		var eventsEnter = events.enter()
			.append("g")
			.attr("id", function(d) {
					return "hs" + id + "_event_" + d.id;
				})
			.attr("class", "heap_event")
			.attr("transform", attr.event.transform)
			.on("click", function(d) { 
			
				// REMOVE ME
				console.log(d);
			
				if( me.hasOwnProperty("publish") ) {	
		
					me.publish( {data: d, event: d3.event} );
					
				}
			})
			.on("dblclick", function(d) { 
				if( me.hasOwnProperty("publish") ) {	
		
					me.publish( {data: d, event: d3.event} );
					
				}
			})
			.each(function(d) { d.hasImage = false; } );
			
		// Add event appearance
		createEventsAppearance( eventsEnter );
		
		// Update events
		events.attr("transform", attr.event.transform);
		
		// Update event appearance
		updateEventsAppearance(events);
		
		// Remove events
		events.exit().remove();
		
		// Add or update images
		updateEventsImages(events);
		
		// Draw outline
		p.elements.outline.attr("d", function() {

			var path = [],
				i = -1,
				n = p.grid.table.length,
				d;
				
			// Generate path part per value				
			while (++i < n) {
				
				d = p.grid.table[i];
				
				if( d.length > 0) {
					
					//path.push( "S", _x( d[ d.length-1 ][nmsp].x - p.styles.events.diameter/2 ), ",", _y( d[ d.length-1 ][nmsp].y ), " ", _x( d[ d.length-1 ][nmsp].x ), ",", _y( d[ d.length-1 ][nmsp].y ) );	
					//path.unshift( "S", _x( d[ 0 ][nmsp].x + p.styles.events.diameter/2 ), ",", _y( d[ 0 ][nmsp].y ) , " " , _x( d[ 0 ][nmsp].x ), ",", _y( d[ 0 ][nmsp].y ) ); 
					
					path.push( "L", _x( d[ d.length-1 ][nmsp].x ), ",", _y( d[ d.length-1 ][nmsp].y  - p.styles.events.diameter / 2 ) );	
					
					path.unshift( "L", _x( d[ 0 ][nmsp].x ), ",", _y( d[ 0 ][nmsp].y ) +  p.styles.events.diameter / 2 ); 
					
				} else {
					
					// add point in middle
					var centX = computeGridXForColumn( i );
					var centY = computeDisplaceForColumn( i );
					
					path.push( "L", _x( centX ), ",", _y( centY ) );
					path.unshift( "L", _x( centX ), ",", _y( centY ) );
					
				}
				
			}
			path.unshift( "M", path[1], ",", path[3] );
			path.push("Z");
			
			return path.join("");
			
		})
		.attr("display", function() {
			
			return drawOutline ? "" : "none";
			
		});
	
	}
	
	function _x( value ) {
		
		return x(value) + zoom.scale() * p.translate[0];
		
	}
	
	function _y( value ) {
		
		return y(value) + zoom.scale() * p.translate[1];
		
	}

	// Initialiser
	me.apply = function () {
		
		function initHeap() {
						
			function initEvents() {
			
				p.elements.outline = p.svg.insert("g")
					.attr("class", "heap_outline")
					.attr("id", "hs" + id + "_outline")
					.append("path")
					.on("click", function(d) { 
						if( me.hasOwnProperty("publish") ) {	
		
							var event = d3.event;
		
							// Determine Column					
							var dateClicked = new Date( p.scales.pxToDate( event.x + x.domain()[0] ) ),
								offset =  dateClicked.valueOf() - p.view.from.valueOf(),
								col = Math.floor(offset / p.grid.resolution);
							
							// Determine Row
							var displace = p.grid.table[ col ].length * p.styles.events.diameter / 2  + p.view.height / 2 ,
								yClicked = event.y + y.domain()[0],
								row = Math.floor(( displace - yClicked) / zoom.scale() * p.styles.events.diameter );
							
							// FIXME: column and row incorrectly determined after zooming (panning works)
							
							console.log(col + "," + row);
	
							me.publish( {data: p.grid.table[ col ][ row ], event: d3.event} );
					
						}
					});
					
				p.elements.events = p.svg.insert("g")
					.attr("class", "heap_events")
					.attr("id", "hs" + id + "_events");
					
			}
				
			initEvents();
			
		}
		
		initHeap();
		
		initialised = true;
		
		update();
		
	};

	// Accessors
	me.data = function(_) {
		if( !arguments.length ) return p.data;
		
		p.data = [];
		
		// Some cleaning: TODO notify user of records that didn't pass test
		_.forEach( function(d) {
			
			if ( d.from && d.to && d.id && d.from <= d.to ) {
			
				d[nmsp] = {};
				
				p.data.push( d );
				
			}
			
		});
		
		
		p.grid.initialised = false;
		
		if(initialised) {
		
			var minFrom = d3.min( p.data, function(d) { return d.from; } );
			var maxTo = d3.max( p.data, function(d) { return d.to; } );
			
			if( minFrom < p.view.from ) {
				
				p.parent.from( minFrom);
				
			}
			
			if (maxTo > p.view.to ) {
			
				p.parent.to( maxTo );
				
			}
		
			update();
		}
		
		return me;
	};
	
	me.identifier = function() {

		return nmsp;
		
	};
	
	me.initialise = function() {
		
		p.svg.call(me);
		
		return me;
		
	};
	
	me.scales = function(_) {
		
		if( !arguments.length ) return p.scales;
		p.scales = _;
		
		return me;
		
	};
	
	me.styles = {};
	
	me.styles.events = function(name, value) {
		
		if (arguments.length < 2) {
		
			if(typeof name === "string") {
				return p.styles.events[name];
			} else if (typeof name === "object") {
			
				for(var i in name) {				
					p.styles.events[i] = name[i];
				}
				
			}
		
		} else {
			
			p.styles.events[name] = value;
		}
		
		p.grid.initialised = false;
		update();
		
		return me;
		
	};
	
		
	me.styles.images = function(name, value) {
		
		if (arguments.length < 2) {
		
			if(typeof name === "string") {
				return p.styles.images[name];
			} else if (typeof name === "object") {
			
				for(var i in name) {				
					p.styles.images[i] = name[i];
				}
				
			}
		
		} else {
			
			p.styles.images[name] = value;
		}
		
		p.grid.initialised = false;
		update();
		
		return me;
		
	};
	
	me.svg = function(_) {
		
		if( !arguments.length ) return p.svg;
		p.svg = _;
		
		return me;
		
	};
	
	me.parent = function(_) {
		
		if( !arguments.length ) return p.parent;
		p.parent = _;
		
		return me;
		
	};
	
	me.threshold = function(name, value) {
		
		if (arguments.length < 2) {
		
			if(typeof name === "string") {
				return p.thresholds[name];
			} else if (typeof name === "object") {
			
				for(var i in name) {				
					p.thresholds[i] = name[i];
				}
				
			}
		
		} else {
			
			p.thresholds[name] = value;
		}
		
		update();
		
		return me;
		
	};
	
	me.update = function() {

		update();
		
		return me;
		
	};
	
	me.refresh = function() {
		
		p.grid.initialised = false;
		update();
		
		return me;
		
	};
	
	me.view = function(_) {
		
		if( !arguments.length ) return p.view;
		p.view = _;
		
		return me;
		
	};
	
	me.x = function(_) {
		
		if( !arguments.length ) return x;
		x = _;
		
		return me;
		
	};
	
	me.y = function(_) {
		
		if( !arguments.length ) return y;
		y = _;
		
		return me;
		
	};
	
	me.zoom = function(_) {
		
		if( !arguments.length ) return zoom;
		zoom = _;
		
		return me;
		
	};
	
	return me;
	
};;TT.observer = {

	addSubscriber: function(callback) {
		this.subscribers[this.subscribers.length] = callback;
	},

	removeSubscriber: function(callback) {
		for (var i = 0; i < this.subscribers.length; i++) {
			if (this.subscribers[i] === callback) {
				delete(this.subscribers[i]);
			} 
		}
	},
	
	publish: function(what) {
		for (var i = 0; i < this.subscribers.length; i++) {
			if (typeof this.subscribers[i] === 'function') {

				this.subscribers[i](what);
			}
		} 
	},
	
	make: function(o) { // turns an object into a publisher
		for(var i in this) {
			o[i] = this[i];
			o.subscribers = [];
		}
	}
};

;TT.timeline = function() {
	
	if(!TT.timeline.id) TT.timeline.id = 0;
	
	var	initialised = false,
		id = TT.timeline.id++,
		me = {},
		timeline = this,
		nmsp = "tl_" + id,
		x,
		y,
		zoom;
	
	var p = {
		
		axis: {},
		
		children: [],
		
		elements: {},

		format: {
			
			year: d3.time.format("%Y"),
			date: d3.time.format("%d %b %Y")
			
		},
		
		scales: {
			
			minMax: {
				
				// Update zoom extent here
				
				zoom: d3.scale.linear()
					.domain( [0.5, 240] ) 
					.range( [0, 1] )
				
			}
			
		},
		
		svg: false,

		view: {
			
			from: new Date( 1900 , 0, 1 ),
			to: new Date( 2000 , 0, 1 ),
			
			width: 800,
			height: 600,
			
			padding: 40
			
		}
	};
	
	// REMOVE
	test_timeline_p  = p;
	
	var attr = {
		
		axis: {
		
			tickFormat: function (d) {

				if( Math.round( (p.axis.scale().domain()[1].getFullYear() - p.axis.scale().domain()[0].getFullYear()) / p.axis.ticks()) >= 1 ) { // If there is not more than one tick per year represented

					return p.format.year(d);
					
				} else {
				
					return p.format.date(d);
					
				}

			}
			
		}

	};
			
	// Private functions
	
	function doZoom() {
		
		p.scales.axis.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] );
	
		p.elements.axis.call(p.axis);
		
		update();
		
	}
	
	function update() {
		
		p.children.forEach( function(child) {
			child.update();
		} );
		
	}

	// Initialiser
	me.apply = function () {
		
		function initTimeline() {
			
			function initAxis() {
			
				p.scales.axis = d3.time.scale()
					.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] )
					.range( [0, p.view.width] );
				
				p.axis = d3.svg.axis()
					.scale(p.scales.axis)
					.tickSize(p.view.height - p.view.padding)
					.tickFormat(attr.axis.tickFormat)
					.orient("top");
					
				p.elements.axis = p.svg.insert("g", ":first-child")
					.attr("class", "timeline_axis axis")
					.attr("id", nmsp + "_axis")
					.call(p.axis)
					.attr("transform", "translate(0," + ( p.view.height - p.view.padding / 2 ) + ")");
					
			}
				
			function initScales() {
			
				x = d3.scale.linear()
					.domain([0, p.view.width])
					.range([0, p.view.width]);
				
				y = d3.scale.linear()
					.domain([0, 1])
					.range([0, 1]);		
			
				// REMOVE
				test_timeline_x = x;
				test_timeline_y = y;
			
				p.scales.dateToPx = d3.scale.linear()
					.domain( [ p.view.from.valueOf(), p.view.to.valueOf() ] )
					.range( [ p.view.padding, p.view.width - p.view.padding ] );
					
				p.scales.pxToDate = d3.scale.linear()
					.domain( p.scales.dateToPx.range() )
					.range( p.scales.dateToPx.domain() );
					
			}	
			
			function initZoom() {						
				
				zoom = d3.behavior.zoom()
					.x(x)
					.y(y)
					.scaleExtent( p.scales.minMax.zoom.domain() );			
					
				// REMOVE
				test_timeline_zoom = zoom;
				
				p.elements.children = p.svg.insert("g")
					.attr("class", "timeline_children")
					.attr("id", nmsp + "_children")
					.call( zoom.on("zoom", doZoom) )
						.on( "dblclick.zoom", null)
						.on( "dblclick", function(d) {
							if( me.hasOwnProperty("publish") ) {	
		
								me.publish( {data: d, event: d3.event} );
					
							}
						})
						.on( "click", function(d) {
							if( me.hasOwnProperty("publish") ) {	
		
								me.publish( {data: d, event: d3.event} );
					
							}
						});
														
				p.elements.children.insert("rect",":first-child")
					.attr("width", p.view.width)
					.attr("height", p.view.height)
					.attr("class","overlay");
				
			}
							
			initScales();
			initAxis();
			initZoom();	
			
		}
		
		// Update parameters
		
		p.svg = arguments[0];

		p.view.width = +p.svg.attr("width") || p.view.width;
		p.view.height = +p.svg.attr("height") || p.view.width;
		
		initTimeline();
		
		initialised = true;
		
	};
	
	me.refresh = function() {
	
		function updateAxis() {
		
			p.scales.axis.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] )
					.range( [0, p.view.width] );
					
			p.axis.tickSize(p.view.height - p.view.padding);

			p.elements.axis.call( p.axis )
				.attr("transform", "translate(0," + ( p.view.height - p.view.padding / 2 ) + ")");
			
		}		
	
		function updateScales() {
		
			// update domain (new width times scale)
			var diff = p.view.width - x.range()[1];
			x.range([ 0, p.view.width ])
				.domain( [ x.domain()[0], x.domain()[1] + diff ] );
			
			//y.range([0, p.view.height ]);		

			p.scales.dateToPx.domain( [ p.view.from.valueOf(), p.view.to.valueOf() ] )
				.range( [ p.view.padding, p.view.width - p.view.padding ] );
				
			p.scales.pxToDate.domain( p.scales.dateToPx.range() )
				.range( p.scales.dateToPx.domain() );
		}
		
		function updateSVG() {
					
			p.svg.attr("width", p.view.width);
			p.svg.attr("height", p.view.height);
		
		}
		
		function updateZoom() {
															
			p.svg.select(".overlay")
				.attr("width", p.view.width)
				.attr("height", p.view.height);
				
		}

		updateSVG();		
		updateScales();
		updateAxis();
		updateZoom();
		
			
		p.children.forEach( function(child) {
			child.refresh();
		} );
		
	};
	
	// Children
	me.add = function( layout ) {
		
		var g = p.elements.children.append("g")
			.attr( "id", layout.identifier() );
		
		layout.svg( g )
			.view( p.view )
			.scales( p.scales )
			.x( x )
			.y( y )
			.zoom( zoom )
			.parent( me );
			
		if( layout.data().length ) {
			
			var minFrom = d3.min( layout.data(), function(d) { return d.from; } );
			var maxTo = d3.max( layout.data(), function(d) { return d.to; } );
			
			if( minFrom < p.view.from ) {
				
				me.from( minFrom);
				
			}
			
			if (maxTo > p.view.to ) {
			
				me.to( maxTo );
				
			}
			
		}
			
		layout.initialise();
			
		p.children.push( layout );
		
		update();
		
	};
	
	// Accessors

	me.domain = function(_) {
		
		if( !arguments.length ) return Array( p.view.from, p.view.to );
		
		if ( _.length === 2 &&  _[0] instanceof Date && _[1] instanceof Date && _[1] > _[0]) {
			
			p.view.from = _[0];
			p.view.to = _[1];
			
		}
		
		return me;
		
	};
	
	me.from = function(_) {
		
		if( !arguments.length ) return p.view.from;
		
		p.view.from = _;		
		
		me.refresh();
		
		return me;
		
	};
	
	me.height = function(_) {
		
		if( !arguments.length ) return p.view.height;
		
		p.view.height = _;		
		
		me.refresh();
		
		return me;
		
	};

	me.view = function() {
		
		return p.view;
		
	};
	
	me.width = function(_) {
		
		if( !arguments.length ) return p.view.width;
		
		p.view.width = _;
		
		me.refresh();
		
		return me;
		
	};
	
	me.to = function(_) {
		
		if( !arguments.length ) return p.view.to;
		
		p.view.to = _;		
		
		me.refresh();
		
		return me;
		
	};
	
	me.x = function(_) {
		if( !arguments.length ) return x;
		x = _;
		
		return me;
	};
		
	me.y = function(_) {
		if( !arguments.length ) return y;
		y = _;
		
		return me;
	};
	
	return me;
};;TT.ui = {};;TT.ui.panel = function() {
	
	if(!TT.ui.panel.id) TT.ui.panel.id = 0;
	
	var	initialised = false,
		id = TT.ui.panel.id++,
		me = {},
		nmsp = "ui_" + id,
		x,
		y,
		zoom;
		
	var p = {
		
		elements: {
			
		},
		
		data: [],
		
		heap: false,
		
		fields: [],
				
		parent: false,
		
		record: {
			
			title: function(d) { return d.title; },
			subtitle: function(d) { return d.subtitle; },
			image: function(d) { return d.image; }
			
		},
		
		styles: {
			
			panel: {
				
				height: 0.6, // 60%
				width: 0.25, // 25%
				
				pointer: {
					width: 10,
					height: 20
				}
			}

		},
		
		view: {}
	};
	
	// REMOVE
	test_ui_p = p;
	
	function panel( params ) {
		
		if( !params.event || !params.data ) {
		
			return false;
			
		}
		
		function bufferPanel() {
			
			showPanel( params );
			
			p.elements.panel.html( "" )
				.append( "div" )
				.attr( "class", "loading" );
			
		}
		
		function loadContent( data ) {
		
			function addHeader() {
						
				// Add header
				var header = p.elements.panel.append("div")
					.attr( "class", "header" )
					.style( "background-image", "url(" + p.record.image.call( p.record.image, data ) + ")" );
					
				header.append("h2")
					.html( p.record.title.call( p.record.title, data ) );
				header.append("h3")
					.html( p.record.subtitle.call( p.record.subtitle, data ) );		
				
			}
			
			function addList() {
							
				// Add list
				p.elements.panel.append("ul").attr("class", "select").selectAll("li").data( p.fields )
					.enter()
				.append("li")
					.html( function(d) {
						
						var content = d.accessor( data );
						
						if ( jQuery.isArray( content ) ) {
							
							content = content.join( ", " );
							
						}
						
						return "<label>" + d.title + "</label>" + content; 
						
					} )
					.on( "click", function(d) {
						
						var obj = this;
						
						function doLoadField() {
							
							d.selected = d.accessor( data );
							
							if ( jQuery.isArray( d.selected ) ) {
								
								d.options = d.accessor( data );
								
							} else {
								
								d.options = false;
								
							}
										
							loadField( d );
							
						}
						
						if ( d.initialise && typeof d.initialise == "function" ) {
							
							console.log( d );
							
							bufferPanel();
							
							d.initialise( doLoadField );
							
						} else {
							
							doLoadField();
							
						}
						
					});
				
			}
			
			clearPanel();
			
			addHeader();
			addList();
		}	
		
		function loadField( data ) {
			
			function addHeader () {
				
				var reloadField = function () {
					
					var selected = Array();
					
					header.select(".values").selectAll( "input[type=checkbox]").each( function( d ) {
						
						if ( jQuery( this ).is( ":checked" ) ) {
							
							selected.push( d );
							
						}
						
					} );
					
					data.selected = selected;
					
					loadField( data );	
					
				};
				
				
				var header = p.elements.panel.append("ul")
					.attr("class", "header");
				
				header.append("li")
					.append( "a" )
					.attr( "class", "back" )
					.attr( "href", "#" )
					.html( "Back" );
								
				if ( ! data.options ) {
					
					header.append("li")
						.html( function() {
							return "<label>" + data.title + "</label>" + data.selected;
							
						} );
					
				} else {
					
					var li = header.append("li")
						.html( function() {
							return "<label>" + data.title + "</label><div class=\"values\"></div>";
							
						} );
					
					var enter = li.select( ".values" )
						.append( "ul" )
						.selectAll( "li" )
					.data( data.options )
						.enter()
						.append( "li" );
						
					enter.append( "input" )
						.attr( "id", function( d ) {
							
							return "input-" + data.field + "-" + d;
							
						} )
						.attr( "type", "checkbox" )
						.attr( "value", function( d )  {
							
							return d;
							
						} )
						.attr( "checked", function( d ) {
							
							if ( data.selected.indexOf( d ) != -1 ) {
								
								return "checked";
								
							}
							
						} )
						.on( "click", reloadField );
						
					enter.append( "label" )
						.attr( "for", function( d ) {
							
							return "input-" + data.field + "-" + d;
							
						} )
						.html( function( d ) {
							
							return d;
							
						} )
						.on( "click", reloadField );
				
				}
					
				header.select("a.back")
					.on("click", function() {
						loadContent( p.elements.panel.datum() );
					});
			
			}
			
			function addInstructions() {
				
				p.elements.panel.append("div")
					.attr("class", "instructions")
				.append("p")
					.html( "or" );
				
			}
			
			function addOperations() {
				
				var operations = p.elements.panel.append("ul")
					.attr("class", "operations");
					
				var buttons = [
					{
						title: "Colour",
						description: "Colour all the items matching " + data.title + " \"" +  data.selected + "\"",
						action: function() {
							
							loadFilterByColour( data );
							
						}
					}, 
					{
						title: "Duplicate",
						description: "Create a new heap with the items matching " + data.title + " \"" +  data.selected + "\""
					}, 
					/*{
						title: "Separate",
						description: "Separate all items matching " + data.title + " \"" +  data.selected + "\" from their current heap"
					},*/
					{
						
						title: "Remove",
						description: "Remove all items matching " + data.title + " \"" +  data.selected + "\"",
						action: function() {
							
							if( p.heap ) {
								
								// TODO update to support array fields
								
								if ( ! jQuery.isArray( data.selected ) ) {
								
									p.heap.data( p.heap.data().filter( function(d) { 
										
										return data.accessor(d) != data.selected;
										
									} ) ); 
									
								} else {
									
									p.heap.data( p.heap.data().filter( function(d) { 
								
										var value = data.accessor( d );
									
										for( var i = 0; i < data.selected.length; i++ ) {	
											
											if ( value.indexOf( data.selected[ i ] ) != -1 ) {
												
												return false;
												
											}
											
										}
										
										return true;
										
									} ) ); 
									
								}

								// Repopulate field values
								p.data = p.heap.data();
								
								hidePanel();
								
							}
							
						}
					}
				];
				
				operations.selectAll("li").data(buttons)
					.enter()
					.append("li")
					.html( function(d) { 
						
						return "<a class=\"button\" href=\"#\">" + d.title + "</a><p class=\"description\">" + d.description + "</p>";
						
					})
				.select("a")
					.on("click", function(d) {
						d.action();
					});
					
				
				
			} 
			
			function addSelect() {
				
				function populateSelect() {					
					
					if ( ! data.values ) {
						
						populateField( data );
						
					}
					
					select.selectAll("option")
						.data( data.values )
					.enter()
						.append("option")
						.html(function(d) { return d; });
						
					select.on("mouseover", null);
						
				}
				
				var select = p.elements.panel.append("select")
				
					.attr("class", "select")
					.on("change", function(d) {
						
						var selected = this.options[ this.selectedIndex ].__data__ ;
						
						if( data.options && data.options.indexOf( selected ) == -1 ) {
							
							data.options.push( selected );
							
						}
						
						if ( ! jQuery.isArray( data.selected) ) {
							
						
							data.selected = selected;
							
						} else {
							
							data.selected = Array( selected );
							
						}
						loadField( data );				
						
					});
			
				select.insert("option", ":first-child")
					.html( "Select a different " + data.title );
					
				setTimeout( populateSelect, 300 );
				
			}
			
			clearPanel();
			addHeader();
			addOperations();
			addInstructions();
			
			addSelect();
			
		}
		
		function loadFilterByColour( data ) {
			
			function addHeader () {
				
				var header = p.elements.panel.append("ul")
					.attr("class", "header");
					
				header.selectAll("li")
					.data([
						"<a class=\"back\" href=\"#\">Back</a>",
						"<label>" + data.title + "</label>" + data.selected
					])
					.enter()
					.append("li")
					.html( function(d) { return d; });
					
				header.select("a.back")
					.on("click", function() {
						loadField( data );
					});
					
				p.elements.panel.append("h3")
					.html( "Colour" );
			
			}
			
			function addSwatches() {
				
				var colour = [d3.scale.category20(), d3.scale.category20b(), d3.scale.category20c()];
				
				p.elements.panel.append("ul")
					.attr("class", "swatches")
				.selectAll("li")
					.data( d3.range(60) )
				.enter()
					.append("li")
					.style("background-color", function(d) {
						
						return colour[ d % 3 ](d);
						
					})
					.on("click", function( index ) {
					
							if( p.heap ) {
							
								p.data = p.heap.data();
								
								p.data.forEach( function(d) {
									
									var value = data.accessor( d ),
										doColour = false;
									
									if ( ! jQuery.isArray( value ) ) {
																			
										if( value == data.selected ) {
									
											doColour = true;
										
										}
										
									} else {
										
										var found = 0;
										
										for( var i = 0; i < data.selected.length; i++ ) {	
											
											if ( value.indexOf( data.selected[ i ] ) != -1 ) {
												
												found++;
												
											}
											
										}
										
										if ( found == data.selected.length ) {
											
											doColour = true;
											
										}
										
									}
									
									if ( doColour ) {
										
										d.color = colour[ index % 3 ](index);
										
									}
								
								} );
								
								p.heap.data( p.data ); 
								
								hidePanel();
								
							}			
						
					});
				
			}
			
			clearPanel();
			addHeader();
			addSwatches();
		}
		
		function makePanel() {
			
			showPanel( params );
		
			loadContent ( params.data );	
			
		}
		
		if ( ! params.data.initialise ) {
			
			makePanel();

		} else {
			
			if ( typeof params.data.initialise == "function" ) {
				
				bufferPanel();
				
				params.data.initialise( makePanel );
				
			}
			
		}
		
	}
	
	function clearPanel() {
		
		p.elements.panel.selectAll("*")
			.remove();
		
	}

	function hidePanel() {
		
		p.elements.panel.style("display", "none");

		p.elements.panel.overlay.style("display", "none");
		
	}
	
	function showPanel( params ) {
		
		// Displays panel at the position of the item
		
		p.elements.panel.style({
			"display": "block"
		});	
		
		p.elements.panel.datum( params.data );
		
		p.elements.panel.overlay.style("display", "block");
		
		if( params.event.pageY > p.elements.panel.height / 2) {

			p.elements.panel.style("top", ( params.event.pageY - p.elements.panel.height / 2 - p.styles.panel.pointer.height / 2 ) + "px" );

		} else {
		
			p.elements.panel.style("top", (p.styles.panel.pointer.height / 2 ) + "px" );
			
		}
		
		if( params.event.pageX > p.elements.panel.width + p.styles.panel.pointer.width ) {
			
			p.elements.panel.style("left", ( params.event.pageX - p.elements.panel.width - p.styles.panel.pointer.width) + "px")
				.classed("pointerLeft", true)
				.classed("pointerRight", false);
			
		} else {
			
			p.elements.panel.style("left", ( params.event.pageX + p.styles.panel.pointer.width) + "px")
				.classed("pointerLeft", false)
				.classed("pointerRight", true);
			
		}
		

	}
	
	function populateField( field ) {
	
		field.values = []; 
			
		p.data.forEach( function(d) { 
			
				value = field.accessor.call(field.accessor, d); 
				
				if( toString.call(value) !== "[object Array]" ) {
				
					value = [ value ];
					
				}
				
				value.forEach( function (v) {
					
					if ( v instanceof Object) {
						
						var objectInArray = false;
						
						for(var i = 0; i < field.values.length; i++) {
						
							if( field.values[i] instanceof Object && field.values[i].id === v.id ) {
								objectInArray = true;
								break;
							}
							
						}
						
						if (! objectInArray ) {
							
							field.values.push(v);
							
						}
						
					} else if ( field.values.indexOf( v ) === -1 ) {
						
							field.values.push(v);
							
					}
					
				});
			} );
			
		field.values.sort();
		
	}
	
	function process( params ) {
		
		switch( params.event.type ) {
			
			case "click":
			
				panel( params );
				
				break;
				
			case "dblclick":
			
				if ( params.data && params.data.url ) {
					
					window.open( params.data.url );
					
				}
				
				break;
			
		}
		
	}
	
	// Initialiser
	me.initialise = function() {
				
		function initPanel() {
			
			var container = d3.select("body").append("div")
				.attr("class", "ui_panel_container");
				
			// Add overlay (for closing the panel)
			container.append("div")
				.attr("class", "ui_panel_overlay")
				.style("display", "none")
				.on("click", hidePanel);
				
			p.elements.panel = container.append("div")
				.attr("class", "ui_panel")
				.attr("id", "ui_panel_" + id);
				
			p.elements.panel.overlay = container.select(".ui_panel_overlay");
				
			// Make panel visible before determining width & height
			p.elements.panel.style("display", "block");	
				
			p.elements.panel.width = parseInt( p.elements.panel.style("width") ) ;
			p.elements.panel.height = parseInt( p.elements.panel.style("height") );
			
			p.elements.panel.style("display", "none");
				
				
			// Add pointers
			p.elements.panel.append("div")
				.attr("class", "pointer pointerLeft");
			p.elements.panel.append("div")
				.attr("class", "pointer pointerRight");
				
			
			// Add listener for progress bar
			jQuery( document ).on("loadingProgressed", function ( event, numFetched, numRows ) {
			
				var div = p.elements.panel.select( "div.loading" );
				
				if ( div.empty() ) {
					
					return false;
					
				}
				
					
				var barWidth = function( d ) {
					
					return 100 / d.numRows * d.numFetched + "%";
					
				};
				
				if ( ! div.classed( "progress" ) ) {
					
					div.classed( "progress", true );
					
				}
				
				div.selectAll( "div.bar" )
					.data( [ { numFetched: numFetched, numRows: numRows } ] )
				.enter()
					.append( "div" )
					.attr( "class", "bar" )
					.style( "width", barWidth );
					
				div.selectAll( "div.bar" )	
					.style( "width", barWidth );
				
			
			} );
				
					
		}
		
		initPanel();
		
		initialised = true;
		
		return me;
		
	};
	
	
	// Accessors
	me.heap = function(_) {
		if( !arguments.length ) return p.heap;
		
		var heap = _;
		
		p.heap = heap;
		
		// Link UI to a heap layout
		TT.observer.make( heap );
		heap.addSubscriber( process );
		p.data = heap.data();
		
		// Add heap parent as panel parent
		p.parent = heap.parent();
		TT.observer.make( p.parent );
		p.parent.addSubscriber( process );
	
		return me;
		
	};
	
	me.fields = function(_) {
		if( !arguments.length ) return p.fields;
		p.fields = _;
		
		return me;
	};
	
	me.record = function(_) {
		if( !arguments.length ) return p.record;
		p.record = _;
		
		return me;
	};
	
	return me;
	
};